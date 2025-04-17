import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import os from "os";
import ExcelJS from "exceljs"; // Import ExcelJS library for Excel manipulation
import retry from "async-retry";
import { createWorker } from "tesseract.js";
import { createClient } from "@supabase/supabase-js";

// Constants for directories, Supabase URL, and API keys
const imagePath = path.join("./KRA/ocr.png");
const now = new Date();
const formattedDateTime = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
const downloadFolderPath = path.join(
    process.cwd(),
    "temp",
    `KRA-RETURNS-${formattedDateTime}`
);
fs.mkdir(downloadFolderPath, { recursive: true }).catch(console.error);

const supabaseUrl = "https://zyszsqgdlrpnunkegipk.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to log in to KRA iTax portal
async function loginToKRA(page, company) {
    await page.goto("https://itax.kra.go.ke/KRA-Portal/");
    await page.locator("#logid").click();
    await page.locator("#logid").fill(company.kra_pin);
    await page.evaluate(() => {
        CheckPIN();
    });
    // await page.locator('input[name="xxZTT9p2wQ"]').fill('bclitax2025');
    await page.locator('input[name="xxZTT9p2wQ"]').fill(company.kra_password);
    await page.waitForTimeout(500);

    const image = await page.waitForSelector("#captcha_img");
    const imagePath = path.join(downloadFolderPath, "ocr.png");
    await image.screenshot({ path: imagePath });

    const worker = await createWorker('eng', 1);
    console.log("Extracting Text...");
    let result;

    const extractResult = async () => {
        const ret = await worker.recognize(imagePath);
        const text1 = ret.data.text.slice(0, -1); // Omit the last character
        const text = text1.slice(0, -1);
        const numbers = text.match(/\d+/g);
        console.log('Extracted Numbers:', numbers);

        if (!numbers || numbers.length < 2) {
            throw new Error("Unable to extract valid numbers from the text.");
        }

        if (text.includes("+")) {
            result = Number(numbers[0]) + Number(numbers[1]);
        } else if (text.includes("-")) {
            result = Number(numbers[0]) - Number(numbers[1]);
        } else {
            throw new Error("Unsupported operator.");
        }
    };

    let attempts = 0;
    const maxAttempts = 5;
    // Retry extracting result if unsupported operator error occurs
    while (attempts < maxAttempts) {
        try {
            await extractResult();
            break; // Exit the loop if successful
        } catch (error) {
            console.log("Re-extracting text from image...");
            attempts++;
            if (attempts < maxAttempts) {
                await page.waitForTimeout(1000); // Wait before re-attempting
                await image.screenshot({ path: imagePath }); // Re-capture the image
                continue; // Retry extracting the result
            } else {
                console.log("Max attempts reached. Logging in again...");
                return loginToKRA(page, company);
            }
        }
    }

    console.log('Result:', result.toString());
    await worker.terminate();
    await page.type("#captcahText", result.toString());
    await page.click("#loginButton");

    await page.goto("https://itax.kra.go.ke/KRA-Portal/");

    // Check if login was successful
    const isInvalidLogin = await page.waitForSelector('b:has-text("Wrong result of the arithmetic operation.")', { state: 'visible', timeout: 3000 })
        .catch(() => false);

    if (isInvalidLogin) {
        console.log("Wrong result of the arithmetic operation, retrying...");
        await loginToKRA(page, company);
    }
}

// Function to read company data from Supabase
const readSupabaseData = async () => {
    try {
        const { data, error } = await supabase.from("PasswordChecker").select("*")
            .eq('company_name', 'VISHNU BUILDERS AND COMPANY LIMITED')
            // .eq('kra_pin', 'P051642956N')
            // .eq('kra_password', 'bclitax2024')
            .order('id');

        if (error) {
            throw new Error(`Error reading data from 'PasswordChecker' table: ${error.message}`);
        }

        // If no data found in DB, return hardcoded details
        if (!data || data.length === 0) {
            return [{
                id: 'manual',
                company_name: 'XTRA CAB CABLES LTD',
                kra_pin: 'P052191233J',
                kra_password: 'bclitax2024'
            }];
        }

        return data;
    } catch (error) {
        // Return hardcoded details on any error
        return [{
            id: 'manual',
            company_name: 'XTRA CAB CABLES LTD',
            kra_pin: 'P052191233J',
            kra_password: 'bclitax2024'
        }];
    }
};


// Function to update the status of a company's password in Supabase
const updateSupabaseStatus = async (id, status) => {
    try {
        const { error } = await supabase
            .from("PasswordChecker")
            .update({ status, last_checked: new Date().toISOString() })
            .eq("id", id);

        if (error) {
            throw new Error(`Error updating status in Supabase: ${error.message}`);
        }
    } catch (error) {
        console.error("Error updating Supabase:", error);
    }
};

async function navigateToFileReturn(page, company) {
    // console.log('Waiting for top menu bar...');
    // await page.waitForSelector('#ddtopmenubar');

    console.log('Hovering over Returns menu...');
    const returnsSelector = '#ddtopmenubar > ul > li > a[rel="Returns"]';
    await page.hover(returnsSelector);

    console.log('Waiting for menu animation...');
    await page.waitForTimeout(500);

    console.log('Clicking on Nil Return option...');
    await page.evaluate(() => {
        showNilReturn()
    });

    console.log('Waiting for page load...');
    await page.waitForLoadState("networkidle");
    console.log('Successfully navigated to File Nil Return page');

    console.log('Selecting registration type...');
    await page.locator('#regType').selectOption('7');
    console.log('Clicking Next button...');
    await page.getByRole('button', { name: 'Next' }).click();

    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.dismiss().catch(() => { });
    });

    console.log('Clicking first Submit button...');
    await page.getByRole('button', { name: 'Submit' }).click();

    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.accept().catch(() => { });
    });

    console.log('Clicking second Submit button...');
    await page.getByRole('button', { name: 'Submit' }).click();

    page.once('dialog', dialog => {
        console.log(`Dialog message: ${dialog.message()}`);
        dialog.accept().catch(() => { });
    });

    console.log('Waiting for final page load...');
    await page.waitForLoadState("networkidle");

    console.log('Initiating download process...');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download Returns Receipt' }).click();
    const download = await downloadPromise;
    const date = new Date().toISOString().split('T')[0];
    console.log('Saving downloaded file...');
    await download.saveAs(path.join(downloadFolderPath, `${company.company_name} - ${company.kra_pin} - NIL RETURN - ACKNOWLEDGEMENT RECEIPT - ${date}.pdf`));
    console.log('File successfully saved');
}
// Main function to process one company and validate passwords
(async () => {
    const data = await readSupabaseData();

    if (data.length === 0) {
        console.log("Company not found or details don't match.");
        return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Password Validation");

    // Headers starting from the 3rd row and 3rd column
    const headers = ["Company Name", "KRA PIN", "ITAX Password", "Status"];
    const headerRow = worksheet.getRow(3);
    headers.forEach((header, index) => {
        headerRow.getCell(index + 3).value = header; // Start from 3rd column
        headerRow.getCell(index + 3).font = { bold: true }; // Set headers bold
    });
    headerRow.commit();

    const company = data[0];
    const browser = await chromium.launch({ headless: false, executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(180000); // 3 minutes
    page.setDefaultTimeout(180000); // 3 minutes for all other operations


    console.log("COMPANY:", company.company_name);
    console.log("KRA PIN:", company.kra_pin);
    console.log("ITAX Password:", company.kra_password);

    try {
        await loginToKRA(page, company);
        await navigateToFileReturn(page, company);

        let isPasswordExpired, isAccountLocked, isInvalidLogin, menuItemNotFound;

        await retry(
            async (bail) => {
                try {
                    menuItemNotFound = await page
                        .waitForSelector("#ddtopmenubar > ul > li:nth-child(1) > a", { timeout: 2000 })
                        .catch(() => false);

                    if (!menuItemNotFound) {
                        isPasswordExpired = await page
                            .waitForSelector('.formheading:has-text("YOUR PASSWORD HAS EXPIRED!")', {
                                state: "visible",
                                timeout: 1000,
                            })
                            .catch(() => false);

                        isAccountLocked = await page
                            .waitForSelector('b:has-text("The account has been locked.")', {
                                state: "visible",
                                timeout: 1000,
                            })
                            .catch(() => false);

                        isInvalidLogin =
                            !isPasswordExpired &&
                            !isAccountLocked &&
                            (await page
                                .waitForSelector('b:has-text("Invalid Login Id or Password.")', {
                                    state: "visible",
                                    timeout: 1000,
                                })
                                .catch(() => false));
                    }
                } catch (error) {
                    bail(error);
                }
            },
            { retries: 3, minTimeout: 1000, maxTimeout: 3000 }
        );

        const status = isPasswordExpired
            ? "Password Expired"
            : isAccountLocked
                ? "Locked"
                : isInvalidLogin
                    ? "Invalid"
                    : "Valid";

        const row = worksheet.addRow([null, company.company_name, company.kra_pin, company.kra_password, status]);

        // Apply cell colors based on status
        if (status === "Valid") {
            row.getCell(6).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF99FF99" }, // Light Green for valid status
            };
        } else if (status === "Invalid") {
            row.getCell(6).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFF9999" }, // Light Red for invalid status
            };
        } else {
            row.getCell(6).fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFE066" }, // Light Yellow for password/account issues
            };
        }

        await updateSupabaseStatus(company.id, status);

        await workbook.xlsx.writeFile(
            path.join(downloadFolderPath, `PASSWORD VALIDATION - COMPANIES.xlsx`)
        );

        await page.evaluate(() => {
            try {
                logOutUser();
                logOutUser();
                page.goto("https://itax.kra.go.ke/KRA-Portal/");
                logOutUser();
            } catch (error) {
                console.error("Error occurred during logOutUser:", error);
            }
        });

    } catch (error) {
        console.error("An error occurred:", error);
        console.log("Stopping the code due to incorrect details.");
    } finally {
        await page.close();
        await context.close();
        await browser.close();
    }
})();

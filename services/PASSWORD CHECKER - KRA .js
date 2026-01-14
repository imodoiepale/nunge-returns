import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import os from "os";
import retry from "async-retry";
import { createWorker } from "tesseract.js";
import { createClient } from "@supabase/supabase-js";

// Constants for directories
const now = new Date();
const formattedDateTime = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
const downloadFolderPath = path.join(
    os.homedir(),
    "Downloads",
    `KRA PASSWORD VALIDATION - ${formattedDateTime}`
);
fs.mkdir(downloadFolderPath, { recursive: true }).catch(console.error);

// Supabase configuration
const supabaseUrl = "https://zyszsqgdlrpnunkegipk.supabase.co";
const supabaseAnonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Function to read company data from Supabase
async function readSupabaseData() {
    try {
        const today = new Date().toISOString().split("T")[0];

        // 1️⃣ Fetch all accounting companies
        const { data, error } = await supabase
            .from("acc_portal_company_duplicate")
            .select("*")
            .not("kra_password", "is", null)
            .not("kra_pin", "is", null)
            .order("company_name", { ascending: true });

        if (error) {
            throw new Error(`Error reading data from 'acc_portal_company_duplicate': ${error.message}`);
        }

        // 2️⃣ Filter companies with valid "Effective To" dates (support both formats)
        const filteredData = data.filter(company => {
            const dateValue = company.acc_client_effective_to;
            if (!dateValue) return false;

            // Handle DD/MM/YYYY format
            if (dateValue.includes("/")) {
                const [day, month, year] = dateValue.split("/");
                if (!day || !month || !year) return false;

                const effectiveDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                return effectiveDate >= new Date();
            }

            // Handle YYYY-MM-DD format
            if (dateValue.includes("-")) {
                return dateValue >= today;
            }

            return false;
        });

        return filteredData;
    } catch (error) {
        console.error(`Error reading Supabase data: ${error.message}`);
        return [];
    }
}

// Function to update the status of a company's password in Supabase
async function updateSupabaseStatus(id, status, message = "", newPassword = null) {
    try {
        const updateData = {
            kra_status: status,
            kra_last_checked: new Date().toISOString()
        };

        // If a new password was set, update it in the database
        if (newPassword) {
            updateData.kra_password = newPassword;
        }

        const { error } = await supabase
            .from("acc_portal_company_duplicate")
            .update(updateData)
            .eq("id", id);

        if (error) {
            throw new Error(`Error updating status in Supabase: ${error.message}`);
        }

        console.log(`Updated Supabase record for ID ${id} with status: ${status}`);
        return true;
    } catch (error) {
        console.error("Error updating Supabase:", error);
        return false;
    }
}

// Function to extract text from captcha
async function extractCaptchaText(page) {
    const randomId = Math.floor(Math.random() * 10000);
    const imagePath = path.join(downloadFolderPath, `ocr_${randomId}.png`);
    const image = await page.waitForSelector("#captcha_img");
    await image.screenshot({ path: imagePath });

    const worker = await createWorker('eng', 1);
    console.log(`[Worker ${randomId}] Extracting Text...`);
    let result;

    const extractResult = async () => {
        const ret = await worker.recognize(imagePath);
        const text1 = ret.data.text.slice(0, -1); // Omit the last character
        const text = text1.slice(0, -1);
        const numbers = text.match(/\d+/g);
        console.log(`[Worker ${randomId}] Extracted Numbers:`, numbers);

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

    while (attempts < maxAttempts) {
        try {
            await extractResult();
            break;
        } catch (error) {
            console.log(`[Worker ${randomId}] Re-extracting text from image...`);
            attempts++;
            if (attempts < maxAttempts) {
                await page.waitForTimeout(1000);
                await image.screenshot({ path: imagePath });
                continue;
            } else {
                throw new Error("Failed to extract captcha after multiple attempts");
            }
        }
    }

    console.log(`[Worker ${randomId}] Captcha Result:`, result.toString());
    await worker.terminate();

    // Delete the OCR image after processing
    try {
        await fs.unlink(imagePath);
        console.log(`[Worker ${randomId}] Deleted OCR image: ${imagePath}`);
    } catch (error) {
        console.error(`[Worker ${randomId}] Error deleting OCR image: ${error.message}`);
    }

    return result.toString();
}

// Function to log in to KRA iTax portal with retry for wrong arithmetic operation
async function loginToKRA(page, company) {
    console.log(`Attempting login for ${company.company_name}`);

    if (!company.kra_pin || !company.kra_password) {
        let status;
        if (!company.kra_pin && !company.kra_password) {
            status = "PIN and Password Missing";
        } else if (!company.kra_pin) {
            status = "PIN Missing";
        } else {
            status = "Password Missing";
        }
        return { status, message: "Missing credentials" };
    }

    let loginAttempts = 0;
    const maxLoginAttempts = 3;

    while (loginAttempts < maxLoginAttempts) {
        try {
            await page.goto("https://itax.kra.go.ke/KRA-Portal/");
            await page.locator("#logid").click();
            await page.locator("#logid").fill(company.kra_pin);

            // Check for "You have not updated your details in iTax" message
            const detailsNotUpdated = await page.waitForSelector('b:has-text("You have not updated your details in iTax.")', {
                timeout: 1000,
                state: "visible"
            }).catch(() => false);

            if (detailsNotUpdated) {
                console.log(`Details not updated in iTax for ${company.company_name}`);
                return { status: "Details Not Updated", message: "User has not updated their details in iTax." };
            }

            try {
                await page.evaluate(() => {
                    CheckPIN();
                });
            } catch (error) {
                return { status: "Error", message: "Invalid PIN format" };
            }

            await page.locator('input[name="xxZTT9p2wQ"]').fill(company.kra_password);
            await page.waitForTimeout(500);

            const captchaResult = await extractCaptchaText(page);
            await page.type("#captcahText", captchaResult);
            await page.click("#loginButton");

            // Wait for potential responses
            await page.waitForTimeout(2000);

            // Check if we got the wrong arithmetic operation error
            const wrongCaptcha = await page.waitForSelector('b:has-text("Wrong result of the arithmetic operation.")', {
                timeout: 1000,
                state: "visible"
            }).catch(() => false);

            if (wrongCaptcha) {
                console.log(`Wrong captcha result for ${company.company_name}, retry attempt ${loginAttempts + 1}/${maxLoginAttempts}`);
                loginAttempts++;
                continue; // Try again
            }

            // If we didn't get captcha error, proceed to check login status
            return await checkLoginStatus(page);

        } catch (error) {
            // Special handling for cached page error
            if (error.message === "CACHED_PAGE_ERROR") {
                console.log(`Cached page detected for ${company.company_name}, refreshing and retrying (attempt ${loginAttempts + 1}/${maxLoginAttempts})`);
                loginAttempts++;
                await page.waitForTimeout(1000);
                continue; // Retry with fresh page
            }

            console.error(`Error during login for ${company.company_name}:`, error);
            loginAttempts++;

            if (loginAttempts >= maxLoginAttempts) {
                return { status: "Error", message: `Failed after ${maxLoginAttempts} attempts: ${error.message}` };
            }

            console.log(`Retrying login for ${company.company_name}, attempt ${loginAttempts}/${maxLoginAttempts}`);
        }
    }

    return { status: "Error", message: `Failed after ${maxLoginAttempts} login attempts` };
}

// Function to check login status
async function checkLoginStatus(page) {
    // Check for cached page error FIRST (most critical to catch early)
    const cachedPageError = await page.waitForSelector('b:has-text("Invalid request. You might be using cached page. Please Login again.")', {
        timeout: 1000,
        state: "visible"
    }).catch(() => false);

    if (cachedPageError) {
        // Throw error to trigger retry in loginToKRA
        throw new Error("CACHED_PAGE_ERROR");
    }

    // Check if login was successful (look for main menu)
    const mainMenu = await page.waitForSelector("#ddtopmenubar > ul > li:nth-child(1) > a", {
        timeout: 2000,
        state: "visible"
    }).catch(() => false);

    if (mainMenu) {
        return { status: "Valid", message: "Login successful" };
    }

    // Check for password expired
    const passwordExpired = await page.waitForSelector('.formheading:has-text("YOUR PASSWORD HAS EXPIRED!")', {
        timeout: 1000,
        state: "visible"
    }).catch(() => false);

    if (passwordExpired) {
        return { status: "Password Expired", message: "Password has expired" };
    }

    // Check for account locked
    const accountLocked = await page.waitForSelector('b:has-text("The account has been locked.")', {
        timeout: 1000,
        state: "visible"
    }).catch(() => false);

    if (accountLocked) {
        return { status: "Locked", message: "Account has been locked" };
    }

    // Check for cancelled user
    const cancelledUser = await page.waitForSelector('b:has-text("User has been cancelled.")', {
        timeout: 1000,
        state: "visible"
    }).catch(() => false);

    if (cancelledUser) {
        return { status: "Cancelled", message: "User has been cancelled" };
    }

    // Check for invalid login
    const invalidLogin = await page.waitForSelector('b:has-text("Invalid Login Id or Password.")', {
        timeout: 1000,
        state: "visible"
    }).catch(() => false);

    if (invalidLogin) {
        return { status: "Invalid", message: "Invalid login ID or password" };
    }

    return { status: "Unknown", message: "Unable to determine login status" };
}

// Function to safely logout
async function logoutSafely(page) {
    try {
        await page.evaluate(() => {
            try {
                logOutUser();
            } catch (e) {
                console.log("Logout function not available");
            }
        });
        await page.waitForTimeout(1000);
        await page.goto("https://itax.kra.go.ke/KRA-Portal/");
    } catch (error) {
        console.error("Error during logout:", error);
    }
}

// Function to handle password expiry if needed
async function handlePasswordExpiry(page, company, newPassword) {
    try {
        console.log(`Handling password expiry for ${company.company_name}...`);
        // Enter current password
        await page.locator('input[name="$ZxQPLm$"]').fill(company.kra_password);
        // Enter new password
        await page.locator('input[name="$kkCx7ZqD"]').fill(newPassword);
        // Confirm new password
        await page.locator('input[name="c$$p97aSd"]').fill(newPassword);

        // Click submit
        await page.getByRole('button', { name: 'Submit' }).click();

        // Handle secure password policy checkbox
        await page.waitForSelector('#securePwdPolicy');
        await page.locator('#securePwdPolicy').check();
        await page.getByRole('button', { name: 'Submit' }).click();

        // Click back button
        await page.getByRole('button', { name: 'Back' }).click();

        // Update company password for return value
        console.log(`Password successfully changed to: ${newPassword}`);

        return {
            success: true,
            newPassword
        };
    } catch (error) {
        console.error("Error handling password expiry:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Function to capture screenshot of the login result
async function captureResultScreenshot(page, companyName) {
    try {
        // Convert company name to uppercase for screenshot filename
        const upperCaseName = companyName.toUpperCase().replace(/\s+/g, '_');
        const screenshotPath = path.join(downloadFolderPath, `${upperCaseName}_RESULT.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`Screenshot saved to ${screenshotPath}`);
        return screenshotPath;
    } catch (error) {
        console.error("Error capturing screenshot:", error);
        return null;
    }
}

// Function to process a single company
async function processCompany(company, index, totalCount) {
    console.log(`\n===== Processing ${index + 1}/${totalCount}: ${company.company_name} =====`);

    let result;
    let screenshotPath = null;
    let newPassword = null;

    // Skip login attempt if credentials are missing
    if (!company.kra_pin || !company.kra_password) {
        result = {
            status: !company.kra_pin && !company.kra_password
                ? "PIN and Password Missing"
                : !company.kra_pin
                    ? "PIN Missing"
                    : "Password Missing",
            message: "Missing credentials"
        };

        // Update status in Supabase
        await updateSupabaseStatus(company.id, result.status, result.message);

        return {
            company,
            result,
            screenshotPath
        };
    }

    // Create new browser for this company
    const browser = await chromium.launch({
        headless: false,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });

    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(180000);
    page.setDefaultTimeout(180000);

    try {
        // Attempt login and check status
        result = await retry(
            async () => {
                const loginResult = await loginToKRA(page, company);

                // Handle password expiry if detected
                if (loginResult.status === "Password Expired") {
                    newPassword = "bclitax2026"; // New password to set
                    const passwordChangeResult = await handlePasswordExpiry(page, company, newPassword);

                    if (passwordChangeResult.success) {
                        loginResult.message += ` - Changed to: ${newPassword}`;
                    } else {
                        loginResult.message += ` - Failed to change password: ${passwordChangeResult.error}`;
                    }
                }

                return loginResult;
            },
            { retries: 2, minTimeout: 1000, maxTimeout: 3000 }
        );

        // Capture screenshot
        // screenshotPath = await captureResultScreenshot(page, company.company_name);

        // Update status in Supabase
        await updateSupabaseStatus(company.id, result.status, result.message, newPassword);

        // Logout safely
        await logoutSafely(page);
    } catch (error) {
        console.error(`Error processing ${company.company_name}:`, error);
        result = { status: "Error", message: error.message };

        // Update error status in Supabase
        await updateSupabaseStatus(company.id, result.status, result.message);
    } finally {
        await context.close();
        await browser.close();
    }

    return {
        company,
        result,
        screenshotPath
    };
}


// Function to validate companies in parallel batches (DB only, no Excel)
async function validateKraPasswordsParallel(companiesData, batchSize = 20) {
    const results = [];
    const totalCompanies = companiesData.length;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Starting validation: ${totalCompanies} companies`);
    console.log(`Batch size: ${batchSize}`);
    console.log(`All results saved to Supabase database`);
    console.log(`${"=".repeat(60)}\n`);

    // Process companies in batches using Promise.all
    for (let i = 0; i < totalCompanies; i += batchSize) {
        const batch = companiesData.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(totalCompanies / batchSize);

        console.log(`\n${"=".repeat(60)}`);
        console.log(`📦 Batch ${batchNumber}/${totalBatches} (${i + 1}-${Math.min(i + batchSize, totalCompanies)}/${totalCompanies})`);
        console.log(`${"=".repeat(60)}`);

        // Create an array of promises for this batch, with error handling for each company
        const batchPromises = batch.map((company, batchIndex) =>
            processCompany(company, i + batchIndex, totalCompanies).catch(error => {
                console.error(`💥 Critical error processing ${company.company_name}: ${error.message}`);
                // Return a default error result if processCompany completely fails
                return {
                    company,
                    result: {
                        status: "Critical Error",
                        message: `Processing failed: ${error.message}`
                    },
                    screenshotPath: null
                };
            })
        );

        // Wait for all companies in this batch to be processed
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Log batch completion with summary
        const batchValid = batchResults.filter(r => r.result.status === "Valid").length;
        const batchInvalid = batchResults.filter(r => r.result.status === "Invalid").length;
        const batchErrors = batchResults.filter(r => r.result.status.includes("Error")).length;

        console.log(`\n✅ Batch ${batchNumber}/${totalBatches} completed`);
        console.log(`   Valid: ${batchValid} | Invalid: ${batchInvalid} | Errors: ${batchErrors}`);
        console.log(`   Progress: ${i + batchResults.length}/${totalCompanies} companies processed`);
    }

    // Count final statuses
    const validCount = results.filter(r => r.result.status === "Valid").length;
    const invalidCount = results.filter(r => r.result.status === "Invalid").length;
    const expiredCount = results.filter(r => r.result.status === "Password Expired").length;
    const lockedCount = results.filter(r => r.result.status === "Locked").length;
    const pendingUpdateCount = results.filter(r => r.result.status === "Pending Update").length;
    const cancelledCount = results.filter(r => r.result.status === "Cancelled").length;
    const missingCount = results.filter(r =>
        ["PIN Missing", "Password Missing", "PIN and Password Missing"].includes(r.result.status)
    ).length;
    const errorCount = results.filter(r => r.result.status === "Error" || r.result.status === "Critical Error").length;
    const unknownCount = results.filter(r => r.result.status === "Unknown").length;

    // Print final summary
    console.log(`\n${"=".repeat(60)}`);
    console.log(`📊 VALIDATION COMPLETE`);
    console.log(`${"=".repeat(60)}`);
    console.log(`✅ Valid Passwords:      ${validCount}`);
    console.log(`❌ Invalid Passwords:    ${invalidCount}`);
    console.log(`🔄 Expired Passwords:    ${expiredCount}`);
    console.log(`🔒 Locked Accounts:      ${lockedCount}`);
    console.log(`⏳ Pending Updates:      ${pendingUpdateCount}`);
    console.log(`🚫 Cancelled Users:      ${cancelledCount}`);
    console.log(`⚠️  Missing Credentials:  ${missingCount}`);
    console.log(`💥 Errors:               ${errorCount}`);
    console.log(`❓ Unknown Status:       ${unknownCount}`);
    console.log(`${"=".repeat(60)}`);
    console.log(`📊 Total Companies:      ${totalCompanies}`);
    console.log(`💾 All data saved to Supabase database`);
    console.log(`${"=".repeat(60)}\n`);

    return {
        results,
        summary: {
            validCount,
            invalidCount,
            expiredCount,
            lockedCount,
            pendingUpdateCount,
            cancelledCount,
            missingCount,
            errorCount,
            unknownCount,
            totalCount: companiesData.length
        }
    };
}

// Function to clean up any remaining OCR images
async function cleanupOcrImages() {
    try {
        console.log("Cleaning up OCR images...");
        const files = await fs.readdir(downloadFolderPath);
        let deletedCount = 0;

        for (const file of files) {
            if (file.startsWith('ocr_') && file.endsWith('.png')) {
                const filePath = path.join(downloadFolderPath, file);
                await fs.unlink(filePath);
                deletedCount++;
            }
        }

        console.log(`Cleanup complete: Deleted ${deletedCount} OCR images`);
    } catch (error) {
        console.error(`Error during OCR image cleanup: ${error.message}`);
    }
}

// Main execution function with parallel processing
async function main() {
    let batchSize = 20; // Default batch size - process 20 companies at a time

    // Check if arguments were provided
    if (process.argv.length > 2) {
        const batchArg = process.argv.find(arg => arg.startsWith('--batch='));
        if (batchArg) {
            const batchValue = parseInt(batchArg.split('=')[1]);
            if (!isNaN(batchValue) && batchValue > 0) {
                batchSize = batchValue;
            }
        }
    }

    const companiesData = await readSupabaseData();

    if (!companiesData || companiesData.length === 0) {
        console.log("No companies to process. Exiting.");
        return;
    }

    // Split companies into two groups: Unknown status first, then others
    const unknownCompanies = companiesData.filter(c => !c.kra_status || c.kra_status === "Unknown");
    const knownCompanies = companiesData.filter(c => c.kra_status && c.kra_status !== "Unknown");

    console.log(`\n${"=".repeat(60)}`);
    console.log(`Total companies: ${companiesData.length}`);
    console.log(`Unknown status: ${unknownCompanies.length} (will process FIRST)`);
    console.log(`Known status: ${knownCompanies.length} (will process AFTER)`);
    console.log(`Batch size: ${batchSize}`);
    console.log(`${"=".repeat(60)}\n`);

    // Process unknown companies first
    if (unknownCompanies.length > 0) {
        console.log(`\n🔍 PHASE 1: Processing ${unknownCompanies.length} companies with UNKNOWN status...`);
        await validateKraPasswordsParallel(unknownCompanies, batchSize);
        console.log(`\n✅ PHASE 1 COMPLETE: All unknown status companies processed!\n`);
    }

    // Then process known companies
    if (knownCompanies.length > 0) {
        console.log(`\n🔄 PHASE 2: Processing ${knownCompanies.length} companies with KNOWN status...`);
        await validateKraPasswordsParallel(knownCompanies, batchSize);
        console.log(`\n✅ PHASE 2 COMPLETE: All known status companies processed!\n`);
    }

    // Phase 3: Retry failed companies
    console.log(`\n⏳ Checking for failed companies to retry...`);
    const failedCompanies = await readSupabaseData();
    const companiesToRetry = failedCompanies.filter(c =>
        c.kra_status === "Error" || c.kra_status === "Critical Error"
    );

    if (companiesToRetry.length > 0) {
        console.log(`\n🔁 PHASE 3: Retrying ${companiesToRetry.length} FAILED companies...`);
        console.log(`${"=".repeat(60)}`);
        await validateKraPasswordsParallel(companiesToRetry, batchSize);
        console.log(`\n✅ PHASE 3 COMPLETE: All failed companies retried!\n`);
    } else {
        console.log(`✅ No failed companies to retry.\n`);
    }

    // Clean up any remaining OCR images
    await cleanupOcrImages();
}

// Run the main function
main().catch(console.error);

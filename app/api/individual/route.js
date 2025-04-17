import { NextRequest, NextResponse } from 'next/server';
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import os from "os";
import ExcelJS from "exceljs";
import retry from "async-retry";
import { createWorker } from "tesseract.js";
import { createClient } from "@supabase/supabase-js";

// Supabase client initialization
const supabaseUrl = "https://zyszsqgdlrpnunkegipk.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5c3pzcWdkbHJwbnVua2VnaXBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcwODMyNzg5NCwiZXhwIjoyMDIzOTAzODk0fQ.7ICIGCpKqPMxaSLiSZ5MNMWRPqrTr5pHprM0lBaNing";
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

const testSupabaseConnection = async () => {
    try {
        const { data, error } = await supabase.from('sessions').select('count').limit(1);
        if (error) {
            console.error('Supabase connection test failed:', error);
            return false;
        }
        console.log('Supabase connection successful');
        return true;
    } catch (e) {
        console.error('Supabase connection exception:', e);
        return false;
    }
}

const dbConnected = await testSupabaseConnection();
if (!dbConnected) {
    console.warn('Database connection failed - will continue but data may not be saved');
}

// Set up directories
const now = new Date();
const formattedDateTime = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
const downloadFolderPath = path.join(
    process.cwd(),
    "temp",
    `KRA-RETURNS-${formattedDateTime}`
);

// Function to log in to KRA iTax portal
async function loginToKRA(page, individual) {
    await page.goto("https://itax.kra.go.ke/KRA-Portal/");
    await page.locator("#logid").click();
    await page.locator("#logid").fill(individual.kra_pin);
    await page.evaluate(() => {
        CheckPIN();
    });
    await page.locator('input[name="xxZTT9p2wQ"]').fill(individual.kra_password);
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
        const numbers = text.match(/\\d+/g);
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
                return loginToKRA(page, individual);
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
        await loginToKRA(page, individual);
    }
}

// Function to navigate to file return for individuals
async function navigateToFileReturn(page, individual) {
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
    await page.locator('#regType').selectOption('1'); // Individual registration type
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
    const receiptFileName = `${individual.name || 'Individual'} - ${individual.kra_pin} - NIL RETURN - ACKNOWLEDGEMENT RECEIPT - ${date}.pdf`;
    const receiptFilePath = path.join(downloadFolderPath, receiptFileName);
    console.log('Saving downloaded file to:', receiptFilePath);
    await download.saveAs(receiptFilePath);
    console.log('File successfully saved');

    // Upload the receipt to Supabase storage
    try {
        const fileContent = await fs.readFile(receiptFilePath);
        const storageFileName = `receipts/${individual.kra_pin.replace(/\//g, '-')}_${date}.pdf`;
        
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('receipts')
            .upload(storageFileName, fileContent, {
                contentType: 'application/pdf',
                upsert: true
            });
            
        if (uploadError) {
            console.error('Error uploading receipt to storage:', uploadError);
        } else {
            console.log('Receipt uploaded to storage:', storageFileName);
            
            // Get the public URL
            const { data: urlData } = await supabase
                .storage
                .from('receipts')
                .getPublicUrl(storageFileName);
                
            if (urlData && urlData.publicUrl) {
                const receiptUrl = urlData.publicUrl;
                console.log('Receipt public URL:', receiptUrl);
                return { 
                    localPath: receiptFilePath,
                    storageUrl: receiptUrl
                };
            }
        }
    } catch (storageError) {
        console.error('Error during storage upload:', storageError);
    }
    
    return { 
        localPath: receiptFilePath,
        storageUrl: null
    };
}

// Function to update status in Supabase
const updateSupabaseStatus = async (sessionId, returnId, status, receiptUrl) => {
    try {
        // Update return record
        await supabase
            .from('returns')
            .update({
                status: status === 'Valid' ? 'completed' : 'failed',
                updated_at: new Date().toISOString(),
                return_data: { status, receipt_url: receiptUrl }
            })
            .eq('id', returnId);
            
        // Log activity
        await supabase
            .from('session_activities')
            .insert([{
                session_id: sessionId,
                activity_type: 'automation_complete',
                description: `Individual nil return filing ${status === 'Valid' ? 'completed' : 'failed'}`,
                metadata: {
                    status,
                    timestamp: new Date().toISOString()
                }
            }]);
    } catch (error) {
        console.error("Error updating Supabase:", error);
    }
};

// Main API handler
export async function POST(req) {
    try {
        // Ensure download directory exists
        await fs.mkdir(downloadFolderPath, { recursive: true });
        
        // Get individual data from request
        const requestData = await req.json();
        const { 
            name,
            kra_pin, 
            kra_password, 
            session_id,
            return_id,
            email
        } = requestData;
        
        if (!kra_pin || !kra_password) {
            return NextResponse.json(
                { error: "Missing required individual information" },
                { status: 400 }
            );
        }
        
        // Create workbook for logging
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Password Validation");

        // Headers starting from the 3rd row and 3rd column
        const headers = ["Name", "KRA PIN", "ITAX Password", "Status"];
        const headerRow = worksheet.getRow(3);
        headers.forEach((header, index) => {
            headerRow.getCell(index + 3).value = header; // Start from 3rd column
            headerRow.getCell(index + 3).font = { bold: true }; // Set headers bold
        });
        headerRow.commit();
        
        // Log that we're processing this individual
        console.log("Processing individual:", name || "Unknown");
        console.log("KRA PIN:", kra_pin);
        console.log("KRA Password:", kra_password);
        
        const individual = {
            name,
            kra_pin,
            kra_password,
            email
        };
        

        // Then add this before launching browser:
console.log('System details:');
console.log(`- Platform: ${process.platform}`);
console.log(`- Architecture: ${process.arch}`);
console.log(`- Node version: ${process.version}`);
console.log(`- Download path: ${downloadFolderPath}`);

        // Launch browser (non-headless for UI interaction)
        const browser = await chromium.launch({
            headless: false,
            // channel: "chrome",
            args: ['--start-maximized'],
            ignoreDefaultArgs: ['--headless']
        });
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            deviceScaleFactor: 1,
        });
        const page = await context.newPage();
        page.setDefaultNavigationTimeout(180000); // 3 minutes
        page.setDefaultTimeout(180000); // 3 minutes for all other operations

        let status = "Processing";
        let receiptUrl = null;

        try {
            // Log in to KRA
            await loginToKRA(page, individual);
            
            // File the return
            const receiptPaths = await navigateToFileReturn(page, individual);
            receiptUrl = receiptPaths.storageUrl;
            
            // Check for potential issues (password expired, account locked, etc.)
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

            status = isPasswordExpired
                ? "Password Expired"
                : isAccountLocked
                    ? "Locked"
                    : isInvalidLogin
                        ? "Invalid"
                        : "Valid";

            // Add result to Excel file
            const row = worksheet.addRow([null, individual.name || "Unknown", individual.kra_pin, "********", status]);

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

            // Save Excel file
            await workbook.xlsx.writeFile(
                path.join(downloadFolderPath, `PASSWORD VALIDATION - INDIVIDUALS.xlsx`)
            );

            // Try to log out
            await page.evaluate(() => {
                try {
                    logOutUser();
                    logOutUser();
                } catch (error) {
                    console.error("Error during logout:", error);
                }
            });
            
        } catch (error) {
            console.error("Error during automation:", error);
            status = "Failed";
        } finally {
            // Close browser
            await page.close();
            await context.close();
            await browser.close();
        }
        
        // Update Supabase with results
        if (session_id && return_id) {
            await updateSupabaseStatus(session_id, return_id, status, receiptUrl);
            
            // Create a document record if we have a receipt URL
            if (receiptUrl && receiptPaths.localPath) {
                try {
                    const fileName = path.basename(receiptPaths.localPath);
                    
                    // Add entry to return_documents table
                    await supabase
                        .from('return_documents')
                        .insert([{
                            return_id: return_id,
                            document_type: 'acknowledgement_receipt',
                            document_name: fileName,
                            document_url: receiptUrl,
                            description: 'KRA acknowledgement receipt for filing',
                            is_verified: true,
                            updated_at: new Date().toISOString()
                        }]);
                        
                    console.log('Created document record in return_documents table');
                } catch (docError) {
                    console.error('Error creating document record:', docError);
                }
            }
        }
        
        // Return response with results
        return NextResponse.json({
            success: status === "Valid",
            status,
            name: individual.name,
            kra_pin,
            receipt_url: receiptUrl,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error("API error:", error);
        return NextResponse.json(
            { error: "Failed to process individual nil return" },
            { status: 500 }
        );
    }
}

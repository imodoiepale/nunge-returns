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
const supabaseUrl = "https://mqqkfggqfkpkgtzdpkmt.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcWtmZ2dxZmtwa2d0emRwa210Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUwMjU5OTcsImV4cCI6MjA1MDYwMTk5N30.-cxEkQUhCc_Nv5-vBhFAVSnb7WdU_RvdrV82A0F1r98";
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

// Extract captcha text using OCR
async function extractCaptchaText(page) {
    const randomId = Math.floor(Math.random() * 10000);
    const imagePath = path.join(downloadFolderPath, `ocr_${randomId}.png`);

    try {
        const image = await page.waitForSelector("#captcha_img");
        await image.screenshot({ path: imagePath });

        console.log(`[Worker ${randomId}] Creating Tesseract worker...`);
        const worker = await createWorker('eng', 1, {
            workerPath: path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
        });
        console.log(`[Worker ${randomId}] Extracting Text...`);
        let result;

        const extractResult = async () => {
            const ret = await worker.recognize(imagePath);
            const text1 = ret.data.text.slice(0, -1); // Omit the last character
            const text = text1.slice(0, -1); // Omit one more character (2 total)
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
    } catch (error) {
        console.error(`[Worker ${randomId}] CRITICAL ERROR: Tesseract module error:`, error.message);
        throw new Error(`Captcha extraction failed: ${error.message}. Please ensure tesseract.js is properly installed.`);
    }
}

// Function to log in to KRA iTax portal
async function loginToKRA(page, individual) {
    console.log(`[LOGIN] Attempting login for PIN: ${individual.kra_pin}`);

    if (!individual.kra_pin || !individual.kra_password) {
        throw new Error("PIN and password are required");
    }

    let loginAttempts = 0;
    const maxLoginAttempts = 3;

    while (loginAttempts < maxLoginAttempts) {
        try {
            await page.goto("https://itax.kra.go.ke/KRA-Portal/", { waitUntil: 'networkidle' });

            // Fill PIN
            await page.locator("#logid").click();
            await page.locator("#logid").fill(individual.kra_pin);

            // Check for "Details not updated" message
            const detailsNotUpdated = await page.waitForSelector(
                'b:has-text("You have not updated your details in iTax.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (detailsNotUpdated) {
                console.log(`[LOGIN] Details not updated in iTax for PIN: ${individual.kra_pin}`);
                throw new Error("User has not updated their details in iTax");
            }

            // Validate PIN format
            try {
                await page.evaluate(() => {
                    CheckPIN();
                });
            } catch (error) {
                throw new Error("Invalid PIN format");
            }

            // Fill password
            await page.locator('input[name="xxZTT9p2wQ"]').fill(individual.kra_password);
            await page.waitForTimeout(500);

            // Extract and fill captcha
            const captchaResult = await extractCaptchaText(page);
            await page.type("#captcahText", captchaResult);

            // Submit login
            await page.click("#loginButton");
            await page.waitForTimeout(2000);

            // Check for wrong captcha
            const wrongCaptcha = await page.waitForSelector(
                'b:has-text("Wrong result of the arithmetic operation.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (wrongCaptcha) {
                console.log(`[LOGIN] Wrong captcha, retrying... (attempt ${loginAttempts + 1}/${maxLoginAttempts})`);
                loginAttempts++;
                continue;
            }

            // Check for cached page error
            const cachedPageError = await page.waitForSelector(
                'b:has-text("Invalid request. You might be using cached page. Please Login again.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (cachedPageError) {
                console.log(`[LOGIN] Cached page detected, retrying... (attempt ${loginAttempts + 1}/${maxLoginAttempts})`);
                loginAttempts++;
                await page.waitForTimeout(1000);
                continue;
            }

            // Check if login was successful (look for main menu)
            const mainMenu = await page.waitForSelector(
                "#ddtopmenubar > ul > li:nth-child(1) > a",
                { timeout: 2000, state: "visible" }
            ).catch(() => false);

            if (mainMenu) {
                console.log(`[LOGIN] Login successful for PIN: ${individual.kra_pin}`);
                return; // Login successful
            }

            // Check for other error conditions
            const accountLocked = await page.waitForSelector(
                'b:has-text("The account has been locked.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (accountLocked) {
                throw new Error("Account has been locked");
            }

            const cancelledUser = await page.waitForSelector(
                'b:has-text("User has been cancelled.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (cancelledUser) {
                throw new Error("User has been cancelled");
            }

            const invalidLogin = await page.waitForSelector(
                'b:has-text("Invalid Login Id or Password.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (invalidLogin) {
                throw new Error("Invalid password");
            }

            // If we get here, login status is unknown
            throw new Error("Unable to determine login status");

        } catch (error) {
            console.error(`[LOGIN] Error during login:`, error);
            loginAttempts++;

            if (loginAttempts >= maxLoginAttempts) {
                throw new Error(`Failed after ${maxLoginAttempts} attempts: ${error.message}`);
            }
        }
    }

    throw new Error(`Failed after ${maxLoginAttempts} login attempts`);
}

// Helper function to select dropdown option using keyboard
async function selectDropdownOption(page, selector, downPresses) {
    await page.locator(selector).click();
    await page.waitForTimeout(500);

    for (let i = 0; i < downPresses; i++) {
        await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
}

// Function to navigate to file return for individuals
async function navigateToFileReturn(page, individual) {
    let dialogMessage = '';

    // Set up dialog handler to capture messages
    page.on('dialog', async dialog => {
        dialogMessage = dialog.message();
        console.log(`Dialog message: ${dialogMessage}`);
        await dialog.accept().catch(() => { });
    });

    await page.goto("https://itax.kra.go.ke/KRA-Portal/");
    // ... (Navigation code remains similar)
    const returnsSelector = '#ddtopmenubar > ul > li > a[rel="Returns"]';
    await page.hover(returnsSelector);
    await page.waitForTimeout(500);
    await page.evaluate(() => showNilReturn());
    await page.waitForLoadState("networkidle");

    await selectDropdownOption(page, '#regType', 1);
    await page.getByRole('button', { name: 'Next' }).click();
    await page.waitForTimeout(2000);

    const obligationType = individual.resident_type || '1';
    const downPresses = obligationType === '1' ? 1 : 2;
    for (let i = 0; i < downPresses; i++) {
        await page.keyboard.press('ArrowDown');
    }
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Extract period dates
    console.log('Extracting return period dates...');
    let periodFrom = '';
    let periodTo = '';
    try {
        periodFrom = await page.locator('#txtPeriodFrom').inputValue().catch(() => '');
        periodTo = await page.locator('#txtPeriodTo').inputValue().catch(() => '');
        console.log(`Return period: From ${periodFrom} to ${periodTo}`);
    } catch (error) {
        console.log('Could not extract period dates:', error.message);
    }

    // Check for pending years and payment requirement BEFORE submitting
    const currentYear = new Date().getFullYear();
    const periodYear = periodFrom ? parseInt(periodFrom.split('/')[2]) : currentYear;
    const pendingYears = currentYear - periodYear;
    const extraCharge = pendingYears > 0 ? pendingYears * 10 : 0;

    // If there are pending years and user hasn't paid extra yet, return immediately
    if (pendingYears > 0 && !individual.hasPaidExtra) {
        console.log(`[PAYMENT] Pending years detected: ${pendingYears}. Waiting for payment.`);
        return {
            requiresPayment: true,
            reason: 'pending_years',
            periodFrom,
            periodTo,
            pendingYears,
            extraCharge,
            message: `You have ${pendingYears} pending year(s) to file. Please pay the extra charge of KES ${extraCharge} to proceed.`
        };
    }

    console.log('Clicking first Submit button...');
    await page.getByRole('button', { name: 'Submit' }).click();
    await page.waitForTimeout(2000);

    // Check for employment income error (Text or Dialog)
    const pageContent = await page.content();
    const textError = /employment\s+income/i.test(pageContent) && /cannot\s+file\s+nil\s+return/i.test(pageContent);
    const dialogError = dialogMessage && (dialogMessage.includes('Employment Income') || dialogMessage.includes('employment income'));

    if (textError || dialogError) {
        console.log('[ERROR] Employment income detected after first submit');
        return {
            requiresPayment: true,
            reason: 'employment_income',
            periodFrom,
            periodTo,
            pendingYears,
            extraCharge,
            refundAmount: 30,
            message: dialogError ? dialogMessage : `You have Employment Income. You cannot file a NIL return.`
        };
    }

    console.log('Clicking second Submit button...');
    await page.getByRole('button', { name: 'Submit' }).click();
    dialogMessage = ''; // Reset dialog message
    await page.waitForTimeout(2000);

    // Check errors again after second submit
    if (dialogMessage && (dialogMessage.includes('Employment Income') || dialogMessage.includes('employment income'))) {
        return {
            requiresPayment: true,
            reason: 'employment_income',
            periodFrom,
            periodTo,
            pendingYears,
            extraCharge,
            refundAmount: 30,
            message: dialogMessage
        };
    }

    console.log('Waiting for final page load...');
    try {
        await page.waitForLoadState("networkidle", { timeout: 30000 });
    } catch (e) {
        console.log('Timeout waiting for networkidle');
    }

    // Final check for text errors
    const finalPageContent = await page.content();
    if (/employment\s+income/i.test(finalPageContent) && /cannot\s+file\s+nil\s+return/i.test(finalPageContent)) {
        return {
            requiresPayment: true,
            reason: 'employment_income',
            periodFrom,
            periodTo,
            pendingYears,
            extraCharge,
            refundAmount: 30,
            message: `You have Employment Income. You cannot file a NIL return.`
        };
    }

    // ... (Download logic) ...

    console.log('Initiating download process...');

    // Check if download link exists
    const downloadLink = await page.getByRole('link', { name: 'Download Returns Receipt' }).isVisible().catch(() => false);

    if (!downloadLink) {
        console.log('[WARNING] Download link not found - checking for errors');

        // Final check for text errors if download link is missing
        const pageContent = await page.content();
        if (/employment\s+income/i.test(pageContent)) {
            return {
                requiresPayment: true,
                reason: 'employment_income',
                periodFrom: periodFrom || '01/01/' + new Date().getFullYear(),
                periodTo: periodTo || '31/12/' + new Date().getFullYear(),
                pendingYears: 1,
                extraCharge: 0,
                refundAmount: 30,
                message: `You have Employment Income. You cannot file a NIL return.`
            };
        }

        throw new Error('Download link not found. The return may not have been filed successfully.');
    }

    const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
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
            email,
            resident_type,
            hasPaidExtra // New field
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
            email,
            resident_type: resident_type || '1' // Default to resident
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
            channel: "chrome",
            // args: ['--start-maximized'],
            // ignoreDefaultArgs: ['--headless']
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

            // Check if employment income was detected (requires payment)
            if (receiptPaths.requiresPayment) {
                console.log('[EMPLOYMENT INCOME] User has employment income, returning payment info to UI');
                await browser.close();
                return NextResponse.json({
                    requiresPayment: true,
                    periodFrom: receiptPaths.periodFrom,
                    periodTo: receiptPaths.periodTo,
                    pendingYears: receiptPaths.pendingYears,
                    extraCharge: receiptPaths.extraCharge,
                    message: receiptPaths.message
                });
            }

            receiptUrl = receiptPaths.storageUrl;

            // If we have a receipt URL, the filing was successful
            if (receiptUrl) {
                status = "Valid";
            } else {
                // Check for potential issues (password expired, account locked, etc.) only if we didn't get a receipt
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
                            : "Failed"; // Default to Failed if no errors found
            }

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

            // Check if it's an employment income error thrown as Error
            if (error.message && error.message.includes('Employment Income')) {
                return NextResponse.json({
                    success: false,
                    requiresPayment: true,
                    periodFrom: '01/01/' + new Date().getFullYear(),
                    periodTo: '31/12/' + new Date().getFullYear(),
                    pendingYears: 1,
                    extraCharge: 0,
                    message: error.message,
                    refundAmount: 30,
                    timestamp: new Date().toISOString()
                });
            }

            return NextResponse.json(
                {
                    success: false,
                    error: error.message || "Automation process failed",
                    status: "Failed"
                },
                { status: 500 }
            );
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

        // Check if employment income was detected (requiresPayment flag)
        if (receiptPaths && receiptPaths.requiresPayment) {
            console.log('[API] Returning employment income detection response');
            return NextResponse.json({
                success: false,
                requiresPayment: true,
                periodFrom: receiptPaths.periodFrom,
                periodTo: receiptPaths.periodTo,
                pendingYears: receiptPaths.pendingYears,
                extraCharge: receiptPaths.extraCharge,
                message: receiptPaths.message,
                refundAmount: 30, // 30 KES refund for employees
                timestamp: new Date().toISOString()
            });
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

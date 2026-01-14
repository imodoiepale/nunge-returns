import { chromium } from "playwright";
import { createWorker } from "tesseract.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

const downloadFolderPath = path.join(os.tmpdir(), "kra-password-validation");
await fs.mkdir(downloadFolderPath, { recursive: true }).catch(console.error);

/**
 * Extract text from captcha image using OCR
 */
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

/**
 * Login to KRA iTax portal and check password status
 */
async function loginToKRA(page, pin, password) {
    console.log(`[LOGIN] Attempting login for PIN: ${pin}`);

    if (!pin || !password) {
        return {
            status: "error",
            message: "PIN and password are required"
        };
    }

    let loginAttempts = 0;
    const maxLoginAttempts = 3;

    while (loginAttempts < maxLoginAttempts) {
        try {
            await page.goto("https://itax.kra.go.ke/KRA-Portal/", { waitUntil: 'networkidle' });

            // Fill PIN
            await page.locator("#logid").click();
            await page.locator("#logid").fill(pin);

            // Check for "Details not updated" message
            const detailsNotUpdated = await page.waitForSelector(
                'b:has-text("You have not updated your details in iTax.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (detailsNotUpdated) {
                console.log(`[LOGIN] Details not updated in iTax for PIN: ${pin}`);
                return {
                    status: "details_not_updated",
                    message: "User has not updated their details in iTax"
                };
            }

            // Validate PIN format
            try {
                await page.evaluate(() => {
                    CheckPIN();
                });
            } catch (error) {
                return {
                    status: "invalid_pin",
                    message: "Invalid PIN format"
                };
            }

            // Fill password
            await page.locator('input[name="xxZTT9p2wQ"]').fill(password);
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

            // Check login status
            return await checkLoginStatus(page);

        } catch (error) {
            // Handle cached page error
            if (error.message === "CACHED_PAGE_ERROR") {
                console.log(`[LOGIN] Cached page detected, retrying... (attempt ${loginAttempts + 1}/${maxLoginAttempts})`);
                loginAttempts++;
                await page.waitForTimeout(1000);
                continue;
            }

            console.error(`[LOGIN] Error during login:`, error);
            loginAttempts++;

            if (loginAttempts >= maxLoginAttempts) {
                return {
                    status: "error",
                    message: `Failed after ${maxLoginAttempts} attempts: ${error.message}`
                };
            }
        }
    }

    return {
        status: "error",
        message: `Failed after ${maxLoginAttempts} login attempts`
    };
}

/**
 * Check login status and return appropriate response
 */
async function checkLoginStatus(page) {
    // Check for cached page error FIRST
    const cachedPageError = await page.waitForSelector(
        'b:has-text("Invalid request. You might be using cached page. Please Login again.")',
        { timeout: 1000, state: "visible" }
    ).catch(() => false);

    if (cachedPageError) {
        throw new Error("CACHED_PAGE_ERROR");
    }

    // Check if login was successful (look for main menu)
    const mainMenu = await page.waitForSelector(
        "#ddtopmenubar > ul > li:nth-child(1) > a",
        { timeout: 2000, state: "visible" }
    ).catch(() => false);

    if (mainMenu) {
        return {
            status: "valid",
            message: "Login successful, password is valid"
        };
    }

    // Check for password expired
    const passwordExpired = await page.waitForSelector(
        '.formheading:has-text("YOUR PASSWORD HAS EXPIRED!")',
        { timeout: 1000, state: "visible" }
    ).catch(() => false);

    if (passwordExpired) {
        return {
            status: "password_expired",
            message: "Password has expired and needs to be reset",
            requiresPasswordReset: true
        };
    }

    // Check for account locked
    const accountLocked = await page.waitForSelector(
        'b:has-text("The account has been locked.")',
        { timeout: 1000, state: "visible" }
    ).catch(() => false);

    if (accountLocked) {
        return {
            status: "locked",
            message: "Account has been locked"
        };
    }

    // Check for cancelled user
    const cancelledUser = await page.waitForSelector(
        'b:has-text("User has been cancelled.")',
        { timeout: 1000, state: "visible" }
    ).catch(() => false);

    if (cancelledUser) {
        return {
            status: "cancelled",
            message: "User has been cancelled"
        };
    }

    // Check for invalid login
    const invalidLogin = await page.waitForSelector(
        'b:has-text("Invalid Login Id or Password.")',
        { timeout: 1000, state: "visible" }
    ).catch(() => false);

    if (invalidLogin) {
        return {
            status: "invalid",
            message: "Invalid password"
        };
    }

    return {
        status: "unknown",
        message: "Unable to determine login status"
    };
}

/**
 * Handle password expiry by resetting to new password
 */
async function handlePasswordExpiry(page, currentPassword, newPassword) {
    try {
        console.log(`[PASSWORD] Resetting expired password...`);

        // Fill current password
        await page.locator('input[name="$ZxQPLm$"]').fill(currentPassword);

        // Fill new password
        await page.locator('input[name="$kkCx7ZqD"]').fill(newPassword);

        // Confirm new password
        await page.locator('input[name="c$$p97aSd"]').fill(newPassword);

        // Submit
        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(1000);

        // Handle secure password policy checkbox
        const policyCheckbox = await page.waitForSelector('#securePwdPolicy', { timeout: 2000 }).catch(() => null);

        if (policyCheckbox) {
            await page.locator('#securePwdPolicy').check();
            await page.getByRole('button', { name: 'Submit' }).click();
            await page.waitForTimeout(1000);
        }

        // Click back button
        const backButton = await page.getByRole('button', { name: 'Back' }).catch(() => null);
        if (backButton) {
            await backButton.click();
        }

        console.log(`[PASSWORD] Successfully reset password`);

        return {
            success: true,
            newPassword
        };
    } catch (error) {
        console.error("[PASSWORD] Error resetting password:", error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Safely logout from KRA portal
 */
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
    } catch (error) {
        console.error("[LOGOUT] Error during logout:", error);
    }
}

/**
 * Main function to validate password for an individual
 * @param {string} pin - KRA PIN
 * @param {string} password - Current password
 * @param {string} newPassword - New password to set if current is expired (optional)
 * @returns {Promise<Object>} Validation result
 */
export async function validateIndividualPassword(pin, password, newPassword = null) {
    let browser = null;
    let browserClosed = false;

    try {
        console.log(`[VALIDATION] Starting password validation for PIN: ${pin}`);
        browser = await chromium.launch({
            headless: false,
            channel: 'chrome'
        });

        // Add listener for browser closure
        browser.on('disconnected', () => {
            console.log('[VALIDATION] Browser was closed by user');
            browserClosed = true;
        });

        const context = await browser.newContext();
        const page = await context.newPage();
        page.setDefaultNavigationTimeout(180000);
        page.setDefaultTimeout(180000);

        // Attempt login
        const loginResult = await loginToKRA(page, pin, password);

        // Handle password expiry if detected
        if (loginResult.status === "password_expired" && newPassword) {
            const resetResult = await handlePasswordExpiry(page, password, newPassword);

            if (resetResult.success) {
                loginResult.newPassword = newPassword;
                loginResult.message += ` Password has been reset successfully.`;
            } else {
                loginResult.message += ` Failed to reset password: ${resetResult.error}`;
            }
        }

        // Logout
        await logoutSafely(page);
        await context.close();
        await browser.close();

        console.log(`[VALIDATION] Completed with status: ${loginResult.status}`);
        return loginResult;
    } catch (error) {
        console.error(`[VALIDATION] Error:`, error);

        // Check if browser was closed by user
        if (browserClosed) {
            console.log('[VALIDATION] Validation cancelled by user');
            return {
                status: "cancelled",
                message: "Validation cancelled by user"
            };
        }

        if (browser) {
            try {
                await browser.close();
            } catch (closeError) {
                console.error(`[VALIDATION] Error closing browser:`, closeError);
            }
        }

        return {
            status: "error",
            message: error.message
        };
    }
}

/**
 * Clean up temporary OCR images
 */
export async function cleanupTempFiles() {
    try {
        const files = await fs.readdir(downloadFolderPath);
        let deletedCount = 0;

        for (const file of files) {
            if (file.startsWith('ocr_') && file.endsWith('.png')) {
                const filePath = path.join(downloadFolderPath, file);
                await fs.unlink(filePath);
                deletedCount++;
            }
        }

        console.log(`[CLEANUP] Deleted ${deletedCount} temporary files`);
    } catch (error) {
        console.error(`[CLEANUP] Error:`, error.message);
    }
}

import { chromium } from "playwright";
import { createWorker } from "tesseract.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

const downloadFolderPath = path.join(os.tmpdir(), "kra-automation");
await fs.mkdir(downloadFolderPath, { recursive: true }).catch(console.error);

/**
 * Extract captcha text using OCR (shared across all KRA automations)
 * @param {Page} page - Playwright page object
 * @param {string} imageSelector - CSS selector for the captcha image (default: #captcha_img)
 */
export async function extractCaptchaText(page, imageSelector = "#captcha_img") {
    const randomId = Math.floor(Math.random() * 10000);
    const imagePath = path.join(downloadFolderPath, `ocr_${randomId}.png`);

    try {
        // First check if CAPTCHA text is available in DOM (forgot password page shows text-based CAPTCHA)
        try {
            // The forgot password CAPTCHA is displayed as text next to "Security Stamp*"
            // Look for the row containing Security Stamp and extract the CAPTCHA question
            const securityRow = page.locator('tr:has(td:has-text("Security Stamp"))');
            if (await securityRow.count() > 0) {
                const rowText = await securityRow.first().textContent();
                console.log(`[CAPTCHA ${randomId}] Security Stamp row text:`, rowText);
                
                // Extract the math expression (e.g., "107 - 12?")
                const mathMatch = rowText.match(/(\d+)\s*([\+\-\*x])\s*(\d+)/);
                if (mathMatch) {
                    const num1 = Number(mathMatch[1]);
                    const operator = mathMatch[2];
                    const num2 = Number(mathMatch[3]);
                    
                    let result;
                    if (operator === '+') {
                        result = num1 + num2;
                    } else if (operator === '-') {
                        result = num1 - num2;
                    } else if (operator === '*' || operator === 'x') {
                        result = num1 * num2;
                    }
                    
                    if (result !== undefined) {
                        console.log(`[CAPTCHA ${randomId}] Solved from DOM: ${num1} ${operator} ${num2} = ${result}`);
                        return result.toString();
                    }
                }
            }
        } catch (e) {
            console.log(`[CAPTCHA ${randomId}] Could not extract from DOM (${e.message}), falling back to OCR`);
        }

        const image = await page.waitForSelector(imageSelector, { timeout: 10000, state: 'visible' });
        
        // Wait for image to fully load
        await page.waitForTimeout(1000);
        
        // Get bounding box and take screenshot
        const box = await image.boundingBox();
        if (!box) {
            throw new Error('Could not get captcha image bounding box');
        }
        
        console.log(`[CAPTCHA ${randomId}] Image bounds:`, box);
        
        // Take screenshot of the captcha area with padding
        await page.screenshot({ 
            path: imagePath,
            type: 'png',
            clip: {
                x: Math.max(0, box.x - 5),
                y: Math.max(0, box.y - 5),
                width: box.width + 10,
                height: box.height + 10
            }
        });
        console.log(`[CAPTCHA ${randomId}] Screenshot saved to: ${imagePath}`);

        console.log(`[CAPTCHA ${randomId}] Creating Tesseract worker...`);
        const worker = await createWorker('eng', 1, {
            workerPath: path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
        });
        
        // Configure for single-line text with better accuracy
        await worker.setParameters({
            tessedit_pageseg_mode: '7', // Single line
            tessedit_char_whitelist: '0123456789+-x*=? '
        });
        
        console.log(`[CAPTCHA ${randomId}] Extracting text...`);
        let result;

        const extractResult = async () => {
            const ret = await worker.recognize(imagePath);
            const rawText = ret.data.text;
            console.log(`[CAPTCHA ${randomId}] Raw OCR text:`, JSON.stringify(rawText));
            
            // Remove last 2 characters (newline + question mark) like login CAPTCHA
            const text1 = rawText.slice(0, -1);
            const text = text1.slice(0, -1);
            console.log(`[CAPTCHA ${randomId}] Cleaned text (removed last 2 chars):`, text);
            
            // Extract numbers from the text
            const numbers = text.match(/\d+/g);
            console.log(`[CAPTCHA ${randomId}] Extracted Numbers:`, numbers);

            if (!numbers || numbers.length < 2) {
                throw new Error(`Unable to extract valid numbers from text: "${text}"`);
            }

            // Detect operator
            if (text.includes("+")) {
                result = Number(numbers[0]) + Number(numbers[1]);
                console.log(`[CAPTCHA ${randomId}] Operation: ${numbers[0]} + ${numbers[1]} = ${result}`);
            } else if (text.includes("-")) {
                result = Number(numbers[0]) - Number(numbers[1]);
                console.log(`[CAPTCHA ${randomId}] Operation: ${numbers[0]} - ${numbers[1]} = ${result}`);
            } else if (text.includes("*") || text.includes("x")) {
                result = Number(numbers[0]) * Number(numbers[1]);
                console.log(`[CAPTCHA ${randomId}] Operation: ${numbers[0]} * ${numbers[1]} = ${result}`);
            } else {
                throw new Error(`Unsupported operator in text: "${text}"`);
            }
        };

        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                await extractResult();
                break;
            } catch (error) {
                console.log(`[CAPTCHA ${randomId}] Re-extracting text from image...`);
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

        console.log(`[CAPTCHA ${randomId}] Result:`, result.toString());
        await worker.terminate();

        try {
            await fs.unlink(imagePath);
        } catch (error) {
            console.error(`[CAPTCHA ${randomId}] Error deleting OCR image: ${error.message}`);
        }

        return result.toString();
    } catch (error) {
        console.error(`[CAPTCHA ${randomId}] CRITICAL ERROR:`, error.message);
        throw new Error(`Captcha extraction failed: ${error.message}`);
    }
}

/**
 * Login to KRA iTax portal with captcha solving and retry
 * Returns: { status, message, page } on success or throws on failure
 */
export async function loginToKRA(page, pin, password) {
    console.log(`[LOGIN] Attempting login for PIN: ${pin}`);

    if (!pin || !password) {
        throw new Error("PIN and password are required");
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
                return { status: "details_not_updated", message: "User has not updated their details in iTax" };
            }

            // Validate PIN format via page script
            try {
                await page.evaluate(() => { CheckPIN(); });
            } catch (error) {
                return { status: "invalid_pin", message: "Invalid PIN format" };
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

            // Check for cached page error
            const cachedPageError = await page.waitForSelector(
                'b:has-text("Invalid request. You might be using cached page. Please Login again.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (cachedPageError) {
                console.log(`[LOGIN] Cached page detected, retrying...`);
                loginAttempts++;
                await page.waitForTimeout(1000);
                continue;
            }

            // Check for first-time login / password change required
            const firstTimeLogin = await page.waitForSelector(
                'input[name="firstTimeLoginVO.$ZxQPLm$"]',
                { timeout: 2000, state: "visible" }
            ).catch(() => false);

            if (firstTimeLogin) {
                return { status: "first_time_login", message: "First-time login detected — password change required" };
            }

            // Check for password expired
            const passwordExpired = await page.waitForSelector(
                '.formheading:has-text("YOUR PASSWORD HAS EXPIRED!")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (passwordExpired) {
                return { status: "password_expired", message: "Password has expired and needs to be reset" };
            }

            // Check if login was successful (main menu visible)
            const mainMenu = await page.waitForSelector(
                "#ddtopmenubar > ul > li:nth-child(1) > a",
                { timeout: 2000, state: "visible" }
            ).catch(() => false);

            if (mainMenu) {
                console.log(`[LOGIN] Login successful for PIN: ${pin}`);
                return { status: "valid", message: "Login successful" };
            }

            // Check for account locked
            const accountLocked = await page.waitForSelector(
                'b:has-text("The account has been locked.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (accountLocked) {
                return { status: "locked", message: "Account has been locked" };
            }

            // Check for cancelled user
            const cancelledUser = await page.waitForSelector(
                'b:has-text("User has been cancelled.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (cancelledUser) {
                return { status: "cancelled", message: "User has been cancelled" };
            }

            // Check for invalid login
            const invalidLogin = await page.waitForSelector(
                'b:has-text("Invalid Login Id or Password.")',
                { timeout: 1000, state: "visible" }
            ).catch(() => false);

            if (invalidLogin) {
                return { status: "invalid", message: "Invalid password" };
            }

            return { status: "unknown", message: "Unable to determine login status" };

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

/**
 * Handle first-time login flow: fill recovery password, set new password, security question
 */
export async function handleFirstTimeLogin(page, recoveryPassword, newPassword) {
    try {
        console.log(`[FIRST-TIME] Setting new password...`);

        // Fill current/recovery password
        await page.locator('input[name="firstTimeLoginVO.$ZxQPLm$"]').fill(recoveryPassword);

        // Fill new password
        await page.locator('input[name="firstTimeLoginVO.$kkCx7ZqD"]').fill(newPassword);

        // Confirm new password
        await page.getByRole('row', { name: 'Confirm New Password*', exact: true }).getByRole('textbox').fill(newPassword);

        // Security question
        await page.locator('#secQuestion').selectOption('BCITY');
        await page.locator('#secAnswer').click();
        await page.locator('#secAnswer').fill('Nairobi');
        await page.locator('#confirmSecAnswer').click();
        await page.locator('#confirmSecAnswer').fill('Nairobi');

        // Accept checkboxes
        await page.locator('#chkDisclaimer').check();
        await page.locator('#securePwdPolicy').check();

        // Handle the dialog that appears on submit
        page.once('dialog', dialog => {
            console.log(`[FIRST-TIME] Dialog message: ${dialog.message()}`);
            dialog.dismiss().catch(() => {});
        });

        // Submit
        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(3000);

        console.log(`[FIRST-TIME] Password set successfully`);
        return { success: true, newPassword };
    } catch (error) {
        console.error("[FIRST-TIME] Error:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Handle password expiry flow
 */
export async function handlePasswordExpiry(page, currentPassword, newPassword) {
    try {
        console.log(`[PASSWORD] Resetting expired password...`);

        await page.locator('input[name="$ZxQPLm$"]').fill(currentPassword);
        await page.locator('input[name="$kkCx7ZqD"]').fill(newPassword);
        await page.locator('input[name="c$$p97aSd"]').fill(newPassword);

        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(1000);

        const policyCheckbox = await page.waitForSelector('#securePwdPolicy', { timeout: 2000 }).catch(() => null);
        if (policyCheckbox) {
            await page.locator('#securePwdPolicy').check();
            await page.getByRole('button', { name: 'Submit' }).click();
            await page.waitForTimeout(1000);
        }

        console.log(`[PASSWORD] Successfully reset password`);
        return { success: true, newPassword };
    } catch (error) {
        console.error("[PASSWORD] Error resetting password:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Navigate to forgot password page and trigger email recovery
 */
export async function triggerPasswordResetViaEmail(page, pin) {
    try {
        console.log(`[RESET] Navigating to forgot password for PIN: ${pin}`);

        // Navigate directly to forgot password page
        await page.goto("https://itax.kra.go.ke/KRA-Portal/", { waitUntil: 'domcontentloaded' });
        
        // Click the forgot password link
        await page.getByRole('link', { name: 'Forgot Password/Unlock Account' }).click();
        await page.waitForLoadState('domcontentloaded');

        // Fill PIN in the username field
        await page.locator('#username').fill(pin);

        // Solve the CAPTCHA using OCR (forgot password page uses #captchaPost_img)
        console.log('[RESET] Solving CAPTCHA...');
        const captchaResult = await extractCaptchaText(page, '#captchaPost_img');
        console.log(`[RESET] CAPTCHA solved: ${captchaResult}`);
        
        // Fill the CAPTCHA answer in #captcahPostText
        await page.locator('#captcahPostText').fill(String(captchaResult));

        // Submit the form
        await page.getByRole('button', { name: 'Submit' }).click();

        // Wait for response and check for success message
        await page.waitForLoadState('domcontentloaded');
        
        // Check for success message
        let successMsg = null;
        try {
            successMsg = await page.getByText('Your password has been sent', { timeout: 5000 });
        } catch (e) {
            // Success message not found
        }
        
        if (successMsg) {
            console.log('[RESET] Password reset email sent successfully');
            return { success: true, message: 'Recovery password sent to your registered email' };
        }

        // Check for error messages
        try {
            const errorEl = page.locator('.error-message, b[style*="color:red"], .alert-danger');
            if (await errorEl.count() > 0) {
                const errorMsg = await errorEl.first().textContent();
                if (errorMsg && errorMsg.trim()) {
                    console.log(`[RESET] Error: ${errorMsg}`);
                    return { success: false, message: errorMsg.trim() };
                }
            }
        } catch (e) { /* ignore */ }

        // If no clear success/error, assume success
        return { success: true, message: 'Password reset request submitted. Check your email for the recovery password.' };
    } catch (error) {
        console.error("[RESET] Error triggering password reset:", error);
        return { success: false, message: error.message };
    }
}

/**
 * Safely logout from KRA portal
 */
export async function logoutSafely(page) {
    try {
        await page.evaluate(() => {
            try { logOutUser(); } catch (e) {}
        });
        await page.waitForTimeout(1000);
    } catch (error) {
        console.error("[LOGOUT] Error during logout:", error);
    }
}

/**
 * Launch a browser for KRA automation
 */
export async function launchBrowser(headless = false) {
    const browser = await chromium.launch({
        headless,
        channel: 'chrome'
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.setDefaultNavigationTimeout(180000);
    page.setDefaultTimeout(60000);
    return { browser, context, page };
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
                await fs.unlink(path.join(downloadFolderPath, file));
                deletedCount++;
            }
        }
        console.log(`[CLEANUP] Deleted ${deletedCount} temporary files`);
    } catch (error) {
        console.error(`[CLEANUP] Error:`, error.message);
    }
}

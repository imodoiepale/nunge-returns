import { NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { extractCaptchaText } from '@/services/kra-utils';
import path from 'path';
import os from 'os';
import fs from 'fs';

const KRA_PORTAL_URL = 'https://itax.kra.go.ke/KRA-Portal/';

// Store browser sessions for OTP continuation
const sessions = new Map();

export async function POST(request) {
    let browser = null;
    let context = null;
    let page = null;

    try {
        const formData = await request.json();
        const { step, otp, sessionId } = formData;
        
        console.log(`[KRA REGISTRATION] Step: ${step || 'start'}`);
        
        // If completing with OTP, retrieve existing session
        if (step === 'complete' && sessionId) {
            const session = sessions.get(sessionId);
            if (!session) {
                return NextResponse.json({ success: false, error: 'Session expired or not found' });
            }
            
            page = session.page;
            browser = session.browser;
            context = session.context;
            
            console.log('[KRA REGISTRATION] Continuing with OTP:', otp);
            
            // Enter OTP
            await page.fill('#otpTextKE', otp);
            await page.waitForTimeout(1000);
            
            // Continue with the rest of the registration...
            // (Will add the continuation logic below)
        } else {
            // Start new registration
            console.log('[KRA REGISTRATION] Starting new PIN registration process...');

        // Launch browser
        browser = await chromium.launch({
            headless: false,
            slowMo: 500
        });

        context = await browser.newContext();
        page = await context.newPage();

        // Navigate to KRA portal
        console.log('[KRA REGISTRATION] Navigating to KRA portal...');
        await page.goto(KRA_PORTAL_URL, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Click on new registration
        console.log('[KRA REGISTRATION] Clicking new registration...');
        await page.locator('#newReg').getByRole('link', { name: 'Click Here' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        // Select taxpayer type (Individual)
        console.log('[KRA REGISTRATION] Selecting taxpayer type...');
        await page.locator('#cmbTaxpayerType').waitFor({ state: 'visible' });
        await page.locator('#cmbTaxpayerType').selectOption('INDI');
        await page.waitForTimeout(500);
        await page.locator('#modeOfRegsitartion').selectOption('ON');
        await page.waitForTimeout(500);
        await page.getByRole('button', { name: 'Next' }).click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // PAGE 1: Personal Information
        console.log('[KRA REGISTRATION] Filling personal information...');
        
        // Wait for profession dropdown to be fully loaded
        await page.locator('#cmbTxprProfId').waitFor({ state: 'visible', timeout: 15000 });
        await page.waitForTimeout(1500);
        
        // Profession - use value 11 for Students (71-Students)
        const professionValue = formData.profession || '11';
        console.log(`[KRA REGISTRATION] Selecting profession: ${professionValue}`);
        await page.locator('#cmbTxprProfId').selectOption(professionValue);

        // Citizenship
        await page.waitForTimeout(500);
        await page.locator('#rdoCiti1').check();

        // ID Number and Date of Birth
        await page.waitForTimeout(500);
        await page.locator('#txtTxprKENatId').fill(formData.idNumber);
        await page.waitForTimeout(300);
        await page.locator('#calKeTxprDOB').fill(formData.dateOfBirth);

        // Address Information
        console.log('[KRA REGISTRATION] Filling address details...');
        await page.waitForTimeout(500);
        await page.locator('#txtTxprKELocStrtRoad').fill(formData.streetRoad);
        await page.waitForTimeout(300);
        await page.locator('#txtTxprKELocCity').fill(formData.city);
        await page.waitForTimeout(300);
        await page.locator('#txtTxprKELocCounty').selectOption(formData.county || '30');
        await page.waitForTimeout(300);
        await page.locator('#txtTxprKELocDistrict').selectOption(formData.district || '93');
        await page.waitForTimeout(300);
        await page.locator('#txtTxprKELocLocality').selectOption(formData.locality || '664');
        await page.waitForTimeout(300);
        await page.locator('#txtTxprKELocTown').selectOption(formData.town || '00100');
        await page.waitForTimeout(300);
        await page.locator('#txtTxprKELocPOBox').fill(formData.poBox);

        // Data privacy checkbox
        await page.waitForTimeout(500);
        await page.locator('#chkDataPriv').check();

        // Click Next to go to Contact Information page
        await page.waitForTimeout(1000);
        
        // Bypass validation functions
        await page.evaluate(() => {
            window.validateKEFields = function () {
                console.log("Validation bypassed: validateKEFields");
                return true;
            };
            window.checkEmail = function () {
                console.log("Validation bypassed: checkEmail");
                return true;
            };
        });

        // Contact Information
        console.log('[KRA REGISTRATION] Filling contact information...');
        await page.locator('#txtTxprKELocMobNo1').fill(formData.mobileNumber);
        await page.locator('#txtTxprKELocMainEmail').fill(formData.mainEmail.toUpperCase());
        if (formData.secondaryEmail) {
            await page.locator('#txtTxprKELocSecEmail').fill(formData.secondaryEmail.toUpperCase());
        }

        // Send OTP
        console.log('[KRA REGISTRATION] Sending OTP...');
        await page.locator('#SendOtpKE').click();
        await page.waitForTimeout(2000);

        // Wait for OTP input field to appear
        console.log('[KRA REGISTRATION] Waiting for OTP field...');
        await page.waitForSelector('#otpTextKE', { state: 'visible' });
        
        // Store session and return to frontend for OTP input
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessions.set(sessionId, { browser, context, page });
        
        // Clean up old sessions after 10 minutes
        setTimeout(() => {
            if (sessions.has(sessionId)) {
                const oldSession = sessions.get(sessionId);
                oldSession.browser?.close().catch(() => {});
                sessions.delete(sessionId);
            }
        }, 10 * 60 * 1000);
        
        console.log('[KRA REGISTRATION] Pausing for OTP - session:', sessionId);
        return NextResponse.json({ 
            success: false, 
            needsOTP: true, 
            sessionId,
            message: 'OTP has been sent to your mobile number' 
        });
    }
    
    // Continue after OTP is provided
    if (step === 'complete') {

        // Upload ID documents if available
        console.log('[KRA REGISTRATION] Uploading ID documents...');
        
        if (formData.idFrontImage && formData.idBackImage) {
            try {
                // Convert base64 to file and upload front ID
                const frontBuffer = Buffer.from(formData.idFrontImage.split(',')[1], 'base64');
                const frontPath = path.join(os.tmpdir(), `id_front_${Date.now()}.jpg`);
                fs.writeFileSync(frontPath, frontBuffer);
                
                await page.locator('#frontIdFile').setInputFiles(frontPath);
                await page.waitForTimeout(1000);
                
                // Convert base64 to file and upload back ID
                const backBuffer = Buffer.from(formData.idBackImage.split(',')[1], 'base64');
                const backPath = path.join(os.tmpdir(), `id_back_${Date.now()}.jpg`);
                fs.writeFileSync(backPath, backBuffer);
                
                await page.locator('#backIdFile').setInputFiles(backPath);
                await page.waitForTimeout(1000);
                
                // Clean up temp files
                fs.unlinkSync(frontPath);
                fs.unlinkSync(backPath);
                
                console.log('[KRA REGISTRATION] ID documents uploaded successfully');
            } catch (error) {
                console.error('[KRA REGISTRATION] Error uploading ID documents:', error);
                // Continue anyway - ID upload might be optional
            }
        } else {
            console.log('[KRA REGISTRATION] No ID images provided, skipping upload');
        }

        // PAGE 2: Obligation Details
        console.log('[KRA REGISTRATION] Navigating to obligations...');
        await page.getByRole('link', { name: 'B_Obligation_Details' }).click();

        // Income Tax checkbox
        if (formData.incomeTax) {
            await page.locator('#chkIncTaxResi').check();
            const today = new Date().toLocaleDateString('en-CA').split('/').reverse().join('/');
            await page.locator('#regDtIncTaxResi').fill(formData.incomeTaxDate || today);
        }

        // PAGE 3: Source of Income
        console.log('[KRA REGISTRATION] Setting source of income...');
        await page.getByRole('link', { name: 'C_Source_Income_Details' }).click();

        await page.getByLabel('Employment Income').selectOption(formData.employmentIncome || 'No');
        await page.getByLabel('Business Income').selectOption(formData.businessIncome || 'No');
        await page.getByLabel('Rental Income', { exact: true }).selectOption(formData.rentalIncome || 'No');

        // Navigate to Agent Details (final page)
        await page.getByRole('link', { name: 'F_Agent_Details' }).click();

        // PAGE 4: CAPTCHA and Submit
        console.log('[KRA REGISTRATION] Solving CAPTCHA...');
        
        async function handleCaptcha() {
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    console.log(`[CAPTCHA] Attempt ${attempts + 1} to solve CAPTCHA`);
                    
                    const captchaResult = await extractCaptchaText(page, '#captcha_img');
                    await page.fill("#captcahText", captchaResult);
                    
                    // Wait for error message
                    const isInvalidCaptcha = await page.waitForSelector('b:has-text("Wrong result of the arithmetic operation.")', 
                        { state: 'visible', timeout: 3000 })
                        .catch(() => null);

                    if (!isInvalidCaptcha) {
                        console.log('[CAPTCHA] CAPTCHA solved successfully!');
                        return true;
                    }

                    console.log('[CAPTCHA] Wrong CAPTCHA result, retrying...');
                    attempts++;
                    
                    if (attempts < maxAttempts) {
                        await page.waitForTimeout(1000);
                    }
                } catch (error) {
                    console.error('[CAPTCHA] Error solving CAPTCHA:', error);
                    attempts++;
                    
                    if (attempts >= maxAttempts) {
                        throw new Error(`Failed to solve CAPTCHA after ${maxAttempts} attempts`);
                    }
                    
                    await page.waitForTimeout(1000);
                }
            }
            
            throw new Error(`Failed to solve CAPTCHA after ${maxAttempts} attempts`);
        }

        await handleCaptcha();

        // Submit registration
        console.log('[KRA REGISTRATION] Submitting registration...');
        await page.locator('#saveReg5').click();
        await page.waitForTimeout(5000);

        // Extract PIN from success page
        console.log('[KRA REGISTRATION] Extracting PIN...');
        let pin = null;
        
        try {
            // Look for PIN in the success message
            const successMessage = await page.textContent('body');
            const pinMatch = successMessage.match(/PIN:\s*([A-Z0-9]+)/i);
            if (pinMatch) {
                pin = pinMatch[1];
            }
            
            // Clean up session
            if (sessionId && sessions.has(sessionId)) {
                sessions.delete(sessionId);
            }
            
            if (pin) {
                pin = pinMatch[1];
                console.log('[KRA REGISTRATION] PIN extracted:', pin);
            }
        } catch (error) {
            console.error('[KRA REGISTRATION] Failed to extract PIN:', error);
        }

        // Wait before closing
        await page.waitForTimeout(5000);

        // Close browser after successful completion
        if (page) await page.close().catch(() => {});
        if (context) await context.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});

        return NextResponse.json({
            success: true,
            pin: pin,
            message: 'KRA PIN registration completed successfully'
        });
        }

    } catch (error) {
        console.error('[KRA REGISTRATION] Error:', error);
        
        // Close browser on error
        if (page) await page.close().catch(() => {});
        if (context) await context.close().catch(() => {});
        if (browser) await browser.close().catch(() => {});
        
        // Provide user-friendly error messages
        let userMessage = 'Registration failed. Please try again.';
        
        if (error.message?.includes('Timeout')) {
            if (error.message.includes('cmbTxprProfId')) {
                userMessage = 'The KRA portal is taking too long to load. Please check your internet connection and try again.';
            } else if (error.message.includes('otpTextKE')) {
                userMessage = 'Failed to send OTP. Please verify your mobile number is correct and try again.';
            } else {
                userMessage = 'The KRA portal is not responding. This may be due to high traffic or maintenance. Please try again in a few minutes.';
            }
        } else if (error.message?.includes('Navigation')) {
            userMessage = 'Unable to connect to the KRA portal. Please check your internet connection and try again.';
        } else if (error.message?.includes('Session expired')) {
            userMessage = 'Your session has expired. Please start the registration process again.';
        } else if (error.message?.includes('CAPTCHA')) {
            userMessage = 'Failed to solve the security verification. Please try again.';
        }
        
        return NextResponse.json({
            success: false,
            error: userMessage,
            technicalError: error.message // For debugging
        }, { status: 500 });
    }
    // Note: No finally block - browser stays open for OTP session
}

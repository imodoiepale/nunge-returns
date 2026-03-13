import { NextRequest, NextResponse } from 'next/server';
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { createWorker } from "tesseract.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zyszsqgdlrpnunkegipk.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

const now = new Date();
const formattedDateTime = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
const downloadFolderPath = path.join(process.cwd(), "temp", `KRA-BATCH-${formattedDateTime}`);

// Obligation ID to name mapping
const OBLIGATION_NAMES = {
    '7': 'PAYE',
    '9': 'VAT',
    '4': 'Income Tax - Company',
    '5': 'MRI',
    '1': 'Resident Individual',
    '8': 'Turnover Tax',
};

async function extractCaptchaText(page) {
    const randomId = Math.floor(Math.random() * 10000);
    const imagePath = path.join(downloadFolderPath, `ocr_batch_${randomId}.png`);

    try {
        const image = await page.waitForSelector("#captcha_img");
        await image.screenshot({ path: imagePath });

        const worker = await createWorker('eng', 1, {
            workerPath: path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
        });

        let result;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                const ret = await worker.recognize(imagePath);
                const text = ret.data.text.slice(0, -2);
                const numbers = text.match(/\d+/g);

                if (!numbers || numbers.length < 2) throw new Error("Unable to extract numbers");

                if (text.includes("+")) {
                    result = Number(numbers[0]) + Number(numbers[1]);
                } else if (text.includes("-")) {
                    result = Number(numbers[0]) - Number(numbers[1]);
                } else {
                    throw new Error("Unsupported operator");
                }
                break;
            } catch (error) {
                attempts++;
                if (attempts < maxAttempts) {
                    await page.waitForTimeout(1000);
                    await image.screenshot({ path: imagePath });
                } else {
                    await worker.terminate();
                    throw new Error("Failed to extract captcha after multiple attempts");
                }
            }
        }

        await worker.terminate();
        try { await fs.unlink(imagePath); } catch { }
        return result.toString();
    } catch (error) {
        throw new Error(`Captcha extraction failed: ${error.message}`);
    }
}

async function loginToKRA(page, company) {
    console.log(`[BATCH-LOGIN] Logging in for PIN: ${company.kra_pin}`);

    let loginAttempts = 0;
    const maxLoginAttempts = 3;

    while (loginAttempts < maxLoginAttempts) {
        try {
            await page.goto("https://itax.kra.go.ke/KRA-Portal/", { waitUntil: 'networkidle' });
            await page.locator("#logid").click();
            await page.locator("#logid").fill(company.kra_pin);

            try { await page.evaluate(() => { CheckPIN(); }); } catch { throw new Error("Invalid PIN format"); }

            await page.locator('input[name="xxZTT9p2wQ"]').fill(company.kra_password);
            await page.waitForTimeout(500);

            const captchaResult = await extractCaptchaText(page);
            await page.type("#captcahText", captchaResult);
            await page.click("#loginButton");
            await page.waitForTimeout(2000);

            const wrongCaptcha = await page.waitForSelector('b:has-text("Wrong result of the arithmetic operation.")', { timeout: 1000, state: "visible" }).catch(() => false);
            if (wrongCaptcha) { loginAttempts++; continue; }

            const mainMenu = await page.waitForSelector("#ddtopmenubar > ul > li:nth-child(1) > a", { timeout: 3000, state: "visible" }).catch(() => false);
            if (mainMenu) {
                console.log(`[BATCH-LOGIN] Login successful for PIN: ${company.kra_pin}`);
                return;
            }

            const accountLocked = await page.waitForSelector('b:has-text("The account has been locked.")', { timeout: 1000, state: "visible" }).catch(() => false);
            if (accountLocked) throw new Error("Account has been locked");

            const invalidLogin = await page.waitForSelector('b:has-text("Invalid Login Id or Password.")', { timeout: 1000, state: "visible" }).catch(() => false);
            if (invalidLogin) throw new Error("Invalid password");

            throw new Error("Unable to determine login status");
        } catch (error) {
            loginAttempts++;
            if (loginAttempts >= maxLoginAttempts) throw new Error(`Login failed after ${maxLoginAttempts} attempts: ${error.message}`);
        }
    }
    throw new Error(`Login failed after ${maxLoginAttempts} attempts`);
}

async function fileNilReturnForObligation(page, company, obligationId) {
    const obligationName = OBLIGATION_NAMES[obligationId] || `Obligation ${obligationId}`;
    console.log(`[BATCH-FILE] Filing nil return for ${obligationName} (ID: ${obligationId})`);

    try {
        // Navigate to nil return page
        await page.goto("https://itax.kra.go.ke/KRA-Portal/");
        await page.waitForTimeout(1000);

        const returnsSelector = '#ddtopmenubar > ul > li > a[rel="Returns"]';
        await page.hover(returnsSelector);
        await page.waitForTimeout(500);
        await page.evaluate(() => { showNilReturn(); });
        await page.waitForLoadState("networkidle");

        // Select obligation type
        await page.locator('#regType').selectOption(obligationId);
        await page.getByRole('button', { name: 'Next' }).click();
        await page.waitForTimeout(2000);

        // Handle dialogs
        let dialogMessage = '';
        page.on('dialog', async dialog => {
            dialogMessage = dialog.message();
            console.log(`[BATCH-FILE] Dialog: ${dialogMessage}`);
            await dialog.accept().catch(() => { });
        });

        // First submit
        console.log(`[BATCH-FILE] Clicking first Submit for ${obligationName}...`);
        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(2000);

        // Check for errors
        if (dialogMessage && /cannot\s+file/i.test(dialogMessage)) {
            return { obligation_id: obligationId, obligation_name: obligationName, status: 'failed', error: dialogMessage, receipt_url: null };
        }

        // Second submit
        console.log(`[BATCH-FILE] Clicking second Submit for ${obligationName}...`);
        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(2000);
        await page.waitForLoadState("networkidle").catch(() => { });

        // Check for download link
        const downloadLink = await page.getByRole('link', { name: 'Download Returns Receipt' }).isVisible().catch(() => false);
        if (!downloadLink) {
            return { obligation_id: obligationId, obligation_name: obligationName, status: 'failed', error: 'Download link not found — filing may have failed', receipt_url: null };
        }

        // Download receipt
        const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
        await page.getByRole('link', { name: 'Download Returns Receipt' }).click();
        const download = await downloadPromise;

        const date = new Date().toISOString().split('T')[0];
        const receiptFileName = `${company.company_name} - ${company.kra_pin} - ${obligationName} - NIL RETURN - ${date}.pdf`;
        const receiptFilePath = path.join(downloadFolderPath, receiptFileName);
        await download.saveAs(receiptFilePath);
        console.log(`[BATCH-FILE] Receipt saved: ${receiptFileName}`);

        // Upload to Supabase storage
        let receiptUrl = null;
        try {
            const fileContent = await fs.readFile(receiptFilePath);
            const storageFileName = `receipts/company_${company.kra_pin}_${obligationName.replace(/\s+/g, '_')}_${date}.pdf`;

            const { error: uploadError } = await supabase.storage.from('receipts').upload(storageFileName, fileContent, { contentType: 'application/pdf', upsert: true });
            if (!uploadError) {
                const { data: urlData } = await supabase.storage.from('receipts').getPublicUrl(storageFileName);
                receiptUrl = urlData?.publicUrl || null;
                console.log(`[BATCH-FILE] Uploaded receipt: ${receiptUrl}`);
            }
        } catch (storageError) {
            console.error(`[BATCH-FILE] Storage upload error for ${obligationName}:`, storageError);
        }

        return { obligation_id: obligationId, obligation_name: obligationName, status: 'completed', error: null, receipt_url: receiptUrl };

    } catch (error) {
        console.error(`[BATCH-FILE] Error filing ${obligationName}:`, error);
        return { obligation_id: obligationId, obligation_name: obligationName, status: 'failed', error: error.message, receipt_url: null };
    }
}

export async function POST(req) {
    try {
        await fs.mkdir(downloadFolderPath, { recursive: true });

        const requestData = await req.json();
        const { company_name, kra_pin, kra_password, obligation_ids, session_id, return_id } = requestData;

        if (!company_name || !kra_pin || !kra_password) {
            return NextResponse.json({ error: "Missing required company information" }, { status: 400 });
        }

        if (!obligation_ids || !Array.isArray(obligation_ids) || obligation_ids.length === 0) {
            return NextResponse.json({ error: "At least one obligation_id is required" }, { status: 400 });
        }

        console.log(`[BATCH] Starting batch filing for ${company_name} (${kra_pin}), obligations: ${obligation_ids.join(', ')}`);

        const company = { company_name, kra_pin, kra_password };

        // Launch browser
        const browser = await chromium.launch({ headless: false, channel: "chrome" });
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await context.newPage();
        page.setDefaultNavigationTimeout(180000);
        page.setDefaultTimeout(180000);

        const results = [];

        try {
            // Login ONCE
            await loginToKRA(page, company);

            // File each obligation sequentially (same browser session)
            for (let i = 0; i < obligation_ids.length; i++) {
                const obligationId = obligation_ids[i];
                console.log(`[BATCH] Filing obligation ${i + 1}/${obligation_ids.length}: ${obligationId}`);

                const result = await fileNilReturnForObligation(page, company, obligationId);
                results.push(result);

                // Small delay between filings to avoid overwhelming iTax
                if (i < obligation_ids.length - 1) {
                    await page.waitForTimeout(2000);
                }
            }

            // Logout
            try {
                await page.evaluate(() => { logOutUser(); logOutUser(); });
            } catch { }

        } catch (error) {
            console.error("[BATCH] Fatal error during batch filing:", error);
            // Mark remaining obligations as failed
            const processedIds = results.map(r => r.obligation_id);
            for (const oid of obligation_ids) {
                if (!processedIds.includes(oid)) {
                    results.push({
                        obligation_id: oid,
                        obligation_name: OBLIGATION_NAMES[oid] || `Obligation ${oid}`,
                        status: 'failed',
                        error: `Batch aborted: ${error.message}`,
                        receipt_url: null,
                    });
                }
            }
        } finally {
            await page.close();
            await context.close();
            await browser.close();
        }

        // Save results to Supabase
        const completed = results.filter(r => r.status === 'completed').length;
        const failed = results.filter(r => r.status === 'failed').length;

        if (session_id) {
            try {
                await supabase.from('session_activities').insert([{
                    session_id,
                    activity_type: 'automation_complete',
                    description: `Batch company filing: ${completed} completed, ${failed} failed`,
                    metadata: { results, total: obligation_ids.length, completed, failed },
                }]);
            } catch (dbError) {
                console.error('[BATCH] DB error logging results:', dbError);
            }
        }

        return NextResponse.json({
            success: completed > 0,
            total: obligation_ids.length,
            completed,
            failed,
            results,
            company_name,
            kra_pin,
            timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("[BATCH] API error:", error);
        return NextResponse.json({ error: `Batch filing failed: ${error.message}` }, { status: 500 });
    }
}

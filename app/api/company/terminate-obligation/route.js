import { NextRequest, NextResponse } from 'next/server';
import { chromium } from "playwright";
import fs from "fs/promises";
import path from "path";
import { createWorker } from "tesseract.js";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zyszsqgdlrpnunkegipk.supabase.co";
const supabaseAnonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });

const downloadFolderPath = path.join(process.cwd(), "temp", "terminations");

const OBLIGATION_NAMES = {
    '7': 'PAYE', '9': 'VAT', '4': 'Income Tax - Company',
    '5': 'MRI', '1': 'Resident Individual', '8': 'Turnover Tax',
};

const TERMINATION_REASONS = [
    'Business Closed', 'Business Dormant', 'Merged with Another Entity',
    'Obligation Not Applicable', 'Duplicate Registration', 'Other',
];

async function extractCaptchaText(page) {
    const randomId = Math.floor(Math.random() * 10000);
    const imagePath = path.join(downloadFolderPath, `ocr_term_${randomId}.png`);

    try {
        const image = await page.waitForSelector("#captcha_img");
        await image.screenshot({ path: imagePath });

        const worker = await createWorker('eng', 1, {
            workerPath: path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js')
        });

        let result;
        let attempts = 0;
        while (attempts < 5) {
            try {
                const ret = await worker.recognize(imagePath);
                const text = ret.data.text.slice(0, -2);
                const numbers = text.match(/\d+/g);
                if (!numbers || numbers.length < 2) throw new Error("Unable to extract numbers");
                if (text.includes("+")) result = Number(numbers[0]) + Number(numbers[1]);
                else if (text.includes("-")) result = Number(numbers[0]) - Number(numbers[1]);
                else throw new Error("Unsupported operator");
                break;
            } catch (error) {
                attempts++;
                if (attempts < 5) { await page.waitForTimeout(1000); await image.screenshot({ path: imagePath }); }
                else { await worker.terminate(); throw new Error("Captcha extraction failed"); }
            }
        }
        await worker.terminate();
        try { await fs.unlink(imagePath); } catch { }
        return result.toString();
    } catch (error) {
        throw new Error(`Captcha failed: ${error.message}`);
    }
}

async function loginToKRA(page, company) {
    let loginAttempts = 0;
    while (loginAttempts < 3) {
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
            if (mainMenu) return;

            const accountLocked = await page.waitForSelector('b:has-text("The account has been locked.")', { timeout: 1000, state: "visible" }).catch(() => false);
            if (accountLocked) throw new Error("Account locked");
            const invalidLogin = await page.waitForSelector('b:has-text("Invalid Login Id or Password.")', { timeout: 1000, state: "visible" }).catch(() => false);
            if (invalidLogin) throw new Error("Invalid password");
            throw new Error("Unable to determine login status");
        } catch (error) {
            loginAttempts++;
            if (loginAttempts >= 3) throw new Error(`Login failed: ${error.message}`);
        }
    }
}

async function navigateToObligationManagement(page) {
    console.log('[TERMINATE] Navigating to Registration > Amend Registration Details...');

    // Navigate to Registration menu
    const registrationSelector = '#ddtopmenubar > ul > li > a[rel="Registration"]';
    await page.hover(registrationSelector);
    await page.waitForTimeout(500);

    // Click on "Amendment of Registration Details"
    // This navigates to the page where obligation deregistration can be initiated
    try {
        await page.evaluate(() => {
            // Try the standard amendment navigation
            showAmendment();
        });
    } catch {
        // Fallback: try direct navigation
        await page.goto("https://itax.kra.go.ke/KRA-Portal/eRegAmend.htm?actionCode=amendReg");
    }

    await page.waitForLoadState("networkidle");
    console.log('[TERMINATE] Loaded obligation management page');
}

async function submitTerminationRequest(page, company, obligationId, reason) {
    const obligationName = OBLIGATION_NAMES[obligationId] || `Obligation ${obligationId}`;
    console.log(`[TERMINATE] Submitting termination for ${obligationName}, reason: ${reason}`);

    try {
        await navigateToObligationManagement(page);

        // Navigate to the obligation section
        // The iTax amendment page has tabs/sections for different registration details
        // We need to find the obligation tab and select the specific obligation for deregistration

        // Select "De-register Obligation" option
        const deregOption = await page.locator('text=De-register').first().isVisible().catch(() => false);
        if (deregOption) {
            await page.locator('text=De-register').first().click();
            await page.waitForTimeout(1000);
        }

        // Select the specific obligation
        try {
            await page.locator(`select#obligationType, #regType`).selectOption(obligationId);
            await page.waitForTimeout(500);
        } catch {
            console.log('[TERMINATE] Could not find obligation dropdown, trying alternative selectors...');
        }

        // Fill in termination reason
        const reasonField = await page.locator('textarea[name*="reason"], input[name*="reason"], #reason, #remarks').first().isVisible().catch(() => false);
        if (reasonField) {
            await page.locator('textarea[name*="reason"], input[name*="reason"], #reason, #remarks').first().fill(reason);
        }

        // Set effective date to today
        const dateField = await page.locator('input[name*="effectiveDate"], input[name*="deregDate"], #effectiveDate').first().isVisible().catch(() => false);
        if (dateField) {
            const today = new Date();
            const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
            await page.locator('input[name*="effectiveDate"], input[name*="deregDate"], #effectiveDate').first().fill(dateStr);
        }

        // Handle dialog for confirmation
        page.on('dialog', async dialog => {
            console.log(`[TERMINATE] Dialog: ${dialog.message()}`);
            await dialog.accept().catch(() => { });
        });

        // Submit the termination request
        await page.getByRole('button', { name: 'Submit' }).click();
        await page.waitForTimeout(3000);
        await page.waitForLoadState("networkidle").catch(() => { });

        // Check for success message
        const pageContent = await page.content();
        const isSuccess = /successfully|submitted|received|approved/i.test(pageContent);

        // Try to download acknowledgment if available
        let receiptUrl = null;
        const downloadLink = await page.getByRole('link', { name: /download|receipt|acknowledgment/i }).isVisible().catch(() => false);
        if (downloadLink) {
            try {
                const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
                await page.getByRole('link', { name: /download|receipt|acknowledgment/i }).click();
                const download = await downloadPromise;
                const date = new Date().toISOString().split('T')[0];
                const fileName = `${company.company_name} - ${company.kra_pin} - TERMINATION - ${obligationName} - ${date}.pdf`;
                const filePath = path.join(downloadFolderPath, fileName);
                await download.saveAs(filePath);

                // Upload to Supabase
                const fileContent = await fs.readFile(filePath);
                const storageFileName = `receipts/termination_${company.kra_pin}_${obligationName.replace(/\s+/g, '_')}_${date}.pdf`;
                const { error: uploadError } = await supabase.storage.from('receipts').upload(storageFileName, fileContent, { contentType: 'application/pdf', upsert: true });
                if (!uploadError) {
                    const { data: urlData } = await supabase.storage.from('receipts').getPublicUrl(storageFileName);
                    receiptUrl = urlData?.publicUrl || null;
                }
            } catch (dlError) {
                console.error('[TERMINATE] Download error:', dlError.message);
            }
        }

        return {
            obligation_id: obligationId,
            obligation_name: obligationName,
            status: isSuccess ? 'submitted' : 'pending_review',
            reason,
            receipt_url: receiptUrl,
            error: null,
            message: isSuccess
                ? `Termination request for ${obligationName} submitted successfully`
                : `Termination request for ${obligationName} submitted — pending KRA review`,
        };

    } catch (error) {
        console.error(`[TERMINATE] Error for ${obligationName}:`, error);
        return {
            obligation_id: obligationId,
            obligation_name: obligationName,
            status: 'failed',
            reason,
            receipt_url: null,
            error: error.message,
            message: `Failed to terminate ${obligationName}: ${error.message}`,
        };
    }
}

export async function POST(req) {
    try {
        await fs.mkdir(downloadFolderPath, { recursive: true });

        const requestData = await req.json();
        const { company_name, kra_pin, kra_password, obligation_ids, reason, session_id } = requestData;

        if (!company_name || !kra_pin || !kra_password) {
            return NextResponse.json({ error: "Missing required company information" }, { status: 400 });
        }
        if (!kra_pin.toUpperCase().startsWith('P')) {
            return NextResponse.json({ error: "Only company PINs (starting with P) can terminate obligations" }, { status: 400 });
        }
        if (!obligation_ids || !Array.isArray(obligation_ids) || obligation_ids.length === 0) {
            return NextResponse.json({ error: "At least one obligation_id is required" }, { status: 400 });
        }
        if (!reason || reason.length < 5) {
            return NextResponse.json({ error: "A termination reason is required (min 5 characters)" }, { status: 400 });
        }
        if (!TERMINATION_REASONS.some(r => reason.toLowerCase().includes(r.toLowerCase())) && reason.length < 10) {
            return NextResponse.json({ error: `Reason must be descriptive. Suggested: ${TERMINATION_REASONS.join(', ')}` }, { status: 400 });
        }

        console.log(`[TERMINATE] Starting for ${company_name} (${kra_pin}), obligations: ${obligation_ids.join(', ')}, reason: ${reason}`);

        const company = { company_name, kra_pin, kra_password };
        const browser = await chromium.launch({ headless: false, channel: "chrome" });
        const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
        const page = await context.newPage();
        page.setDefaultNavigationTimeout(180000);
        page.setDefaultTimeout(180000);

        const results = [];

        try {
            await loginToKRA(page, company);

            for (let i = 0; i < obligation_ids.length; i++) {
                console.log(`[TERMINATE] Processing ${i + 1}/${obligation_ids.length}: ${obligation_ids[i]}`);
                const result = await submitTerminationRequest(page, company, obligation_ids[i], reason);
                results.push(result);
                if (i < obligation_ids.length - 1) await page.waitForTimeout(2000);
            }

            try { await page.evaluate(() => { logOutUser(); }); } catch { }
        } catch (error) {
            console.error("[TERMINATE] Fatal error:", error);
            const processedIds = results.map(r => r.obligation_id);
            for (const oid of obligation_ids) {
                if (!processedIds.includes(oid)) {
                    results.push({
                        obligation_id: oid, obligation_name: OBLIGATION_NAMES[oid] || `Obligation ${oid}`,
                        status: 'failed', reason, receipt_url: null, error: `Aborted: ${error.message}`,
                    });
                }
            }
        } finally {
            await page.close(); await context.close(); await browser.close();
        }

        const submitted = results.filter(r => r.status === 'submitted' || r.status === 'pending_review').length;
        const failed = results.filter(r => r.status === 'failed').length;

        if (session_id) {
            try {
                await supabase.from('session_activities').insert([{
                    session_id, activity_type: 'obligation_termination',
                    description: `Obligation termination: ${submitted} submitted, ${failed} failed`,
                    metadata: { results, reason, total: obligation_ids.length },
                }]);
            } catch { }
        }

        return NextResponse.json({
            success: submitted > 0, total: obligation_ids.length, submitted, failed,
            results, company_name, kra_pin, reason, timestamp: new Date().toISOString(),
        });

    } catch (error) {
        console.error("[TERMINATE] API error:", error);
        return NextResponse.json({ error: `Termination failed: ${error.message}` }, { status: 500 });
    }
}

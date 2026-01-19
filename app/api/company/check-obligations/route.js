import { NextResponse } from 'next/server';
import { chromium } from "playwright";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import { createWorker } from "tesseract.js";

// Function to login to KRA PIN Checker
async function loginToKRAPinChecker(page, pin) {
    await page.goto("https://itax.kra.go.ke/KRA-Portal/");
    await page.locator("#logid").click();
    await page.evaluate(() => pinchecker());
    await page.waitForTimeout(1000);

    const maxAttempts = 5;
    let attempts = 0;

    while (attempts < maxAttempts) {
        let worker = null;
        let imagePath = null;
        try {
            const image = await page.waitForSelector("#captcha_img");
            const cleanPin = pin.trim().replace(/\s+/g, '_');
            imagePath = path.join(os.tmpdir(), `ocr_${cleanPin}_${Date.now()}.png`);

            await image.screenshot({ path: imagePath });

            const fileExists = existsSync(imagePath);
            if (!fileExists) {
                console.log(`Screenshot file not created, retrying...`);
                attempts++;
                continue;
            }

            worker = await createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        // Suppress verbose logging
                    }
                },
                errorHandler: err => console.error('Tesseract error:', err)
            });

            const ret = await worker.recognize(imagePath);
            const text1 = ret.data.text.slice(0, -1);
            const text = text1.slice(0, -1);
            const numbers = text.match(/\d+/g);

            if (imagePath) {
                await fs.unlink(imagePath).catch(() => { });
            }

            if (!numbers || numbers.length < 2) {
                console.log("Unable to extract valid numbers from the CAPTCHA. Retrying...");
                attempts++;
                continue;
            }

            let result;
            if (text.includes("+")) {
                result = Number(numbers[0]) + Number(numbers[1]);
            } else if (text.includes("-")) {
                result = Number(numbers[0]) - Number(numbers[1]);
            } else {
                console.log("Unsupported operator in CAPTCHA. Retrying...");
                attempts++;
                continue;
            }

            await page.locator("#captcahText").clear();
            await page.locator("#captcahText").fill(result.toString());

            const pinInput = page.locator('input[name="vo\\.pinNo"]');
            await pinInput.clear();
            await pinInput.fill(pin.trim());
            await page.getByRole("button", { name: "Consult" }).click();

            const isInvalidLogin = await page.waitForSelector('b:has-text("Wrong result of the arithmetic operation.")', { state: 'visible', timeout: 1000 })
                .catch(() => false);

            if (!isInvalidLogin) {
                console.log(`Captcha solved successfully for PIN: ${pin}`);
                return;
            }

            console.log("Wrong result of the arithmetic operation, retrying...");
            attempts++;
        } catch (error) {
            console.error(`Error during login attempt ${attempts + 1}:`, error.message);
            attempts++;
        } finally {
            if (worker) {
                await worker.terminate().catch(() => { });
            }
            if (imagePath) {
                await fs.unlink(imagePath).catch(() => { });
            }
        }
    }

    throw new Error("Max login attempts reached. Unable to log in.");
}

// Function to click Obligation Details
async function clickObligationDetails(page) {
    try {
        await page.getByRole("group", { name: "Obligation Details" }).click({ timeout: 10000 });
        return true;
    } catch (error) {
        console.error("Error clicking Obligation Details:", error.message);
        return false;
    }
}

// Function to extract obligation data
async function extractObligationData(page) {
    const extractedData = await page.evaluate(() => {
        function extractTableData() {
            const result = {
                taxpayerDetails: {},
                obligationDetails: [],
                electronicTaxInvoicing: {},
                vatCompliance: {}
            };

            const mainTable = document.querySelector('#pinCheckerForm > div:nth-child(9) > center > div > table');
            if (!mainTable) {
                console.error('Main table not found');
                return result;
            }

            // Extract Taxpayer Details
            const taxpayerRow = mainTable.querySelector('tr:nth-child(3)');
            if (taxpayerRow) {
                const taxpayerTable = taxpayerRow.querySelector('table');
                if (taxpayerTable) {
                    const rows = taxpayerTable.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td.textAlignLeft');
                        if (cells.length >= 4) {
                            result.taxpayerDetails[cells[0].textContent.trim().replace(':', '')] = cells[1].textContent.trim();
                            result.taxpayerDetails[cells[2].textContent.trim().replace(':', '')] = cells[3].textContent.trim();
                        } else if (cells.length === 2) {
                            result.taxpayerDetails[cells[0].textContent.trim().replace(':', '')] = cells[1].textContent.trim();
                        }
                    });
                }
            }

            // Extract Obligation Details
            const obligationRow = mainTable.querySelector('tr:nth-child(5)');
            if (obligationRow) {
                const obligationTable = obligationRow.querySelector('table.tab3');
                if (obligationTable) {
                    const rows = obligationTable.querySelectorAll('tr');
                    for (let i = 1; i < rows.length; i++) {
                        const cells = rows[i].querySelectorAll('td');
                        if (cells.length >= 4) {
                            result.obligationDetails.push({
                                obligationName: cells[0].textContent.trim(),
                                currentStatus: cells[1].textContent.trim(),
                                effectiveFromDate: cells[2].textContent.trim(),
                                effectiveToDate: cells[3].textContent.trim() || 'Active'
                            });
                        }
                    }
                }
            }

            // Extract Electronic Tax Invoicing
            const etimsRow = mainTable.querySelector('tr:nth-child(7)');
            if (etimsRow) {
                const etimsTable = etimsRow.querySelector('table');
                if (etimsTable) {
                    const rows = etimsTable.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td.textAlignLeft');
                        if (cells.length >= 4) {
                            result.electronicTaxInvoicing[cells[0].textContent.trim().replace(':', '')] = cells[1].textContent.trim();
                            if (cells.length > 2) {
                                result.electronicTaxInvoicing[cells[2].textContent.trim().replace(':', '')] = cells[3].textContent.trim();
                            }
                        }
                    });
                }
            }

            // Extract VAT Compliance
            const vatComplianceCell = document.querySelector('#pinCheckerForm > div:nth-child(9) > center > div > table > tbody > tr:nth-child(8) > td');
            if (vatComplianceCell) {
                const vatTable = vatComplianceCell.querySelector('table');
                if (vatTable) {
                    const statusCell = vatTable.querySelector('td.textAlignLeft');
                    if (statusCell) {
                        result.vatCompliance.status = statusCell.textContent.trim();
                    }
                }
            }

            return result;
        }

        return extractTableData();
    });

    return extractedData;
}

// Main API handler
export async function POST(req) {
    let browser = null;

    try {
        const { pin } = await req.json();

        if (!pin) {
            return NextResponse.json(
                { error: "PIN is required" },
                { status: 400 }
            );
        }

        // Check if PIN starts with 'P' (company PIN)
        if (!pin.toUpperCase().startsWith('P')) {
            return NextResponse.json(
                { error: "This endpoint is only for company PINs (starting with 'P')" },
                { status: 400 }
            );
        }

        console.log(`Checking obligations for PIN: ${pin}`);

        // Launch browser
        browser = await chromium.launch({
            headless: false,
            args: ['--start-maximized']
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            deviceScaleFactor: 1
        });

        const page = await context.newPage();
        page.setDefaultNavigationTimeout(60000);
        page.setDefaultTimeout(60000);

        // Login to PIN Checker
        await loginToKRAPinChecker(page, pin);

        // Check for errors
        const hasError = await page.evaluate(() => {
            const bodyText = document.body.textContent || '';
            return bodyText.includes('An Error has occurred');
        });

        if (hasError) {
            await browser.close();
            return NextResponse.json({
                error: "An error occurred while checking PIN",
                timestamp: new Date().toISOString()
            }, { status: 400 });
        }

        // Click Obligation Details
        const clickSuccess = await clickObligationDetails(page);
        if (!clickSuccess) {
            await browser.close();
            return NextResponse.json({
                error: "Failed to access Obligation Details",
                timestamp: new Date().toISOString()
            }, { status: 400 });
        }

        // Extract obligation data
        const extractedData = await extractObligationData(page);

        // Close browser
        await browser.close();

        // Map obligations to UI-friendly format with obligation IDs
        const obligationMapping = {
            'Income Tax - PAYE': { id: '7', name: 'Income Tax - PAYE' },
            'Value Added Tax (VAT)': { id: '9', name: 'Value Added Tax (VAT)' },
            'Income Tax - Company': { id: '4', name: 'Income Tax - Company' },
            'Income Tax - Rent Income (MRI)': { id: '5', name: 'Income Tax - Rent Income (MRI)' },
            'Income Tax - Resident Individual': { id: '1', name: 'Income Tax - Resident Individual' },
            'Income Tax - Turnover Tax': { id: '8', name: 'Income Tax - Turnover Tax' }
        };

        const activeObligations = extractedData.obligationDetails
            .filter(obl => obl.currentStatus.toLowerCase().includes('active') || obl.currentStatus.toLowerCase().includes('registered'))
            .map(obl => {
                const mapped = obligationMapping[obl.obligationName];
                return {
                    id: mapped?.id || '0',
                    name: obl.obligationName,
                    status: obl.currentStatus,
                    effectiveFrom: obl.effectiveFromDate,
                    effectiveTo: obl.effectiveToDate
                };
            });

        return NextResponse.json({
            success: true,
            pin: pin,
            taxpayerName: extractedData.taxpayerDetails['Taxpayer Name'] || '',
            pinStatus: extractedData.taxpayerDetails['PIN Status'] || '',
            itaxStatus: extractedData.taxpayerDetails['iTax Status'] || '',
            obligations: activeObligations,
            allObligations: extractedData.obligationDetails,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error("Error checking obligations:", error);

        if (browser) {
            await browser.close().catch(() => { });
        }

        return NextResponse.json(
            { error: error.message || "Failed to check obligations" },
            { status: 500 }
        );
    }
}

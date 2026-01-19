// @ts-nocheck
import { chromium } from "playwright";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import os from "os";
import ExcelJS from "exceljs";
import { createWorker } from "tesseract.js";
import { createClient } from "@supabase/supabase-js";

// ==================== CONFIGURATION SETTINGS ====================
const CONFIG = {
    // Parallel processing settings
    CONCURRENT_COMPANIES: 12,           // Number of companies to process in parallel
    BATCH_SIZE: 12,                     // Process companies in batches

    // Screen layout settings
    SCREEN_WIDTH: 1920,                 // Your screen width in pixels
    SCREEN_HEIGHT: 1080,                // Your screen height in pixels
    BROWSER_ZOOM: 0.5,                  // Zoom level for browser content (0.5 = 50%, 0.75 = 75%, 1.0 = 100%)

    // Browser settings
    HEADLESS_MODE: false,               // Set to true for headless browser
    BROWSER_CHANNEL: "chrome",          // Chrome channel to use

    // Database settings
    SOURCE_TABLE: "acc_portal_company_duplicate", // Table to fetch companies from
    SAVE_TABLE: "PinCheckerDetails",    // Table to save results to
    PIN_FIELD: "kra_pin",               // Field name for PIN number
    NAME_FIELD: "company_name",         // Field name for company name

    // Processing settings
    MAX_CAPTCHA_ATTEMPTS: 5,            // Maximum CAPTCHA login attempts
    LOGIN_TIMEOUT: 1000,                // Timeout for login operations (ms)
    MAX_RETRY_ATTEMPTS: 2,              // Number of times to retry failed companies in a batch
    MAX_GLOBAL_RETRY_ROUNDS: 3,         // Maximum rounds to retry all failed companies until success

    // Skip/Re-extract options
    SKIP_EXISTING: true,                // Skip companies that already have data in PinCheckerDetails
    REEXTRACT_ERRORS: true,             // Re-extract companies that have errors
};
// ================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

let stopRequested = false;

// Function to calculate browser window position based on grid layout
function calculateWindowPosition(index, totalWindows) {
    const screenWidth = CONFIG.SCREEN_WIDTH;
    const screenHeight = CONFIG.SCREEN_HEIGHT;

    // Calculate grid dimensions (rows x cols)
    const cols = Math.ceil(Math.sqrt(totalWindows));
    const rows = Math.ceil(totalWindows / cols);

    // Calculate window size
    const windowWidth = Math.floor(screenWidth / cols);
    const windowHeight = Math.floor(screenHeight / rows);

    // Calculate position
    const col = index % cols;
    const row = Math.floor(index / cols);

    return {
        x: col * windowWidth,
        y: row * windowHeight,
        width: windowWidth,
        height: windowHeight
    };
}

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ message: "Method not allowed" });
    }

    const { action, runOption, selectedIds } = req.body;

    if (action === "getProgress") {
        const progress = await getAutomationProgress();
        return res.status(200).json(progress);
    }

    if (action === "stop") {
        stopRequested = true;
        await updateAutomationProgress(0, "Stopped", []);
        return res.status(200).json({ message: "Automation stop requested." });
    }

    if (action === "start") {
        console.log('API Request received - action:', action);
        console.log('API Request received - runOption:', runOption);
        console.log('API Request received - selectedIds:', selectedIds);

        const currentProgress = await getAutomationProgress();
        if (currentProgress && currentProgress.status === "Running") {
            console.log('Automation already in progress - returning 400');
            return res.status(400).json({ message: "Automation is already in progress." });
        }

        if (!runOption) {
            console.log('Missing runOption parameter - returning 400');
            return res.status(400).json({ message: "runOption parameter is required." });
        }

        if (runOption === 'selected' && (!selectedIds || !Array.isArray(selectedIds) || selectedIds.length === 0)) {
            console.log('Invalid selectedIds for selected mode - returning 400');
            return res.status(400).json({ message: "selectedIds must be a non-empty array when runOption is 'selected'." });
        }

        const normalizedSelectedIds = Array.isArray(selectedIds) ? selectedIds : [];

        console.log(`Starting automation with runOption: ${runOption}, selectedIds count: ${normalizedSelectedIds.length}`);
        stopRequested = false;
        await updateAutomationProgress(0, "Running", []);
        processCompanies(runOption, normalizedSelectedIds).catch(console.error);
        return res.status(200).json({ message: "Automation started." });
    }

    return res.status(400).json({ message: "Invalid action." });
}

async function getAutomationProgress() {
    try {
        const { data, error } = await supabase
            .from("PinCheckerDetails_AutomationProgress")
            .select("*")
            .eq("id", 1)
            .single();

        if (error) {
            console.error("Supabase error:", error);
            return { status: "Not Started", progress: 0, logs: [] };
        }

        return data || { status: "Not Started", progress: 0, logs: [] };
    } catch (error) {
        console.error("Error getting automation progress:", error);
        return { status: "Not Started", progress: 0, logs: [] };
    }
}

async function updateAutomationProgress(progress, status, logs) {
    try {
        await supabase
            .from("PinCheckerDetails_AutomationProgress")
            .upsert({
                id: 1,
                progress,
                status,
                logs: logs || [],
                last_updated: new Date().toISOString()
            });
    } catch (error) {
        console.error("Error updating automation progress:", error);
    }
}

async function processCompanies(runOption, selectedIds) {
    const browserInstances = [];
    const backgroundRetryPromises = []; // Track background retry tasks

    try {
        let companies = await readSupabaseData(runOption, selectedIds);
        const allCompanyData = [];
        const now = new Date();
        const formattedDateTime = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;
        const downloadFolderPath = path.join(os.homedir(), "Downloads", `PIN CHECKER DETAILS EXTRACTOR_${formattedDateTime}`);
        await fs.mkdir(downloadFolderPath, { recursive: true });

        console.log(`Processing ${companies.length} companies with ${CONFIG.CONCURRENT_COMPANIES} concurrent browsers`);
        console.log(`Initializing ${CONFIG.CONCURRENT_COMPANIES} browser instances in parallel...`);

        // Initialize all browsers in parallel (fast - ~3 seconds)
        const browserInitPromises = Array.from({ length: CONFIG.CONCURRENT_COMPANIES }, async (_, i) => {
            const position = calculateWindowPosition(i, CONFIG.CONCURRENT_COMPANIES);

            const browser = await chromium.launch({
                headless: CONFIG.HEADLESS_MODE,
                channel: CONFIG.BROWSER_CHANNEL,
                args: [
                    `--window-position=${position.x},${position.y}`,
                    `--window-size=${position.width},${position.height}`,
                    '--force-device-scale-factor=1'
                ]
            });

            const context = await browser.newContext({
                viewport: { width: position.width, height: position.height },
                deviceScaleFactor: 1
            });
            const page = await context.newPage();

            // Set viewport and apply CSS zoom for proper scaling
            await page.setViewportSize({ width: position.width, height: position.height });

            return { browser, page, index: i, position };
        });

        browserInstances.push(...await Promise.all(browserInitPromises));
        console.log(`✓ All ${CONFIG.CONCURRENT_COMPANIES} browsers initialized!\n`);

        // Process companies using the browser pool
        let companyIndex = 0;
        while (companyIndex < companies.length) {
            if (stopRequested) {
                console.log("Automation stopped by user request.");
                break;
            }

            // Assign companies to available browsers
            const batch = companies.slice(companyIndex, companyIndex + CONFIG.CONCURRENT_COMPANIES);
            console.log(`\nProcessing companies ${companyIndex + 1} to ${companyIndex + batch.length} of ${companies.length}`);

            const batchPromises = batch.map(async (company, index) => {
                const browserInstance = browserInstances[index];
                const { page } = browserInstance;

                try {
                    // Navigate and apply zoom
                    await page.goto("https://itax.kra.go.ke/KRA-Portal/", { waitUntil: 'domcontentloaded' });
                    await page.evaluate((zoom) => {
                        document.body.style.zoom = zoom;
                        document.body.style.transform = `scale(${zoom})`;
                        document.body.style.transformOrigin = '0 0';
                    }, CONFIG.BROWSER_ZOOM);

                    const organizedData = await processCompanyData(company, page);

                    // Save immediately after extraction - don't wait for batch
                    await saveCompanyDetails(organizedData).catch(err => {
                        console.error(`[${companyIndex + index + 1}/${companies.length}] Save error:`, err.message);
                    });

                    if (organizedData.error) {
                        console.log(`[${companyIndex + index + 1}/${companies.length}] ✗ Error:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD], organizedData.error);
                    } else {
                        console.log(`[${companyIndex + index + 1}/${companies.length}] ✓ Completed & Saved:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD]);
                    }

                    return { ...organizedData, _company: company };
                } catch (error) {
                    console.error(`[${companyIndex + index + 1}/${companies.length}] ✗ Error:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD], error.message);
                    return {
                        company_name: company[CONFIG.NAME_FIELD],
                        company_pin: company[CONFIG.PIN_FIELD],
                        error: error.message,
                        error_timestamp: new Date().toISOString(),
                        _company: company
                    };
                }
            });

            let batchResults = await Promise.all(batchPromises);

            // Identify failed companies but don't block - retry them asynchronously
            const failedCompanies = batchResults.filter(r => r.error).map(r => r._company);
            const successCount = batchResults.filter(r => !r.error).length;

            if (failedCompanies.length > 0) {
                console.log(`\n📊 Batch Results: ✓ ${successCount} succeeded, ✗ ${failedCompanies.length} failed`);
                console.log(`⚠️  Retrying ${failedCompanies.length} failed companies in background...`);

                // Start retry process in background and track the promise
                const retryPromise = (async () => {
                    for (let retryAttempt = 1; retryAttempt <= CONFIG.MAX_RETRY_ATTEMPTS; retryAttempt++) {
                        if (failedCompanies.length === 0) break;

                        console.log(`[Background] Retry attempt ${retryAttempt}/${CONFIG.MAX_RETRY_ATTEMPTS} for ${failedCompanies.length} companies...`);

                        const retryPromises = failedCompanies.map(async (company, idx) => {
                            const browserIndex = idx % CONFIG.CONCURRENT_COMPANIES;
                            const { page } = browserInstances[browserIndex];

                            try {
                                await page.goto("https://itax.kra.go.ke/KRA-Portal/", { waitUntil: 'domcontentloaded' });
                                await page.evaluate((zoom) => {
                                    document.body.style.zoom = zoom;
                                    document.body.style.transform = `scale(${zoom})`;
                                    document.body.style.transformOrigin = '0 0';
                                }, CONFIG.BROWSER_ZOOM);

                                const organizedData = await processCompanyData(company, page);

                                if (organizedData.error) {
                                    console.log(`  [Retry] ✗ Still failed:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD]);
                                    return { ...organizedData, _company: company };
                                } else {
                                    console.log(`  [Retry] ✓ Succeeded:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD]);
                                    // Save successful retry immediately
                                    await saveCompanyDetails(organizedData).catch(err =>
                                        console.error(`Save error:`, err.message)
                                    );
                                    return organizedData;
                                }
                            } catch (error) {
                                console.error(`  [Retry] ✗ Error:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD], error.message);
                                return {
                                    company_name: company[CONFIG.NAME_FIELD],
                                    company_pin: company[CONFIG.PIN_FIELD],
                                    error: error.message,
                                    error_timestamp: new Date().toISOString(),
                                    _company: company
                                };
                            }
                        });

                        const retryResults = await Promise.all(retryPromises);

                        // Update failed list for next retry
                        failedCompanies.length = 0;
                        failedCompanies.push(...retryResults.filter(r => r.error).map(r => r._company));

                        if (failedCompanies.length === 0) {
                            console.log(`[Background] ✓ All retries succeeded!`);
                            break;
                        }
                    }

                    if (failedCompanies.length > 0) {
                        console.log(`[Background] ⚠️  ${failedCompanies.length} companies still failed after retries`);
                    }
                })().catch(err => console.error('Background retry error:', err));

                // Track this retry promise
                backgroundRetryPromises.push(retryPromise);
            } else {
                console.log(`\n📊 Batch Results: ✓ All ${successCount} companies succeeded!`);
            }

            // Remove _company property and add to results (already saved individually)
            batchResults = batchResults.map(({ _company, ...result }) => result);
            allCompanyData.push(...batchResults);

            // Update progress and generate Excel in background - don't block
            const progress = Math.round(((companyIndex + batch.length) / companies.length) * 100);

            // Run progress update and Excel generation in background
            Promise.all([
                updateAutomationProgress(progress, "Running", allCompanyData),
                (async () => {
                    const workbook = createExcelFile(allCompanyData);
                    const formattedDate = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()}`;
                    const excelFilePath = path.join(downloadFolderPath, `PIN CHECKER DETAILS - OBLIGATIONS - ${formattedDate}.xlsx`);
                    await workbook.xlsx.writeFile(excelFilePath);
                })()
            ]).catch(err => console.error('Background task error:', err));

            const totalProcessed = companyIndex + batch.length;
            const finalSuccessCount = batchResults.filter(r => !r.error).length;
            const finalErrorCount = batchResults.filter(r => r.error).length;

            console.log(`\n📈 Progress: ${progress}% | Processed: ${totalProcessed}/${companies.length} | ✓ ${finalSuccessCount} | ✗ ${finalErrorCount}`);
            console.log(`➡️  Moving to next batch immediately...\n`);
            companyIndex += batch.length;
        }

        await updateAutomationProgress(100, "Completed", allCompanyData);

        // Wait for all background retry tasks to complete before closing browsers
        if (backgroundRetryPromises.length > 0) {
            console.log(`\n⏳ Waiting for ${backgroundRetryPromises.length} background retry task(s) to complete...`);
            await Promise.allSettled(backgroundRetryPromises);
            console.log(`✓ All background retry tasks completed!\n`);
        }

        // Global retry loop - keep retrying failed companies until all succeed
        let globalRetryRound = 1;
        let failedCompaniesGlobal = allCompanyData.filter(r => r.error);

        while (failedCompaniesGlobal.length > 0 && globalRetryRound <= CONFIG.MAX_GLOBAL_RETRY_ROUNDS) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🔄 GLOBAL RETRY ROUND ${globalRetryRound}/${CONFIG.MAX_GLOBAL_RETRY_ROUNDS}`);
            console.log(`${'='.repeat(60)}`);
            console.log(`⚠️  Retrying ${failedCompaniesGlobal.length} failed companies...\n`);

            // Process failed companies in batches
            let retryIndex = 0;
            while (retryIndex < failedCompaniesGlobal.length) {
                if (stopRequested) {
                    console.log("Automation stopped by user request.");
                    break;
                }

                const retryBatch = failedCompaniesGlobal.slice(retryIndex, retryIndex + CONFIG.CONCURRENT_COMPANIES);
                console.log(`\n[Global Retry] Processing ${retryIndex + 1} to ${retryIndex + retryBatch.length} of ${failedCompaniesGlobal.length} failed companies`);

                const retryBatchPromises = retryBatch.map(async (failedResult, index) => {
                    const browserInstance = browserInstances[index % CONFIG.CONCURRENT_COMPANIES];
                    const { page } = browserInstance;

                    // Find the original company data
                    const company = companies.find(c => c[CONFIG.PIN_FIELD] === failedResult.company_pin);
                    if (!company) {
                        console.error(`[Global Retry] Company not found for PIN: ${failedResult.company_pin}`);
                        return failedResult;
                    }

                    try {
                        await page.goto("https://itax.kra.go.ke/KRA-Portal/", { waitUntil: 'domcontentloaded' });
                        await page.evaluate((zoom) => {
                            document.body.style.zoom = zoom;
                            document.body.style.transform = `scale(${zoom})`;
                            document.body.style.transformOrigin = '0 0';
                        }, CONFIG.BROWSER_ZOOM);

                        const organizedData = await processCompanyData(company, page);

                        if (organizedData.error) {
                            console.log(`  [Global Retry] ✗ Still failed:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD], organizedData.error);
                            return organizedData;
                        } else {
                            console.log(`  [Global Retry] ✓ Succeeded:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD]);
                            // Save successful retry immediately
                            await saveCompanyDetails(organizedData).catch(err =>
                                console.error(`[Global Retry] Save error:`, err.message)
                            );

                            // Update allCompanyData with successful result
                            const dataIndex = allCompanyData.findIndex(d => d.company_pin === company[CONFIG.PIN_FIELD]);
                            if (dataIndex !== -1) {
                                allCompanyData[dataIndex] = organizedData;
                            }

                            return organizedData;
                        }
                    } catch (error) {
                        console.error(`  [Global Retry] ✗ Error:`, company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD], error.message);
                        return {
                            company_name: company[CONFIG.NAME_FIELD],
                            company_pin: company[CONFIG.PIN_FIELD],
                            error: error.message,
                            error_timestamp: new Date().toISOString()
                        };
                    }
                });

                const retryBatchResults = await Promise.all(retryBatchPromises);

                // Update the failed companies list
                const stillFailed = retryBatchResults.filter(r => r.error);
                const nowSucceeded = retryBatchResults.filter(r => !r.error);

                console.log(`  [Global Retry] Batch complete: ✓ ${nowSucceeded.length} succeeded, ✗ ${stillFailed.length} still failed`);

                retryIndex += retryBatch.length;
            }

            // Update failed companies list for next round
            failedCompaniesGlobal = allCompanyData.filter(r => r.error);

            if (failedCompaniesGlobal.length === 0) {
                console.log(`\n✅ All companies processed successfully after ${globalRetryRound} global retry round(s)!`);
                break;
            } else {
                console.log(`\n📊 Round ${globalRetryRound} complete: ${failedCompaniesGlobal.length} companies still failed`);
                globalRetryRound++;
            }
        }

        if (failedCompaniesGlobal.length > 0 && globalRetryRound > CONFIG.MAX_GLOBAL_RETRY_ROUNDS) {
            console.log(`\n⚠️  Reached maximum retry rounds (${CONFIG.MAX_GLOBAL_RETRY_ROUNDS}). ${failedCompaniesGlobal.length} companies still failed.`);
        }

        // Final summary
        const totalSuccess = allCompanyData.filter(r => !r.error).length;
        const totalErrors = allCompanyData.filter(r => r.error).length;

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✓ PROCESSING COMPLETED!`);
        console.log(`${'='.repeat(60)}`);
        console.log(`📊 Final Summary:`);
        console.log(`   Total processed: ${allCompanyData.length}`);
        console.log(`   ✓ Successful: ${totalSuccess} (${Math.round(totalSuccess / allCompanyData.length * 100)}%)`);
        console.log(`   ✗ Failed: ${totalErrors} (${Math.round(totalErrors / allCompanyData.length * 100)}%)`);
        console.log(`${'='.repeat(60)}\n`);
    } catch (error) {
        console.error("Error in processCompanies:", error);
        await updateAutomationProgress(0, "Error", []);
    } finally {
        // Close all browsers
        console.log("\nClosing all browsers...");
        for (const instance of browserInstances) {
            await instance.browser.close().catch(console.error);
        }
    }
}

async function readSupabaseData(runOption, selectedIds) {
    try {
        console.log(`Reading Supabase data from ${CONFIG.SOURCE_TABLE} for runOption: ${runOption}, with ${selectedIds.length} IDs`);

        // Step 1: Get companies from source table
        let query = supabase
            .from(CONFIG.SOURCE_TABLE)
            .select("id, " + CONFIG.NAME_FIELD + ", " + CONFIG.PIN_FIELD)
            .not(CONFIG.PIN_FIELD, 'is', null)
            .order('id', { ascending: true });

        // Only filter by IDs if in 'selected' mode and we have IDs
        if (runOption === 'selected' && selectedIds && selectedIds.length > 0) {
            console.log(`Filtering by ${selectedIds.length} selected IDs: ${selectedIds.join(', ')}`);
            query = query.in('id', selectedIds);
        } else {
            console.log('Running in all companies mode, no ID filtering applied');
        }

        const { data: sourceData, error: sourceError } = await query;

        if (sourceError) {
            console.error(`Supabase query error: ${sourceError.message}`);
            throw new Error(`Error reading data from ${CONFIG.SOURCE_TABLE} table: ${sourceError.message}`);
        }

        console.log(`Successfully retrieved ${sourceData?.length || 0} companies from ${CONFIG.SOURCE_TABLE}`);

        if (!sourceData || sourceData.length === 0) {
            console.log('No companies found in the database, returning empty array');
            return [];
        }

        // Step 2: Check which companies already have data in PinCheckerDetails table (if SKIP_EXISTING is enabled)
        let filteredData = sourceData;
        let skippedCount = 0;
        let errorCount = 0;
        let newCount = 0;

        if (CONFIG.SKIP_EXISTING || CONFIG.REEXTRACT_ERRORS) {
            // Get all existing records from PinCheckerDetails table
            const { data: existingRecords, error: existingError } = await supabase
                .from(CONFIG.SAVE_TABLE)
                .select("company_name, company_pin, error");

            if (existingError) {
                console.warn(`Warning: Could not check existing records: ${existingError.message}`);
                console.log('Proceeding to process all companies...');
            } else {
                // Create a map for quick lookup
                const existingMap = new Map();
                if (existingRecords) {
                    existingRecords.forEach(record => {
                        existingMap.set(record.company_pin, {
                            hasData: true,
                            hasError: !!record.error
                        });
                    });
                }

                // Filter companies based on skip/reextract settings
                filteredData = sourceData.filter(company => {
                    const existing = existingMap.get(company[CONFIG.PIN_FIELD]);

                    // If no data exists, include it (new companies)
                    if (!existing || !existing.hasData) {
                        newCount++;
                        return true;
                    }

                    // If company has error and REEXTRACT_ERRORS is true, include it
                    if (existing.hasError && CONFIG.REEXTRACT_ERRORS) {
                        errorCount++;
                        return true;
                    }

                    // If company has data without error and SKIP_EXISTING is true, skip it
                    if (!existing.hasError && CONFIG.SKIP_EXISTING) {
                        skippedCount++;
                        return false;
                    }

                    // If SKIP_EXISTING is false, include all remaining companies
                    return true;
                });

                console.log(`\n📊 Summary:`);
                console.log(`   Total companies in database: ${sourceData.length}`);
                console.log(`   ✓ Skipped (already processed): ${skippedCount}`);
                console.log(`   ⚠️  Re-extracting (errors): ${errorCount}`);
                console.log(`   🆕 New companies: ${newCount}`);
                console.log(`   → Processing: ${filteredData.length} companies\n`);
            }
        }

        return filteredData;
    } catch (error) {
        console.error(`Error reading Supabase data: ${error.message}`);
        throw error;
    }
}

async function processCompanyData(company, page) {
    console.log("Processing company:", company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD]);

    if (!company[CONFIG.PIN_FIELD]) {
        return {
            company_name: company[CONFIG.NAME_FIELD],
            company_pin: company[CONFIG.PIN_FIELD],
            error: "PIN Number Missing"
        };
    }

    await loginToKRA(page, company);

    // Check for "An Error has occurred" message
    const hasError = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        return bodyText.includes('An Error has occurred');
    });

    if (hasError) {
        return {
            company_name: company[CONFIG.NAME_FIELD],
            company_pin: company[CONFIG.PIN_FIELD],
            error: "An Error has occurred on the page",
            error_timestamp: new Date().toISOString()
        };
    }

    // Try to click Obligation Details with error handling
    const clickSuccess = await clickObligationDetails(page);
    if (!clickSuccess) {
        return {
            company_name: company[CONFIG.NAME_FIELD],
            company_pin: company[CONFIG.PIN_FIELD],
            error: "Failed to click Obligation Details - timeout",
            error_timestamp: new Date().toISOString()
        };
    }

    // Use the comprehensive extraction method to get all data in one go
    const extractedData = await page.evaluate(() => {
        // Function to extract data from the table
        function extractTableData() {
            const result = {
                taxpayerDetails: {},
                obligationDetails: [],
                electronicTaxInvoicing: {},
                vatCompliance: {}
            };

            // Get the main table container
            const mainTable = document.querySelector('#pinCheckerForm > div:nth-child(9) > center > div > table');
            if (!mainTable) {
                console.error('Main table not found');
                return result;
            }

            // Extract Taxpayer Details (3rd row in the main table)
            const taxpayerRow = mainTable.querySelector('tr:nth-child(3)');
            if (taxpayerRow) {
                const taxpayerTable = taxpayerRow.querySelector('table');
                if (taxpayerTable) {
                    const rows = taxpayerTable.querySelectorAll('tr');
                    rows.forEach(row => {
                        const cells = row.querySelectorAll('td.textAlignLeft');
                        if (cells.length >= 4) {
                            // Handle rows with 4 cells (2 label-value pairs)
                            result.taxpayerDetails[cells[0].textContent.trim().replace(':', '')] = cells[1].textContent.trim();
                            result.taxpayerDetails[cells[2].textContent.trim().replace(':', '')] = cells[3].textContent.trim();
                        } else if (cells.length === 2) {
                            // Handle rows with 2 cells (single label-value pair) - for Taxpayer Station
                            result.taxpayerDetails[cells[0].textContent.trim().replace(':', '')] = cells[1].textContent.trim();
                        }
                    });
                }
            }

            // Extract Obligation Details (5th row in the main table)
            const obligationRow = mainTable.querySelector('tr:nth-child(5)');
            if (obligationRow) {
                const obligationTable = obligationRow.querySelector('table.tab3');
                if (obligationTable) {
                    const rows = obligationTable.querySelectorAll('tr');
                    for (let i = 1; i < rows.length; i++) { // Skip header row
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

            // Extract Electronic Tax Invoicing (7th row in the main table)
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

    // Convert the extracted data to the format for the database
    const data = {
        company_name: company[CONFIG.NAME_FIELD],
        company_pin: company[CONFIG.PIN_FIELD],
        income_tax_company_status: 'No obligation',
        income_tax_company_effective_from: 'No obligation',
        income_tax_company_effective_to: 'No obligation',
        vat_status: 'No obligation',
        vat_effective_from: 'No obligation',
        vat_effective_to: 'No obligation',
        paye_status: 'No obligation',
        paye_effective_from: 'No obligation',
        paye_effective_to: 'No obligation',
        rent_income_mri_status: 'No obligation',
        rent_income_mri_effective_from: 'No obligation',
        rent_income_mri_effective_to: 'No obligation',
        resident_individual_status: 'No obligation',
        resident_individual_effective_from: 'No obligation',
        resident_individual_effective_to: 'No obligation',
        turnover_tax_status: 'No obligation',
        turnover_tax_effective_from: 'No obligation',
        turnover_tax_effective_to: 'No obligation',
        etims_registration: extractedData.electronicTaxInvoicing['eTIMS Registration'] || 'Unknown',
        tims_registration: extractedData.electronicTaxInvoicing['TIMS Registration'] || 'Unknown',
        vat_compliance: extractedData.vatCompliance.status || 'Unknown',
        pin_status: extractedData.taxpayerDetails['PIN Status'] || 'Unknown',
        itax_status: extractedData.taxpayerDetails['iTax Status'] || 'Unknown',
        pin_stations: extractedData.taxpayerDetails['Taxpayer Station'] || null,
        pin_taxpayer_name: extractedData.taxpayerDetails['Taxpayer Name'] || null,
        pin_no: extractedData.taxpayerDetails['PIN No'] || null,
        pin_verification_date: extractedData.taxpayerDetails['Verification Date'] || null
    };

    // Map the obligation details to the correct fields
    if (extractedData.obligationDetails && extractedData.obligationDetails.length > 0) {
        for (const obligation of extractedData.obligationDetails) {
            switch (obligation.obligationName) {
                case 'Income Tax - PAYE':
                    data.paye_status = obligation.currentStatus;
                    data.paye_effective_from = obligation.effectiveFromDate;
                    data.paye_effective_to = obligation.effectiveToDate;
                    break;
                case 'Value Added Tax (VAT)':
                    data.vat_status = obligation.currentStatus;
                    data.vat_effective_from = obligation.effectiveFromDate;
                    data.vat_effective_to = obligation.effectiveToDate;
                    break;
                case 'Income Tax - Company':
                    data.income_tax_company_status = obligation.currentStatus;
                    data.income_tax_company_effective_from = obligation.effectiveFromDate;
                    data.income_tax_company_effective_to = obligation.effectiveToDate;
                    break;
                case 'Income Tax - Rent Income (MRI)':
                    data.rent_income_mri_status = obligation.currentStatus;
                    data.rent_income_mri_effective_from = obligation.effectiveFromDate;
                    data.rent_income_mri_effective_to = obligation.effectiveToDate;
                    break;
                case 'Income Tax - Resident Individual':
                    data.resident_individual_status = obligation.currentStatus;
                    data.resident_individual_effective_from = obligation.effectiveFromDate;
                    data.resident_individual_effective_to = obligation.effectiveToDate;
                    break;
                case 'Income Tax - Turnover Tax':
                    data.turnover_tax_status = obligation.currentStatus;
                    data.turnover_tax_effective_from = obligation.effectiveFromDate;
                    data.turnover_tax_effective_to = obligation.effectiveToDate;
                    break;
            }
        }
    }

    // Add timestamp for when this company was checked
    data.last_checked_at = new Date().toISOString();

    // Log the complete extracted data for reference/debugging
    console.log('Complete extracted data for', company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD], ':', JSON.stringify(extractedData));

    return data;
}

async function loginToKRA(page, company) {
    await page.goto("https://itax.kra.go.ke/KRA-Portal/");
    await page.locator("#logid").click();
    await page.evaluate(() => pinchecker());
    await page.waitForTimeout(CONFIG.LOGIN_TIMEOUT);

    const maxAttempts = CONFIG.MAX_CAPTCHA_ATTEMPTS;
    let attempts = 0;

    while (attempts < maxAttempts) {
        let worker = null;
        let imagePath = null;
        try {
            const image = await page.waitForSelector("#captcha_img");
            // Use unique filename for each parallel process to avoid conflicts
            const cleanPin = (company[CONFIG.PIN_FIELD] || 'unknown').trim().replace(/\s+/g, '_');
            imagePath = path.join(os.tmpdir(), `ocr_${cleanPin}_${Date.now()}.png`);

            // Ensure screenshot is taken successfully before proceeding
            await image.screenshot({ path: imagePath });

            // Verify file exists before trying to read it
            const fileExists = existsSync(imagePath);
            if (!fileExists) {
                console.log(`Screenshot file not created, retrying...`);
                attempts++;
                continue;
            }

            // Create worker with proper initialization and error handling
            worker = await createWorker('eng', 1, {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        // Suppress verbose logging
                    }
                },
                errorHandler: err => console.error('Tesseract error:', err)
            });

            const ret = await worker.recognize(imagePath);
            const text1 = ret.data.text.slice(0, -1); // Omit the last character
            const text = text1.slice(0, -1);
            const numbers = text.match(/\d+/g);

            // Clean up the temporary image file
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

            // Clear and fill CAPTCHA field to avoid appending on retries
            await page.locator("#captcahText").clear();
            await page.locator("#captcahText").fill(result.toString());

            // Clear and fill PIN number field to avoid appending on retries
            const pinInput = page.locator('input[name="vo\\.pinNo"]');
            await pinInput.clear();
            await pinInput.fill((company[CONFIG.PIN_FIELD] || '').trim());
            await page.getByRole("button", { name: "Consult" }).click();

            // Check if login was successful
            const isInvalidLogin = await page.waitForSelector('b:has-text("Wrong result of the arithmetic operation.")', { state: 'visible', timeout: 1000 })
                .catch(() => false);

            if (!isInvalidLogin) {
                console.log(`Captcha solved successfully for ${company[CONFIG.NAME_FIELD] || company[CONFIG.PIN_FIELD]}`);
                return; // Exit the function if login is successful
            }

            console.log("Wrong result of the arithmetic operation, retrying...");
            attempts++;
        } catch (error) {
            console.error(`Error during login attempt ${attempts + 1}:`, error.message);
            attempts++;
        } finally {
            // Always terminate the worker to free resources
            if (worker) {
                await worker.terminate().catch(() => { });
            }
            // Clean up temp file in case of error
            if (imagePath) {
                await fs.unlink(imagePath).catch(() => { });
            }
        }
    }

    throw new Error("Max login attempts reached. Unable to log in.");
}

async function clickObligationDetails(page) {
    try {
        // Use shorter timeout to detect failures faster
        await page.getByRole("group", { name: "Obligation Details" }).click({ timeout: 10000 });
        return true;
    } catch (error) {
        console.error("Error clicking Obligation Details:", error.message);
        return false;
    }
}

async function saveCompanyDetails(details) {
    // 1. Validate input: company_name is required for the upsert operation.
    if (!details || !details.company_name) {
        console.error('Save Aborted: "company_name" is missing, cannot perform upsert.', details);
        return null;
    }

    // 2. Construct a payload with keys that match the "PinCheckerDetails" table schema.
    // This prevents errors from extra fields and ensures data integrity.
    const payload = {
        company_id: details.company_id,
        company_name: details.company_name,
        company_pin: details.company_pin,

        // KRA Obligation Statuses
        income_tax_company_status: details.income_tax_company_status,
        income_tax_company_effective_from: details.income_tax_company_effective_from,
        income_tax_company_effective_to: details.income_tax_company_effective_to,
        vat_status: details.vat_status,
        vat_effective_from: details.vat_effective_from,
        vat_effective_to: details.vat_effective_to,
        paye_status: details.paye_status,
        paye_effective_from: details.paye_effective_from,
        paye_effective_to: details.paye_effective_to,
        rent_income_mri_status: details.rent_income_mri_status,
        rent_income_mri_effective_from: details.rent_income_mri_effective_from,
        rent_income_mri_effective_to: details.rent_income_mri_effective_to,
        resident_individual_status: details.resident_individual_status,
        resident_individual_effective_from: details.resident_individual_effective_from,
        resident_individual_effective_to: details.resident_individual_effective_to,
        turnover_tax_status: details.turnover_tax_status,
        turnover_tax_effective_from: details.turnover_tax_effective_from,
        turnover_tax_effective_to: details.turnover_tax_effective_to,

        // Compliance Details
        etims_registration: details.etims_registration,
        tims_registration: details.tims_registration,
        vat_compliance: details.vat_compliance,
        pin_status: details.pin_status,
        itax_status: details.itax_status,
        pin_stations: details.pin_stations,

        // Meta Fields
        last_checked_at: new Date().toISOString(),
        error_message: details.error_message, // Will be null on success, or a string on failure.
    };

    // Note: Other fields from your schema (NSSF, NHIF, etc.) are not included here
    // as the scraping logic does not provide them. The upsert will not affect those columns
    // unless they are explicitly added to the payload above.

    try {
        const { data, error } = await supabase
            .from(CONFIG.SAVE_TABLE)
            .upsert(payload, {
                onConflict: "company_name", // Your table's unique constraint
                ignoreDuplicates: false,    // Set to false to update existing records
            });

        if (error) {
            console.error(`Supabase save error for '${payload.company_name}':`, error.message);
            throw new Error(`Database save error: ${error.message}`);
        }

        if (!payload.error_message) {
            console.log(`✓ Details successfully saved for: ${payload.company_name}`);
        } else {
            console.log(`✗ Error details saved for: ${payload.company_name}`);
        }

        return data;
    } catch (error) {
        // This will catch the re-thrown error or any other exception during the process.
        console.error(`Critical error in saveCompanyDetails for '${payload.company_name}':`, error);
        throw error; // Propagate the error up to the main processing loop.
    }
}

function createExcelFile(companyData) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Company Obligations");

    // Add headers
    const headers = [
        "Index",
        "Company Name",
        "PIN Status",
        "iTax Status",
        "PIN Station",
        "Income Tax - Company Current Status",
        "Income Tax - Company Effective From Date",
        "Income Tax - Company Effective To Date",
        "Value Added Tax (VAT) Current Status",
        "Value Added Tax (VAT) Effective From Date",
        "Value Added Tax (VAT) Effective To Date",
        "Income Tax - PAYE Current Status",
        "Income Tax - PAYE Effective From Date",
        "Income Tax - PAYE Effective To Date",
        "Income Tax - Rent Income (MRI) Current Status",
        "Income Tax - Rent Income (MRI) Effective From Date",
        "Income Tax - Rent Income (MRI) Effective To Date",
        "Income Tax - Resident Individual Current Status",
        "Income Tax - Resident Individual Effective From Date",
        "Income Tax - Resident Individual Effective To Date",
        "Income Tax - Turnover Tax Current Status",
        "Income Tax - Turnover Tax Effective From Date",
        "Income Tax - Turnover Tax Effective To Date",
        "eTIMS Registration",
        "TIMS Registration",
        "VAT Compliance",
        "Error"
    ];

    // Add headers starting from row 3, column 2
    const headerRow = worksheet.getRow(3);
    headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 2);
        cell.value = header;
        cell.font = { bold: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow background
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Define colors for each tax type
    const colors = {
        companyTax: 'FFB3E0F0',
        vat: 'FFF0D9B3',
        paye: 'FFD9F0B3',
        rentIncome: 'FFE0B3F0',
        residentIndividual: 'FFB3F0D9',
        turnoverTax: 'FFF0B3E0'
    };

    // Add company data
    companyData.forEach((company, index) => {
        const rowIndex = index + 4; // Start from row 4 (row 3 is header)
        const row = worksheet.getRow(rowIndex);

        let values = [
            index + 1,
            company.company_name,
            company.pin_status || 'Unknown',
            company.itax_status || 'Unknown',
            company.pin_stations || 'N/A',
            company.income_tax_company_status,
            company.income_tax_company_effective_from,
            company.income_tax_company_effective_to,
            company.vat_status,
            company.vat_effective_from,
            company.vat_effective_to,
            company.paye_status,
            company.paye_effective_from,
            company.paye_effective_to,
            company.rent_income_mri_status,
            company.rent_income_mri_effective_from,
            company.rent_income_mri_effective_to,
            company.resident_individual_status,
            company.resident_individual_effective_from,
            company.resident_individual_effective_to,
            company.turnover_tax_status,
            company.turnover_tax_effective_from,
            company.turnover_tax_effective_to,
            company.etims_registration,
            company.tims_registration,
            company.vat_compliance,
            company.error || ""
        ];

        // Add values starting from column 2
        values.forEach((value, cellIndex) => {
            const cell = row.getCell(cellIndex + 2);
            cell.value = value;
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });

        // Apply colors to cells
        row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White for index
        row.getCell(3).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }; // White for company name
        row.getCell(3).alignment = { vertical: 'middle', horizontal: 'left' }; // Left align company name

        // Define colors for PIN Status, iTax Status, and PIN Station
        const pinStatusColor = 'FFD8E4BC'; // Light olive green
        const itaxStatusColor = 'FFB8CCE4'; // Light blue
        const pinStationColor = 'FFC5C5C5'; // Light gray

        row.getCell(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pinStatusColor } }; // PIN Status
        row.getCell(5).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: itaxStatusColor } }; // iTax Status
        row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: pinStationColor } }; // PIN Station

        row.getCell(7).fill = row.getCell(8).fill = row.getCell(9).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.companyTax } };
        row.getCell(10).fill = row.getCell(11).fill = row.getCell(12).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.vat } };
        row.getCell(13).fill = row.getCell(14).fill = row.getCell(15).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.paye } };
        row.getCell(16).fill = row.getCell(17).fill = row.getCell(18).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.rentIncome } };
        row.getCell(19).fill = row.getCell(20).fill = row.getCell(21).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.residentIndividual } };
        row.getCell(22).fill = row.getCell(23).fill = row.getCell(24).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.turnoverTax } };

        // Set colors for the compliance fields
        const etimsColor = 'FFD4F1F4';
        const timsColor = 'FFFDE9D9';
        const vatComplianceColor = 'FFDFECDE';

        row.getCell(25).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: etimsColor } };
        row.getCell(26).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: timsColor } };
        row.getCell(27).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: vatComplianceColor } };

        // Set light red color for empty cells
        for (let i = 4; i <= 27; i++) {
            const cell = row.getCell(i);
            if (!cell.value || cell.value === "No obligation" || cell.value === "Unknown") {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC0CB' } }; // Light red
            }
        }

        // Set red color for error cell if there's an error
        if (company.error) {
            row.getCell(28).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }; // Red
        }
    });

    // Autofit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
            const columnLength = cell.value ? cell.value.toString().length : 0;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = maxLength + 2;
    });

    return workbook;
}
import { NextRequest, NextResponse } from 'next/server';
import https from 'https';

/**
 * Initialize KRA iTax session and get cookies
 */
async function initKraSession(): Promise<Record<string, string>> {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: '/KRA-Portal/',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 30000
        };

        console.log('[KRA API] Initializing session...');

        const req = https.request(options, (res) => {
            const cookies = res.headers['set-cookie'] || [];
            const cookieMap: Record<string, string> = {};

            cookies.forEach((cookie) => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.split('=');
                if (name && value) {
                    cookieMap[name] = value;
                }
            });

            console.log('[KRA API] Session initialized, cookies:', Object.keys(cookieMap));
            resolve(cookieMap);
        });

        req.on('error', (error) => {
            console.error('[KRA API] Session init error:', error);
            reject(new Error(`Failed to initialize KRA session: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('KRA session initialization timeout'));
        });

        req.end();
    });
}

/**
 * Call KRA DWR endpoint
 */
async function callKraDWR(params: {
    cookies: Record<string, string>;
    scriptSessionId: string;
    windowName: string;
    scriptName: string;
    methodName: string;
    params: string[];
    batchId: number;
}): Promise<string | null> {
    return new Promise((resolve, reject) => {
        const cookieString = Object.entries(params.cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

        const body = [
            'callCount=1',
            `windowName=${params.windowName}`,
            `c0-scriptName=${params.scriptName}`,
            `c0-methodName=${params.methodName}`,
            'c0-id=0',
            ...params.params.map((p, i) => `c0-param${i}=${p}`),
            `batchId=${params.batchId}`,
            'page=/KRA-Portal/',
            'httpSessionId=',
            `scriptSessionId=${params.scriptSessionId}`
        ].join('\n') + '\n';

        const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: `/KRA-Portal/dwr/call/plaincall/${params.scriptName}.${params.methodName}.dwr`,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(body),
                'Cookie': cookieString,
                'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.5'
            },
            timeout: 30000
        };

        console.log(`[KRA API] Calling DWR: ${params.scriptName}.${params.methodName}`);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`[KRA API] DWR response received (${data.length} bytes)`);
                const result = parseDWRResponse(data);
                resolve(result);
            });
        });

        req.on('error', (error) => {
            console.error('[KRA API] DWR call error:', error);
            reject(new Error(`DWR call failed: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('DWR call timeout'));
        });

        req.write(body);
        req.end();
    });
}

/**
 * Parse DWR response format
 */
function parseDWRResponse(response: string): string | null {
    // Parse DWR callback format: dwr.engine.remote.handleCallback("0","0","VALUE");
    const callbackMatch = response.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
    if (callbackMatch) return callbackMatch[1];

    // Fallback for string variable format: s0="VALUE"
    const stringMatch = response.match(/s\d+="([^"]+)"/);
    return stringMatch ? stringMatch[1] : null;
}

/**
 * Generate random script session ID
 */
function generateScriptSessionId(): string {
    const random = Math.random().toString(16).slice(2).toUpperCase();
    const timestamp = Date.now();
    return `${random}/${timestamp}`;
}

/**
 * Generate random window name
 */
function generateWindowName(): string {
    return 'DWR-' + Math.random().toString(16).slice(2).toUpperCase();
}

/**
 * Fetch manufacturer details from KRA
 */
async function fetchManufacturerDetails(
    pin: string,
    cookies: Record<string, string>
): Promise<any> {
    return new Promise((resolve, reject) => {
        const cookieString = Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

        const body = `manPin=${encodeURIComponent(pin)}`;

        const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: '/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl',
            method: 'POST',
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'Content-Length': Buffer.byteLength(body),
                'Cookie': cookieString,
                'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'X-Requested-With': 'XMLHttpRequest'
            },
            timeout: 30000
        };

        console.log('[KRA API] Fetching manufacturer details for PIN:', pin);

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    console.log('[KRA API] Manufacturer details fetched successfully');

                    if (parsedData && parsedData.timsManBasicRDtlDTO) {
                        // Extract name fields
                        const firstName = parsedData.timsManBasicRDtlDTO?.firstName || '';
                        const middleName = parsedData.timsManBasicRDtlDTO?.middleName || '';
                        const lastName = parsedData.timsManBasicRDtlDTO?.lastName || '';
                        const manufacturerName = parsedData.timsManBasicRDtlDTO?.manufacturerName || '';

                        // Build full name
                        let fullName = manufacturerName;
                        if (firstName || lastName) {
                            fullName = [firstName, middleName, lastName]
                                .filter(name => name && name.trim())
                                .join(' ');
                        }

                        const formatted = {
                            basic: {
                                fullName,
                                firstName,
                                middleName,
                                lastName,
                                manufacturerName,
                                registrationNumber: parsedData.timsManBasicRDtlDTO?.manufacturerBrNo || '',
                                idNumber: parsedData.timsManBasicRDtlDTO?.idNumber || '',
                                idType: parsedData.timsManBasicRDtlDTO?.idType || '',
                                pin
                            },
                            business: {
                                businessName: parsedData.manBusinessRDtlDTO?.businessName || '',
                                registrationDate: parsedData.manBusinessRDtlDTO?.businessRegDate || '',
                                commencementDate: parsedData.manBusinessRDtlDTO?.businessComDate || '',
                                businessType: parsedData.manBusinessRDtlDTO?.businessType || '',
                                tradingName: parsedData.manBusinessRDtlDTO?.tradingName || ''
                            },
                            contact: {
                                mainEmail: parsedData.manContactRDtlDTO?.mainEmail || '',
                                secondaryEmail: parsedData.manContactRDtlDTO?.secondaryEmail || '',
                                mobileNumber: parsedData.manContactRDtlDTO?.mobileNo || '',
                                telephoneNumber: parsedData.manContactRDtlDTO?.telephoneNo || '',
                                faxNumber: parsedData.manContactRDtlDTO?.faxNo || ''
                            },
                            address: {
                                descriptive: parsedData.manAddRDtlDTO?.descriptiveAddress || '',
                                buildingNumber: parsedData.manAddRDtlDTO?.buldgNo || '',
                                streetRoad: parsedData.manAddRDtlDTO?.streetRoad || '',
                                cityTown: parsedData.manAddRDtlDTO?.cityTown || '',
                                county: parsedData.manAddRDtlDTO?.county || '',
                                district: parsedData.manAddRDtlDTO?.district || '',
                                town: parsedData.manAddRDtlDTO?.town || '',
                                lrNumber: parsedData.manAddRDtlDTO?.lrNo || '',
                                postalCode: parsedData.manAddRDtlDTO?.postalCode || '',
                                poBox: parsedData.manAddRDtlDTO?.poBox || '',
                                taxArea: parsedData.manAddRDtlDTO?.taxAreaLocality || '',
                                jurisdictionStationId: parsedData.manAddRDtlDTO?.jurisdictionStationId || '',
                                locationId: parsedData.manAddRDtlDTO?.locationId || ''
                            }
                        };

                        resolve(formatted);
                    } else {
                        console.warn('[KRA API] No manufacturer details in response');
                        resolve({ error: 'No manufacturer details found', raw: parsedData });
                    }
                } catch (parseError: any) {
                    console.error('[KRA API] Parse error:', parseError);
                    resolve({ error: 'Failed to parse manufacturer details', details: parseError.message });
                }
            });
        });

        req.on('error', (error) => {
            console.error('[KRA API] Manufacturer details fetch error:', error);
            reject(new Error(`Failed to fetch manufacturer details: ${error.message}`));
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Manufacturer details fetch timeout'));
        });

        req.write(body);
        req.end();
    });
}

/**
 * Find PIN by ID number
 */
async function findPinByIdNumber(idNumber: string) {
    try {
        console.log(`[KRA API] Starting PIN lookup for ID: ${idNumber}`);

        // Step 1: Initialize session
        const cookies = await initKraSession();

        // Step 2: Generate session identifiers
        const scriptSessionId = generateScriptSessionId();
        const windowName = generateWindowName();

        // Step 3: Call DWR to get masked PIN
        const maskedResponse = await callKraDWR({
            cookies,
            scriptSessionId,
            windowName,
            scriptName: 'findPinByIdno',
            methodName: 'findPinByIdnumber',
            params: [`string:${idNumber}`],
            batchId: 0
        });

        if (!maskedResponse) {
            throw new Error('No response from KRA PIN lookup');
        }

        console.log('[KRA API] Masked response:', maskedResponse);

        // Step 4: Decode PIN
        if (maskedResponse.includes('#$')) {
            const [maskedPin, reversedDigits] = maskedResponse.split('#$');
            const actualDigits = reversedDigits.split('').reverse().join('');
            const fullPin = maskedPin.replace('*****', actualDigits);

            console.log('[KRA API] PIN decoded successfully');

            // Step 5: Validate PIN
            const validation = await callKraDWR({
                cookies,
                scriptSessionId,
                windowName,
                scriptName: 'CheckLoginPin',
                methodName: 'checkLoginPin',
                params: [`string:${fullPin}`],
                batchId: 1
            });

            console.log('[KRA API] PIN validation:', validation);

            // Step 6: Fetch manufacturer details
            const manufacturerDetails = await fetchManufacturerDetails(fullPin, cookies);

            return {
                success: true,
                pin: fullPin,
                idNumber,
                validation,
                manufacturerDetails
            };
        } else {
            throw new Error('Invalid response format from KRA');
        }
    } catch (error: any) {
        console.error('[KRA API] Error in findPinByIdNumber:', error);
        throw error;
    }
}

/**
 * API Route Handler
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { idNumber } = body;

        console.log('[API] POST /api/kra/fetch-by-id - Request received');
        console.log('[API] ID Number:', idNumber);

        // Validate input
        if (!idNumber) {
            console.warn('[API] Missing ID number in request');
            return NextResponse.json(
                { error: 'ID number is required' },
                { status: 400 }
            );
        }

        // Validate ID number format (should be 8 digits)
        if (!/^\d{8}$/.test(idNumber)) {
            console.warn('[API] Invalid ID number format:', idNumber);
            return NextResponse.json(
                { error: 'ID number must be 8 digits' },
                { status: 400 }
            );
        }

        // Fetch data from KRA
        const result = await findPinByIdNumber(idNumber);

        const duration = Date.now() - startTime;
        console.log(`[API] Request completed successfully in ${duration}ms`);

        return NextResponse.json(result);

    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[API] Request failed after ${duration}ms:`, error);
        console.error('[API] Error stack:', error.stack);

        return NextResponse.json(
            {
                error: 'Failed to fetch details from KRA',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            },
            { status: 500 }
        );
    }
}

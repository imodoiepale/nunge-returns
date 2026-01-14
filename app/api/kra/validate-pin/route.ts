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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: 30000
        };

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

            resolve(cookieMap);
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Session initialization timeout'));
        });
        req.end();
    });
}

/**
 * Generate random script session ID for DWR
 */
function generateScriptSessionId(): string {
    const random = Math.random().toString(16).slice(2).toUpperCase();
    const timestamp = Date.now();
    return `${random}/${timestamp}`;
}

/**
 * Generate random window name for DWR
 */
function generateWindowName(): string {
    return 'DWR-' + Math.random().toString(16).slice(2).toUpperCase();
}

/**
 * Parse DWR response format
 */
function parseDWRResponse(response: string): string | null {
    const callbackMatch = response.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
    if (callbackMatch) return callbackMatch[1];

    const stringMatch = response.match(/s\d+="([^"]+)"/);
    return stringMatch ? stringMatch[1] : null;
}

/**
 * Call KRA DWR endpoint to validate PIN
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('DWR call timeout'));
        });

        req.write(body);
        req.end();
    });
}

/**
 * Fetch manufacturer details from KRA to validate PIN
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

        const req = https.request(options, (res) => {
            let data = '';

            console.log(`[KRA API] Response status: ${res.statusCode}`);

            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                // Check for HTTP error status codes
                if (res.statusCode && res.statusCode !== 200) {
                    console.error(`[KRA API] HTTP Error ${res.statusCode}: ${data}`);
                    resolve({ error: `HTTP ${res.statusCode}: ${res.statusMessage}` });
                    return;
                }

                try {
                    console.log(`[KRA API] Response data (first 200 chars): ${data.substring(0, 200)}`);
                    const parsedData = JSON.parse(data);

                    if (parsedData && parsedData.timsManBasicRDtlDTO) {
                        const firstName = parsedData.timsManBasicRDtlDTO?.firstName || '';
                        const middleName = parsedData.timsManBasicRDtlDTO?.middleName || '';
                        const lastName = parsedData.timsManBasicRDtlDTO?.lastName || '';
                        const manufacturerName = parsedData.timsManBasicRDtlDTO?.manufacturerName || '';

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
                        resolve({ error: 'No manufacturer details found' });
                    }
                } catch (parseError: any) {
                    resolve({ error: 'Failed to parse manufacturer details' });
                }
            });
        });

        req.on('error', (error) => {
            console.error('[KRA API] Manufacturer details fetch error:', error);
            resolve({ error: error.message });
        });
        req.on('timeout', () => {
            req.destroy();
            resolve({ error: 'Request timeout' });
        });

        req.write(body);
        req.end();
    });
}

/**
 * API Route Handler - Validate PIN using DWR CheckLoginPin
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        const body = await request.json();
        const { pin } = body;

        console.log('[API] POST /api/kra/validate-pin - Request received');
        console.log('[API] PIN:', pin);

        if (!pin) {
            return NextResponse.json(
                { error: 'PIN is required' },
                { status: 400 }
            );
        }

        // Step 1: Initialize session
        const cookies = await initKraSession();
        const scriptSessionId = generateScriptSessionId();
        const windowName = generateWindowName();

        // Step 2: Validate PIN using DWR CheckLoginPin
        console.log('[API] Validating PIN with CheckLoginPin...');
        const validation = await callKraDWR({
            cookies,
            scriptSessionId,
            windowName,
            scriptName: 'CheckLoginPin',
            methodName: 'checkLoginPin',
            params: [`string:${pin}`],
            batchId: 0
        });

        console.log('[API] PIN validation response:', validation);

        // Check validation result
        if (!validation || validation === 'Invalid' || validation === 'null' || validation === '') {
            const duration = Date.now() - startTime;
            console.log(`[API] PIN validation failed in ${duration}ms: Invalid PIN`);
            return NextResponse.json({
                success: false,
                error: 'Invalid PIN'
            });
        }

        // Step 3: Fetch manufacturer details for valid PIN
        console.log('[API] PIN valid, fetching manufacturer details...');
        const manufacturerDetails = await fetchManufacturerDetails(pin, cookies);

        const duration = Date.now() - startTime;

        if (manufacturerDetails.error) {
            // PIN is valid but couldn't fetch details - still return success
            console.log(`[API] PIN valid but details fetch failed in ${duration}ms`);
            return NextResponse.json({
                success: true,
                pin,
                validation,
                manufacturerDetails: null,
                message: 'PIN is valid but details could not be retrieved'
            });
        }

        console.log(`[API] PIN validated successfully with details in ${duration}ms`);

        return NextResponse.json({
            success: true,
            pin,
            validation,
            manufacturerDetails
        });

    } catch (error: any) {
        const duration = Date.now() - startTime;
        console.error(`[API] Request failed after ${duration}ms:`, error);

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to validate PIN',
                message: error.message
            },
            { status: 500 }
        );
    }
}

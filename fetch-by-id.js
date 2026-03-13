import https from 'https';

/**
 * Initialize KRA iTax session and get cookies
 */
async function initKraSession() {
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
            const cookieMap = {};

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
async function callKraDWR(params) {
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
function parseDWRResponse(response) {
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
function generateScriptSessionId() {
    const random = Math.random().toString(16).slice(2).toUpperCase();
    const timestamp = Date.now();
    return `${random}/${timestamp}`;
}

/**
 * Generate random window name
 */
function generateWindowName() {
    return 'DWR-' + Math.random().toString(16).slice(2).toUpperCase();
}

/**
 * Fetch manufacturer details from KRA
 */
async function fetchManufacturerDetails(pin, cookies) {
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
                        // Return the raw manufacturer details in the expected format
                        resolve([parsedData]);
                    } else {
                        console.warn('[KRA API] No manufacturer details in response');
                        resolve(null);
                    }
                } catch (parseError) {
                    console.error('[KRA API] Parse error:', parseError);
                    resolve(null);
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
async function findPinByIdNumber(idNumber) {
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
    } catch (error) {
        console.error('[KRA API] Error in findPinByIdNumber:', error);
        throw error;
    }
}

/**
 * API Route Handler
 */
export default async function handler(req, res) {
    const startTime = Date.now();

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { idNumber } = req.body;

        console.log('[API] POST /api/fetch-by-id - Request received');
        console.log('[API] ID Number:', idNumber);

        // Validate input
        if (!idNumber) {
            console.warn('[API] Missing ID number in request');
            return res.status(400).json({ error: 'ID number is required' });
        }

        // Validate ID number format (should be at least 5 digits)
        if (!/^\d{5,}$/.test(idNumber)) {
            console.warn('[API] Invalid ID number format:', idNumber);
            return res.status(400).json({ error: 'ID number must be at least 5 digits' });
        }

        // Fetch data from KRA
        const result = await findPinByIdNumber(idNumber);

        const duration = Date.now() - startTime;
        console.log(`[API] Request completed successfully in ${duration}ms`);

        return res.status(200).json(result);

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[API] Request failed after ${duration}ms:`, error);
        console.error('[API] Error stack:', error.stack);

        return res.status(500).json({
            error: 'Failed to fetch details from KRA',
            message: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

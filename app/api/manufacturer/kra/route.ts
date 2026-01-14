import { NextResponse } from 'next/server';
import https from 'https';

/**
 * DEPRECATED: This endpoint now uses direct KRA fetch instead of external Railway service
 * Maintained for backward compatibility with old code
 * New code should use /api/kra/validate-pin instead
 */

interface ManufacturerDetails {
  pin: string;
  name: string;
  contactDetails: {
    mobile: string;
    email: string;
    secondaryEmail: string;
  };
  businessDetails: {
    name: string;
    registrationNumber: string;
    registrationDate: string;
    commencedDate: string;
  };
  postalAddress: {
    postalCode: string;
    town: string;
    poBox: string;
  };
  physicalAddress: {
    descriptive: string;
  };
}

async function initKraSession(): Promise<Record<string, string>> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'itax.kra.go.ke',
      port: 443,
      path: '/KRA-Portal/',
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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

async function fetchManufacturerDetailsFromKRA(pin: string, cookies: Record<string, string>): Promise<any> {
  return new Promise((resolve) => {
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
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode && res.statusCode !== 200) {
          resolve({ error: `HTTP ${res.statusCode}` });
          return;
        }

        try {
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

            resolve({
              timsManBasicRDtlDTO: {
                ...parsedData.timsManBasicRDtlDTO,
                fullName
              },
              manContactRDtlDTO: parsedData.manContactRDtlDTO,
              manBusinessRDtlDTO: parsedData.manBusinessRDtlDTO,
              manAddRDtlDTO: parsedData.manAddRDtlDTO
            });
          } else {
            resolve({ error: 'No manufacturer details found' });
          }
        } catch (parseError) {
          resolve({ error: 'Failed to parse response' });
        }
      });
    });

    req.on('error', (error) => {
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

export async function GET(request: Request) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'Missing PIN parameter' },
        { status: 400 }
      );
    }

    console.log('[DEPRECATED API] Fetching manufacturer details for PIN:', pin);
    console.log('[DEPRECATED API] Consider using /api/kra/validate-pin instead');

    // Initialize KRA session
    const cookies = await initKraSession();

    // Fetch details directly from KRA
    const parsedData = await fetchManufacturerDetailsFromKRA(pin, cookies);

    if (parsedData.error) {
      throw new Error(parsedData.error);
    }

    const details: ManufacturerDetails = {
      pin: pin,
      name: parsedData.timsManBasicRDtlDTO?.fullName || parsedData.timsManBasicRDtlDTO?.manufacturerName || '',
      contactDetails: {
        mobile: parsedData.manContactRDtlDTO?.mobileNo || '',
        email: parsedData.manContactRDtlDTO?.mainEmail || '',
        secondaryEmail: parsedData.manContactRDtlDTO?.secondaryEmail || ''
      },
      businessDetails: {
        name: parsedData.manBusinessRDtlDTO?.businessName || parsedData.timsManBasicRDtlDTO?.manufacturerName || '',
        registrationNumber: parsedData.timsManBasicRDtlDTO?.manufacturerBrNo || '',
        registrationDate: parsedData.manBusinessRDtlDTO?.businessRegDate || '',
        commencedDate: parsedData.manBusinessRDtlDTO?.businessComDate || ''
      },
      postalAddress: {
        postalCode: parsedData.manAddRDtlDTO?.postalCode?.toString() || '',
        town: parsedData.manAddRDtlDTO?.town || '',
        poBox: parsedData.manAddRDtlDTO?.poBox?.toString() || ''
      },
      physicalAddress: {
        descriptive: parsedData.manAddRDtlDTO?.descriptiveAddress || ''
      }
    };

    const duration = Date.now() - startTime;
    console.log(`[DEPRECATED API] Request completed in ${duration}ms`);

    return NextResponse.json({ success: true, data: details });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[DEPRECATED API] Error after ${duration}ms:`, error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}

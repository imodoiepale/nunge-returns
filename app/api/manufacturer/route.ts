import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const browser = await chromium.launch({ 
        headless: true,
        channel: 'msedge',
    //   executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      await page.goto("https://itax.kra.go.ke/KRA-Portal/");
      await page.locator("#logid").click();
      await page.evaluate(() => {
        manufacturerAuthorization();
      });
      await page.locator("#mfrPinResi").fill(pin);
      await page.click("#nextBtn");
      await page.waitForTimeout(1000);
      await page.click("#nextBtn");

      const errorText = await page.innerText('.tablerowhead').catch(() => '');
      if (errorText.includes('An Error has occurred')) {
        throw new Error('Invalid PIN or service unavailable');
      }

      const details = {
        taxpayerName: await page.inputValue("#taxpayerNameResi"),
        mobileNumber: await page.inputValue("#mobileNumber"),
        mainEmailId: await page.inputValue("#mainEmailId"),
        businessRegCertiNo: await page.inputValue("#businessRegCertiNo"),
        busiRegDt: await page.inputValue("#busiRegDt"),
        busiCommencedDt: await page.inputValue("#busiCommencedDt"),
        descriptiveAddress: await page.inputValue("#DescAddr"),
        postalAddress: {
          postalCode: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.postalCode']"),
          town: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.town']"),
          poBox: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.poBox']")
        }
      };

      return NextResponse.json({ success: true, data: details });
    } finally {
      await context.close();
      await browser.close();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
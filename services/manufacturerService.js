// services/manufacturerService.js
import { chromium } from "playwright";

export async function extractManufacturerDetails(pin) {
  const browser = await chromium.launch({ 
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto("https://itax.kra.go.ke/KRA-Portal/");
    await page.locator("#logid").click();
    await page.evaluate(() => manufacturerAuthorization());
    await page.locator("#mfrPinResi").fill(pin);
    await page.click("#nextBtn");
    await page.waitForTimeout(1000);
    await page.click("#nextBtn");

    // Check for error
    const errorText = await page.innerText('.tablerowhead').catch(() => '');
    if (errorText.includes('An Error has occurred')) {
      throw new Error('Invalid PIN or service unavailable');
    }

    // Extract all manufacturer details
    const details = {
      taxpayerName: await page.inputValue("#taxpayerNameResi"),
      mobileNumber: await page.inputValue("#mobileNumber"),
      mainEmailId: await page.inputValue("#mainEmailId"),
      businessRegCertiNo: await page.inputValue("#businessRegCertiNo"),
      busiRegDt: await page.inputValue("#busiRegDt"),
      busiCommencedDt: await page.inputValue("#busiCommencedDt"),
      descriptiveAddress: await page.inputValue("#DescAddr"),
      physicalAddress: {
        lrNo: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.lrNo']"),
        building: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.building']"),
        street: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.street']"),
        city: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.city']"),
        county: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.county']"),
        district: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.district']"),
        taxArea: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.taxArea']")
      },
      postalAddress: {
        postalCode: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.postalCode']"),
        town: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.town']"),
        poBox: await page.inputValue("[name='manAuthDTO.manAddRDtlDTO.poBox']")
      }
    };

    return details;
  } catch (error) {
    throw new Error(`Failed to extract manufacturer details: ${error.message}`);
  } finally {
    await context.close();
    await browser.close();
  }
}
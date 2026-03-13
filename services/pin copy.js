const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://itax.kra.go.ke/KRA-Portal/login.htm');
  await page.locator('area').click();
  await page.locator('#logid').click();
  await page.locator('#logid').fill('A016747060E');
  await page.getByRole('link', { name: 'Continue' }).click();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.locator('input[name="xxZTT9p2wQ"]').click();
  await page.locator('input[name="xxZTT9p2wQ"]').fill('3');
  await page.locator('input[name="xxZTT9p2wQ"]').press('CapsLock');
  await page.locator('input[name="xxZTT9p2wQ"]').fill('3N');
  await page.locator('input[name="xxZTT9p2wQ"]').press('CapsLock');
  await page.locator('input[name="xxZTT9p2wQ"]').fill('3Nj');
  await page.locator('input[name="xxZTT9p2wQ"]').press('CapsLock');
  await page.locator('input[name="xxZTT9p2wQ"]').fill('3NjZCO1');
  await page.locator('input[name="xxZTT9p2wQ"]').press('CapsLock');
  await page.locator('input[name="xxZTT9p2wQ"]').fill('3NjZCO1z');
  await page.getByRole('textbox', { name: 'Please enter the result of' }).click();
  await page.getByRole('textbox', { name: 'Please enter the result of' }).fill('122');
  await page.getByRole('link', { name: 'Login' }).click();
  await page.locator('input[name="firstTimeLoginVO.$ZxQPLm$"]').click();
  await page.locator('input[name="firstTimeLoginVO.$ZxQPLm$"]').fill('3NjZCO1z');
  await page.locator('input[name="firstTimeLoginVO.$kkCx7ZqD"]').click();
  await page.locator('input[name="firstTimeLoginVO.$kkCx7ZqD"]').fill('James39794454');
  await page.getByRole('row', { name: 'Confirm New Password*', exact: true }).getByRole('textbox').click();
  await page.getByRole('row', { name: 'Confirm New Password*', exact: true }).getByRole('textbox').fill('James39794454');
  await page.locator('#secQuestion').selectOption('BCITY');
  await page.locator('#secAnswer').click();
  await page.locator('#secAnswer').fill('Nairobi');
  await page.locator('#confirmSecAnswer').click();
  await page.locator('#confirmSecAnswer').fill('Nairobi');
  await page.locator('#chkDisclaimer').check();
  await page.locator('#securePwdPolicy').check();
  page.once('dialog', dialog => {
    console.log(`Dialog message: ${dialog.message()}`);
    dialog.dismiss().catch(() => {});
  });
  await page.getByRole('button', { name: 'Submit' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://devpg.bluewalnut.co.kr/hpayBookmark.jsp');
  await page.locator('#dev').selectOption('https://devpg.bluewalnut.co.kr/dlp/cnspayRequest.jsp');
  await page.locator('#accessFrame').contentFrame().getByRole('checkbox', { name: '신용카드' }).check();
  await page.locator('#accessFrame').contentFrame().getByRole('link', { name: '결제 요청하기' }).click();
  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().locator('#agreeAllMethod span').click();
  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().getByRole('button', { name: '현대' }).click();
  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().getByRole('button', { name: '다음' }).click();
  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().getByRole('button', { name: '닫기' }).click();

  // ---------------------
  await context.close();
  await browser.close();
})();

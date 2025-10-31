const { test, expect } = require('@playwright/test');

test('Payment test', async ({ page }) => {
  console.log('Starting payment test...');

  await page.goto('https://devpg.bluewalnut.co.kr/hpayBookmark.jsp');

  await page.locator('#dev').selectOption('https://devpg.bluewalnut.co.kr/dlp/cnspayRequest.jsp');

  await page.locator('#accessFrame').contentFrame().getByRole('checkbox', { name: '신용카드' }).check();

  await page.locator('#accessFrame').contentFrame().getByRole('link', { name: '결제 요청하기' }).click();

  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().locator('#agreeAllMethod span').click();

  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().getByRole('button', { name: '현대' }).click();

  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().getByRole('button', { name: '다음' }).click();

  await page.locator('#accessFrame').contentFrame().locator('iframe[name="easyXDM_dlp_provider"]').contentFrame().getByRole('button', { name: '닫기' }).click();

  console.log('Payment test completed!');
});
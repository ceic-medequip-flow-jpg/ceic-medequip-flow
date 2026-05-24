const playwright = require('playwright');
(async () => {
  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
  await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/index.html');
  await page.waitForTimeout(2000);
  await browser.close();
})();

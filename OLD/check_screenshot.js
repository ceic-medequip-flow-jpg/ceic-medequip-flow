const playwright = require('playwright');
(async () => {
  try {
    console.log('launching browser');
    const browser = await playwright.chromium.launch();
    console.log('browser launched');
    const page = await browser.newPage();
    page.on('console', msg => console.log('CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    console.log('navigating to page');
    await page.goto('file:///' + __dirname.replace(/\\/g, '/') + '/index.html', { waitUntil: 'networkidle' });
    console.log('taking screenshot');
    await page.screenshot({ path: 'screenshot.png' });
    console.log("Screenshot saved.");
    await browser.close();
  } catch (e) {
    console.error('ERROR:', e);
  }
})();

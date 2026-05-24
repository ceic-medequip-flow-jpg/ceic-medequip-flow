import fs from 'fs';
import path from 'path';

export async function mapUI(page, profile) {
  const dir = path.resolve('qa-reports/latest/ui-discovery');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // Aguarda a tela estabilizar após renderizações ou network requests
  await page.waitForTimeout(2000);

  const url = page.url();
  const title = await page.title();
  
  const locators = {
    buttons: await page.locator('button').allTextContents(),
    links: await page.locator('a').allTextContents(),
    headings: await page.locator('h1, h2, h3').allTextContents(),
    testIds: await page.evaluate(() => {
      return Array.from(document.querySelectorAll('[data-testid]')).map(e => e.getAttribute('data-testid'));
    })
  };

  const cleanArray = (arr) => [...new Set(arr.map(s => String(s).trim()).filter(Boolean))];

  const uiData = {
    perfil: profile,
    url,
    titulo: title,
    botoes: cleanArray(locators.buttons),
    links: cleanArray(locators.links),
    titulos: cleanArray(locators.headings),
    testIdsVisiveis: cleanArray(locators.testIds)
  };

  fs.writeFileSync(path.join(dir, `${profile}.json`), JSON.stringify(uiData, null, 2));
  await page.screenshot({ path: path.join(dir, `${profile}.png`), fullPage: true });
  return uiData;
}
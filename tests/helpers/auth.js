export async function performLogin(page, login, senha) {
  await page.goto('http://127.0.0.1:5173/');
  await page.waitForSelector('input[placeholder*="login"]', { state: 'visible' });
  await page.fill('input[placeholder*="login"]', login);
  await page.fill('input[type="password"]', senha);
  await page.click('button:has-text("Entrar")');
  await page.waitForTimeout(2000);
  if (await page.getByRole('button', { name: /Entrar/i }).isVisible().catch(() => false)) {
    throw new Error(`Login não avançou para o sistema para o usuário ${login}.`);
  }
}

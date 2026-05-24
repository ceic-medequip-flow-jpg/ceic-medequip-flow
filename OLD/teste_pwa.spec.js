import { test, expect } from '@playwright/test';

test.describe('Testes de PWA (Progressive Web App)', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:8081/index.html');
  });

  test('Deve possuir a tag meta do manifest.json', async ({ page }) => {
    const manifestLink = page.locator('link[rel="manifest"]');
    await expect(manifestLink).toHaveAttribute('href', 'manifest.json');
  });

  test('Deve possuir a tag theme-color configurada para o celular', async ({ page }) => {
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#2563eb');
  });

  test('Deve registrar o Service Worker com sucesso no navegador', async ({ page }) => {
    // Aguarda 1.5s para garantir que o script de registro do SW index.html seja executado
    await page.waitForTimeout(1500);
    
    // Avalia o objeto 'navigator' da própria página para ler o status da API do ServiceWorker
    const swCount = await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      return registrations.length;
    });

    expect(swCount).toBeGreaterThan(0);
  });
});
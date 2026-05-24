import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile Pequeno', width: 375, height: 667 },
  { name: 'Mobile Grande', width: 430, height: 932 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Notebook', width: 1366, height: 768 },
  { name: 'Desktop Grande', width: 1920, height: 1080 }
];

test.describe('Responsividade do CEIC App', () => {

  for (const vp of viewports) {
    test(`Validar viewport: ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      
      // Ajuste o URL abaixo caso o Vite esteja rodando em porta diferente
      await page.goto('http://localhost:5173');

      // Se o app não mockar o login automaticamente nos testes locais, precisamos fazer o login:
      // Espera pelo campo de usuário
      const userInput = page.locator('input[placeholder*="Matrícula"]');
      if (await userInput.count() > 0) {
          await userInput.fill('admin'); // usuario mock/fake se necessario
          await page.locator('input[type="password"]').fill('admin');
          await page.getByRole('button', { name: /Entrar/i }).click();
      }

      // Aguarda carregamento do dashboard
      await expect(page.locator('text=CEIC')).toBeVisible();

      // Entra em "Nova Solicitação" caso não esteja já lá
      const novaSolicitacaoBtn = page.getByTestId('nav-nova_solicitacao');
      if (await novaSolicitacaoBtn.count() > 0) {
        await novaSolicitacaoBtn.click();
      } else {
        // No mobile, precisa abrir o menu antes
        const menuBtn = page.locator('button:has(.lucide-menu)');
        if (await menuBtn.isVisible()) {
            await menuBtn.click();
            await page.getByTestId('nav-nova_solicitacao').click();
        }
      }

      // Espera formulário aparecer
      await expect(page.getByTestId('request-form')).toBeVisible();

      // Aguarda para estabilizar o layout
      await page.waitForTimeout(500);

      // Checa overflow horizontal
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5; // Tolerância de 5px
      });

      expect(hasHorizontalOverflow, `Viewport ${vp.name} não deve ter barra de rolagem horizontal (overflow).`).toBe(false);
    });
  }
});

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:8081/index.html';

const OPERACIONAL = {
  login: 'EQUIPE_OPERACIONAL',
  password: 'oP9!wK3@jRz5'
};

test('LIMPEZA TOTAL DO DASHBOARD OPERACIONAL (VISUAL)', async ({ page }) => {

  // =========================
  // LOGIN
  // =========================
  await page.goto(BASE_URL);

  await page.getByPlaceholder('Digite seu login').fill(OPERACIONAL.login);
  await page.getByPlaceholder('Sua senha').fill(OPERACIONAL.password);
  await page.getByRole('button', { name: 'Entrar' }).click();

  // ✅ Validação correta da tela
  await expect(
    page.getByRole('heading', { name: 'Dashboard Operacional' })
  ).toBeVisible();

  // =========================
  // CANCELAR TODAS AS SOLICITAÇÕES
  // =========================
  let total = await page.locator(
    'button', { hasText: /^Cancelar/i }
  ).count();

  console.log(`Solicitações encontradas: ${total}`);

  while (total > 0) {
    const btnCancelar = page
      .locator('button', { hasText: /^Cancelar/i })
      .first();

    await btnCancelar.scrollIntoViewIfNeeded();
    await btnCancelar.click();

    // =========================
    // MODAL DE CANCELAMENTO (ESCOPO CORRETO)
    // =========================
    const modal = page.locator('[role="dialog"]').filter({ hasText: /Cancelar/i });

    await expect(modal).toBeVisible();

    await modal
      .getByPlaceholder(/duplicidade|alta|pedido/i)
      .fill('Limpeza automática de testes');

    await modal
      .getByPlaceholder('Nome do profissional')
      .fill('Teste Automatizado');

    await modal
      .getByPlaceholder('Ex: 12345')
      .fill('99999');

    // ✅ Confirmar APENAS dentro do modal
    await modal
      .getByRole('button', { name: 'Confirmar' })
      .click();

    // =========================
    // AGUARDA CONFIRMAÇÃO
    // =========================
    const notificacao = page.getByText(/Solicitação cancelada/i);

    await expect(notificacao).toBeVisible();
    await expect(notificacao).not.toBeVisible({ timeout: 10000 });

    // Reconta após cancelar
    total = await page.locator(
      'button', { hasText: /^Cancelar/i }
    ).count();

    console.log(`Restantes: ${total}`);
  }

  // =========================
  // PROVA FINAL (ANTI-FAKE SUCCESS)
  // =========================
  await page.reload();

  await expect(
    page.locator('button', { hasText: /^Cancelar/i })
  ).toHaveCount(0);
});
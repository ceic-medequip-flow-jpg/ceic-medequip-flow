import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:8081/index.html';

// Credenciais de teste (ajuste se necessário)
const USERS = {
  ADMIN: { login: 'TESTE', password: 'tQ4#vB8!nZp7' },
  OPERACIONAL: { login: 'EQUIPE_OPERACIONAL', password: 'oP9!wK3@jRz5' },
  ASSISTENCIAL: { login: '04CC', password: '4001' }
};

async function login(page, { login, password }) {
  await page.goto(BASE_URL);
  await page.getByPlaceholder('Digite seu login').fill(login);
  await page.getByPlaceholder('Sua senha').fill(password);
  await page.getByRole('button', { name: 'Entrar' }).click();
}

test.describe('Checklist Anti Fake Success – Persistência Real', () => {

  test('1️⃣ Cancelamento persiste após reload', async ({ page }) => {
    await login(page, USERS.OPERACIONAL);

    // Garante que existe ao menos um pedido visível que possa ser cancelado
    const pedido = page.locator('.border-b.border-gray-100').filter({ has: page.getByRole('button', { name: /Cancelar/i }) }).first();
    await expect(pedido).toBeVisible();

    // Cancela
    await pedido.getByRole('button', { name: /Cancelar/i }).click();
    await page.getByRole('button', { name: /Confirmar/i }).click();

    // Confirma feedback
    await expect(page.getByText(/cancelada/i)).toBeVisible();

    // 🔴 PROVA: reload
    await page.reload();

    // ❌ Se o pedido voltar, o teste QUEBRA
    await expect(pedido).not.toBeVisible();
  });

  test('2️⃣ Alocação/Entrega NÃO volta após reload', async ({ page }) => {
    await login(page, USERS.OPERACIONAL);

    const pedido = page.locator('.border-b.border-gray-100').filter({ hasText: /Buscar e selecionar TAG/i }).first();
    await expect(pedido).toBeVisible();

    await pedido.getByText(/Buscar e selecionar TAG/i).click();
    await page.getByPlaceholder('Digite para buscar...').pressSequentially('AUTO', { delay: 50 });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await pedido.getByRole('button', { name: /Confirmar/i }).click();
    await expect(page.getByText(/vinculado/i)).toBeVisible();

    await page.reload();

    // ❌ Pedido NÃO pode voltar após entrega
    await expect(pedido).not.toBeVisible();
  });

  test('3️⃣ Devolução / Expurgo persiste após reload', async ({ page }) => {
    await login(page, USERS.OPERACIONAL);

    await page.getByRole('button', { name: /Triagem/i }).click();
    await page.getByText(/Pesquisar TAG/i).click();
    await page.getByPlaceholder('Digite para buscar...').pressSequentially('AUTO', { delay: 50 });
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    await page.getByRole('button', { name: /Avançar/i }).click();
    await page.locator('button', { hasText: /^SIM$/ }).click();
    await page.locator('button', { hasText: /^NÃO/ }).click();
    await page.getByRole('button', { name: /Confirmar/i }).click();

    await page.getByRole('button', { name: /Expurgo/i }).click();
    await page.getByRole('button', { name: /Liberar Item/i }).click();

    await page.reload();

    // ❌ Item NÃO pode reaparecer em triagem/expurgo
    await expect(page.getByText(/AUTO/i)).not.toBeVisible();
  });

  test('4️⃣ Bloqueio de permissão: Assistencial NÃO cancela', async ({ page }) => {
    await login(page, USERS.ASSISTENCIAL);

    const pedido = page.locator('.border-b.border-gray-100').filter({ has: page.getByRole('button', { name: /Cancelar/i }) }).first();
    await expect(pedido).toBeVisible();

    await pedido.getByRole('button', { name: /Cancelar/i }).click();

    // ✅ Deve falhar por permissão
    await expect(page.getByText(/não tem permissão/i)).toBeVisible();
  });

});
import { test, expect } from '@playwright/test';

test.describe('CRUD de Usuários - Perfil Admin', () => {

  const testUserLogin = `TEST_USER_${Math.floor(1000 + Math.random() * 9000)}`;
  const testPassword = 'senha123';

  test.beforeEach(async ({ page }) => {
    // Entra no sistema e faz login como Admin/Teste antes de cada teste
    await page.goto('http://127.0.0.1:8081/index.html');
    await page.getByPlaceholder('Digite seu login').fill('TESTE');
    await page.getByPlaceholder('Sua senha').fill('tQ4#vB8!nZp7');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Navega para a tela de gestão de usuários (TESTE já cai nela por padrão, então apenas validamos)
    await expect(page.getByRole('heading', { name: /Gestão de Usuários/i })).toBeVisible({ timeout: 10000 });
  });

  test('Deve criar, editar e excluir um usuário', async ({ page }) => {
    
    // 1. CRIAR (Create)
    await test.step('Criar novo usuário', async () => {
      await page.getByRole('button', { name: /Novo Usuário/i }).click();
      
      // Preenche o formulário no modal
      await page.locator('.modal-overlay').locator('input.font-mono').fill(testUserLogin);
      await page.locator('.modal-overlay').locator('input[type="password"]').fill(testPassword);
      await page.locator('.modal-overlay').locator('select').first().selectOption('OPERACIONAL');
      await page.locator('.modal-overlay').getByPlaceholder('Ex: UTI DA EMERGENCIA').fill('SETOR DE TESTE');
      
      await page.getByRole('button', { name: /Salvar/i }).click();
      
      // Verifica se o usuário aparece na tabela
      await expect(page.getByRole('cell', { name: testUserLogin, exact: true })).toBeVisible();
    });

    // 2. EDITAR (Update) - Garantindo que não altera a senha
    await test.step('Editar o usuário mantendo a senha intacta', async () => {
      const userRow = page.locator('tr', { hasText: testUserLogin });
      await userRow.locator('button.text-blue-600').click(); // Clica no ícone de lápis (Editar)

      await page.locator('.modal-overlay').locator('select').selectOption('GESTAO');
      // NÃO preenchemos o campo de senha para garantir que a antiga se mantenha no banco
      await page.getByRole('button', { name: /Salvar/i }).click();

      await expect(userRow.getByText('GESTAO')).toBeVisible();
    });

    // 3. VALIDAR LOGIN (Prova definitiva de que a senha não foi alterada)
    await test.step('Validar login do usuário editado', async () => {
      await page.getByRole('button', { name: /Sair/i }).click();

      await page.getByPlaceholder('Digite seu login').fill(testUserLogin);
      await page.getByPlaceholder('Sua senha').fill(testPassword); // Usa a mesma senha do passo 1
      await page.getByRole('button', { name: 'Entrar' }).click();

      // Verifica se logou com sucesso (Perfil GESTAO cai no admin_dashboard)
      await expect(page.getByRole('heading', { name: /Painel Gerencial/i })).toBeVisible();

      // Retorna para o Admin principal para concluir o teste
      await page.getByRole('button', { name: /Sair/i }).click();
      await page.getByPlaceholder('Digite seu login').fill('TESTE');
      await page.getByPlaceholder('Sua senha').fill('tQ4#vB8!nZp7');
      await page.getByRole('button', { name: 'Entrar' }).click();
      await expect(page.getByRole('heading', { name: /Gestão de Usuários/i })).toBeVisible({ timeout: 10000 });
    });

    // 4. EXCLUIR (Delete)
    await test.step('Excluir o usuário de teste', async () => {
      page.once('dialog', dialog => dialog.accept()); // Aceita o confirm() do navegador
      await page.locator('tr', { hasText: testUserLogin }).locator('button.text-red-600').click(); // Clica na lixeira (Excluir)
      
      await expect(page.getByRole('cell', { name: testUserLogin, exact: true })).not.toBeVisible();
    });
  });
});
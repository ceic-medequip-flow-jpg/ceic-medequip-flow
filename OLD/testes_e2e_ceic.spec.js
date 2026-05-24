import { test, expect } from '@playwright/test';

test.describe('Cobertura Completa CEIC App - Teste de todas as telas', () => {

  test.beforeEach(async ({ page }) => {
    // Entra no sistema antes de cada teste
    await page.goto('http://127.0.0.1:8081/index.html');
  });

  test('Teste 1: Telas do Perfil Assistencial', async ({ page }) => {
    // Login
    await page.getByPlaceholder('Digite seu login').fill('04CC');
    await page.getByPlaceholder('Sua senha').fill('4001');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Verifica carregamento da Home (Nova Solicitação)
    await expect(page.getByRole('heading', { name: 'Nova Solicitação' })).toBeVisible();

    // Clica no Menu: Meus Pedidos
    await page.getByRole('button', { name: 'Meus Pedidos' }).click();
    await expect(page.getByRole('heading', { name: /Meus Pedidos/i })).toBeVisible();

    // Clica no Menu: Equipamentos na Minha Área
    await page.getByRole('button', { name: 'Equipamentos na Minha Área' }).click();
    await expect(page.getByRole('heading', { name: /Equipamentos na Área/i })).toBeVisible();
  });

  test('Teste 2: Telas do Perfil Operacional', async ({ page }) => {
    // Login
    await page.getByPlaceholder('Digite seu login').fill('EQUIPE_OPERACIONAL');
    await page.getByPlaceholder('Sua senha').fill('oP9!wK3@jRz5');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Menu: Dashboard
    await expect(page.getByRole('heading', { name: 'Dashboard Operacional' })).toBeVisible();

    // Menu: Estoque Central
    await page.getByRole('button', { name: 'Estoque Central' }).click();
    await expect(page.getByRole('heading', { name: 'Estoque Central' })).toBeVisible();

    // Menu: Triagem / Devolução
    await page.getByRole('button', { name: 'Triagem / Devolução' }).click();
    await expect(page.getByRole('heading', { name: /Devolução e Triagem/i })).toBeVisible();

    // Menu: Expurgo / Limpeza
    await page.getByRole('button', { name: 'Expurgo / Limpeza' }).click();
    await expect(page.getByRole('heading', { name: /Sala de Expurgo/i })).toBeVisible();
  });

  test('Teste 3: Telas do Perfil Gestão / Liderança', async ({ page }) => {
    // Login
    await page.getByPlaceholder('Digite seu login').fill('TESTE');
    await page.getByPlaceholder('Sua senha').fill('tQ4#vB8!nZp7');
    await page.getByRole('button', { name: 'Entrar' }).click();

    // A página inicial para o perfil 'TESTE' é a de usuários. Validamos e depois navegamos.
    await expect(page.getByRole('heading', { name: /Gestão de Usuários/i })).toBeVisible();
    await page.getByRole('button', { name: 'Painel Gerencial' }).click();
    await expect(page.getByRole('heading', { name: /Painel Gerencial/i })).toBeVisible();

    // Menu: Indicadores
    await page.getByRole('button', { name: 'Indicadores', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Indicadores de Performance/i })).toBeVisible();

    // Menu: Gestão da Frota
    await page.getByRole('button', { name: 'Gestão da Frota' }).click();
    await expect(page.getByRole('heading', { name: /Gestão da Frota/i })).toBeVisible();

    // Menu: Gestão de Ocorrências
    await page.getByRole('button', { name: 'Gestão de Ocorrências' }).click();
    await expect(page.getByRole('heading', { name: /Gestão de Ocorrências/i })).toBeVisible();

    // Menu: Plano de Preventivas
    await page.getByRole('button', { name: 'Plano de Preventivas' }).click();
    await expect(page.getByRole('heading', { name: /Plano de Manutenção Preventiva/i })).toBeVisible();

    // Menu: Remanejamento
    await page.getByRole('button', { name: 'Remanejamento' }).click();
    await expect(page.getByRole('heading', { name: /Remanejamento de Equipamentos/i })).toBeVisible();
  });

});
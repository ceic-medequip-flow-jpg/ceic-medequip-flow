import { test, expect } from '@playwright/test';

const BASE_URL = 'http://127.0.0.1:8081/index.html';
const USERS = {
  ADMIN: { login: 'TESTE', password: 'tQ4#vB8!nZp7' },
  OPERACIONAL: { login: 'EQUIPE_OPERACIONAL', password: 'oP9!wK3@jRz5' },
  ASSISTENCIAL: { login: '04CC', password: '4001' }
};

test('Fluxo completo com baixa definitiva (anti-fake success)', async ({ page }) => {
  const num = Math.floor(10000 + Math.random() * 90000);
  const pacName = `Paciente Auto ${num}`;
  const tagTeste = `AUTO${Math.floor(1000 + Math.random() * 9000)}`;

  // Preparação
  await page.goto(BASE_URL);
  await expect(page.getByPlaceholder('Digite seu login')).toBeVisible();

  // ADMIN cria equipamento
  await page.getByPlaceholder('Digite seu login').fill(USERS.ADMIN.login);
  await page.getByPlaceholder('Sua senha').fill(USERS.ADMIN.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.getByRole('button', { name: 'Gestão da Frota' }).click();
  await page.getByRole('button', { name: /Adicionar Equipamento/i }).click();
  await page.getByPlaceholder('Ex: EVEN0001').fill(tagTeste);
  await page.getByPlaceholder('Ex: Bennett 840').fill('BOMBA DE INFUSAO');
  await page.getByPlaceholder('Ex: VMI').fill('BOMBA DE INFUSAO');
  await page.getByRole('button', { name: /Salvar Dados/i }).click();
  await expect(page.getByText(/inserido na frota/i)).toBeVisible();
  await page.getByRole('button', { name: /Sair/i }).click();

  // ASSISTENCIAL cria pedido
  await page.getByPlaceholder('Digite seu login').fill(USERS.ASSISTENCIAL.login);
  await page.getByPlaceholder('Sua senha').fill(USERS.ASSISTENCIAL.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.locator('label:has-text("Nome Solicitante") + input').fill('Teste');
  await page.locator('label:has-text("Matrícula") + input').fill('12345');
  await page.locator('label:has-text("Ramal") + input').fill('5432');
  await page.getByPlaceholder('Ex: MV458512').fill(`MV${num}`);
  await page.locator('label:has-text("Nome do Paciente") + input').fill(pacName);
  await page.getByPlaceholder('Ex: 05').fill('15');
  await page.getByText(/Selecione a categoria/i).click();
  await page.getByText(/Equipamentos Gerais/i).click();
  await page.getByText(/Buscar e selecionar equipamento/i).click();
  const opcao = page.getByText('BOMBA DE INFUSAO').last();
  await expect(opcao).toBeVisible();
  await opcao.click({ force: true });
  await page.getByRole('button', { name: /Confirmar Solicitação/i }).click();
  await expect(page.getByText(/Solicitação enviada/i)).toBeVisible();
  await page.reload();
  await expect(page.locator('.border-b', { hasText: pacName })).toBeVisible();
  await page.getByRole('button', { name: /Sair/i }).click();

  // OPERACIONAL aprova/aloca
  await page.getByPlaceholder('Digite seu login').fill(USERS.OPERACIONAL.login);
  await page.getByPlaceholder('Sua senha').fill(USERS.OPERACIONAL.password);
  await page.getByRole('button', { name: 'Entrar' }).click();
  const card = page.locator('.border-b', { hasText: pacName }).first();
  await expect(card).toBeVisible();
  await card.getByText(/Buscar e selecionar TAG/i).click();
  await page.getByPlaceholder('Digite para buscar...').fill(tagTeste);
  const tagOpt = page.getByText(new RegExp(tagTeste, 'i')).last();
  await expect(tagOpt).toBeVisible();
  await tagOpt.click({ force: true });
  await card.locator('button:has-text("Confirmar")').click({ force: true });
  await expect(page.getByText(/vinculado/i)).toBeVisible();
  await page.reload();
  await expect(card.getByText(/Buscar e selecionar TAG/i)).not.toBeVisible();

  // TRIAGEM/EXPURGO
  await page.getByRole('button', { name: /Triagem/i }).click();
  await page.getByText(/Pesquisar TAG/i).click();
  await page.getByPlaceholder('Digite para buscar...').fill(tagTeste);
  const opt2 = page.getByText(new RegExp(tagTeste, 'i')).last();
  await expect(opt2).toBeVisible();
  await opt2.click({ force: true });
  await page.getByRole('button', { name: /Avançar/i }).click();
  await page.locator('button', { hasText: /^SIM$/ }).click();
  await page.locator('button', { hasText: /^NÃO/ }).click();
  await page.getByRole('button', { name: /Confirmar/i }).click();
  await expect(page.getByText(/Baixa concluída/i)).toBeVisible();
  await page.reload();

  // BAIXA DEFINITIVA
  await page.getByRole('button', { name: /Expurgo/i }).click();
  await page.getByPlaceholder('Buscar por TAG').fill(tagTeste);
  await page.getByRole('button', { name: /Liberar Item/i }).click();
  await expect(page.getByText(/liberado/i)).toBeVisible();
  await page.reload();
  await expect(page.locator('.border-b', { hasText: tagTeste })).not.toBeVisible();
});
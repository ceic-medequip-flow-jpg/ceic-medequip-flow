import { expect } from '@playwright/test';

export const TRAINING_RISK_SECURITY =
  'RISCO_CONHECIDO_SEGURANCA: senhas em texto claro devem ser tratadas antes da liberação ampla em produção.';

export function getUser(users, profile) {
  const user = users.find(item => String(item.perfil).toUpperCase() === String(profile).toUpperCase());
  if (!user) throw new Error(`USUARIO_TREINAMENTO_AUSENTE: perfil ${profile} não encontrado no fixture.`);
  return user;
}

export async function loginAs(page, users, profile) {
  const user = getUser(users, profile);
  await page.goto('/');
  await page.getByTestId('login-input').fill(user.login);
  await page.getByTestId('password-input').fill(user.senha);
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
}

export async function logout(page) {
  await closeModalIfVisible(page);
  await page.getByTestId('logout-button').click();
  await expect(page.getByTestId('login-input')).toBeVisible({ timeout: 10000 });
}

export async function clickIfVisible(locator, description) {
  if (!(await locator.first().isVisible().catch(() => false))) {
    console.warn(`MASSA_TREINAMENTO_INDISPONIVEL: ${description}`);
    return false;
  }
  await locator.first().click();
  return true;
}

export async function chooseFirstDropdownOption(page, locator) {
  await locator.click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
}

export async function closeModalIfVisible(page) {
  const modal = page.locator('.modal-overlay').first();
  if (!(await modal.isVisible().catch(() => false))) return;
  const closeOrCancel = modal.getByRole('button', { name: /cancelar|voltar|fechar/i }).first();
  if (await closeOrCancel.isVisible().catch(() => false)) {
    await closeOrCancel.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await modal.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
}

export async function fillTrainingRequest(page, trainingData) {
  const assistencial = trainingData.assistencial;
  await page.getByTestId('request-requester-name').fill(assistencial.requesterName);
  await page.getByTestId('request-requester-badge').fill(assistencial.requesterBadge);
  await page.getByTestId('request-extension').fill(assistencial.extension);
  await page.getByTestId('request-patient-mv').fill(assistencial.patientMV);
  await page.getByTestId('request-patient-name').fill(assistencial.patientName);
  await page.getByTestId('request-patient-bed').fill(assistencial.patientBed);
}

export async function selectTrainingEquipmentFromCatalog(page) {
  await chooseFirstDropdownOption(page, page.getByTestId('request-equipment-type'));
  await expect(page.getByTestId('request-equipment-item')).toBeVisible({ timeout: 5000 });

  const equipmentItem = page.getByTestId('request-equipment-item');
  await equipmentItem.click();
  await page.keyboard.type('monitor multiparam');
  await page.keyboard.press('Enter');
}

export async function findTrainingRequestCard(page, trainingData) {
  const patientName = trainingData.assistencial.patientName;
  const byName = page.getByTestId('request-card').filter({ hasText: patientName }).first();
  if (await byName.isVisible().catch(() => false)) return byName;
  return page.getByTestId('request-card').filter({ hasText: trainingData.assistencial.patientMV }).first();
}

export async function findPendingTrainingCard(page, trainingData) {
  const patientName = trainingData.assistencial.patientName;
  const card = page.getByTestId('pending-request-card').filter({ hasText: patientName }).first();
  if (await card.isVisible().catch(() => false)) return card;
  return page.getByTestId('pending-request-card').first();
}

export async function selectTrainingTagIfPossible(page, scope, tag) {
  const tagControl = scope.getByTestId('equipment-tag-input').first();
  if (!(await tagControl.isVisible().catch(() => false))) {
    console.warn(`MASSA_TREINAMENTO_INDISPONIVEL: controle de TAG ${tag} não visível neste fluxo.`);
    return false;
  }
  await tagControl.click();
  await page.keyboard.type(tag);
  await page.keyboard.press('Enter');
  return true;
}

export async function fillTriageTagIfPossible(page, tag) {
  const visibleTagInput = page.getByPlaceholder(/PESQUISAR TAG|Pesquisar TAG|TAG/i).first();

  if (await visibleTagInput.isVisible().catch(() => false)) {
    await visibleTagInput.fill(tag);
    await page.keyboard.press('Enter');
    return true;
  }

  const anyInput = page.locator('input:visible').first();
  if (await anyInput.isVisible().catch(() => false)) {
    await anyInput.fill(tag);
    await page.keyboard.press('Enter');
    return true;
  }

  console.warn(`MASSA_TREINAMENTO_INDISPONIVEL: campo de TAG da triagem não está disponível para ${tag}.`);
  return false;
}

export async function validateNoManagementWrites(page) {
  const forbiddenTestIds = [
    'create-equipment-button',
    'equipment-edit-button',
    'equipment-delete-test-button'
  ];

  for (const testId of forbiddenTestIds) {
    if (await page.getByTestId(testId).first().isVisible().catch(() => false)) {
      throw new Error(`FRONTEND_PERMISSAO_UI: GESTAO enxergou ação de escrita (${testId}).`);
    }
  }
}

export async function validateTrainingEquipmentIfPresent(page, trainingData) {
  const tag = trainingData.equipment.tag;
  await page.getByTestId('equipment-search-input').fill(tag);
  const row = page.getByTestId('equipment-row').filter({ hasText: tag }).first();
  if (!(await row.isVisible().catch(() => false))) {
    console.warn(`MASSA_TREINAMENTO_INDISPONIVEL: equipamento ${tag} não está cadastrado/renderizado na Gestão da Frota.`);
    await expect(page.getByTestId('equipment-management-screen')).toBeVisible();
    return;
  }

  await expect(row.getByTestId('equipment-real-tag')).toContainText(tag);
  await expect(row.getByTestId('equipment-real-status')).toBeVisible();
  await expect(row).toContainText(trainingData.equipment.location);
}

export async function ensureTrainingEquipmentForDemo(page, trainingData) {
  const defaultTag = trainingData.equipment.tag;
  console.log(`[TREINAMENTO] Verificando equipamento institucional ${defaultTag}`);

  await page.getByTestId('equipment-search-input').fill(defaultTag);
  await page.waitForTimeout(1000);

  const row = page.getByTestId('equipment-row').filter({ hasText: defaultTag }).first();
  if (await row.isVisible().catch(() => false)) {
    console.log('[TREINAMENTO] Equipamento institucional encontrado');
    return { status: 'found-training', tag: defaultTag };
  }

  console.log('[TREINAMENTO] Equipamento institucional não encontrado; usando equipamento real disponível');
  await page.getByTestId('equipment-search-input').fill('');
  await page.waitForTimeout(1000);

  const availableRow = page.getByTestId('equipment-row').filter({ hasText: /Disponível/i }).first();
  
  if (await availableRow.isVisible().catch(() => false)) {
    const realTag = await availableRow.getByTestId('equipment-real-tag').innerText();
    const cleanTag = realTag.trim();
    console.log(`[TREINAMENTO] Equipamento real selecionado para demonstração: ${cleanTag}`);
    return { status: 'found-existing', tag: cleanTag };
  }

  console.warn('MASSA_TREINAMENTO_INDISPONIVEL: nenhum equipamento disponível encontrado para demonstração.');
  console.log('[TREINAMENTO] Nenhum equipamento disponível para demonstração');
  return { status: 'unavailable', tag: null };
}

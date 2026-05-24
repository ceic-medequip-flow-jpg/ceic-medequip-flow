import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  TRAINING_RISK_SECURITY,
  clickIfVisible,
  closeModalIfVisible,
  ensureTrainingEquipmentForDemo,
  fillTriageTagIfPossible,
  fillTrainingRequest,
  findPendingTrainingCard,
  findTrainingRequestCard,
  loginAs,
  logout,
  selectTrainingEquipmentFromCatalog,
  selectTrainingTagIfPossible,
  validateNoManagementWrites,
} from '../helpers/training-actions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../fixtures/users.json'), 'utf8'));
const trainingData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../fixtures/training-data.json'), 'utf8'));
const STEP_DELAY = Number(process.env.CEIC_TRAINING_STEP_DELAY || 1200);

async function stepPause(page) {
  await page.waitForTimeout(STEP_DELAY);
}

async function trainingStep(page, label, callback) {
  console.log(`[TREINAMENTO] ${label}`);
  await callback();
  await stepPause(page);
}

test.describe('Treinamento Operacional Visual CEIC', () => {
  test('fluxo visual de treinamento por perfil', async ({ page }) => {
    test.setTimeout(300000);
    page.setDefaultTimeout(10000);
    page.setDefaultNavigationTimeout(20000);

    console.warn(TRAINING_RISK_SECURITY);

    let demoEquipmentTag = trainingData.equipment.tag;
    let demoObs = [];

    await trainingStep(page, 'Login Assistencial', async () => {
      await loginAs(page, users, trainingData.assistencial.loginProfile);
    });

    await trainingStep(page, 'Criando solicitação de treinamento', async () => {
      await page.getByTestId('nav-nova-solicitacao').click();
      await expect(page.getByTestId('request-form')).toBeVisible();
      await fillTrainingRequest(page, trainingData);
      await selectTrainingEquipmentFromCatalog(page);
      await page.getByTestId('request-submit').click();
      await expect(page.getByTestId('request-success-message')).toBeVisible({ timeout: 10000 });
    });

    await trainingStep(page, 'Solicitação encontrada em Meus Pedidos', async () => {
      await page.getByTestId('nav-meus-pedidos').click();
      const card = await findTrainingRequestCard(page, trainingData);
      await expect(card).toBeVisible({ timeout: 10000 });
      await expect(card.getByTestId('request-status')).toContainText(/PENDENTE|FILA DE ESPERA/i);
    });

    await trainingStep(page, 'Logout Assistencial', async () => {
      await logout(page);
    });

    await trainingStep(page, 'Login Admin/Teste', async () => {
      await loginAs(page, users, 'ADMIN_TESTE');
    });

    await trainingStep(page, 'Validando equipamento de treinamento', async () => {
      await page.getByTestId('nav-equipamentos').click();
      await expect(page.getByTestId('equipment-management-screen')).toBeVisible();
      
      const result = await ensureTrainingEquipmentForDemo(page, trainingData);
      if (result.tag) {
        demoEquipmentTag = result.tag;
      }
      if (result.status === 'found-existing') {
         demoObs.push('Equipamento institucional ausente; usado equipamento real disponível.');
      } else if (result.status === 'unavailable') {
         demoObs.push('Nenhum equipamento disponível para demonstração.');
      }
      await closeModalIfVisible(page);
    });

    await trainingStep(page, 'Logout Admin/Teste', async () => {
      await logout(page);
    });

    await trainingStep(page, 'Login Operacional', async () => {
      await loginAs(page, users, 'OPERACIONAL');
    });

    await trainingStep(page, 'Confirmando solicitação de treinamento', async () => {
      await page.getByTestId('nav-dashboard-operacional').click();
      await expect(page.getByTestId('operational-dashboard')).toBeVisible();

      const card = await findPendingTrainingCard(page, trainingData);
      if (!(await card.isVisible().catch(() => false))) {
        console.warn('MASSA_TREINAMENTO_INDISPONIVEL: solicitação de treinamento não apareceu no dashboard operacional.');
        return;
      }

      await selectTrainingTagIfPossible(page, card, demoEquipmentTag);
      const confirmButton = card.getByTestId('confirm-submit-button').first();
      const directConfirmButton = card.getByTestId('confirm-request-button').first();
      if (await confirmButton.isVisible().catch(() => false)) {
        await confirmButton.click();
      } else if (await directConfirmButton.isVisible().catch(() => false)) {
        await directConfirmButton.click();
      } else {
        console.warn('MASSA_TREINAMENTO_INDISPONIVEL: ação de confirmação não está disponível para a solicitação de treinamento.');
        return;
      }

      await expect(page.locator('[data-testid="request-success-message"], [data-testid="notification-message"]').first())
        .toBeVisible({ timeout: 10000 });
    });

    await trainingStep(page, 'Abrindo Triagem', async () => {
      if (!(await clickIfVisible(page.getByTestId('nav-triagem'), 'menu Triagem / Devolução não visível'))) return;
      await expect(page.locator('main')).toContainText(/Triagem|Devolução|TAG|Equipamento/i);
      await fillTriageTagIfPossible(page, demoEquipmentTag);
    });

    await trainingStep(page, 'Abrindo Expurgo', async () => {
      if (!(await clickIfVisible(page.getByTestId('nav-expurgo'), 'menu Expurgo / Limpeza não visível'))) return;
      await expect(page.locator('main')).toContainText(/Expurgo|Limpeza|Higienização|Equipamento/i);
    });

    await trainingStep(page, 'Fila de Espera se disponível', async () => {
      const waitlistButton = page.getByTestId('waitlist-button').first();
      if (!(await waitlistButton.isVisible().catch(() => false))) {
        console.warn('MASSA_TREINAMENTO_INDISPONIVEL: fila de espera sem massa aplicável para demonstração.');
        demoObs.push('Fila de espera opcional não demonstrada (sem massa).');
      }
    });

    await trainingStep(page, 'Logout Operacional', async () => {
      await logout(page);
    });

    await trainingStep(page, 'Login Gestão', async () => {
      await loginAs(page, users, 'GESTAO');
    });

    await trainingStep(page, 'Validando dashboards', async () => {
      await page.getByTestId('nav-gestao').click();
      await expect(page.getByTestId('management-dashboard')).toBeVisible();
      await expect(page.getByTestId('metrics-card').first()).toBeVisible();
      await page.getByTestId('nav-relatorios').click();
      await expect(page.getByTestId('management-dashboard')).toBeVisible();
      await expect(page.getByRole('button', { name: /Visão Global|Visao Global/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Equipamentos Gerais|Assistência Ventilatória|Assistencia Ventilatoria/i }).first()).toBeVisible();
      await validateNoManagementWrites(page);
    });

    await trainingStep(page, 'Logout Gestão', async () => {
      await logout(page);
    });

    console.log('[TREINAMENTO] Finalizado');
    console.log(`[TREINAMENTO] TAG usada na demonstração: ${demoEquipmentTag || 'indisponível'}`);
    if (demoObs.length > 0) {
      console.log(`[TREINAMENTO] Observações: ${demoObs.join(' | ')}`);
    }
  });
});

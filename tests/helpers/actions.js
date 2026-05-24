import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersPath = path.resolve(__dirname, '../fixtures/users.json');

const SECURITY_MESSAGE = 'PROTECAO_CREDENCIAIS: Ação bloqueada pela política de segurança da auditoria.';
const SECURITY_TERMS = [
  'senha',
  'password',
  'usuario',
  'usuário',
  'user',
  'credencial',
  'acesso',
  'permissao',
  'permissão'
];

const envByProfile = {
  ASSISTENCIAL: ['QA_ASSISTENCIAL_USER', 'QA_ASSISTENCIAL_PASS'],
  OPERACIONAL: ['QA_OPERACIONAL_USER', 'QA_OPERACIONAL_PASS'],
  GESTAO: ['QA_GESTAO_USER', 'QA_GESTAO_PASS'],
  ADMIN_TESTE: ['QA_ADMIN_TESTE_USER', 'QA_ADMIN_TESTE_PASS']
};

let fixtureUsersCache;

function normalizeActionName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function readFixtureUsers() {
  if (!fixtureUsersCache) {
    fixtureUsersCache = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  }
  return fixtureUsersCache;
}

function byTestId(page, testId) {
  return page.getByTestId(testId);
}

async function isVisibleByTestId(page, testId, timeout = 1000) {
  return byTestId(page, testId).first().isVisible({ timeout }).catch(() => false);
}

async function optionalClickByTestId(page, testId, description, timeout = 1000) {
  if (!(await isVisibleByTestId(page, testId, timeout))) {
    console.warn(`FEATURE_NAO_IMPLEMENTADA_OU_NAO_VISIVEL: ${description} (${testId})`);
    return false;
  }
  await byTestId(page, testId).first().click();
  return true;
}

async function selectFirstSearchDropdownOption(page, locator) {
  await locator.click();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
}

async function loginIfNeeded(page, profile) {
  if (!(await isVisibleByTestId(page, 'login-input', 1000))) return;

  const creds = getCreds(profile);
  await byTestId(page, 'login-input').fill(creds.user);
  await byTestId(page, 'password-input').fill(creds.pass);
  await safeClickByTestId(page, 'login-submit');
  await expectVisibleByTestId(page, 'logout-button', 10000);
}

async function closeOpenModalIfAny(page) {
  const modal = page.locator('.modal-overlay').first();
  if (!(await modal.isVisible().catch(() => false))) return;

  const closeButton = modal.locator('button').first();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click();
  }
  await expect(modal).toBeHidden({ timeout: 5000 }).catch(() => {});
}

export function getCreds(profile) {
  const normalizedProfile = String(profile || '').toUpperCase();
  const envKeys = envByProfile[normalizedProfile];

  if (envKeys && process.env[envKeys[0]] && process.env[envKeys[1]]) {
    return { user: process.env[envKeys[0]], pass: process.env[envKeys[1]] };
  }

  const fixtureUser = readFixtureUsers().find(user => String(user.perfil).toUpperCase() === normalizedProfile);
  if (fixtureUser?.login && fixtureUser?.senha) {
    return { user: fixtureUser.login, pass: fixtureUser.senha };
  }

  throw new Error(`CREDENCIAIS_QA_AUSENTES: Defina credenciais para o perfil ${normalizedProfile}.`);
}

export async function safeClickByTestId(page, testId, timeout = 5000) {
  await expectVisibleByTestId(page, testId, timeout);
  await byTestId(page, testId).first().click();
}

export async function expectVisibleByTestId(page, testId, timeout = 5000) {
  const locator = byTestId(page, testId).first();
  await expect(locator, `Elemento obrigatório não visível: ${testId}`).toBeVisible({ timeout });
  return locator;
}

export async function runAction(page, actionName, profile) {
  const normalizedActionName = normalizeActionName(actionName);
  if (SECURITY_TERMS.some(term => normalizedActionName.includes(normalizeActionName(term)))) {
    throw new Error(SECURITY_MESSAGE);
  }

  switch (actionName) {
    case 'login': {
      const creds = getCreds(profile);
      await page.goto('/');
      await byTestId(page, 'login-input').fill(creds.user);
      await byTestId(page, 'password-input').fill(creds.pass);
      await safeClickByTestId(page, 'login-submit');
      await Promise.race([
        byTestId(page, 'logout-button').waitFor({ state: 'visible', timeout: 10000 }),
        byTestId(page, 'nav-nova-solicitacao').waitFor({ state: 'visible', timeout: 10000 }),
        byTestId(page, 'nav-dashboard-operacional').waitFor({ state: 'visible', timeout: 10000 }),
        byTestId(page, 'nav-gestao').waitFor({ state: 'visible', timeout: 10000 }),
        byTestId(page, 'nav-equipamentos').waitFor({ state: 'visible', timeout: 10000 })
      ]);
      break;
    }

    case 'logout':
      await closeOpenModalIfAny(page);
      await safeClickByTestId(page, 'logout-button');
      await expectVisibleByTestId(page, 'login-input', 8000);
      break;

    case 'abrir_nova_solicitacao':
      await safeClickByTestId(page, 'nav-nova-solicitacao');
      await expectVisibleByTestId(page, 'request-form');
      break;

    case 'preencher_dados_solicitante':
      await expectVisibleByTestId(page, 'request-form');
      await byTestId(page, 'request-requester-name').fill(getCreds(profile).user);
      await byTestId(page, 'request-requester-badge').fill(getCreds(profile).user);
      await byTestId(page, 'request-extension').fill(getCreds(profile).user);
      break;

    case 'preencher_dados_paciente':
      await expectVisibleByTestId(page, 'request-form');
      await byTestId(page, 'request-patient-mv').fill('458512');
      await byTestId(page, 'request-patient-name').fill('Maria Betânea');
      await byTestId(page, 'request-patient-bed').fill('05');
      break;

    case 'selecionar_tipo_equipamento':
      await selectFirstSearchDropdownOption(page, byTestId(page, 'request-equipment-type'));
      await expectVisibleByTestId(page, 'request-equipment-item');
      await selectFirstSearchDropdownOption(page, byTestId(page, 'request-equipment-item'));
      break;

    case 'submeter_solicitacao':
      await safeClickByTestId(page, 'request-submit');
      break;

    case 'validar_sucesso_visual_solicitacao':
      await expectVisibleByTestId(page, 'request-success-message', 8000);
      break;

    case 'validar_persistencia_solicitacao':
      await page.reload();
      await loginIfNeeded(page, profile);
      await safeClickByTestId(page, 'nav-meus-pedidos');
      await expectVisibleByTestId(page, 'request-card', 10000);
      await expect(page.getByTestId('request-card').filter({ hasText: 'Maria Betânea' }).first()).toBeVisible({ timeout: 5000 });
      break;

    case 'validar_status_inicial':
      await expectVisibleByTestId(page, 'request-status', 5000);
      await expect(byTestId(page, 'request-status').first()).toContainText(/PENDENTE|FILA DE ESPERA/i);
      break;

    case 'validar_bloqueio_acoes_operacionais':
      if (await isVisibleByTestId(page, 'nav-dashboard-operacional')) {
        throw new Error('FRONTEND_PERMISSAO_UI: O perfil Assistencial enxergou navegação operacional.');
      }
      break;

    case 'abrir_dashboard_operacional':
      await safeClickByTestId(page, 'nav-dashboard-operacional');
      await expectVisibleByTestId(page, 'operational-dashboard');
      break;

    case 'validar_lista_pendentes': {
      const count = await byTestId(page, 'pending-request-card').count();
      if (count === 0) {
        throw new Error('MASSA_REAL_INDISPONIVEL: Não há solicitações reais com status pending para validar a rotina operacional.');
      }
      break;
    }

    case 'selecionar_solicitacao_pendente':
      await expectVisibleByTestId(page, 'pending-request-card');
      await byTestId(page, 'pending-request-card').first().scrollIntoViewIfNeeded();
      break;

    case 'confirmar_solicitacao_com_tag': {
      const card = await expectVisibleByTestId(page, 'pending-request-card');
      const tagInput = card.getByTestId('equipment-tag-input').first();
      const directConfirm = card.getByTestId('confirm-request-button').first();

      if (await tagInput.isVisible().catch(() => false)) {
        await selectFirstSearchDropdownOption(page, tagInput);
        await card.getByTestId('confirm-submit-button').first().click();
      } else if (await directConfirm.isVisible().catch(() => false)) {
        await directConfirm.click();
      } else {
        throw new Error('FRONTEND_UI_SELECTOR_OU_MENU_AUSENTE: Ação de confirmação operacional não encontrada.');
      }
      break;
    }

    case 'validar_status_aprovado':
      await expect(page.locator('[data-testid="pending-request-card"], [data-testid="request-status"]').first()).toBeVisible({ timeout: 5000 });
      break;

    case 'validar_persistencia_confirmacao':
      await page.reload();
      await loginIfNeeded(page, profile);
      await safeClickByTestId(page, 'nav-dashboard-operacional');
      await expectVisibleByTestId(page, 'operational-dashboard');
      break;

    case 'cancelar_solicitacao_com_motivo': {
      const card = await expectVisibleByTestId(page, 'pending-request-card');
      await card.getByTestId('cancel-request-button').first().click();
      await byTestId(page, 'cancel-reason-input').fill('Cancelado via Teste E2E');
      await page.locator('.modal-overlay').getByPlaceholder('Nome do profissional').fill('QA Operacional');
      await page.locator('.modal-overlay').getByPlaceholder(/12345|matr/i).fill('11111');
      await safeClickByTestId(page, 'cancel-submit-button');
      break;
    }

    case 'validar_status_cancelado':
      await expect(page.locator('[data-testid="request-success-message"], [data-testid="notification-message"]').first()).toBeVisible({ timeout: 8000 });
      break;

    case 'testar_fila_espera_se_disponivel': {
      const waitlistButton = byTestId(page, 'waitlist-button').first();
      if (!(await waitlistButton.isVisible().catch(() => false))) {
        console.warn('FEATURE_NAO_IMPLEMENTADA_OU_NAO_VISIVEL: Fila de espera indisponível para a massa atual.');
        break;
      }
      await waitlistButton.click();
      break;
    }

    case 'testar_triagem_se_disponivel':
      await optionalClickByTestId(page, 'nav-triagem', 'Triagem não disponível para este perfil ou ambiente');
      break;

    case 'testar_expurgo_se_disponivel':
      await optionalClickByTestId(page, 'nav-expurgo', 'Expurgo não disponível para este perfil ou ambiente');
      break;

    case 'abrir_dashboard_gestao':
      await safeClickByTestId(page, 'nav-gestao');
      await expectVisibleByTestId(page, 'management-dashboard');
      break;

    case 'validar_cards_metricas': {
      const count = await byTestId(page, 'metrics-card').count();
      if (count === 0) {
        throw new Error('FRONTEND_UI_SELECTOR_OU_MENU_AUSENTE: Cards de métricas não encontrados.');
      }
      break;
    }

    case 'testar_filtros_se_disponivel':
      await optionalClickByTestId(page, 'report-filter', 'Filtros gerenciais indisponíveis');
      break;

    case 'validar_leitura_dados': {
      const cards = await byTestId(page, 'report-card').count();
      const metrics = await byTestId(page, 'metrics-card').count();
      if (cards === 0 && metrics === 0) {
        throw new Error('FRONTEND_UI_SELECTOR_OU_MENU_AUSENTE: Dados gerenciais de leitura não carregados.');
      }
      break;
    }

    case 'validar_bloqueio_escrita': {
      const forbiddenTestIds = [
        'create-equipment-button',
        'equipment-edit-button',
        'equipment-delete-test-button'
      ];
      for (const testId of forbiddenTestIds) {
        if (await isVisibleByTestId(page, testId)) {
          throw new Error(`FRONTEND_PERMISSAO_UI: Perfil GESTAO enxergou ação administrativa de escrita (${testId}).`);
        }
      }

      const forbiddenButtons = page.getByRole('button').filter({
        hasText: /gest[aã]o de usu[aá]rios|gest[aã]o de utilizadores|usu[aá]rio|utilizador|senha|alterar senha|permiss[aã]o/i
      });
      if (await forbiddenButtons.first().isVisible().catch(() => false)) {
        throw new Error('FRONTEND_PERMISSAO_UI: Perfil GESTAO enxergou ação de usuários, senha ou permissões.');
      }
      break;
    }

    case 'abrir_gestao_equipamentos_se_disponivel':
      await safeClickByTestId(page, 'nav-equipamentos');
      await expectVisibleByTestId(page, 'equipment-management-screen');
      break;

    case 'buscar_equipamento':
      await byTestId(page, 'equipment-search-input').fill('');
      await expectVisibleByTestId(page, 'equipment-row', 8000);
      break;

    case 'selecionar_equipamento_existente':
      await expectVisibleByTestId(page, 'equipment-row', 8000);
      await byTestId(page, 'equipment-row').first().scrollIntoViewIfNeeded();
      break;

    case 'validar_dados_equipamento_real': {
      const row = await expectVisibleByTestId(page, 'equipment-row', 8000);
      await expect(row.getByTestId('equipment-real-tag')).not.toHaveText('', { timeout: 5000 });
      await expect(row.getByTestId('equipment-real-status')).toBeVisible();
      await expect(row.getByTestId('equipment-real-location')).toBeVisible();
      break;
    }

    case 'editar_equipamento_real_se_permitido': {
      const row = await expectVisibleByTestId(page, 'equipment-row', 8000);
      const editButton = row.getByTestId('equipment-edit-button').first();
      if (!(await editButton.isVisible().catch(() => false))) {
        throw new Error('MASSA_REAL_INDISPONIVEL: Não há ação de edição visível para equipamento real.');
      }
      await editButton.click();
      await expectVisibleByTestId(page, 'equipment-form', 5000);
      await safeClickByTestId(page, 'equipment-save-button');
      await expect(page.locator('[data-testid="request-success-message"], [data-testid="notification-message"]').first()).toBeVisible({ timeout: 8000 });
      await closeOpenModalIfAny(page);
      break;
    }

    case 'criar_equipamento_teste_se_disponivel':
      throw new Error('MASSA_REAL_INDISPONIVEL: Auditoria real não cria equipamento novo nem gera TAG fictícia.');
      break;

    case 'editar_equipamento_teste_se_disponivel':
      throw new Error('MASSA_REAL_INDISPONIVEL: Auditoria real não edita equipamento fictício de teste.');
      break;

    case 'validar_equipamento_teste_se_criado':
      throw new Error('MASSA_REAL_INDISPONIVEL: Auditoria real não valida equipamento fictício criado.');
      break;

    case 'remover_dados_teste_se_criado':
      throw new Error('MASSA_REAL_INDISPONIVEL: Auditoria real não remove equipamento histórico.');
      break;

    default:
      throw new Error(`SELETOR_FRAGIL_OU_DESATUALIZADO: A ação '${actionName}' não possui implementação segura em actions.js.`);
  }
}

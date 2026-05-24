import { test, expect } from '@playwright/test';
import { recordAction, captureSupabaseError, generateReports, setCurrentStep } from '../helpers/operational-audit-actions.js';

test.describe.configure({ mode: 'serial' });
test.use({ launchOptions: { slowMo: parseInt(process.env.CEIC_TRAINING_STEP_DELAY || '700') } });

import fs from 'fs';
import path from 'path';

// --- HELPER FUNCTIONS ---

async function safeAction(perfil, tela, acao, callback) {
  setCurrentStep(perfil, tela, acao);
  try {
    await callback();
    recordAction(perfil, tela, acao, 'OK');
  } catch (error) {
    if (error.message.startsWith('MASSA_INDISPONIVEL:')) {
       recordAction(perfil, tela, acao, 'MASSA_INDISPONIVEL', error.message.replace('MASSA_INDISPONIVEL:', '').trim());
    } else if (error.message.startsWith('OPERACAO_NAO_PERSISTIU:')) {
       recordAction(perfil, tela, acao, 'OPERACAO_NAO_PERSISTIU', error.message.replace('OPERACAO_NAO_PERSISTIU:', '').trim());
    } else if (acao === 'Acesso' && tela === 'Login') {
       recordAction(perfil, tela, acao, `FALHA_TECNICA_LOGIN_PERFIL_${perfil.toUpperCase()}`, error.message);
    } else {
       recordAction(perfil, tela, acao, 'FALHA_TECNICA', error.message);
    }
  }
}

async function selectSearchDropdown(page, wrapperTestId, searchText, optionText) {
  const wrapper = page.getByTestId(wrapperTestId).first();
  await expect(wrapper).toBeVisible({ timeout: 5000 });
  await wrapper.click();

  const searchInput = page.locator('input[placeholder="Digite para buscar..."]').last();
  await expect(searchInput).toBeVisible({ timeout: 5000 });
  await searchInput.fill(searchText);

  const option = page.getByText(optionText, { exact: false }).last();
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();
}

async function preencherModalCancelamento(page) {
  const modal = page.locator('.modal-overlay, div[role="dialog"]').first();
  await expect(modal).toBeVisible({ timeout: 10000 });

  const motivo = modal.locator('textarea').first();
  await motivo.fill('Cancelado automaticamente pela Verificacao E2E');

  const nome = modal.locator('input[placeholder*="Nome"]').first();
  if (await nome.isVisible().catch(() => false)) {
    await nome.fill('QA Operacional');
  } else {
    const inputs = modal.locator('input');
    await inputs.nth(0).fill('QA Operacional');
  }

  const matricula = modal.locator('input[placeholder*="12345"], input[placeholder*="Matrícula"], input[placeholder*="Matricula"]').first();
  if (await matricula.isVisible().catch(() => false)) {
    await matricula.fill('11111');
  } else {
    const inputs = modal.locator('input');
    await inputs.nth(1).fill('11111');
  }

  await modal.getByRole('button', { name: /Confirmar/i }).click();
}

async function loginPerfil(page, perfilKey) {
  console.log(`[AUDITORIA] tentando login perfil ${perfilKey}`);
  
  const usersPath = path.resolve(process.cwd(), 'tests/fixtures/users.json');
  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const user = usersData.find(u => u.perfil === perfilKey);
  
  if (!user) throw new Error(`Usuário não encontrado no users.json para perfil: ${perfilKey}`);

  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5173');
  
  const logoutBtn = page.getByTestId('logout-button');
  if (await logoutBtn.isVisible().catch(() => false)) {
    await logoutBtn.click();
  }

  const loginInput = page.getByTestId('login-input');
  if (await loginInput.count() > 0) {
    await loginInput.fill(user.login);
    await page.getByTestId('password-input').fill(user.senha);
    await page.getByTestId('login-submit').click();
  } else {
    throw new Error('TestID login-input não encontrado na tela.');
  }
  
  await expect(page.getByTestId('logout-button')).toBeVisible({ timeout: 10000 });
  
  // Valida o menu dependendo do perfil
  if (perfilKey === 'ASSISTENCIAL') {
    await expect(page.getByTestId('nav-nova-solicitacao').first()).toBeVisible({ timeout: 5000 });
  } else if (perfilKey === 'OPERACIONAL') {
    await expect(page.getByTestId('nav-dashboard-operacional').first()).toBeVisible({ timeout: 5000 });
  } else if (perfilKey === 'GESTAO') {
    await expect(page.getByTestId('nav-relatorios').first()).toBeVisible({ timeout: 5000 });
  } else if (perfilKey === 'ADMIN_TESTE') {
    await expect(page.getByTestId('nav-equipamentos').first()).toBeVisible({ timeout: 5000 });
  }

  console.log(`[AUDITORIA] login perfil ${perfilKey} concluído`);
}

let hasAborted = false;

async function isPageClosed(page) {
  if (hasAborted) return true;
  if (page.isClosed()) {
    hasAborted = true;
    recordAction('Global', 'Execução', 'Checagem de Página', 'FALHA_TECNICA', 'Target page was closed (AUDITORIA_ABORTADA_OU_BROWSER_FECHADO)');
    return true;
  }
  return false;
}

// Global Supabase Error Hook setup
test.beforeEach(async ({ page }) => {
  page.on('response', async response => {
    const url = response.url();
    if (url.includes('rest/v1') || url.includes('supabase')) {
      const status = response.status();
      if (status >= 400) {
        try {
          const req = response.request();
          const method = req.method();
          const postData = req.postData() || '';
          const respBody = await response.text();
          captureSupabaseError(url, method, status, postData, respBody);
        } catch (e) {
          console.error('Failed to capture supabase error details', e);
        }
      }
    }
  });
});

test.afterAll(() => {
  generateReports();
});

// --- PERFIS ---

test('1. Perfil Assistencial - Fluxos permitidos', async ({ page }) => {
  test.setTimeout(300000); // 5 minutos de timeout pro perfil
  if (await isPageClosed(page)) return;

  await safeAction('Assistencial', 'Login', 'Acesso', async () => {
    await loginPerfil(page, 'ASSISTENCIAL');
  });

  await safeAction('Assistencial', 'Permissões', 'Visualiza Dashboard Operacional', async () => {
    const operNav = page.getByTestId('nav-dashboard-operacional');
    if (await operNav.count() > 0) {
      recordAction('Assistencial', 'Permissões', 'Visualiza Dashboard Operacional', 'VIOLACAO_PERMISSAO_UI', 'Assistencial está vendo menu admin');
    } else {
      recordAction('Assistencial', 'Permissões', 'Menus Ocultos', 'BLOQUEADO_CORRETAMENTE');
    }
  });

  await safeAction('Assistencial', 'Nova Solicitação', 'Acesso Form', async () => {
    await page.getByTestId('nav-nova-solicitacao').click();
    await expect(page.getByTestId('request-form')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('request-requester-name').fill('VERIFICACAO CEIC');
    await page.getByTestId('request-requester-badge').fill('VERIFICACAO CEIC');
    await page.getByTestId('request-extension').fill('0000');
    
    const mvInput = page.getByTestId('request-patient-mv');
    if (await mvInput.count() > 0) await mvInput.fill('MV-VERIFICACAO-CEIC');
    
    const nameInput = page.getByTestId('request-patient-name');
    if (await nameInput.count() > 0) await nameInput.fill('PACIENTE VERIFICACAO CEIC');
    
    await page.getByTestId('request-patient-bed').fill('98');
  });

  await safeAction('Assistencial', 'Nova Solicitação', 'Dropdown e Terapia a Vácuo', async () => {
    await selectSearchDropdown(page, 'request-equipment-type', 'Equipamentos Gerais', 'Equipamentos Gerais');

    try {
      await selectSearchDropdown(page, 'request-equipment-item', 'Bomba de Terapia a Vácuo', 'TERAPIA');
    } catch (e) {
      recordAction('Assistencial', 'Nova Solicitação', 'Busca Terapia a Vácuo', 'ERRO_TERAPIA_VACUO_AINDA_FALHA', 'Falha ao encontrar/clicar terapia a vacuo. Fallback.');
      // Fallback para continuar
      const equipItemLocator = page.locator('div[data-testid="request-equipment-item"] input');
      await equipItemLocator.click();
      await equipItemLocator.fill('');
      const fallbackItem = page.locator('text=BOMBA DE INFUSAO').first();
      await expect(fallbackItem).toBeVisible({ timeout: 3000 });
      await fallbackItem.click();
    }
    
    await page.getByTestId('request-submit').click();
    await expect(page.getByTestId('request-success-message')).toBeVisible({ timeout: 8000 });
  });

  await safeAction('Assistencial', 'Meus Pedidos', 'Persistência de Solicitação', async () => {
    await page.getByTestId('nav-meus-pedidos').click();
    await page.reload();
    
    // Procura por multiplas chaves
    const encontrouNaUi = 
      await page.getByText(/PACIENTE VERIFICACAO CEIC/i).first().isVisible().catch(() => false)
      || await page.getByText(/MV-VERIFICACAO-CEIC/i).first().isVisible().catch(() => false)
      || await page.getByText(/TERAPIA A VACUO|TERAPIA À VÁCUO|EQUIPAMENTO DE TERAPIA/i).first().isVisible().catch(() => false)
      || await page.getByTestId('request-card').filter({ hasText: /PACIENTE VERIFICACAO|TERAPIA|PENDENTE/i }).first().isVisible().catch(() => false);
    
    if (!encontrouNaUi) {
      // Se não achar na UI, verifica no banco de dados
      const { createClient } = require('@supabase/supabase-js');
      const supabase = createClient(process.env.VITE_SUPABASE_URL || 'https://mock.supabase.co', process.env.VITE_SUPABASE_ANON_KEY || 'mock');
      const { data } = await supabase.from('pedidos').select('*').ilike('patientname', '%VERIFICACAO%').order('timestamp', { ascending: false }).limit(1);
      
      if (data && data.length > 0) {
        throw new Error('PERSISTIU_NO_BANCO_MAS_NAO_APARECEU_NA_UI: Pedido existe no banco mas não renderizou na tela (Falha de Filtro/UI).');
      } else {
        throw new Error('OPERACAO_NAO_PERSISTIU: Solicitação criada visualmente não apareceu em Meus Pedidos após reload e não está no banco.');
      }
    }
  });

  await safeAction('Assistencial', 'Equipamentos Área', 'Acesso', async () => {
    const btnArea = page.getByRole('button', { name: /Equipamentos na Minha/i }).first();
    if (await btnArea.count() > 0) {
      await btnArea.click();
      await expect(page.locator('text=Minha Área').first()).toBeVisible({ timeout: 5000 });
    } else {
      throw new Error('MASSA_INDISPONIVEL: Botão não encontrado');
    }
  });
});

test('2. Perfil Operacional - Fluxos permitidos', async ({ page }) => {
  test.setTimeout(300000);
  if (await isPageClosed(page)) return;

  await safeAction('Operacional', 'Login', 'Acesso', async () => {
    await loginPerfil(page, 'OPERACIONAL');
  });

  await safeAction('Operacional', 'Dashboard', 'Tratativa e Persistência de Cancelamento', async () => {
    await page.getByTestId('nav-dashboard-operacional').click();
    
    const pedido = page.locator('text=MV-VERIFICACAO-CEIC').first();
    try {
      await expect(pedido).toBeVisible({ timeout: 5000 });
      const btnCancel = page.locator('button:has-text("Cancelar")').first();
      
      if (await btnCancel.count() > 0) {
         await btnCancel.click();
         
         try {
           await preencherModalCancelamento(page);
         } catch (e) {
           throw new Error(`Falha ao preencher/confirmar modal de cancelamento: ${e.message}`);
         }
         
         // Validacao de persistência (recarregar e ver se sumiu)
         await page.waitForTimeout(1000); // Wait briefly for DB to register
         await page.reload();
         const pedidoPosReload = page.locator('text=MV-VERIFICACAO-CEIC').first();
         if (await pedidoPosReload.isVisible({ timeout: 5000 }).catch(() => false)) {
            throw new Error('OPERACAO_NAO_PERSISTIU: O pedido voltou para a tela após recarregar.');
         }
      } else {
         recordAction('Operacional', 'Dashboard', 'Cancelar', 'MASSA_INDISPONIVEL', 'Botão cancelar não visível');
      }
    } catch (e) {
      if (e.message.includes('OPERACAO_NAO_PERSISTIU')) throw e;
      recordAction('Operacional', 'Dashboard', 'Tratativa', 'MASSA_INDISPONIVEL', `Pedido MV-VERIFICACAO não encontrado para cancelar. ${e.message}`);
    }
  });

  await safeAction('Operacional', 'Estoque Central', 'Acesso', async () => {
    const btnEstoque = page.getByRole('button', { name: /Estoque Central/i }).first();
    if (await btnEstoque.count() > 0) {
      await btnEstoque.click();
      await expect(page.locator('text=Estoque Central').first()).toBeVisible({ timeout: 5000 });
    }
  });

  await safeAction('Operacional', 'Triagem e Expurgo', 'Acesso', async () => {
    const navTriagem = page.getByTestId('nav-triagem');
    if (await navTriagem.count() > 0) await navTriagem.click();
    
    const navExpurgo = page.getByTestId('nav-expurgo');
    if (await navExpurgo.count() > 0) await navExpurgo.click();
  });
});

test('3. Perfil Gestão - Leitura e bloqueios', async ({ page }) => {
  test.setTimeout(300000);
  if (await isPageClosed(page)) return;

  await safeAction('Gestão', 'Login', 'Acesso', async () => {
    await loginPerfil(page, 'GESTAO');
  });

  await safeAction('Gestão', 'Painel Gerencial', 'Indicadores', async () => {
    const navInd = page.getByTestId('nav-relatorios');
    if (await navInd.count() > 0) {
       await navInd.click();
    }
  });

  await safeAction('Gestão', 'Permissões', 'Bloqueio de Frota', async () => {
    const navFrota = page.getByTestId('nav-equipamentos');
    if (await navFrota.count() > 0) {
      recordAction('Gestão', 'Permissões', 'Ver Gestão Frota', 'VIOLACAO_PERMISSAO_UI', 'Gestão não deve acessar nav-equipamentos');
    } else {
      recordAction('Gestão', 'Permissões', 'Bloqueio Gestão Frota', 'BLOQUEADO_CORRETAMENTE');
    }
  });
});

test('4. Perfil Admin/Teste - Gestão sem ações destrutivas', async ({ page }) => {
  test.setTimeout(300000);
  if (await isPageClosed(page)) return;

  await safeAction('Admin', 'Login', 'Acesso', async () => {
    await loginPerfil(page, 'ADMIN_TESTE');
  });

  await safeAction('Admin', 'Gestão da Frota', 'Busca', async () => {
    const navFrota = page.getByTestId('nav-equipamentos');
    if (await navFrota.count() > 0) {
      await navFrota.click();
      const searchInput = page.locator('input[placeholder*="Buscar"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('TAG-VERIFICACAO-FALSA');
      }
    } else {
      throw new Error('MASSA_INDISPONIVEL: Sem botão nav-equipamentos');
    }
  });
});

test('5. Responsividade essencial', async ({ page }) => {
  test.setTimeout(300000);
  if (await isPageClosed(page)) return;

  await safeAction('Global', 'Responsividade', 'Viewports', async () => {
    await page.goto('http://localhost:5173');
    const viewports = [
      { name: 'Mobile Pequeno', width: 375, height: 667 },
      { name: 'Mobile Grande', width: 430, height: 932 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Notebook', width: 1366, height: 768 }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      const hasHorizontalOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 5;
      });

      if (hasHorizontalOverflow) {
        recordAction('Global', 'Responsividade', `Viewport ${vp.name}`, 'AINDA_FALHA', `Detectado scroll horizontal indevido`);
      }
    }
  });
});

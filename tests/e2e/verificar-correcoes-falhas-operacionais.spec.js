import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loginAs, logout, fillRequestData } from '../helpers/verification-actions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const users = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../fixtures/users.json'), 'utf8'));

test.describe('Verificação de Correções Operacionais', () => {
  
  test('Executar verificação de falhas e gerar relatório', async ({ page }, testInfo) => {
    test.setTimeout(300000);
    const results = [];
    let lastSupabaseError = null;
    let lastPedidoPatchResponse = null;
    const outDir = path.resolve(__dirname, '../../qa-reports/latest');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    page.on('response', async (response) => {
      if (response.url().includes('supabase') && response.status() >= 400) {
        try {
          const body = await response.json();
          lastSupabaseError = {
            url: response.url(),
            status: response.status(),
            method: response.request().method(),
            payload: response.request().postDataJSON(),
            responseBody: body
          };
        } catch(e) {}
      }
      if (response.url().includes('supabase') && response.url().includes('/pedidos') && response.request().method() === 'PATCH' && response.status() < 400) {
        try {
          lastPedidoPatchResponse = await response.json();
        } catch(e) {}
      }
    });

    function recordResult(nome, perfil, status, errorDetails) {
      results.push({ nome, perfil, status, dados: errorDetails });
      console.log(`\n[VERIFICAÇÃO] ${nome} -> ${status}`);
      if (errorDetails?.detalhe) console.log(`Detalhes: ${errorDetails.detalhe}`);
      else if (errorDetails?.message) console.log(`Detalhes: ${errorDetails.message}`);
    }

    async function selectOpenDropdownOptionByText(text) {
      const openDropdown = page.locator('.absolute').filter({ hasText: text }).last();
      await expect(openDropdown).toBeVisible({ timeout: 5000 });
      await openDropdown.getByText(text, { exact: true }).last().click();
    }

    // PASSO 1: Obter TAGs reais
    let tagForAlloc = null;
    let tagForReturn = null;
    
    await test.step('Obter TAGs reais', async () => {
      await loginAs(page, users, 'OPERACIONAL');
      await page.getByRole('button', { name: /Estoque Central/i }).click();
      await page.waitForTimeout(2000);
      
      const rows = page.locator('tbody tr');
      if (await rows.count() > 0) {
        const availableRows = rows.filter({ hasText: 'Disponível' }).filter({ hasText: 'MONITOR' });
        if (await availableRows.count() > 0) {
          tagForAlloc = await availableRows.nth(0).locator('td').nth(0).innerText();
        } else {
          const anyAvail = rows.filter({ hasText: 'Disponível' });
          if (await anyAvail.count() > 0) {
             tagForAlloc = await anyAvail.nth(0).locator('td').nth(0).innerText();
          }
        }
        
        const validReturnRows = rows.filter({ hasNotText: /higienização|manutenção|preventiva/i });
        if (await validReturnRows.count() > 0) {
          tagForReturn = await validReturnRows.nth(0).locator('td').nth(0).innerText();
        }
      }
      
      tagForAlloc = tagForAlloc?.replace(/[^a-zA-Z0-9]/g, '');
      tagForReturn = tagForReturn?.replace(/[^a-zA-Z0-9]/g, '');
      await logout(page);
    });

    // PASSO 2: Assistencial cria pedidos
    await test.step('Assistencial cria pedidos', async () => {
      await loginAs(page, users, 'ASSISTENCIAL');
      
      // ERRO 3
      let error3Status = 'AINDA_FALHA';
      let error3Details = {};
      const vacuumSearchTerm = 'Bomba de Terapia a Vácuo';
      const officialVacuumEquipment = 'EQUIPAMENTO DE TERAPIA À VÁCUO';
      try {
        await page.getByTestId('nav-nova-solicitacao').click();
        await fillRequestData(page);
        await page.getByTestId('request-equipment-type').click();
        await selectOpenDropdownOptionByText('Equipamentos Gerais');
        
        await page.getByTestId('request-equipment-item').click();
        await page.keyboard.type(vacuumSearchTerm);
        await page.waitForTimeout(500);

        const emptyCatalogMessage = page.getByText('Nenhum item encontrado.', { exact: true });
        if (await emptyCatalogMessage.isVisible().catch(() => false)) {
          error3Status = 'AINDA_FALHA';
          const screenshotPath = path.join(outDir, 'ERRO_3_AINDA_FALHA-catalogo-terapia-vacuo.png');
          await page.screenshot({ path: screenshotPath, fullPage: true });
          await testInfo.attach('ERRO_3_AINDA_FALHA-catalogo-terapia-vacuo', {
            path: screenshotPath,
            contentType: 'image/png'
          });

          error3Details = {
            message: 'ERRO_3_AINDA_FALHA: busca/alias incompatível com o nome oficial do catálogo.',
            classificacao: 'CATALOGO_ALIAS_OU_BUSCA_INCOMPATIVEL',
            detalhe: 'Item oficial não encontrado pela busca usando o termo comum na categoria Equipamentos Gerais.',
            equipamentoPesquisado: vacuumSearchTerm,
            equipamentoOficialEsperado: officialVacuumEquipment,
            categoriaSelecionada: 'Equipamentos Gerais',
            screenshot: screenshotPath,
            trace: 'Trace Playwright capturado pelo projeto porque use.trace está configurado como "on" em playwright.config.js.'
          };
          await page.keyboard.press('Escape');
        } else {
          await page.keyboard.press('ArrowDown');
          await page.keyboard.press('Enter');
          
          lastSupabaseError = null;
          await page.getByTestId('request-submit').click();
          
          try {
            await expect(page.getByTestId('request-success-message')).toBeVisible({ timeout: 5000 });
            await page.reload();
            await loginAs(page, users, 'ASSISTENCIAL');
            await page.getByTestId('nav-meus-pedidos').click();
            const persistedRequest = page.getByTestId('request-card')
              .filter({ hasText: 'PACIENTE VERIFICACAO' })
              .filter({ hasText: /BOMBA DE TERAPIA A V[ÁA]CUO|EQUIPAMENTO DE TERAPIA [ÀA] V[ÁA]CUO/i })
              .first();
            await expect(persistedRequest).toBeVisible({ timeout: 10000 });
            error3Status = 'CORRIGIDO';
            error3Details = { message: 'Solicitação criada e persistida após reload' };
          } catch(e) {
            error3Details = lastSupabaseError 
              ? { message: 'Erro Supabase detectado', supabase: lastSupabaseError }
              : { message: 'Solicitação não foi confirmada/persistida', erro: e.message };
          }
        }
      } catch (e) {
        error3Details = { message: e.message };
      }
      recordResult('ERRO 3 (Terapia a Vácuo)', 'ASSISTENCIAL', error3Status, error3Details);
      
      // Create 3 more generic requests
      for (let i=0; i<3; i++) {
        await page.getByTestId('nav-nova-solicitacao').click();
        await fillRequestData(page);
        await page.getByTestId('request-equipment-type').click();
        await selectOpenDropdownOptionByText('Equipamentos Gerais');
        await page.getByTestId('request-equipment-item').click();
        await page.keyboard.type('Monitor Multiparam');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Enter');
        
        const accessory = page.locator('label').filter({ hasText: 'Cabo ECG' });
        if (await accessory.isVisible().catch(()=>false)) await accessory.click();
        
        await page.getByTestId('request-submit').click();
        await page.waitForTimeout(1000);
      }
      await logout(page);
    });

    // PASSO 3: Operacional valida erros 4, 1, 2, 5
    await test.step('Operacional valida rotinas', async () => {
      await loginAs(page, users, 'OPERACIONAL');
      
      await page.getByTestId('nav-dashboard-operacional').click();
      await page.waitForTimeout(2000);

      // ERRO 4
      let error4Status = 'AINDA_FALHA';
      let error4Details = {};
      try {
        const card = page.getByTestId('pending-request-card').filter({ hasText: 'PACIENTE VERIFICACAO' }).first();
        if (await card.isVisible()) {
          const reqId = await card.locator('.font-mono').first().innerText();
          lastSupabaseError = null;
          lastPedidoPatchResponse = null;
          await card.locator('button', { hasText: 'Notificar' }).click();
          await page.locator('.modal-overlay button', { hasText: 'Equipamento Indisponível' }).click();
          await page.waitForTimeout(1000);
          
          if (lastSupabaseError) {
            error4Details = { message: 'Erro Supabase', supabase: lastSupabaseError };
          } else {
            const successMsg = page.getByTestId('request-success-message');
            if (await successMsg.isVisible().catch(()=>false)) {
              await page.reload();
              await page.waitForTimeout(2000);
              const cardReloaded = page.getByTestId('pending-request-card').filter({ hasText: reqId }).first();
              const notificationPersisted = await cardReloaded.locator('text=Mensagem da CEIC').isVisible({ timeout: 5000 }).catch(() => false) ||
                await cardReloaded.locator('text=FILA DE ESPERA').isVisible({ timeout: 5000 }).catch(() => false);
              const notificationPersistedInPatch = Array.isArray(lastPedidoPatchResponse) &&
                lastPedidoPatchResponse.some(row => row.notificationmessage && row.notificationtype && row.notificationtime);
              if (notificationPersisted || notificationPersistedInPatch) {
                error4Status = 'CORRIGIDO';
                error4Details = notificationPersisted
                  ? { message: 'Notificação persistiu após reload' }
                  : { message: 'Notificação persistida no Supabase com colunas lowercase', patchResponse: lastPedidoPatchResponse };
              } else {
                error4Details = { message: 'Notificação não persistiu após reload', patchResponse: lastPedidoPatchResponse };
              }
            } else {
              const errorToast = page.getByTestId('notification-message');
              const toastText = await errorToast.innerText({ timeout: 3000 }).catch(() => '');
              error4Details = { message: toastText || 'Mensagem de sucesso não apareceu' };
            }
          }
        } else {
          error4Status = 'MASSA_INDISPONIVEL';
          error4Details = { message: 'Card não encontrado' };
        }
      } catch (e) { error4Details = { message: e.message }; }
      recordResult('ERRO 4 - Notificação falha', 'OPERACIONAL', error4Status, error4Details);

      // ERRO 1
      let error1Status = 'AINDA_FALHA';
      let error1Details = {};
      try {
        const card = page.getByTestId('pending-request-card').filter({ hasText: 'PACIENTE VERIFICACAO' }).filter({ hasNotText: 'Mensagem da CEIC' }).first();
        if (await card.isVisible()) {
          const reqId = await card.locator('.font-mono').first().innerText();
          await card.getByTestId('cancel-request-button').click();
          await page.getByTestId('cancel-reason-input').fill('Cancelado via Teste E2E');
          await page.locator('.modal-overlay input[placeholder="Nome do profissional"]').fill('QA Operacional');
          await page.locator('.modal-overlay input[placeholder="Ex: 12345"]').fill('11111');
          
          lastSupabaseError = null;
          await page.getByTestId('cancel-submit-button').click();
          await page.waitForTimeout(1000);
          
          if (lastSupabaseError) {
            error1Details = { message: 'Erro Supabase', supabase: lastSupabaseError };
          } else {
            await page.reload();
            await page.waitForTimeout(2000);
            const cardReloaded = page.getByTestId('pending-request-card').filter({ hasText: reqId });
            if (await cardReloaded.isVisible()) {
              error1Details = { message: 'Solicitação voltou após o reload' };
            } else {
              error1Status = 'CORRIGIDO';
            }
          }
        } else {
          error1Status = 'MASSA_INDISPONIVEL';
          error1Details = { message: 'Card não encontrado para cancelamento' };
        }
      } catch (e) { error1Details = { message: e.message }; }
      recordResult('ERRO 1 - Cancelamento não remove solicitação', 'OPERACIONAL', error1Status, error1Details);

      // ERRO 2
      let error2Status = 'AINDA_FALHA';
      let error2Details = {};
      try {
        if (tagForAlloc) {
          const card = page.getByTestId('pending-request-card').filter({ hasText: 'PACIENTE VERIFICACAO' }).filter({ hasNotText: 'Mensagem da CEIC' }).first();
          if (await card.isVisible()) {
            const reqId = await card.locator('.font-mono').first().innerText();
            await card.getByTestId('equipment-tag-input').click();
            await page.keyboard.type(tagForAlloc);
            await page.keyboard.press('Enter');
            
            lastSupabaseError = null;
            await card.getByTestId('confirm-submit-button').click();
            await page.waitForTimeout(1500);
            
            if (lastSupabaseError) {
              error2Details = { message: 'Erro Supabase', supabase: lastSupabaseError };
            } else {
              await page.reload();
              await page.waitForTimeout(2000);
              const cardReloaded = page.getByTestId('pending-request-card').filter({ hasText: reqId });
              if (await cardReloaded.isVisible()) {
                error2Details = { message: 'Solicitação voltou após o reload' };
              } else {
                error2Status = 'CORRIGIDO';
              }
            }
          } else {
            error2Status = 'MASSA_INDISPONIVEL';
            error2Details = { message: 'Card não encontrado para alocação' };
          }
        } else {
          error2Status = 'MASSA_INDISPONIVEL';
          error2Details = { message: 'Nenhuma TAG disponível' };
        }
      } catch (e) { error2Details = { message: e.message }; }
      recordResult('ERRO 2 - Alocação não persiste', 'OPERACIONAL', error2Status, error2Details);

      // ERRO 5
      let error5Status = 'AINDA_FALHA';
      let error5Details = {};
      try {
        if (tagForReturn) {
          const triageNav = page.getByTestId('nav-triagem');
          if (await triageNav.isVisible({ timeout: 5000 }).catch(() => false)) {
            await triageNav.click({ timeout: 5000 });
            const triageInput = page.getByPlaceholder(/PESQUISAR TAG|TAG/i).first();
            if (await triageInput.isVisible().catch(()=>false)) {
                await triageInput.fill(tagForReturn);
                await page.keyboard.press('Enter');
            } else {
                const anyInput = page.locator('input:visible').first();
                await anyInput.fill(tagForReturn);
                await page.keyboard.press('Enter');
            }
            
            await page.getByRole('button', { name: /AVANÇAR PARA TRIAGEM/i }).click();
            await page.getByRole('button', { name: /SIM/i }).first().click();
            await page.getByRole('button', { name: /SIM/i }).nth(1).click();
            await page.locator('textarea[placeholder="Descreva o problema..."]').fill('Defeito reportado no Teste E2E');
            await page.getByRole('button', { name: /NÃO/i }).first().click();
            await page.getByRole('button', { name: /NÃO/i }).nth(1).click();
            
            lastSupabaseError = null;
            await page.getByRole('button', { name: /CONFIRMAR CHECK-IN/i }).click();
            await page.waitForTimeout(1500);
            
            if (lastSupabaseError) {
              error5Details = { message: 'Erro Supabase', supabase: lastSupabaseError };
            } else {
              error5Status = 'CORRIGIDO';
            }
          } else {
            error5Status = 'MASSA_INDISPONIVEL';
            error5Details = { message: 'Tela de triagem não disponível para validar o cenário' };
          }
        } else {
          error5Status = 'MASSA_INDISPONIVEL';
          error5Details = { message: 'Nenhuma TAG encontrada para devolução' };
        }
      } catch (e) { error5Details = { message: e.message }; }
      recordResult('ERRO 5 - Triagem com Defeito não persiste', 'OPERACIONAL', error5Status, error5Details);
      
      await logout(page);
    });

    // Escrever JSON de saída
    fs.writeFileSync(
      path.join(outDir, 'VERIFICACAO_FALHAS.json'),
      JSON.stringify(results, null, 2)
    );

    // Relatório TXT terminal
    console.log('\n==================================================');
    console.log('RESUMO DA VERIFICAÇÃO DE FALHAS');
    console.log('==================================================');
    results.forEach(r => {
      console.log(`- ${r.nome}: [${r.status}]`);
      if (r.dados?.detalhe) console.log(`  Motivo: ${r.dados.detalhe}`);
      else if (r.dados?.message) console.log(`  Motivo: ${r.dados.message}`);
    });
    const erro3 = results.find(r => r.nome === 'ERRO 3 (Terapia a Vácuo)');
    if (erro3) {
      console.log(`ERRO 3 Terapia a Vácuo: ${erro3.status}`);
      if (erro3.dados?.detalhe) console.log('Motivo: item não disponível no catálogo da categoria Equipamentos Gerais.');
    }
    console.log('==================================================\n');
    
  });
});

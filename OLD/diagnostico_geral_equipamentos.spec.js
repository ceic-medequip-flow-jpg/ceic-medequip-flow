import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('Auditoria e Diagnóstico de Todos os Tipos de Equipamentos', () => {

  let errosEncontrados = [];
  let dbErrors = [];
  let consoleErrors = [];

  // Este Hook roda antes de cada cenário para ligar os "espiões" do sistema
  test.beforeEach(async ({ page }) => {
    dbErrors = [];
    consoleErrors = [];

    // Espião 1: Captura erros fatais da página (React/Babel)
    page.on('pageerror', err => {
      consoleErrors.push(`[ERRO CRÍTICO JS] ${err.message}`);
    });

    // Espião 2: Captura erros vermelhos no Console do F12
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Flexibilizando a trava: ignora erros 404 inofensivos (ex: favicon)
        if (!text.includes('404') && !text.includes('favicon')) {
           consoleErrors.push(`[CONSOLE ERROR] ${text}`);
        }
      }
    });

    // Espião 3: Intercepta a comunicação com o Supabase e captura erros Reais de Banco (ex: colunas faltando)
    page.on('response', async response => {
      if (response.url().includes('supabase.co') && !response.ok()) {
        const body = await response.text();
        dbErrors.push(`[ERRO SUPABASE] HTTP ${response.status()} - Detalhes do Banco: ${body}`);
      }
    });
  });

  // Gera o laudo técnico para a IA ao final da bateria de testes
  test.afterAll(async () => {
    const relatorio = {
      "analise_geral": errosEncontrados.length > 0 ? "FALHAS DETECTADAS" : "SISTEMA SAUDÁVEL. TODOS OS EQUIPAMENTOS PASSARAM.",
      "instrucao_para_ia_offline": "Leia o array 'falhas' abaixo. Se houver 'erros_supabase', crie um script SQL ou ajuste o payload JS para alinhar as colunas. Se houver 'erros_javascript' ou falhas de UI, corrija o React/Babel no index.html.",
      "falhas": errosEncontrados
    };
    fs.writeFileSync('DIAGNOSTICO_OFFLINE_IA.json', JSON.stringify(relatorio, null, 2));
  });

  // Os 4 pilares lógicos da sua aplicação que cobrem 100% das variações de equipamentos
  const CENARIOS = [
    {
       nome: '1. Equipamento Geral Simples (Ex: Oxímetro)',
       categoria: 'Equipamentos Gerais',
       acaoFront: async (page) => {
          await page.getByText(/Buscar e selecionar equipamento/i).click();
          await page.getByPlaceholder('Digite para buscar...').pressSequentially('Oximetro', { delay: 100 });
          await page.waitForTimeout(500); // Aguarda o React renderizar o Dropdown
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(200);
          await page.keyboard.press('Enter');
       }
    },
    {
       nome: '2. Equipamento Geral com Lógica Complexa TEV (Ex: Compressor Vascular)',
       categoria: 'Equipamentos Gerais',
       acaoFront: async (page) => {
          await page.getByText(/Buscar e selecionar equipamento/i).click();
          await page.getByPlaceholder('Digite para buscar...').pressSequentially('Compressor', { delay: 100 });
          await page.waitForTimeout(500); // Aguarda o React renderizar o Dropdown
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(200);
          await page.keyboard.press('Enter');
          
          // Trata a condicional: se for o setor Centro Cirúrgico pede 'Destino', se não, 'Tipo de Paciente'
          if (await page.getByPlaceholder(/Ex: UTI 3/i).isVisible()) {
              await page.getByPlaceholder(/Ex: UTI 3/i).fill('UTI Diagnóstico');
          } else {
              await page.locator('select').filter({ hasText: 'Clínico' }).selectOption('Clínico');
          }
          await page.getByPlaceholder('Ex: 4').fill('5'); // Score Risco
       }
    },
    {
       nome: '3. Assistência Ventilatória (Requer Acessórios Vinculados)',
       categoria: 'Equipamentos de Assistência Ventilatória',
       acaoFront: async (page) => {
          await page.getByText(/Selecione o tipo/i).click();
          await page.getByPlaceholder('Digite para buscar...').pressSequentially('Ventilador', { delay: 100 });
          await page.waitForTimeout(500); // Aguarda o React renderizar o Dropdown
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(200);
          await page.keyboard.press('Enter');
          // Clica no primeiro acessório disponível na tela
          await page.locator('label').filter({ has: page.locator('input[type="checkbox"]') }).first().click();
       }
    },
    {
       nome: '4. Equipamento de Transporte (Requer Destino e Isolamento)',
       categoria: 'Equipamentos para Transporte de Paciente',
       acaoFront: async (page) => {
          // Usa a API nativa do Playwright para selecionar opções, que é mais robusta
          await page.locator('select').filter({ hasText: 'Destino...' }).selectOption({ index: 1 });
          await page.locator('select').filter({ hasText: 'Isolamento?' }).selectOption('Não');

          // Marca o primeiro acessório de transporte (da lista correta e não o de emergência)
          await page.locator('.bg-orange-50 input[type="checkbox"]').first().dispatchEvent('click');
       }
    }
  ];

  for (const cenario of CENARIOS) {
    test(`Auditoria: ${cenario.nome}`, async ({ page }) => {
        try {
            await page.goto('http://127.0.0.1:8081/index.html');
            
            // 1. Login Rápido
            await page.getByPlaceholder('Digite seu login').fill('04CC');
            await page.getByPlaceholder('Sua senha').fill('4001');
            await page.getByRole('button', { name: 'Entrar' }).click();

            // 2. Preenchimento de Dados Padrões
            await page.locator('label:has-text("Nome Solicitante") + input').fill('Auditor IA');
            await page.locator('label:has-text("Matrícula") + input').fill('99999');
            await page.locator('label:has-text("Ramal") + input').fill('0000');
            await page.getByPlaceholder('Ex: MV458512').fill('MV000000');
            await page.locator('label:has-text("Nome do Paciente") + input').fill('Paciente Diagnóstico');
            await page.getByPlaceholder('Ex: 05').fill('10');

            // 3. Navegação Específica do Equipamento
            await page.getByText(/Selecione a categoria/i).click();
            await page.getByText(cenario.categoria).click();
            await cenario.acaoFront(page);

            // 4. Submissão e Análise de Resultado
            await page.waitForTimeout(1000); // Aguarda atualização do estado do React (crucial para o cenário de transporte)
            await page.getByRole('button', { name: /Confirmar Solicitação/i }).click();

            // Se der erro crasso (tela em branco, erro de banco), o expect abaixo vai falhar e cair no catch
            await expect(page.getByText(/Solicitação enviada com sucesso/i)).toBeVisible({ timeout: 5000 });

            // Se passou visualmente mas o banco rejeitou por baixo dos panos (falha silenciosa)
            if (dbErrors.length > 0 || consoleErrors.length > 0) {
                throw new Error("UI não travou, mas erros severos de Banco de Dados ou Console JS foram detectados no background.");
            }

        } catch (error) {
            // Se falhou, geramos a "Radiografia" do erro para a sua IA offline
            let diagnostico = "FALHA_INTERFACE_CÓDIGO (UI / Playwright Locator)";
            if (dbErrors.length > 0) diagnostico = "BANCO_DE_DADOS_REJEITADO (Inconsistência de Schema/Supabase)";
            else if (consoleErrors.length > 0) diagnostico = "FALHA_JAVASCRIPT (Erro de renderização no React/Babel)";

            const laudo = {
                cenario_testado: cenario.nome,
                diagnostico_principal: diagnostico,
                detalhe_interface_ui: error.message,
                erros_javascript_console: consoleErrors,
                erros_supabase_network: dbErrors
            };

            errosEncontrados.push(laudo);
            throw error; // Repassa o erro para o Playwright não dar o teste como "passou"
        }
    });
  }
});
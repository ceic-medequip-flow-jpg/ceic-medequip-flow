import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { performLogin } from '../helpers/auth.js';
import { Diagnostics } from '../helpers/diagnostics.js';
import { runAction } from '../helpers/actions.js';
import { analyzeError } from '../helpers/classifiers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const usersPath = path.resolve(__dirname, '../fixtures/users.json');
const matrixPath = path.resolve(__dirname, '../fixtures/actions-matrix.json');

const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
const actionsMatrix = JSON.parse(fs.readFileSync(matrixPath, 'utf8'));
const testResults = [];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeName(value) {
  return String(value || 'item').replace(/[^a-z0-9_-]+/gi, '_').slice(0, 80);
}

async function captureFailureScreenshot(page, user, actionName) {
  const evidenceDir = path.resolve(__dirname, '../../qa-reports/latest/evidence');
  ensureDir(evidenceDir);
  const screenshotPath = path.join(evidenceDir, `${safeName(user.perfil)}_${safeName(actionName)}_${Date.now()}.png`);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  } catch {
    return 'Não foi possível capturar screenshot; página/contexto já estava fechado.';
  }
}

function buildResult({ user, actionName, status, error, screenshot }) {
  const diagnosis = error?.diagnosis || analyzeError({
    message: error?.message,
    responseBody: error?.responseBody,
    payload: error?.payload,
    url: error?.url,
    method: error?.method
  });
  
  let finalStatus = status;
  if (error?.message && error.message.includes('PROTECAO_CREDENCIAIS')) {
    finalStatus = 'nao_executado_por_regra_de_seguranca';
  } else if (error?.message && error.message.includes('FEATURE_NAO_IMPLEMENTADA_OU_NAO_VISIVEL')) {
    finalStatus = 'feature_nao_implementada';
  } else if (error?.message && error.message.includes('MASSA_DE_TESTE_AUSENTE')) {
    finalStatus = 'massa_ausente';
  } else if (error?.message && error.message.includes('MASSA_REAL_INDISPONIVEL')) {
    finalStatus = 'massa_real_indisponivel';
  }

  return {
    perfil: user.perfil,
    usuario: user.login,
    acao: actionName,
    status: finalStatus,
    classificacao: status === 'falhou' ? (error?.classification || diagnosis.classificacao || 'DESCONHECIDO') : null,
    camada: status === 'falhou' ? (diagnosis.camada || null) : null,
    arquivoProvavel: status === 'falhou' ? (diagnosis.arquivoProvavel || null) : null,
    funcaoProvavel: status === 'falhou' ? (diagnosis.funcaoProvavel || null) : null,
    fluxoFuncional: status === 'falhou' ? (diagnosis.fluxoFuncional || null) : null,
    tabelaSupabase: status === 'falhou' ? (diagnosis.tabelaSupabase || null) : null,
    operacaoSupabase: status === 'falhou' ? (diagnosis.operacaoSupabase || null) : null,
    campoProblematico: status === 'falhou' ? (diagnosis.campoProblematico || null) : null,
    valorEnviado: status === 'falhou' ? (diagnosis.valorEnviado || null) : null,
    mensagemUsuario: status === 'falhou' ? `Erro detectado: ${String(error?.message || '').substring(0, 500)}` : 'Ação executada com sucesso.',
    erroTecnico: status === 'falhou' ? (error?.message || null) : null,
    httpStatus: status === 'falhou' ? (error?.status || null) : null,
    supabaseTable: status === 'falhou' ? (diagnosis.tabelaSupabase || (error?.url ? 'Ver rede' : null)) : null,
    requestUrl: status === 'falhou' ? (error?.url || null) : null,
    requestMethod: status === 'falhou' ? (error?.method || null) : null,
    payload: status === 'falhou' ? (error?.payload || null) : null,
    responseBody: status === 'falhou' ? (error?.responseBody || null) : null,
    screenshot: status === 'falhou' ? (screenshot || 'Não gerado') : null,
    video: status === 'falhou' ? 'Gerado pela configuração do Playwright quando aplicável' : null,
    trace: status === 'falhou' ? 'Gerado pela configuração do Playwright quando aplicável' : null,
    causaProvavel: status === 'falhou' ? diagnosis.causaProvavel : null,
    acaoSugerida: status === 'falhou' ? diagnosis.acaoSugerida : null,
    executadoEm: new Date().toISOString()
  };
}

async function recordFailure(page, user, actionName, error) {
  const screenshot = await captureFailureScreenshot(page, user, actionName);
  testResults.push(buildResult({ user, actionName, status: 'falhou', error, screenshot }));
}

test.describe('Auditoria Visual Completa do CEIC App', () => {
  test.afterAll(async () => {
    const resultsDir = path.resolve(__dirname, '../../qa-reports/latest');
    ensureDir(resultsDir);
    fs.writeFileSync(path.join(resultsDir, 'raw-results.json'), JSON.stringify(testResults, null, 2));
  });

  for (const user of users) {
    test(`Auditar Perfil: ${user.perfil}`, async ({ page }) => {
      test.setTimeout(240000);
      page.setDefaultTimeout(7000);
      page.setDefaultNavigationTimeout(15000);

      const diagnostics = new Diagnostics(page);
      diagnostics.start();

      const actions = actionsMatrix[user.perfil] || [];

      for (const actionName of actions) {
        const startErrorIndex = diagnostics.errors.length;
        let actionFailed = false;

        try {
          if (actionName === 'login') {
            await performLogin(page, user.login, user.senha);
          } else {
            if (actionName !== 'logout' && await page.getByRole('button', { name: /Entrar/i }).isVisible().catch(() => false)) {
              await performLogin(page, user.login, user.senha);
            }
            await runAction(page, actionName, user.perfil);
          }
          await page.waitForTimeout(800);
        } catch (err) {
          actionFailed = true;
          const diagnosis = analyzeError({ message: err.message });
          await recordFailure(page, user, actionName, {
            type: 'exception',
            message: err.message,
            classification: diagnosis.classificacao,
            diagnosis
          });
        }

        const actionDiagnostics = diagnostics.getErrors().slice(startErrorIndex);
        for (const diagnosticError of actionDiagnostics) {
          actionFailed = true;
          await recordFailure(page, user, actionName, diagnosticError);
        }

        if (!actionFailed) {
          testResults.push(buildResult({ user, actionName, status: 'sucesso' }));
        }
      }
    });
  }
});

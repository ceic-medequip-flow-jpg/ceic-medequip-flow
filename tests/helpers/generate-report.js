import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analyzeError } from './classifiers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resultsDir = path.resolve(__dirname, '../../qa-reports/latest');
const rawResultsPath = path.join(resultsDir, 'raw-results.json');

if (!fs.existsSync(rawResultsPath)) {
  console.log('Nenhum resultado bruto encontrado. Execute os testes primeiro.');
  process.exit(0);
}

const rawResults = JSON.parse(fs.readFileSync(rawResultsPath, 'utf8'));

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function pretty(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

function getPayloadItem(payload) {
  if (Array.isArray(payload)) return payload[0] || {};
  if (payload && typeof payload === 'object') return payload;
  return {};
}

function inferFluxo(action) {
  const map = {
    login: 'Autenticação',
    criar_solicitacao: 'Criação de solicitação',
    validar_persistencia_solicitacao: 'Criação de solicitação',
    validar_status_inicial: 'Criação de solicitação',
    tentativa_acao_invalida: 'Permissões de perfil',
    dashboard_operacional: 'Dashboard operacional',
    confirmar_solicitacao: 'Atendimento operacional',
    fila_espera: 'Fila de espera',
    cancelamento: 'Cancelamento de solicitação',
    triagem: 'Triagem / devolução',
    expurgo_baixa: 'Expurgo / baixa',
    dashboards: 'Dashboards de gestão',
    filtros: 'Filtros de gestão',
    validacao_leitura: 'Leitura de gestão',
    tentativa_escrita_deve_falhar: 'Permissões de escrita',
    gestao_equipamentos: 'Gestão de equipamentos',
    criacao_equipamento_teste: 'Gestão de equipamentos',
    edicao_equipamento_teste: 'Gestão de equipamentos',
    validacao_equipamento_teste: 'Gestão de equipamentos',
    remocao_dados_teste: 'Gestão de equipamentos',
    logout: 'Encerramento de sessão'
  };
  return map[action] || action || '-';
}

function formatSupabaseResponse(body) {
  if (!body) return '-';
  return [body.code, body.message].filter(Boolean).join(' - ') || JSON.stringify(body);
}

function enrichResult(result) {
  if (result.status !== 'falhou') {
    return {
      ...result,
      fluxoFuncional: result.fluxoFuncional || inferFluxo(result.acao)
    };
  }

  const diagnosis = analyzeError({
    message: result.erroTecnico || result.mensagemUsuario,
    responseBody: result.responseBody,
    payload: result.payload,
    url: result.requestUrl,
    method: result.requestMethod
  });

  const payloadItem = getPayloadItem(result.payload);
  const enriched = {
    ...result,
    classificacao: result.classificacao || diagnosis.classificacao || 'DESCONHECIDO',
    camada: result.camada || diagnosis.camada,
    arquivoProvavel: result.arquivoProvavel || diagnosis.arquivoProvavel,
    funcaoProvavel: result.funcaoProvavel || diagnosis.funcaoProvavel,
    fluxoFuncional: result.fluxoFuncional || diagnosis.fluxoFuncional || inferFluxo(result.acao),
    tabelaSupabase: result.tabelaSupabase || result.supabaseTable || diagnosis.tabelaSupabase,
    operacaoSupabase: result.operacaoSupabase || diagnosis.operacaoSupabase,
    campoProblematico: result.campoProblematico || diagnosis.campoProblematico,
    valorEnviado: result.valorEnviado || diagnosis.valorEnviado,
    causaProvavel: result.causaProvavel || diagnosis.causaProvavel,
    acaoSugerida: result.acaoSugerida || diagnosis.acaoSugerida
  };

  if (!enriched.valorEnviado && enriched.campoProblematico) {
    enriched.valorEnviado = payloadItem[enriched.campoProblematico] || payloadItem[enriched.campoProblematico.toLowerCase()] || null;
  }

  return enriched;
}

function actionGroupKey(result) {
  return [result.perfil, result.usuario, result.acao].map(v => String(v || '')).join('|');
}

function rootCauseKey(err) {
  if (err.causaRaizAgrupada) return err.causaRaizAgrupada;
  if (err.responseBody?.code === 'P0001' && String(err.responseBody?.message || '').toLowerCase().includes('equipmenttype')) {
    return 'equipmentType inválido enviado no INSERT de pedidos';
  }
  if (err.classificacao === 'OPERACAO_NAO_PERSISTIU' && err.funcaoProvavel === 'handleCreateRequest') {
    return 'Falha de persistência no INSERT de pedidos';
  }
  return [
    err.classificacao || 'DESCONHECIDO',
    err.camada || '-',
    err.arquivoProvavel || '-',
    err.funcaoProvavel || '-',
    err.campoProblematico || '-',
    err.responseBody?.code || '-',
    err.responseBody?.message || err.erroTecnico || '-'
  ].join(' | ');
}

function applyRootCauseGrouping(results) {
  const failuresByAction = new Map();
  results.filter(r => r.status === 'falhou').forEach(result => {
    const key = actionGroupKey(result);
    failuresByAction.set(key, [...(failuresByAction.get(key) || []), result]);
  });

  failuresByAction.forEach(group => {
    const equipmentTypeRoot = group.find(err =>
      err.responseBody?.code === 'P0001' &&
      String(err.responseBody?.message || '').toLowerCase().includes('equipmenttype') &&
      String(err.responseBody?.message || '').toLowerCase().includes('inv')
    );

    if (!equipmentTypeRoot) return;

    group.forEach(err => {
      err.causaRaizAgrupada = 'equipmentType inválido enviado no INSERT de pedidos';
      err.causaRaizOrigem = equipmentTypeRoot.erroTecnico || equipmentTypeRoot.mensagemUsuario;
      err.classificacao = err.classificacao === 'DESCONHECIDO' ? 'BANCO_SCHEMA_OU_PAYLOAD' : err.classificacao;
      err.camada = 'BANCO_SUPABASE';
      err.fluxoFuncional = err.fluxoFuncional || 'Criação de solicitação';
      err.arquivoProvavel = err.arquivoProvavel || 'src/App.jsx';
      err.funcaoProvavel = err.funcaoProvavel || 'handleCreateRequest';
      err.tabelaSupabase = err.tabelaSupabase || 'pedidos';
      err.operacaoSupabase = err.operacaoSupabase || 'INSERT';
      err.campoProblematico = err.campoProblematico || 'equipmentType';
      err.valorEnviado = err.valorEnviado || equipmentTypeRoot.valorEnviado || null;
      err.causaProvavel = 'equipmentType inválido enviado no INSERT de pedidos.';
      err.acaoSugerida = 'Normalizar/mapear equipmentType para o valor canônico aceito pelo catálogo antes do insert em pedidos.';
    });
  });

  return results;
}

const enrichedResults = applyRootCauseGrouping(rawResults.map(enrichResult));
const failures = enrichedResults.filter(r => r.status === 'falhou');
const successes = enrichedResults.filter(r => r.status === 'sucesso');
const safeBlocked = enrichedResults.filter(r => r.status === 'nao_executado_por_regra_de_seguranca');
const notImplemented = enrichedResults.filter(r => r.status === 'feature_nao_implementada');

const rootCauseGroups = new Map();
failures.forEach(err => {
  const key = rootCauseKey(err);
  rootCauseGroups.set(key, [...(rootCauseGroups.get(key) || []), err]);
});

const uiMapDir = path.join(resultsDir, 'ui-discovery');
const hasUIMaps = fs.existsSync(uiMapDir);

const report = {
  nome: 'RELATORIO_DE_ERROS_CEIC',
  geradoEm: new Date().toISOString(),
  resumoExecutivo: {
    totalPerfis: new Set(enrichedResults.map(r => r.perfil)).size,
    totalAcoes: enrichedResults.length,
    fluxosOk: successes.length,
    falhas: failures.length,
    bloqueadosPorSeguranca: safeBlocked.length,
    featuresNaoVisiveis: notImplemented.length,
    causasRaiz: rootCauseGroups.size,
    coberturaPorPerfil: Object.fromEntries(
      [...new Set(enrichedResults.map(r => r.perfil))].map(perfil => [
        perfil,
        {
          acoes: enrichedResults.filter(r => r.perfil === perfil).length,
          sucesso: enrichedResults.filter(r => r.perfil === perfil && r.status === 'sucesso').length,
          falha: enrichedResults.filter(r => r.perfil === perfil && r.status === 'falhou').length
        }
      ])
    )
  },
  errosAgrupadosPorCausaRaiz: [...rootCauseGroups.entries()].map(([causaRaiz, erros]) => ({
    causaRaiz,
    total: erros.length,
    camada: erros[0]?.camada || erros[0]?.classificacao || 'DESCONHECIDO',
    correcaoSugerida: erros[0]?.acaoSugerida || '-',
    erros
  })),
  fluxosOk: successes,
  resultados: enrichedResults
};

function renderDiagnosisHtml(err) {
  return `
    <section class="layer-diagnosis">
      <h4>Diagnóstico por Camada</h4>
      <dl>
        <dt>Camada</dt><dd>${escapeHtml(err.camada || err.classificacao || '-')}</dd>
        <dt>Fluxo</dt><dd>${escapeHtml(err.fluxoFuncional || inferFluxo(err.acao))}</dd>
        <dt>Perfil</dt><dd>${escapeHtml(err.perfil || '-')}</dd>
        <dt>Usuário</dt><dd>${escapeHtml(err.usuario || '-')}</dd>
        <dt>Arquivo provável</dt><dd>${escapeHtml(err.arquivoProvavel || '-')}</dd>
        <dt>Função provável</dt><dd>${escapeHtml(err.funcaoProvavel || '-')}</dd>
        <dt>Tabela Supabase</dt><dd>${escapeHtml(err.tabelaSupabase || err.supabaseTable || '-')}</dd>
        <dt>Operação</dt><dd>${escapeHtml(err.operacaoSupabase || '-')}</dd>
        <dt>Campo problemático</dt><dd>${escapeHtml(err.campoProblematico || '-')}</dd>
        <dt>Valor enviado</dt><dd>${escapeHtml(err.valorEnviado || '-')}</dd>
        <dt>Resposta Supabase</dt><dd>${escapeHtml(formatSupabaseResponse(err.responseBody))}</dd>
        <dt>Causa raiz agrupada</dt><dd>${escapeHtml(err.causaRaizAgrupada || rootCauseKey(err))}</dd>
        <dt>Causa provável</dt><dd>${escapeHtml(err.causaProvavel || '-')}</dd>
        <dt>Correção sugerida</dt><dd>${escapeHtml(err.acaoSugerida || '-')}</dd>
      </dl>
    </section>`;
}

function renderEvidenceHtml(err) {
  return `
    <section class="evidence">
      <h4>Evidência Técnica</h4>
      <p><strong>HTTP Status:</strong> ${escapeHtml(err.httpStatus || '-')}</p>
      <p><strong>URL da request:</strong> ${escapeHtml(err.requestUrl || '-')}</p>
      <p><strong>Método/Operação:</strong> ${escapeHtml(err.requestMethod || err.operacaoSupabase || '-')}</p>
      <p><strong>Stack/Mensagem técnica:</strong></p>
      <pre>${escapeHtml(err.erroTecnico || err.mensagemUsuario || '-')}</pre>
      ${err.payload ? `<p><strong>Payload enviado:</strong></p><pre>${escapeHtml(pretty(err.payload))}</pre>` : ''}
      ${err.responseBody ? `<p><strong>Response body Supabase:</strong></p><pre>${escapeHtml(pretty(err.responseBody))}</pre>` : ''}
      <p><strong>Screenshot:</strong> ${escapeHtml(err.screenshot || '-')}</p>
      <p><strong>Vídeo:</strong> ${escapeHtml(err.video || '-')}</p>
      <p><strong>Trace:</strong> ${escapeHtml(err.trace || '-')}</p>
    </section>`;
}

function renderRootCauseGroupsHtml() {
  if (report.errosAgrupadosPorCausaRaiz.length === 0) {
    return '<section class="ok-panel"><h2>Erros agrupados por causa raiz</h2><p>Nenhum erro encontrado.</p></section>';
  }

  return report.errosAgrupadosPorCausaRaiz.map(group => `
    <section class="root-cause">
      <h2>${escapeHtml(group.causaRaiz)} <span>${group.total} ocorrência(s)</span></h2>
      <p><strong>Camada:</strong> ${escapeHtml(group.camada)}</p>
      <p><strong>Correção sugerida:</strong> ${escapeHtml(group.correcaoSugerida)}</p>
      ${group.erros.map((err, idx) => `
        <article class="card">
          <h3>Erro ${idx + 1}: ${escapeHtml(err.perfil)} / ${escapeHtml(err.acao)}</h3>
          <p><strong>Classificação:</strong> ${escapeHtml(err.classificacao || '-')}</p>
          <p><strong>Mensagem:</strong> <code>${escapeHtml(err.mensagemUsuario || err.erroTecnico || '-')}</code></p>
          ${renderDiagnosisHtml(err)}
          ${renderEvidenceHtml(err)}
        </article>
      `).join('')}
    </section>
  `).join('');
}

function renderOkFlowsHtml() {
  return `
    <section class="ok-panel">
      <h2>Fluxos OK (${successes.length})</h2>
      <table>
        <thead><tr><th>Perfil</th><th>Usuário</th><th>Ação</th><th>Fluxo</th><th>Status</th></tr></thead>
        <tbody>
          ${successes.map(item => `<tr><td>${escapeHtml(item.perfil)}</td><td>${escapeHtml(item.usuario)}</td><td>${escapeHtml(item.acao)}</td><td>${escapeHtml(item.fluxoFuncional || inferFluxo(item.acao))}</td><td>${escapeHtml(item.status)}</td></tr>`).join('')}
        </tbody>
      </table>
    </section>`;
}

function renderUIMapsHtml() {
  if (!hasUIMaps) return '';
  const maps = fs.readdirSync(uiMapDir).filter(f => f.endsWith('.json'));
  if (maps.length === 0) return '';

  return `
    <section class="ok-panel">
      <h2 style="color: #2563eb;">Mapa de UI (Descoberta Automática)</h2>
      <p>Abaixo estão os botões, títulos e campos vitais que a automação encontrou disponíveis para cada perfil após o Login.</p>
      ${maps.map(m => {
        const dt = JSON.parse(fs.readFileSync(path.join(uiMapDir, m), 'utf8'));
        return `
          <div style="background: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin-top: 15px; border-radius: 8px;">
            <h3 style="margin-top: 0;">Perfil: ${escapeHtml(dt.perfil)}</h3>
            <p><strong>Título Lida:</strong> ${escapeHtml(dt.titulo)}</p>
            <p><strong>Botões clicáveis:</strong></p>
            <div style="display:flex; flex-wrap:wrap; gap:8px;">
              ${dt.botoes.map(b => `<span style="background:#e2e8f0; padding:2px 8px; border-radius:4px; font-size:12px;">${escapeHtml(b)}</span>`).join('')}
            </div>
          </div>
        `;
      }).join('')}
    </section>
  `;
}

const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>RELATORIO_DE_ERROS_CEIC</title>
  <style>
    body { font-family: Segoe UI, Tahoma, sans-serif; background:#f3f4f6; color:#1f2937; padding:20px; line-height:1.55; }
    .container { max-width:1200px; margin:0 auto; }
    h1 { color:#111827; border-bottom:2px solid #e5e7eb; padding-bottom:10px; }
    .summary { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin:20px 0 30px; }
    .summary-box { background:#fff; padding:16px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,.1); text-align:center; font-weight:700; }
    .summary-box span { display:block; font-size:1.8em; margin-top:4px; }
    .root-cause, .ok-panel { background:#fff; border-radius:8px; padding:18px; margin:18px 0; box-shadow:0 1px 3px rgba(0,0,0,.1); }
    .root-cause h2 { color:#991b1b; }
    .root-cause h2 span { color:#4b5563; font-size:.65em; }
    .card { border-left:6px solid #ef4444; background:#fff; padding:16px; margin-top:14px; border-radius:8px; border-top:1px solid #e5e7eb; border-right:1px solid #e5e7eb; border-bottom:1px solid #e5e7eb; }
    .layer-diagnosis { background:#eff6ff; border:1px solid #bfdbfe; border-radius:8px; padding:14px; margin-top:14px; }
    .evidence { background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:14px; margin-top:14px; }
    dl { display:grid; grid-template-columns:220px 1fr; gap:6px 14px; margin:0; }
    dt { font-weight:700; color:#374151; }
    dd { margin:0; }
    code { background:#fee2e2; color:#991b1b; padding:2px 6px; border-radius:4px; }
    pre { background:#111827; color:#f8fafc; padding:12px; border-radius:6px; overflow-x:auto; font-size:.9em; }
    table { width:100%; border-collapse:collapse; }
    th, td { text-align:left; border-bottom:1px solid #e5e7eb; padding:8px; }
    th { background:#f9fafb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>RELATORIO_DE_ERROS_CEIC</h1>
    <p>Gerado em: <strong>${new Date(report.geradoEm).toLocaleString('pt-BR')}</strong></p>
    <section class="summary">
      <div class="summary-box">Perfis<span>${report.resumoExecutivo.totalPerfis}</span></div>
      <div class="summary-box">Ações<span>${report.resumoExecutivo.totalAcoes}</span></div>
      <div class="summary-box">Fluxos OK<span>${report.resumoExecutivo.fluxosOk}</span></div>
      <div class="summary-box">Falhas<span>${report.resumoExecutivo.falhas}</span></div>
      <div class="summary-box" style="background:#fef08a; color:#9a3412;">Bloqueios Seg.<span>${report.resumoExecutivo.bloqueadosPorSeguranca}</span></div>
    </section>
    ${safeBlocked.length > 0 ? `<div style="background:#fefce8; border-left: 4px solid #ca8a04; padding:15px; margin-bottom: 20px; border-radius:4px;"><h3 style="margin:0; color:#ca8a04;">Proteção Ativa</h3><p>A auditoria impediu a execução de <strong>${safeBlocked.length}</strong> ação(ões) por conterem termos críticos (senha, usuário) em seu escopo.</p></div>` : ''}
    <section class="ok-panel">
      <h2>Resumo executivo</h2>
      <pre>${escapeHtml(JSON.stringify(report.resumoExecutivo, null, 2))}</pre>
    </section>
    ${renderUIMapsHtml()}
    ${renderRootCauseGroupsHtml()}
    ${renderOkFlowsHtml()}
  </div>
</body>
</html>`;

let txt = '=== RELATORIO_DE_ERROS_CEIC ===\n';
txt += `Gerado em: ${new Date(report.geradoEm).toLocaleString('pt-BR')}\n\n`;
txt += 'Resumo executivo\n';
txt += JSON.stringify(report.resumoExecutivo, null, 2);
txt += '\n\n';

txt += 'Erros agrupados por causa raiz\n';
if (report.errosAgrupadosPorCausaRaiz.length === 0) {
  txt += 'Nenhum erro encontrado.\n\n';
} else {
  report.errosAgrupadosPorCausaRaiz.forEach((group, groupIndex) => {
    txt += `[CAUSA RAIZ ${groupIndex + 1}] ${group.causaRaiz}\n`;
    txt += `Total: ${group.total}\n`;
    txt += `Camada: ${group.camada}\n`;
    txt += `Correção sugerida: ${group.correcaoSugerida}\n\n`;

    group.erros.forEach((err, index) => {
      txt += `  [ERRO ${index + 1}]\n`;
      txt += `  Classificação: ${err.classificacao || '-'}\n`;
      txt += `  Perfil: ${err.perfil || '-'} | Usuário: ${err.usuario || '-'} | Ação: ${err.acao || '-'}\n`;
      txt += `  Diagnóstico por Camada\n`;
      txt += `  Camada: ${err.camada || err.classificacao || '-'}\n`;
      txt += `  Fluxo: ${err.fluxoFuncional || inferFluxo(err.acao)}\n`;
      txt += `  Arquivo provável: ${err.arquivoProvavel || '-'}\n`;
      txt += `  Função provável: ${err.funcaoProvavel || '-'}\n`;
      txt += `  Tabela Supabase: ${err.tabelaSupabase || err.supabaseTable || '-'}\n`;
      txt += `  Operação: ${err.operacaoSupabase || '-'}\n`;
      txt += `  Campo problemático: ${err.campoProblematico || '-'}\n`;
      txt += `  Valor enviado: ${err.valorEnviado || '-'}\n`;
      txt += `  Resposta Supabase: ${formatSupabaseResponse(err.responseBody)}\n`;
      txt += `  Causa provável: ${err.causaProvavel || '-'}\n`;
      txt += `  Correção sugerida: ${err.acaoSugerida || '-'}\n`;
      txt += `  Evidência Técnica\n`;
      txt += `  HTTP Status: ${err.httpStatus || '-'}\n`;
      txt += `  URL da request: ${err.requestUrl || '-'}\n`;
      txt += `  Método/Operação: ${err.requestMethod || err.operacaoSupabase || '-'}\n`;
      txt += `  Stack/Mensagem técnica:\n${err.erroTecnico || err.mensagemUsuario || '-'}\n`;
      if (err.payload) txt += `  Payload Enviado:\n${JSON.stringify(err.payload, null, 2)}\n`;
      if (err.responseBody) txt += `  Resposta Supabase:\n${JSON.stringify(err.responseBody, null, 2)}\n`;
      txt += `  Screenshot: ${err.screenshot || '-'}\n`;
      txt += `  Vídeo: ${err.video || '-'}\n`;
      txt += `  Trace: ${err.trace || '-'}\n\n`;
    });
  });
}

txt += 'Fluxos OK\n';
successes.forEach(item => {
  txt += `- ${item.perfil} | ${item.usuario} | ${item.acao} | ${item.fluxoFuncional || inferFluxo(item.acao)}\n`;
});

fs.writeFileSync(path.join(resultsDir, 'RELATORIO_DE_ERROS_CEIC.html'), html);
fs.writeFileSync(path.join(resultsDir, 'RELATORIO_DE_ERROS_CEIC.txt'), txt);
fs.writeFileSync(path.join(resultsDir, 'RELATORIO_DE_ERROS_CEIC.json'), JSON.stringify(report, null, 2));

console.log('\n======================================================');
console.log('RELATORIO_DE_ERROS_CEIC HTML, TXT E JSON GERADOS COM SUCESSO!');
console.log('======================================================\n');

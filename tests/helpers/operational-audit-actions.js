import fs from 'fs';
import path from 'path';

export const auditResults = [];
let totalErrors = 0;
export let supabaseErrors = [];

export let currentStep = {
  perfil: 'Nenhum',
  tela: 'Início',
  acao: 'Inicializando script',
  timestamp: new Date().toISOString()
};

export function setCurrentStep(perfil, tela, acao) {
  currentStep = {
    perfil,
    tela,
    acao,
    timestamp: new Date().toISOString()
  };
  console.log(`[AUDITORIA] ${perfil} - ${tela}: ${acao}`);
}

/**
 * 
 * @param {string} profile - Ex: 'Assistencial', 'Operacional', 'Gestão', 'Admin/Teste'
 * @param {string} screen - Ex: 'Nova Solicitação', 'Dashboard Operacional'
 * @param {string} action - Ex: 'Criar Pedido', 'Bloqueio de Escrita'
 * @param {string} status - Ex: 'OK', 'AINDA_FALHA', 'MASSA_INDISPONIVEL', 'BLOQUEADO_CORRETAMENTE', 'FALHA_TECNICA'
 * @param {string} observation - Ex: 'Terapia a vácuo não listou no dropdown.'
 * @param {object} errorData - Any supabase error payload or message
 */
export function recordAction(profile, screen, action, status, observation = '', errorData = null) {
  auditResults.push({
    profile,
    screen,
    action,
    status,
    observation,
    errorData,
    timestamp: new Date().toISOString()
  });

  if (status === 'AINDA_FALHA' || status === 'FALHA_TECNICA' || status === 'OPERACAO_NAO_PERSISTIU' || status === 'ERRO_TERAPIA_VACUO_AINDA_FALHA' || status === 'ERRO_NOTIFICACAO_AINDA_FALHA') {
    totalErrors++;
  }
}

export function captureSupabaseError(requestUrl, method, status, payload, responseBody) {
  supabaseErrors.push({
    url: requestUrl,
    method,
    status,
    payload,
    responseBody,
    timestamp: new Date().toISOString()
  });
}

export function generateReports() {
  const reportsDir = path.resolve(process.cwd(), 'qa-reports/latest');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const jsonPath = path.join(reportsDir, 'AUDITORIA_OPERACIONAL_COMPLETA_CEIC.json');
  const txtPath = path.join(reportsDir, 'AUDITORIA_OPERACIONAL_COMPLETA_CEIC.txt');
  const htmlPath = path.join(reportsDir, 'AUDITORIA_OPERACIONAL_COMPLETA_CEIC.html');

  // Counts
  let countOK = 0;
  let countAindaFalha = 0;
  let countMassaIndisp = 0;
  let countFalhaTecnica = 0;
  let countBloqueado = 0;

  const isFalhaTecnica = status => status === 'FALHA_TECNICA' || status.startsWith('FALHA_TECNICA_');

  auditResults.forEach(r => {
    if (r.status === 'OK' || r.status === 'CORRIGIDO') countOK++;
    else if (isFalhaTecnica(r.status)) countFalhaTecnica++;
    else if (r.status === 'MASSA_INDISPONIVEL') countMassaIndisp++;
    else if (r.status === 'BLOQUEADO_CORRETAMENTE') countBloqueado++;
    else if (r.status.includes('FALHA') || r.status.includes('NAO_PERSISTIU')) countAindaFalha++;
  });

  // Decision Logic
  let decision = 'PRONTO_PARA_PILOTO_ENFERMAGEM';
  
  // Condicoes para invalidar script
  const isAborted = auditResults.some(r => r.observation.includes('AUDITORIA_ABORTADA_OU_BROWSER_FECHADO'));
  const attemptedProfiles = new Set(auditResults.map(r => r.profile)).size;
  
  if (isAborted || countFalhaTecnica >= 5 || attemptedProfiles < 4 || auditResults.length < 15) {
    decision = 'AUDITORIA_INVALIDA_CORRIGIR_SCRIPT';
  } else if (countAindaFalha > 0 || supabaseErrors.length > 0) {
    decision = 'NAO_PRONTO_CORRIGIR_FALHAS';
  }

  // JSON
  const finalData = {
    decision,
    summary: {
      totalProfilesTested: attemptedProfiles, 
      totalActions: auditResults.length,
      countOK,
      countAindaFalha,
      countMassaIndisp,
      countFalhaTecnica,
      countBloqueado,
    },
    ultimaEtapaExecutada: currentStep,
    knownRisks: [
      "RISCO_CONHECIDO_SEGURANCA: senhas em texto claro devem ser tratadas antes da liberação ampla em produção.",
      "MASSA_INDISPONIVEL não significa necessariamente falha, mas limita cobertura.",
      "Teste automatizado não substitui piloto acompanhado com enfermagem."
    ],
    supabaseErrors,
    details: auditResults
  };
  fs.writeFileSync(jsonPath, JSON.stringify(finalData, null, 2), 'utf-8');

  // TXT
  let txtContent = `==========================================================\n`;
  txtContent += `AUDITORIA OPERACIONAL COMPLETA - CEIC APP\n`;
  txtContent += `==========================================================\n\n`;
  txtContent += `RESULTADO FINAL: ${decision}\n\n`;
  
  if (decision === 'AUDITORIA_INVALIDA_CORRIGIR_SCRIPT') {
    txtContent += `--- INTERPRETAÇÃO ---\n`;
    txtContent += `Esta execução não é válida para decidir prontidão do sistema porque houve FALHA_TECNICA / browser fechado antes de completar os fluxos.\n`;
    txtContent += `Se a causa foi Ctrl+C ou fechamento manual do terminal/navegador, rodar novamente sem interromper.\n`;
    txtContent += `ÚLTIMA ETAPA TENTADA: Perfil: ${currentStep.perfil} | Tela: ${currentStep.tela} | Ação: ${currentStep.acao}\n\n`;
  }

  txtContent += `--- RESUMO ---\n`;
  txtContent += `Total de Ações: ${auditResults.length}\n`;
  txtContent += `OK: ${countOK}\n`;
  txtContent += `Ainda Falha (Sistema): ${countAindaFalha}\n`;
  txtContent += `Massa Indisponível: ${countMassaIndisp}\n`;
  txtContent += `Falha Técnica (Teste / Timeout): ${countFalhaTecnica}\n`;
  txtContent += `Bloqueado Corretamente: ${countBloqueado}\n\n`;
  
  txtContent += `--- RISCOS CONHECIDOS ---\n`;
  finalData.knownRisks.forEach(r => txtContent += `- ${r}\n`);
  txtContent += `\n`;

  txtContent += `--- ERROS SUPABASE CAPTURADOS (${supabaseErrors.length}) ---\n`;
  supabaseErrors.forEach(err => {
    txtContent += `[${err.status}] ${err.method} ${err.url}\nPayload: ${JSON.stringify(err.payload)}\nResponse: ${err.responseBody}\n\n`;
  });

  txtContent += `--- DETALHES DAS AÇÕES ---\n`;
  auditResults.forEach(r => {
    txtContent += `[${r.status}] Perfil: ${r.profile} | Tela: ${r.screen} | Ação: ${r.action}\n`;
    if (r.observation) txtContent += `   Obs: ${r.observation}\n`;
    if (r.errorData) txtContent += `   ErrorData: ${JSON.stringify(r.errorData)}\n`;
    txtContent += `\n`;
  });

  fs.writeFileSync(txtPath, txtContent, 'utf-8');

  // HTML
  let interpretationHTML = '';
  if (decision === 'AUDITORIA_INVALIDA_CORRIGIR_SCRIPT') {
    interpretationHTML = `
      <div class="card" style="border-left: 4px solid #f59e0b; background-color: #fffbeb;">
        <h2 style="color: #d97706; margin-top:0;">INTERPRETAÇÃO DE FALHA OU TIMEOUT</h2>
        <p style="color: #92400e;">Esta execução não é válida para decidir prontidão do sistema porque houve FALHA_TECNICA / TIMEOUT / browser fechado antes de completar os fluxos.</p>
        <p style="color: #92400e;"><strong>Última Etapa Registrada:</strong> ${currentStep.perfil} - ${currentStep.tela} (${currentStep.acao})</p>
        <p style="color: #92400e;"><strong>Se a causa foi Ctrl+C ou fechamento manual do terminal/navegador, rodar novamente sem interromper.</strong></p>
      </div>
    `;
  }

  let htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Auditoria Operacional Completa CEIC</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f9fafb; color: #111827; }
    h1 { color: #1f2937; }
    .decision { font-size: 24px; font-weight: bold; padding: 15px; border-radius: 8px; margin-bottom: 20px; color: #fff; display: inline-block; }
    .pronto { background: #059669; }
    .nao_pronto { background: #dc2626; }
    .invalida { background: #d97706; }
    .card { background: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; }
    .status-OK { color: #059669; font-weight: bold; }
    .status-AINDA_FALHA { color: #dc2626; font-weight: bold; }
    .status-FALHA_TECNICA { color: #9ca3af; font-weight: bold; }
    .status-MASSA_INDISPONIVEL { color: #d97706; font-weight: bold; }
    .status-BLOQUEADO_CORRETAMENTE { color: #2563eb; font-weight: bold; }
  </style>
</head>
<body>
  <h1>Auditoria Operacional Completa - CEIC App</h1>
  <div class="decision ${decision === 'PRONTO_PARA_PILOTO_ENFERMAGEM' ? 'pronto' : (decision === 'NAO_PRONTO_CORRIGIR_FALHAS' ? 'nao_pronto' : 'invalida')}">${decision}</div>
  
  ${interpretationHTML}

  <div class="card">
    <h2>Resumo</h2>
    <ul>
      <li>Ações executadas: ${auditResults.length}</li>
      <li>OK / Corrigido: ${countOK}</li>
      <li>Falhas Críticas no Sistema: ${countAindaFalha}</li>
      <li>Massa Indisponível: ${countMassaIndisp}</li>
      <li>Bloqueios Válidos: ${countBloqueado}</li>
      <li>Erros Técnicos no Script/Cancelamentos: ${countFalhaTecnica}</li>
    </ul>
  </div>

  <div class="card">
    <h2>Riscos Conhecidos</h2>
    <ul>
      ${finalData.knownRisks.map(r => `<li>${r}</li>`).join('')}
    </ul>
  </div>

  <div class="card">
    <h2>Ações Detalhadas</h2>
    <table>
      <thead>
        <tr><th>Perfil</th><th>Tela</th><th>Ação</th><th>Status</th><th>Observação</th></tr>
      </thead>
      <tbody>
        ${auditResults.map(r => `
          <tr>
            <td>${r.profile}</td>
            <td>${r.screen}</td>
            <td>${r.action}</td>
            <td class="status-${r.status.split('_')[0] === 'ERRO' || (r.status.includes('FALHA') && r.status !== 'FALHA_TECNICA') ? 'AINDA_FALHA' : r.status}">${r.status}</td>
            <td>${r.observation}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
</body>
</html>`;
  fs.writeFileSync(htmlPath, htmlContent, 'utf-8');
}

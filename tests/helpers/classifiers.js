export function classifyError(errorText) {
  const text = String(errorText).toLowerCase();

  if (text.includes('protecao_credenciais') || text.includes('segurança')) {
    return 'PROTECAO_CREDENCIAIS';
  }
  if (text.includes('feature_nao_implementada_ou_nao_visivel')) return 'FEATURE_NAO_IMPLEMENTADA_OU_NAO_VISIVEL';
  if (text.includes('massa_real_indisponivel')) return 'MASSA_REAL_INDISPONIVEL';
  if (text.includes('frontend_permissao_ui')) return 'FRONTEND_PERMISSAO_UI';
  if (text.includes('massa_de_teste_ausente')) return 'MASSA_DE_TESTE_AUSENTE';
  if (text.includes('seletor_fragil_ou_desatualizado')) return 'SELETOR_FRAGIL_OU_DESATUALIZADO';

  if (text.includes('chrome-extension://') || text.includes('content.js') || text.includes('chunkloaderror')) {
    return 'RUIDO_EXTENSAO_IGNORAVEL';
  }

  if (text.includes('column does not exist') || text.includes('could not find') || text.includes('postgrest error') || text.includes('http 400') || text.includes('status of 400')) {
    return 'BANCO_SCHEMA_OU_PAYLOAD';
  }

  if (text.includes('401') || text.includes('403') || text.includes('permission denied') || text.includes('violates row-level security')) {
    return 'RLS_PERMISSAO';
  }

  if (text.includes('selector timeout') || text.includes('not found') || text.includes('not visible') || text.includes('waiting for')) {
    return 'FRONTEND_UI_SELECTOR';
  }

  if (text.includes('typeerror') || text.includes('referenceerror') || text.includes('syntaxerror') || text.includes('cannot read properties')) {
    return 'FRONTEND_JS';
  }

  if (text.includes('operação não persistiu') || text.includes('operacao nao persistiu')) {
    return 'OPERACAO_NAO_PERSISTIU';
  }

  if (text.includes('fake success') || text.includes('fake_success')) {
    return 'FAKE_SUCCESS_PERSISTENCIA';
  }

  return 'DESCONHECIDO';
}

export function analyzeError(error = {}) {
  const message = typeof error === 'string'
    ? error
    : [
        error.message,
        error.responseBody?.message,
        error.responseBody?.code,
        error.url,
        error.method
      ].filter(Boolean).join(' ');

  const classificacao = classifyError(message);
  const diagnosis = {
    classificacao,
    camada: 'DESCONHECIDA',
    arquivoProvavel: null,
    funcaoProvavel: null,
    fluxoFuncional: null,
    tabelaSupabase: null,
    operacaoSupabase: null,
    campoProblematico: null,
    valorEnviado: null,
    causaProvavel: message || 'Erro não classificado.',
    acaoSugerida: 'Verificar a evidência capturada no relatório.'
  };

  if (classificacao === 'BANCO_SCHEMA_OU_PAYLOAD' || classificacao === 'RLS_PERMISSAO') {
    diagnosis.camada = 'BANCO_SUPABASE';
    diagnosis.tabelaSupabase = inferSupabaseTable(error.url);
    diagnosis.operacaoSupabase = inferSupabaseOperation(error.method);
    diagnosis.campoProblematico = inferProblemField(message, error.payload, error.responseBody);
    diagnosis.valorEnviado = getPayloadValue(error.payload, diagnosis.campoProblematico);
    diagnosis.acaoSugerida = 'Verificar payload enviado, campos esperados e permissões Supabase.';
  } else if (classificacao.startsWith('FRONTEND_') || classificacao === 'OPERACAO_NAO_PERSISTIU') {
    diagnosis.camada = 'FRONTEND_REACT';
    diagnosis.arquivoProvavel = 'src/App.jsx';
    diagnosis.acaoSugerida = 'Verificar seletor, renderização condicional e fluxo da tela.';
  } else if (classificacao === 'MASSA_DE_TESTE_AUSENTE') {
    diagnosis.camada = 'MASSA_DE_TESTE';
    diagnosis.acaoSugerida = 'Preparar a massa necessária por fluxo seguro de UI ou banco de teste autorizado.';
  } else if (classificacao === 'PROTECAO_CREDENCIAIS') {
    diagnosis.camada = 'POLITICA_SEGURANCA_QA';
    diagnosis.acaoSugerida = 'Remover a ação sensível da matriz de auditoria.';
  }

  return diagnosis;
}

function inferSupabaseTable(url) {
  const match = String(url || '').match(/\/rest\/v1\/([^?]+)/);
  return match?.[1] || null;
}

function inferSupabaseOperation(method) {
  const map = { POST: 'INSERT', PATCH: 'UPDATE', PUT: 'UPDATE', DELETE: 'DELETE', GET: 'SELECT' };
  return map[String(method || '').toUpperCase()] || null;
}

function inferProblemField(message, payload, responseBody) {
  const text = [message, responseBody?.message, responseBody?.details, responseBody?.hint].filter(Boolean).join(' ');
  const columnMatch = text.match(/column\s+"?([a-zA-Z0-9_]+)"?\s+does not exist/i);
  if (columnMatch) return columnMatch[1];

  const fieldMatch = text.match(/(?:field|campo|column|coluna)\s+"?([a-zA-Z0-9_]+)"?/i);
  if (fieldMatch) return fieldMatch[1];

  const payloadItem = Array.isArray(payload) ? payload[0] : payload;
  if (payloadItem && typeof payloadItem === 'object') {
    return Object.keys(payloadItem).find(key => text.toLowerCase().includes(key.toLowerCase())) || null;
  }

  return null;
}

function getPayloadValue(payload, field) {
  if (!field) return null;
  const payloadItem = Array.isArray(payload) ? payload[0] : payload;
  if (!payloadItem || typeof payloadItem !== 'object') return null;
  return payloadItem[field] ?? payloadItem[field.toLowerCase()] ?? null;
}

console.log('[DEBUG] fix_app_bug.cjs INICIO');
const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'src', 'App.jsx');
const backupPath = path.join(__dirname, 'src', 'App.jsx.backup_fix_app_bug');

console.log('Iniciando script de correção...');

try {
    fs.copyFileSync(appPath, backupPath);
    console.log('[CHECK] Backup criado: ' + backupPath);
} catch (e) {
    console.error('[ERRO] Falha ao criar backup do App.jsx: ' + e.message);
    process.exit(1);
}

let content = fs.readFileSync(appPath, 'utf8');

const STR_ARROW = "\x3D\x3E";
const STR_AND = "\x26\x26";

// 1. Atualizar mapPedido campo a campo para não quebrar outros atributos
const mapReplacements = [
    {
        old: /equipmentType:\s*normUpper\([^)]*\)/,
        newStr: 'equipmentType: normUpper(raw.equipmentType || raw.equipmenttype || raw["equipmentType"] || raw["equipmenttype"] || raw.tipo_equipamento || \'\')'
    },
    {
        old: /equipmentTag:\s*normUpper\([^)]*\)/,
        newStr: 'equipmentTag: normUpper(raw.equipmentTag || raw.equipmenttag || raw["equipmentTag"] || raw["equipmenttag"] || \'\')'
    },
    {
        old: /sector:\s*trimText\([^)]*\)/,
        newStr: 'sector: trimText(raw.sector || raw.Sector || raw.setor || raw.unit || raw.Unit || raw.unidade || \'\')'
    },
    {
        old: /unit:\s*trimText\([^)]*\)/,
        newStr: 'unit: trimText(raw.unit || raw.Unit || raw.unidade || raw.sector || raw.Sector || raw.setor || \'\')'
    },
    {
        old: /patientName:\s*trimText\([^)]*\)/,
        newStr: 'patientName: trimText(raw.patientName || raw.patientname || raw.nome_paciente || \'\')'
    },
    {
        old: /patientMV:\s*trimText\([^)]*\)/,
        newStr: 'patientMV: trimText(raw.patientMV || raw.patientmv || raw.mv || raw.registro_mv || \'\')'
    },
    {
        old: /patientBed:\s*trimText\([^)]*\)/,
        newStr: 'patientBed: trimText(raw.patientBed || raw.patientbed || raw.leito || \'\')'
    },
    {
        old: /requesterName:\s*trimText\([^)]*\)/,
        newStr: 'requesterName: trimText(raw.requesterName || raw.requestername || raw.solicitante || \'\')'
    },
    {
        old: /requesterBadge:\s*trimText\([^)]*\)/,
        newStr: 'requesterBadge: trimText(raw.requesterBadge || raw.requesterbadge || raw.matricula || \'\')'
    },
    {
        old: /timestamp:\s*raw\.timestamp[\s\S]*?null/,
        newStr: 'timestamp: raw.timestamp || raw.created_at || raw.createdAt || raw.createdat || null'
    }
];

let mapPedidoUpdated = false;
for (let i = 0; i < mapReplacements.length; i++) {
    const repl = mapReplacements[i];
    if (repl.old.test(content)) {
        content = content.replace(repl.old, repl.newStr);
        mapPedidoUpdated = true;
    }
}

// 2. Insert Request logic
let handleCreateUpdated = false;
const mathRandomRegex = /id:\s*requestData\?\.id\s*\|\|\s*\`REQ-\$\{Math\.random\(\)\.toString\(36\)\.substr\(2,\s*9\)\.toUpperCase\(\)\}\`,\s*/;
if (mathRandomRegex.test(content)) {
    content = content.replace(mathRandomRegex, '');
    handleCreateUpdated = true;
}

const insertStr = 'const { data, error } \x3D await supabase.from(\'pedidos\').insert(newRequest).select().single();\n\n                    if (error) {\n                        throw error;\n                    }\n\n                    if (!data || !data.id) {\n                        throw new Error(\'OPERACAO_NAO_PERSISTIU_PEDIDO\');\n                    }\n                    \n                    const pedidoPersistido \x3D mapPedido(data);\n\n                    setRequests(function(prev) {\n                        const exists \x3D prev.some(function(p) { return p.id \x3D\x3D\x3D pedidoPersistido.id; });\n                        if (exists) return prev;\n                        return [pedidoPersistido, ...prev];\n                    });\n\n                    showNotification(\'success\', \'Solicitação enviada com sucesso!\');\n                    setCurrentView(\'meus_pedidos\');';

const insertRegex = /const\s+\{\s*data,\s*error\s*\}\s*\x3D\s*await\s+supabase\.from\('pedidos'\)\.insert\(\[newRequest\]\)\.select\(\);[\s\S]*?setCurrentView\('meus_pedidos'\);/;
if (insertRegex.test(content)) {
    content = content.replace(insertRegex, insertStr);
    handleCreateUpdated = true;
}

// 3. Login Screen
let loginUpdated = false;
const loginStr = 'onLogin({\n                        role: data.perfil,\n                        sector: data.setor_nome || data.login,\n                        login: data.login,\n                        badge: data.matricula || data.badge || data.login,\n                        name: data.nome || data.name || data.login\n                    });';

const loginRegex = new RegExp('onLogin\\(\\{\\s*role:\\s*data\\.perfil,\\s*sector:\\s*data\\.setor_nome\\s*\\|\\|\\s*data\\.login\\s*\\}\\);');
if (loginRegex.test(content)) {
    content = content.replace(loginRegex, loginStr);
    loginUpdated = true;
}

// 4. Meus Pedidos Filter - Nova lógica
let filterUpdated = false;
const filterStr = 'const mySectorPendingRequests \x3D useMemo(function() {\n                return requests.filter(function(r) {\n                    const isMineSector \x3D sameText(r.sector, userProfile?.sector) || sameText(r.unit, userProfile?.sector);\n                    const isMineBadge \x3D Boolean(userProfile?.badge ' + STR_AND + ' r.requesterBadge) ' + STR_AND + ' sameText(r.requesterBadge, userProfile.badge);\n                    const isMineLogin \x3D Boolean(userProfile?.login ' + STR_AND + ' r.requesterLogin) ' + STR_AND + ' sameText(r.requesterLogin, userProfile.login);\n                    \n                    const isMine \x3D isMineSector || isMineBadge || isMineLogin;\n                    if (!isMine) return false;\n\n                    const s \x3D String(r.status || \'\').toLowerCase();\n                    const validStatuses \x3D [\'pending\', \'pendente\', \'waitlist\', \'fila\', \'approved\', \'aprovado\', \'cancelled\', \'cancelado\'];\n                    \n                    if (validStatuses.includes(s)) {\n                        if ((s \x3D\x3D\x3D \'approved\' || s \x3D\x3D\x3D \'aprovado\') ' + STR_AND + ' isTransportRequest(r.equipmentType)) {\n                            return !r.returnToCeicTime;\n                        }\n                        return true;\n                    }\n\n                    return false;\n                });\n            }, [requests, userProfile]);';

const filterRegex = /const\s+mySectorPendingRequests\s*\x3D\s*useMemo\(function\(\)\s*\{\s*return\s+requests\.filter\(function\(r\)\s*\{[\s\S]*?return\s+false;\s*\}\);\s*\},\s*\[requests,\s*requesterSector\]\);/;

if (filterRegex.test(content)) {
    content = content.replace(filterRegex, filterStr);
    filterUpdated = true;
}

// 5. Injeção de data-testids no MyRequestsView
let uiUpdated = false;
const equipmentTypeRegex = /<h3 className="font-bold text-gray-800">\{req\.equipmentType\}<\/h3>/g;
const equipmentTypeStr = '<h3 data-testid="request-equipment-name" className="font-bold text-gray-800">{req.equipmentType}</h3>';

const patientNameRegex = /<span className="flex items-center gap-1">\s*<User size=\{12\} \/> \{req\.patientName\}\s*<\/span>/;
const patientNameStr = '<span className="flex items-center gap-1">\n                                                                <User size={12} /> <span data-testid="request-patient-name">{req.patientName}</span>\n                                                                {req.patientMV ' + STR_AND + ' <span data-testid="request-patient-mv" className="ml-2 font-mono bg-gray-100 px-1 rounded text-[10px]">MV: {req.patientMV}</span>}\n                                                            </span>';

if (equipmentTypeRegex.test(content) || patientNameRegex.test(content)) {
    content = content.replace(equipmentTypeRegex, equipmentTypeStr);
    content = content.replace(patientNameRegex, patientNameStr);
    uiUpdated = true;
}

// Validation before save
const preservesMessage = content.includes('notificationMessage:');
const preservesType = content.includes('notificationType:');
const preservesTime = content.includes('notificationTime:');
const preservesFulfilled = content.includes('fulfilledAt:');
const preservesAccessories = content.includes('accessories:');

console.log('[CHECK] mapPedido preserva notificationMessage: ' + (preservesMessage ? 'SIM' : 'NÃO'));
console.log('[CHECK] mapPedido preserva notificationType: ' + (preservesType ? 'SIM' : 'NÃO'));
console.log('[CHECK] mapPedido preserva notificationTime: ' + (preservesTime ? 'SIM' : 'NÃO'));
console.log('[CHECK] mapPedido preserva fulfilledAt: ' + (preservesFulfilled ? 'SIM' : 'NÃO'));
console.log('[CHECK] mapPedido preserva accessories: ' + (preservesAccessories ? 'SIM' : 'NÃO'));

console.log('[CHANGE] handleCreateRequest atualizado: ' + (handleCreateUpdated ? 'SIM' : 'NÃO'));
console.log('[CHANGE] filtro Meus Pedidos atualizado: ' + (filterUpdated ? 'SIM' : 'NÃO'));
console.log('[CHANGE] data-testids inseridos em MyRequestsView: ' + (uiUpdated ? 'SIM' : 'NÃO'));

let abortSave = false;
if (!preservesMessage || !preservesType || !preservesTime || !preservesFulfilled || !preservesAccessories) {
    console.error('[ERRO] O mapPedido perdeu propriedades fundamentais! Abortando salvamento.');
    abortSave = true;
}

const hasHardcodeMV = content.includes('MV-VERIFICACAO-CEIC');
const hasHardcodeNome = content.includes('PACIENTE VERIFICACAO CEIC');

if (hasHardcodeMV || hasHardcodeNome) {
    console.error('[ERRO] Hardcode de testes detectado no código modificado. Abortando.');
    abortSave = true;
}

if (abortSave) {
    fs.copyFileSync(backupPath, appPath);
    console.log('[RESTORE] Backup restaurado.');
    process.exit(1);
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('\\n[SUCESSO] App.jsx corrigido de forma segura e pontual!');
console.log('[DEBUG] fix_app_bug.cjs FIM');
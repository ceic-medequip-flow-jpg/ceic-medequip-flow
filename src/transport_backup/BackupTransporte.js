// =======================================================================
// BACKUP DE LÓGICAS DO TRANSPORTE DE PACIENTES
// Criado para ser reutilizado no futuro sistema de transporte.
// =======================================================================

/* 
1. TAB NO MENU E VIEWS
{ id: 'admin_transporte', label: 'Indicadores de Transporte', icon: Activity, roles: ['GESTAO', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'] }
{currentView === 'admin_transporte' && <AdminEntregaWrapper requests={requests} inventory={inventory} />}

2. FUNÇÃO AUXILIAR
const isTransportRequest = (type) => normUpper(type).startsWith('TRANSPORTE:');

3. CATALOGO E CATEGORIA (App.jsx)
TRANSPORTE: {
    label: "Equipamentos para Transporte de Paciente",
    destinations: ["Hemodinâmica", "Centro Cirúrgico", "Ressonância", "Tomografia", "Raio-X", "Endoscopia", "Outro"]
}

4. NEW REQUEST FORM (Lógica e UI)
// Variáveis de estado
const [transportDest, setTransportDest] = useState('');
const [transportItems, setTransportItems] = useState([]);

// Toggle de itens
const toggleTransportItem = (item) => { setTransportItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };

// Payload Logic
} else if (category && normUpper(category).includes('TRANSPORTE')) {
    if (transportItems.length === 0) {
        showNotification('error', 'Selecione ao menos um item de transporte.');
        return null;
    }
    finalEquip = `Transporte: ${transportItems.join(' + ')}`;
    let isolInfo = isolation ? `Isolamento: ${isolationType}` : 'Sem Isolamento';
    let emergInfo = isEmergency ? ' | PRIORIDADE/URGÊNCIA' : '';

    finalDetails = `Destino: ${transportDest} | ${isolInfo}${emergInfo}`;
    if (!transportDest || !isolation) {
        showNotification('error', 'Preencha todos os campos de transporte.');
        return null;
    }
}

// UI Blocks
{category && normUpper(category).includes('TRANSPORTE') && (
    <div className="mt-4 p-5 rounded-xl border animate-fade-in shadow-sm bg-orange-50 border-orange-200">
        <h4 className="text-orange-800 font-bold mb-4 flex items-center gap-2"><Truck size={18} /> Dados do Transporte</h4>
        <div className="space-y-4">
            <div>
                <label className="label text-orange-900">Destino do Paciente *</label>
                <select value={transportDest} onChange={e => setTransportDest(e.target.value)} className="input border-orange-200 focus:border-orange-500 focus:ring-orange-500">
                    <option value="">Destino...</option>
                    {equipmentCatalog.TRANSPORTE.destinations.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
            </div>
            <div>
                <label className="label font-bold text-orange-800 mb-2">Itens para Transporte:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(transportCatalog || []).map(item => item.nome_oficial).map(item => (
                        <label key={item} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-50">
                            <input type="checkbox" checked={transportItems.includes(item)} onChange={() => toggleTransportItem(item)} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" />
                            <span className="text-gray-700 font-medium text-sm">{item}</span>
                        </label>
                    ))}
                </div>
                <p className="text-xs text-orange-600 mt-2 font-bold">Selecionados: {transportItems.length > 0 ? transportItems.join(', ') : 'Nenhum'}</p>
            </div>
        </div>
    </div>
)}


5. FILA OPERACIONAL (OperatorDashboard / PendingRequestCard)
// Filtragem Especial (Transporte aprovado continua na tela se não retornou ao CEIC)
const pending = requests.filter(r => {
    if (r.status === 'pending' || r.status === 'waitlisted' || r.status === 'pickup_requested' || r.status === 'in_transfer') return true;
    if (r.status === 'approved' && isTransportRequest(r.equipmentType)) {
        return !r.returnToCeicTime;
    }
    return false;
});

// Ações de Atualização do tempo de transporte
onUpdateTransportTimes(req.id, { startTransportTime: new Date().toISOString() })
onUpdateTransportTimes(req.id, { endTransportTime: new Date().toISOString() })
onUpdateTransportTimes(req.id, { returnToCeicTime: new Date().toISOString() })

// Renderização dos Botões de Fluxo
{req.status === 'approved' && isTransportRequest(req.equipmentType) && (
    <div className="mt-3 flex flex-wrap gap-2">
        {!req.startTransportTime && (
            <button onClick={() => onUpdateTransportTimes(req.id, { startTransportTime: new Date().toISOString() })} className="btn flex-1 bg-green-500 hover:bg-green-600 text-white text-xs py-1.5 px-3">
                <Play size={14} className="mr-1" /> INICIAR TRANSPORTE
            </button>
        )}
        {req.startTransportTime && !req.endTransportTime && (
            <button onClick={() => onUpdateTransportTimes(req.id, { endTransportTime: new Date().toISOString() })} className="btn flex-1 bg-purple-500 hover:bg-purple-600 text-white text-xs py-1.5 px-3">
                <CheckCircle2 size={14} className="mr-1" /> FINALIZAR TRANSPORTE
            </button>
        )}
        {req.endTransportTime && !req.returnToCeicTime && (
            <button onClick={() => onUpdateTransportTimes(req.id, { returnToCeicTime: new Date().toISOString() })} className="btn flex-1 bg-gray-500 hover:bg-gray-600 text-white text-xs py-1.5 px-3">
                <CornerDownLeft size={14} className="mr-1" /> RETORNOU AO CEIC
            </button>
        )}
    </div>
)}

6. LÓGICA DE MULTITAGS PARA TRANSPORTE
const isTransport = isTransportRequest(req.equipmentType);
const isMultiTag = isTransport || isCapnografia;
const multiTagItemsList = isTransport 
    ? normUpper(req.equipmentType).replace('TRANSPORTE: ', '').split(' + ') 
    : (isCapnografia ? ['MÓDULO DE CAPNOGRAFIA', 'CABO DE CAPNOGRAFIA', 'CÉLULA DE CAPNOGRAFIA'] : []);
*/

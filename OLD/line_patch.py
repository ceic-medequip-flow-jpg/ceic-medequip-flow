import os

filepath = r'C:/Users/jesus.cavalcante/Desktop/CEIC_App/index.html'

new_block = """        const PendingRequestCard = ({ req, inventory, onFulfill, showNotification, onProcessPickup, onCancel,
            onNotifyRequester, onUpdateTransportTimes }) => {
            const [typedTag, setTypedTag] = useState('');
            const [multiTags, setMultiTags] = useState({});
            const [isCancelling, setIsCancelling] = useState(false);
            const [isNotifying, setIsNotifying] = useState(false);
            const [cancelReason, setCancelReason] = useState('');
            const [cancelName, setCancelName] = useState('');
            const [cancelBadge, setCancelBadge] = useState('');

            const [arrivalTime, setArrivalTime] = useState(req.arrivalTime || '');
            const [departureTime, setDepartureTime] = useState(req.departureTime || '');
            const [returnToUnitTime, setReturnToUnitTime] = useState(req.returnToUnitTime || '');
            const [returnToCeicTime, setReturnToCeicTime] = useState(req.returnToCeicTime || '');
            
            const [availableTags, setAvailableTags] = useState([]);

            const isTransport = req.equipmentType?.startsWith('Transporte:');
            const transportItemsList = isTransport ? req.equipmentType.replace('Transporte: ', '').split(' + ') : [];
            const isInTransit = req.status === 'approved' && isTransport;
            
            useEffect(() => {
                const fetchTags = async () => {
                    if (!req.equipmentType) return;
                    
                    let equipmentsToSearch = [];
                    if (isTransport) {
                        equipmentsToSearch = transportItemsList;
                    } else {
                        // Limpa complementos do nome para buscar corretamente na tabela
                        equipmentsToSearch = [req.equipmentType.split(' + ')[0].split(' (')[0].trim()];
                    }
                    
                    // Ajuste com a instancia global supabaseClient
                    const { data, error } = await window.supabaseClient
                        .from('equipamentos')
                        .select('tag, Equipamento')
                        .in('status', ['available', 'disponivel', 'livre'])
                        .in('Equipamento', equipmentsToSearch);
                        
                    if (data && !error) {
                        if (isTransport) {
                            const grouped = {};
                            data.forEach(item => {
                                if (!grouped[item.Equipamento]) grouped[item.Equipamento] = [];
                                grouped[item.Equipamento].push(item.tag);
                            });
                            setAvailableTags(grouped);
                        } else {
                            setAvailableTags(data.map(item => item.tag));
                        }
                    }
                };
                // Desabilita em casos de devolução, já que a devolução recolhe a tag já existente
                if (req.kind !== 'return_pickup') {
                    fetchTags();
                }
            }, [req.equipmentType, req.status]);

            const handleConfirm = () => {
                if (isTransport) {
                    const enteredTags = [];
                    for (const item of transportItemsList) {
                        const t = (multiTags[item] || '').trim().toUpperCase();
                        if (!TAG_REGEX.test(t)) {
                            showNotification('error', `TAG inválida para "${item}". Use 4 letras + 4 números.`);
                            return;
                        }
                        enteredTags.push(t);
                    }
                    const uniqueTags = new Set(enteredTags);
                    if (uniqueTags.size !== enteredTags.length) {
                        showNotification('error', 'Você informou TAGs duplicadas. Verifique os equipamentos.');
                        return;
                    }
                    onFulfill(req, enteredTags);
                    setMultiTags({});
                } else {
                    const tag = typedTag.trim().toUpperCase();
                    if (!TAG_REGEX.test(tag)) { showNotification('error', 'TAG inválida. Use 4 letras + 4 números.'); return; }
                    onFulfill(req, tag);
                    setTypedTag('');
                }
            };

            const confirmCancel = () => {
                if (!cancelReason.trim() || !cancelName.trim() || !cancelBadge.trim()) {
                    showNotification('error', 'Preencha todos os campos para cancelar a solicitação.');
                    return;
                }
                onCancel(req.id, { cancelReason, cancelName, cancelBadge });
                setIsCancelling(false);
                setCancelReason(''); setCancelName(''); setCancelBadge('');
            };

            const sendNotification = (type) => {
                let message = "";
                if (type === 'delivery') message = "Sua solicitação foi aceita, aguarde a entrega do equipamento na unidade.";
                else if (type === 'pickup') message = "Sua solicitação foi aceita, o equipamento já pode ser retirado na CEIC.";
                else if (type === 'unavailable') message = "Equipamento Indisponível no momento. Por favor, decida se deseja cancelar a solicitação ou aguardar na fila de espera.";

                onNotifyRequester(req.id, message, type);
                setIsNotifying(false);
            };

            const renderNotifyModal = () => {
                if (!isNotifying) return null;
                return createPortal(
                    <div className="modal-overlay z-50">
                        <div
                            className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in border border-blue-100 max-h-[85vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                                    <Send size={20} /> Notificar Solicitante
                                </h3>
                                <button onClick={() => setIsNotifying(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">Selecione o tipo de notificação para enviar à unidade <strong
                                className="text-gray-800">{req.sector || req.unit}</strong> referente ao equipamento <strong
                                    className="text-gray-800">{req.equipmentType}</strong>:</p>

                            <div className="space-y-3 mb-2">
                                <button onClick={() => sendNotification('delivery')} className="w-full text-left p-4 rounded-xl border border-blue-200 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-start gap-3 group">
                                    <div className="bg-blue-100 p-2 rounded-lg group-hover:bg-blue-200">
                                        <MapPin className="text-blue-700" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">Entregar na Unidade</h4>
                                        <p className="text-xs text-gray-500 mt-1">Avisar que a CEIC vai entregar (Padrão para
                                            Ventiladores e Transporte).</p>
                                    </div>
                                </button>

                                <button onClick={() => sendNotification('pickup')} className="w-full text-left p-4 rounded-xl border border-orange-200 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-start gap-3 group">
                                    <div className="bg-orange-100 p-2 rounded-lg group-hover:bg-orange-200">
                                        <Package className="text-orange-700" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">Retirar na CEIC</h4>
                                        <p className="text-xs text-gray-500 mt-1">Avisar que a equipa deve vir buscar (Padrão para
                                            Gerais ou exceções).</p>
                                    </div>
                                </button>

                                <button onClick={() => sendNotification('unavailable')} className="w-full text-left p-4 rounded-xl border border-red-200 hover:border-red-500 hover:bg-red-50 transition-colors flex items-start gap-3 group">
                                    <div className="bg-red-100 p-2 rounded-lg group-hover:bg-red-200">
                                        <AlertTriangle className="text-red-700" size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-800 text-sm">Equipamento Indisponível</h4>
                                        <p className="text-xs text-gray-500 mt-1">Avisar que não há stock imediato e transferir a
                                            decisão para a unidade assistencial.</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                );
            };

            const renderCancelModal = () => {
                if (!isCancelling) return null;
                return createPortal(
                    <div className="modal-overlay z-50">
                        <div
                            className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in border border-red-100 max-h-[85vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                                    <AlertTriangle size={20} /> Cancelar Solicitação
                                </h3>
                                <button onClick={() => setIsCancelling(false)} className="text-gray-400 hover:text-gray-600">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="bg-red-50 p-3 rounded-lg mb-5 text-sm text-red-800 border border-red-100">
                                <p><span className="font-bold">ID:</span> {req.id}</p>
                                <p><span className="font-bold">Item:</span> {req.equipmentType}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div><label className="label text-gray-700">Motivo do cancelamento *</label><textarea
                                    className="input border-gray-300 focus:border-red-500 focus:ring-red-500" rows="2"
                                    value={cancelReason}
                                    onChange={e => setCancelReason(e.target.value)} required placeholder="Ex: Paciente teve alta, duplicidade de pedido..."></textarea>
                                </div>
                                <div><label className="label text-gray-700">Seu Nome *</label><input type="text"
                                    className="input border-gray-300 focus:border-red-500" value={cancelName} onChange={e =>
                                        setCancelName(e.target.value)} placeholder="Nome do profissional" required /></div>
                                <div><label className="label text-gray-700">Sua Matrícula *</label><input type="text"
                                    className="input border-gray-300 focus:border-red-500" value={cancelBadge} onChange={e =>
                                        setCancelBadge(e.target.value)} placeholder="Ex: 12345" required /></div>
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setIsCancelling(false)} className="flex-1 py-2.5 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
                                <button onClick={confirmCancel}
                                    className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Confirmar</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                );
            };

            const baseStyle = req.kind === 'return_pickup'
                ? 'border-l-4 border-purple-500 hover:bg-purple-50'
                : isInTransit
                    ? 'bg-green-50/30 border-l-4 border-green-500'
                    : req.isWaitlisted
                        ? 'bg-orange-50 border-l-4 border-orange-500'
                        : 'hover:bg-blue-50 border-b border-gray-100';

            let timerVariantOp = 'pending';
            if (isInTransit) timerVariantOp = 'notified_op';
            else if (req.isWaitlisted) timerVariantOp = 'waitlist_op';
            else if (req.notificationTime) timerVariantOp = 'notified_op';
            
            console.log('Filtro Estoque -> Pedido:', req.equipmentType, 'Total no Inventory:', inventory?.length);

            if (req.kind === 'return_pickup') {
                return (
                    <>
                        <div className={`p-4 transition-colors ${baseStyle}`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center flex-wrap gap-2">
                                    <span className="font-mono text-xs text-gray-400">#{req.id}</span>
                                    <span className="text-sm font-bold text-gray-800">{req.equipmentType}</span>
                                    <span
                                        className="text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 px-2 py-1 rounded">RETIRADA</span>
                                    <span
                                        className="text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded"
                                        title="Prazo SLA">{getSlaInfo(req).label}</span>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <LiveTimer startTime={req.timestamp} variant="pending" slaLimitSeconds={getSlaInfo(req).secs} />
                                    <span className="text-xs text-gray-500 flex items-center mt-1">
                                        <Clock size={12} className="mr-1" />{new Date(req.timestamp).toLocaleTimeString([], {
                                            hour:
                                                '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                <p><span className="font-semibold">Setor:</span> {req.sector || req.unit}</p>
                                <p><span className="font-semibold">Solicitante:</span> {req.requesterName}</p>
                                <div className="col-span-2 mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                                    <p><span className="font-semibold">TAG a Recolher:</span> <span
                                        className="font-mono font-bold bg-white px-1 border rounded">{req.equipmentTag}</span></p>
                                    <p className="mt-1"><span className="font-semibold">Defeito Relatado?</span> {req.problemReported ||
                                        'Não'}</p>
                                    {req.problemReported === 'Sim' && <p className="text-red-600 italic">"{req.problemDescription}"</p>}
                                </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-3">
                                <button onClick={() => setIsCancelling(true)} className="h-[40px] px-4 rounded-lg text-red-600 font-bold hover:bg-red-50 flex items-center text-sm transition-colors border border-transparent hover:border-red-200">Cancelar</button>
                                <button onClick={() => onProcessPickup(req)} className="h-[40px] px-4 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center text-sm">
                                    <ClipboardList size={16} className="mr-2" /> Receber / Triagem
                                </button>
                            </div>
                        </div>
                        {renderCancelModal()}
                    </>
                );
            }

            return (
                <>
                    <div className={`p-4 transition-colors ${baseStyle}`}>
                        <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center flex-wrap gap-2">
                                <UrgencyBadge isUrgent={req.isUrgent} />
                                {req.tevPriority === 1 && !req.isUrgent && <span
                                    className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">NÍVEL
                                    1 (ALTO RISCO)</span>}
                                {req.tevPriority === 2 && !req.isUrgent && <span
                                    className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-200">NÍVEL
                                    2 (MÉDIO RISCO)</span>}
                                <span className="font-mono text-xs text-gray-400">#{req.id}</span>
                                <span className="text-sm font-bold text-gray-800">{req.equipmentType}</span>
                                <span
                                    className="text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded"
                                    title="Prazo SLA">{getSlaInfo(req).label}</span>
                                {req.isWaitlisted && !isInTransit && <span
                                    className="text-xs font-bold bg-orange-200 text-orange-800 border border-orange-300 px-2 py-1 rounded">FILA
                                    DE ESPERA</span>}
                                {isInTransit && <span
                                    className="text-xs font-bold bg-green-200 text-green-800 border border-green-300 px-2 py-1 rounded">EM
                                    TRÂNSITO</span>}
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <LiveTimer startTime={req.timestamp} variant={timerVariantOp}
                                    slaLimitSeconds={getSlaInfo(req).secs} />
                                <span className="text-xs text-gray-500 flex items-center mt-1">
                                    <Clock size={12} className="mr-1" />{new Date(req.timestamp).toLocaleTimeString([], {
                                        hour:
                                            '2-digit', minute: '2-digit'
                                    })}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3 mt-2">
                            <p><span className="font-semibold">Setor:</span> {req.sector || req.unit} (R: {req.extension || '-'})
                            </p>
                            <p><span className="font-semibold">Solicitante:</span> {req.requesterName}</p>
                            {req.patientName && <p><span className="font-semibold">Paciente:</span> {req.patientName}</p>}
                            {req.patientBed && <p><span className="font-semibold">Leito:</span> <span
                                className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded">{req.patientBed}</span>
                            </p>}
                            {req.patientMV && <p><span className="font-semibold">MV:</span> <span
                                className="font-mono bg-gray-100 px-1 rounded">{req.patientMV}</span></p>}
                            {req.accessories && req.accessories.length > 0 && <p className="col-span-2"><span
                                className="font-semibold">Detalhes:</span> {req.accessories.join(', ')}</p>}
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                            {isInTransit ? (
                                <div
                                    className="bg-green-50 border border-green-200 text-green-900 p-4 rounded-xl text-sm shadow-sm space-y-4 animate-fade-in">
                                    <div
                                        className="flex flex-col sm:flex-row items-center justify-between gap-2 border-b border-green-200 pb-3">
                                        <div className="flex items-center font-bold text-green-800">
                                            <Send size={18} className="animate-pulse mr-2" /> TRANSPORTE EM ATENDIMENTO
                                        </div>
                                        <span className="text-xs font-normal opacity-80">(Aguardando aceite da unidade de
                                            destino)</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div>
                                            <label className="text-[11px] font-bold text-green-800 mb-1 block uppercase">Chegada na
                                                Unidade</label>
                                            <input type="time"
                                                className="input bg-white border-green-200 focus:border-green-500 focus:ring-green-500 text-sm py-1.5"
                                                value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-green-800 mb-1 block uppercase">Saída da
                                                Unidade</label>
                                            <input type="time"
                                                className="input bg-white border-green-200 focus:border-green-500 focus:ring-green-500 text-sm py-1.5"
                                                value={departureTime} onChange={e => setDepartureTime(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-green-800 mb-1 block uppercase">Retorno p/
                                                Unidade (Opc.)</label>
                                            <input type="time"
                                                className="input bg-white border-green-200 focus:border-green-500 focus:ring-green-500 text-sm py-1.5"
                                                value={returnToUnitTime} onChange={e => setReturnToUnitTime(e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[11px] font-bold text-green-800 mb-1 block uppercase">Retorno p/
                                                CEIC</label>
                                            <input type="time"
                                                className="input bg-white border-green-200 focus:border-green-500 focus:ring-green-500 text-sm py-1.5"
                                                value={returnToCeicTime} onChange={e => setReturnToCeicTime(e.target.value)} />
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button onClick={() => onUpdateTransportTimes(req.id, {
                                            arrivalTime, departureTime,
                                            returnToUnitTime, returnToCeicTime
                                        })} className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm text-xs flex items-center gap-2">
                                            <CheckCircle size={14} /> Gravar Tempos
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-xs font-bold text-gray-500 uppercase">Ações Operacionais</p>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setIsNotifying(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                                                <Send size={14} /> Notificar
                                            </button>
                                            <button onClick={() => setIsCancelling(true)} className="text-xs font-bold text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">Cancelar</button>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <div className="flex-1">
                                            {isTransport ? (
                                                <div className="flex flex-col gap-3">
                                                    {transportItemsList.map((item, idx) => (
                                                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                            <span className="text-xs font-bold text-gray-700 min-w-[160px] truncate"
                                                                title={item}>{item}:</span>
                                                            <div className="relative flex-1">
                                                                <Tag className="absolute left-3 top-3 text-gray-400" size={16} />
                                                                <input className="input pl-9 font-mono w-full text-sm py-2" list={`tags-list-${item}-${req.id}`}
                                                                    value={multiTags[item] || ''} onChange={(e) => setMultiTags({
                                                                        ...multiTags,
                                                                        [item]: e.target.value.toUpperCase()
                                                                    })} placeholder={`TAG do(a) ${item}`} />
                                                                <datalist id={`tags-list-${item}-${req.id}`}>
                                                                    {availableTags[item] && Array.isArray(availableTags[item]) && availableTags[item].map(tag => <option key={tag} value={tag} />)}
                                                                </datalist>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <button onClick={handleConfirm}
                                                        className="h-[44px] px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center whitespace-nowrap mt-1 shadow-sm">
                                                        <BadgeCheck size={18} className="mr-2" /> Confirmar Todos
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                                        <div className="relative flex-1">
                                                            <Tag className="absolute left-3 top-3 text-gray-400" size={16} />
                                                            <input className="input pl-9 font-mono w-full" list={`tags-list-${req.id}`} value={typedTag} onChange={(e) =>
                                                                setTypedTag(e.target.value.toUpperCase())} placeholder="Buscar e selecionar TAG..." />
                                                            <datalist id={`tags-list-${req.id}`}>
                                                                {Array.isArray(availableTags) && availableTags.map(tag => <option key={tag} value={tag} />)}
                                                            </datalist>
                                                        </div>
                                                        <button onClick={handleConfirm}
                                                            className="h-[44px] px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center whitespace-nowrap">
                                                            <BadgeCheck size={18} className="mr-2" /> Confirmar
                                                        </button>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">Disp. estoque: <span className="font-bold">{
                                                        inventory ? inventory.filter(i => {
                                                            // Função interna para limpar acentos, maiúsculas e espaços
                                                            const normalize = (str) => String(str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

                                                            const nomeBanco = normalize(i.type || i.Equipamento);
                                                            const baseEqType = req.equipmentType ? req.equipmentType.split(' + ')[0].split(' (')[0] : '';
                                                            const nomePedido = normalize(baseEqType);
                                                            const statusAtual = normalize(i.status || i.Status || i.Situação);

                                                            // Pega só os 10 primeiros caracteres (ex: "monitor mu") para ignorar o final diferente
                                                            const prefixoBanco = nomeBanco.substring(0, 10);
                                                            const prefixoPedido = nomePedido.substring(0, 10);

                                                            // Verifica se o começo da palavra é igual e se está disponível
                                                            const nomeBate = prefixoBanco && prefixoPedido && (prefixoBanco === prefixoPedido || nomeBanco.includes(prefixoPedido));
                                                            return nomeBate && ['available', 'disponivel', 'livre'].includes(statusAtual);
                                                        }).length : 0
                                                    }</span></p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {renderCancelModal()}
                    {renderNotifyModal()}
                </>
            );
        };
"""

with open(filepath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# line 507 starts at index 506
# line 943 ends at index 942
# the block will replace exactly index 506 to index 942

final_lines = "".join(lines[:506]) + new_block + "".join(lines[943:])

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(final_lines)
print("File successfully patched line 507 to line 943!")

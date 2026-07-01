const AdminSupportView = ({ userProfile, showNotification }) => {
    const [chamados, setChamados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [respostas, setRespostas] = useState({});

    const fetchChamados = async () => {
        setLoading(true);
        const { data, error } = await supabase.from('ceic_suporte').select('*').order('criado_em', { ascending: false });
        if (!error && data) setChamados(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchChamados();
    }, []);

    const getTagStyle = (tipo) => {
        switch (tipo) {
            case 'Problema': return 'bg-red-100 text-red-800 border-red-200';
            case 'Elogio': return 'bg-green-100 text-green-800 border-green-200';
            case 'Sugestão': return 'bg-purple-100 text-purple-800 border-purple-200';
            default: return 'bg-blue-100 text-blue-800 border-blue-200'; // Dúvida
        }
    };

    const handleSalvarAtendimento = async (id) => {
        const resposta = respostas[id];
        if (!resposta || resposta.trim() === '') {
            showNotification('error', 'Preencha o que foi feito antes de salvar.');
            return;
        }

        const payload = {
            atendido_em: new Date().toISOString(),
            atendido_por: userProfile?.name || userProfile?.login || 'Admin',
            resposta: resposta.trim()
        };

        const { error } = await supabase.from('ceic_suporte').update(payload).eq('id', id);
        
        if (error) {
            showNotification('error', 'Erro ao salvar o atendimento.');
        } else {
            showNotification('success', 'Atendimento registrado com sucesso!');
            fetchChamados(); // recarrega a lista
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-6 animate-fade-in pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LifeBuoy className="text-purple-600" /> Chamados de Suporte
                </h2>
                <button onClick={fetchChamados} className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200" title="Atualizar">
                    <Activity size={18} />
                </button>
            </div>
            
            {loading ? (
                <div className="text-center p-12 text-gray-400">Carregando chamados...</div>
            ) : chamados.length === 0 ? (
                <div className="text-center p-12 text-gray-400 bg-white rounded-2xl shadow-sm border border-gray-100">Nenhum chamado de suporte registrado.</div>
            ) : (
                <div className="space-y-4">
                    {chamados.map(c => (
                        <div key={c.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{c.nome} <span className="text-sm font-normal text-gray-500">({c.unidade})</span></h3>
                                    <p className="text-sm text-gray-500">{c.email} {c.ramal ? \| Ramal: \\ : ''}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={\	ext-xs font-bold px-2 py-1 rounded border \\}>{c.tipo}</span>
                                    <span className="text-xs text-gray-400">{new Date(c.criado_em).toLocaleString('pt-BR')}</span>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-gray-700 whitespace-pre-wrap">
                                {c.mensagem}
                            </div>
                            
                            <div className="mt-2 border-t pt-4">
                                {c.atendido_em ? (
                                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                                        <div className="flex items-center gap-2 mb-2 text-green-800 font-bold text-sm">
                                            <CheckCircle size={16} /> 
                                            Atendido por {c.atendido_por} em {new Date(c.atendido_em).toLocaleString('pt-BR')}
                                        </div>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap">{c.resposta}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600">Registrar Atendimento:</label>
                                        <textarea 
                                            className="input text-sm min-h-[80px]" 
                                            placeholder="O que foi feito para resolver este chamado?"
                                            value={respostas[c.id] || ''}
                                            onChange={(e) => setRespostas({...respostas, [c.id]: e.target.value})}
                                        ></textarea>
                                        <div className="flex justify-end">
                                            <button 
                                                onClick={() => handleSalvarAtendimento(c.id)}
                                                className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
                                            >
                                                <CheckCircle size={16} /> Salvar Atendimento
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

import { supabase } from './supabaseClient';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    LayoutDashboard, Package, AlertTriangle, Activity, Settings, Tag, ArrowUpRight,
    ArrowDownLeft, User, Clock, LogOut, SprayCan, ClipboardList, Siren, CheckCircle,
    AlertCircle, Search, BadgeCheck, PlusCircle, List, MapPin, X, Send, ChevronDown,
    ChevronUp, XCircle, Menu, Wrench, BarChart3, Database, Edit, Trash2, LineChart,
    Volume2, VolumeX, Truck, CalendarClock, Eye, EyeOff
} from 'lucide-react';

// =========================================================
// BANCO DE DADOS FIXO E CONSTANTES GERAIS
// =========================================================

// Definição de constantes e opções estáticas do sistema (perfil de usuários, setores, etc).
const ROLES = { OPERATOR: 'Equipe Operacional', REQUESTER: 'Equipe Assistencial', ADMINISTRATOR: 'Gestão / Liderança' };
const LOCATIONS = ['03DN', '03DS', '04GN', '04GS', '04CC', '04DN', '04DS', 'Centro Cirúrgico'];

const SIDEBAR_ITEMS = [
    { id: 'admin_dashboard', label: 'Painel Gerencial', icon: BarChart3, roles: ['GESTAO', 'ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-gestao' },
    { id: 'admin_indicadores', label: 'Indicadores', icon: LineChart, roles: ['GESTAO', 'ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-relatorios' },
    { id: 'admin_transporte', label: 'Indicadores de Transporte', icon: Activity, roles: ['GESTAO', 'ADMIN', 'TESTE', 'ADMIN_TESTE'] },
    { id: 'admin_frota', label: 'Gestão da Frota', icon: Database, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-equipamentos' },
    { id: 'admin_ocorrencias', label: 'Gestão de Ocorrências', icon: AlertTriangle, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE'] },
    { id: 'admin_preventiva', label: 'Plano de Preventivas', icon: CalendarClock, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE'] },
    { id: 'admin_remanejamento', label: 'Remanejamento', icon: Send, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE'] },
    { id: 'admin_entrega_ativa', label: 'Entrega Ativa', icon: Truck, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE'] },
    { id: 'admin_users', label: 'Gestão de Utilizadores', icon: User, roles: ['ADMIN'] },
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-dashboard-operacional' },
    { id: 'estoque', label: 'Estoque Central', icon: Package, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE'] },
    { id: 'triagem', label: 'Triagem / Devolução', icon: ClipboardList, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-triagem' },
    { id: 'manutencao', label: 'Expurgo / Limpeza', icon: SprayCan, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-expurgo' },
    { id: 'nova_solicitacao', label: 'Nova Solicitação', icon: PlusCircle, roles: ['ASSISTENCIAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-nova-solicitacao' },
    { id: 'meus_pedidos', label: 'Meus Pedidos', icon: List, roles: ['ASSISTENCIAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE'], testId: 'nav-meus-pedidos' },
    { id: 'equipamentos_area', label: 'Equipamentos na Minha Área', icon: MapPin, roles: ['ASSISTENCIAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE'] },
];

const CHECKLIST_OPTIONS = { "Monitor de Pressão Intracraniana (PIC)": ["Apenas Kit: Módulo + Cabo", "Maleta completa: Monitor + cabo + módulo + cabos + fonte + Suporte"] };

const EQUIPMENT_DATA = {
    GERAIS: {
        label: "Equipamentos Gerais",
        items: ["Compressor Vascular", "Bomba de Terapia a Vácuo", "Monitor Multiparamétrico", "Monitor de Transporte",
            "Ultrassom", "Manovacuômetro", "Ventilômetro", "Cuffômetro", "Oxímetro Portátil", "Gerador de Marcapasso", "Módulo de Capnografia + cabo", "Módulo Auxiliar PHILLIPS", "Monitor de Pressão Intracraniana (PIC)", "Mochila de Transporte",
            "Solicitar somente os acessórios"],
        accessoryItems: ["Espaçador / Aeropuff", "Célula de Capnografia", "20 Sacos para acondicionamento de circuitos (saco infectante)"]
    },
    VENTILATORIA: {
        label: "ASSISTÊNCIA VENTILATÓRIA",
        types: {
            VMI: { label: "Ventilador Pulmonar Não Invasivo", accessories: ["Umidificação Passiva", "Umidificação ativa"] },
            VMNI: {
                label: "VMNI", accessories: ["Circuito", "Circuito BPAP", "Circuito CPAP", "Máscara Orofacial (sem válvula exalatória)", "Máscara Orofacial (com válvula exalatória)", "Máscara Performax (sem válvula exalatória - azul)",
                    "Máscara Performax (com válvula exalatória - branca/laranja)", "Máscara Nasal"]
            },
            ALTO_FLUXO: { label: "ALTO FLUXO", accessories: ["Circuito Adulto", "Circuito Infantil"] },
            OXIDO: { label: "Óxido Nítrico", accessories: [] },
            APENAS_ACESSORIOS: { label: "Apenas Acessórios (Ventilatório)", accessories: ["Umidificação Passiva", "Umidificação ativa"] }
        }
    },
    TRANSPORTE: {
        label: "Equipamentos para Transporte de Paciente",
        destinations: ["Centro cirúrgico 9º PAMB", "ICESP", "INCOR", "IOT", "Ressonância magnética", "Tomografia 3o andar",
            "Tomografia 4o andar", "Radiologia intervencionista", "11DN", "11DS", "11EE", "11FF", "11GN", "09UAN/UAC - PAMB 9",
            "07AA - UTI", "04GN", "04GS", "PS - Sala de emergência cirúrgica", "PS -Sala de emergência clínica"]
    }
};

const HIGH_FLOW_OPTIONS = {
    "Circuito Adulto": ["Circuito Adulto", "Cânula nasal Adulto P", "Cânula nasal Adulto M", "Cânula nasal Adulto G",
        "Cânula de interface para TQT"],
    "Circuito Infantil": ["Circuito Infantil", "Cânula nasal Infantil (Roxa - até 20L/min)", "Cânula nasal Pediátrica (Verde - até 25L/min)"]
};

// =========================================================
// FUNÇÕES DE AJUDA GERAIS (HELPERS)
// =========================================================

// Funções utilitárias (helpers) compartilhadas.
const pad2 = (n) => String(n).padStart(2, '0');
const trimText = (s) => String(s ?? '').trim();

// Liga/desliga logs de debug no console (deixe false em testes)
const DEBUG_LOGS = false;
const normText = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
const normUpper = (s) => normText(s).toUpperCase();
const normLower = (s) => normText(s).toLowerCase();
const sameText = (a, b) => normUpper(a) === normUpper(b);
const splitTagList = (value) => String(value ?? '').split(',').map(normUpper).filter(Boolean);
const isTransportRequest = (type) => normUpper(type).startsWith('TRANSPORTE:');
const isTevCompressorType = (type) => ['COMPRESSOR PARA TERAPIA VASCULAR', 'COMPRESSOR VASCULAR'].includes(normUpper(type));
const EQUIPMENT_ALIASES = {
    'EQUIPAMENTO DE TERAPIA A VACUO': [
        'BOMBA DE TERAPIA A VACUO',
        'BOMBA TERAPIA VACUO',
        'TERAPIA A VACUO',
        'TERAPIA À VÁCUO',
        'EQUIPAMENTO TERAPIA VACUO',
        'VACUO',
        'VÁCUO'
    ]
};
const getEquipmentAliases = (label) => EQUIPMENT_ALIASES[normUpper(label)] || [];
const normalizeEquipmentTypeForDb = (value) => {
    const raw = String(value ?? '').trim();
    const key = normUpper(raw);
    const canonicalMap = {
        'MONITOR MULTIPARAMETRICO': 'MONITOR MULTIPARAMÉTRICO',
        'MANOVACUOMETRO': 'MANOVACUÔMETRO',
        'BOMBA DE TERAPIA A VACUO': 'EQUIPAMENTO DE TERAPIA À VÁCUO'
    };
    return canonicalMap[key] || raw;
};


const hasUndefined = (obj) => {
    for (const key in obj) {
        if (obj[key] === undefined) return true;
        if (typeof obj[key] === 'object' && obj[key] !== null && hasUndefined(obj[key])) return true;
    }
    return false;
};

const mapPedido = (raw) => {
    if (!raw) return null;
    return {
        ...raw,
        id: raw.id || '',
        status: normLower(raw.status || raw.Status || 'pending'),
        kind: raw.kind || 'solicitacao',
        equipmentType: normUpper(raw.equipment_type || raw.equipmentType || raw.equipmenttype || raw["equipmentType"] || raw["equipmenttype"] || raw.tipo_equipamento || 'NÃO INFORMADO'),
        equipmentTag: normUpper(raw.equipment_tag || raw.equipmentTag || raw.equipmenttag || raw["equipmentTag"] || raw["equipmenttag"] || ''),
        sector: trimText(raw.sector || raw.Sector || raw.setor || raw.unit || raw.Unit || raw.unidade || ''),
        unit: trimText(raw.unit || raw.Unit || raw.unidade || raw.sector || raw.Sector || raw.setor || ''),
        patientName: trimText(raw.patient_name || raw.patientName || raw.patientname || raw.nome_paciente || 'NÃO INFORMADO'),
        patient_mv: trimText(raw.patient_mv || raw.patient_mv || raw.patientmv || raw.mv || raw.registro_mv || '000000'),
        patientBed: trimText(raw.patient_bed || raw.patientBed || raw.patientbed || raw.leito || '00'),
        requesterName: trimText(raw.requester_name || raw.requesterName || raw.requestername || raw.solicitante || 'ANÔNIMO'),
        requesterBadge: trimText(raw.requester_badge || raw.requesterBadge || raw.requesterbadge || raw.matricula || '00000'),
        accessories: Array.isArray(raw.accessories) ? raw.accessories : (raw.accessories ? [raw.accessories] : []),
        isUrgent: !!(raw.is_urgent || raw.isUrgent || raw.isurgent),
        isWaitlisted: !!(raw.is_waitlisted || raw.isWaitlisted || raw.iswaitlisted || raw.status === 'waitlisted'),
        extension: raw.extension || '-',
        notificationMessage: raw.notification_message || raw.notificationMessage || raw.notificationmessage || null,
        notificationType: raw.notification_type || raw.notificationType || raw.notificationtype || null,
        notificationTime: raw.notification_time || raw.notificationTime || raw.notificationtime || null,
        fulfilledAt: raw.fulfilled_at || raw.fulfilledAt || raw.fulfilledat || null,
        transfer_to: raw.transfer_to || raw.transferTo || raw.transferto || null,
        timestamp: raw.timestamp || raw.created_at || raw.createdAt || raw.createdat || null,
        catalogo_equipamentos: raw.catalogo_equipamentos || null
    };
};

const mapEquip = (raw) => {
    if (!raw) return null;
    const location = trimText(raw.location || raw.Location || 'CEIC');
    const model = trimText(raw.model || raw.Model || '');
    const specificLocation = trimText(raw.specificLocation || raw.specificlocation || raw.SpecificLocation || '');
    const transferTo = trimText(raw.transfer_to || raw.transferTo || raw.transferto || '');
    const transferToBed = trimText(raw.transferToBed || raw.transfertobed || '');
    const previousLocation = trimText(raw.previousLocation || raw.previouslocation || '');

    return {
        ...raw,
        tag: normUpper(raw.tag || raw.TAG || raw["TAG"] || ''),
        type: normUpper(raw.type || raw.Equipamento || raw["Equipamento"] || ''),
        status: normLower(raw.status || raw.Status || 'available') || 'available',
        location,
        model,
        specificLocation: specificLocation || null,
        patient_mv: trimText(raw.patient_mv || raw.patient_mv || raw.patientmv || ''),
        patientName: trimText(raw.patientName || raw.patientname || ''),
        transferStatus: normLower(raw.transfer_status || raw.transferStatus || raw.transferstatus || raw.TransferStatus || '') || null,
        transferTo: transferTo || null,
        transferToBed: transferToBed || null,
        transferRejected: raw.transferRejected ?? raw.transferrejected ?? false,
        receivedBySector: raw.received_by_sector ?? raw.receivedBySector ?? raw.receivedbysector ?? null,
        previousLocation: previousLocation || null,
        in_use_since: raw.in_use_since || raw.inUseSince || raw.in_use_since || raw.inusesince || null,
        returnDate: raw.returnDate || raw.returndate || null,
        lastCleaned: raw.lastCleaned || raw.lastcleaned || null,
        notificationNumber: raw.notificationNumber || raw.notificationnumber || null,
        serviceRequestNumber: raw.serviceRequestNumber || raw.servicerequestnumber || null,
    };
};

function formatElapsed(iso) {
    if (!iso) return '-';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return '-';
    const mins = Math.floor(ms / 60000);
    const h = Math.floor(mins / 60);
    const d = Math.floor(h / 24);
    const hh = h % 24;
    const mm = mins % 60;
    if (d > 0) return `${d}d ${pad2(hh)}h`;
    return `${pad2(h)}h ${pad2(mm)}m`;
}

function formatElapsedVerbose(iso) {
    if (!iso) return '-';
    const ms = Date.now() - new Date(iso).getTime();
    if (ms < 0) return '-';
    const mins = Math.floor(ms / 60000);
    const d = Math.floor(mins / 1440);
    const h = Math.floor((mins % 1440) / 60);
    const mm = mins % 60;
    if (mins < 1440) return `${pad2(h)}h ${pad2(mm)}m`;
    return `${d}d ${pad2(h)}h ${pad2(mm)}m`;
}

const formatItemLocation = (item) => {
    if (!item || !item.location) return '-';
    if (sameText(item.location, 'CEIC')) return 'CEIC (Disponível)';

    const locStr = item.specificLocation ? `${item.location} - ${item.specificLocation}` : item.location;
    return `Alocado: ${locStr}`;
};

const getCategoryForType = (typeStr) => {
    if (!typeStr) return 'GERAIS';
    const t = normUpper(typeStr);
    if (t.includes('TRANSPORTE')) return 'TRANSPORTE';
    if (['VENTILADOR PULMONAR', 'GERADOR DE FLUXO', 'OXIDO NITRICO', 'APENAS ACESSORIOS'].some(v => t.includes(v))) return 'VENTILATORIA';
    return 'GERAIS';
};

const getSlaInfo = (req) => {
    if (req.kind === 'return_pickup') return { ms: 7200000, secs: 7200, label: '2h (Recolhimento)' };

    let isPickup = false;
    if (req.notificationType === 'pickup') {
        isPickup = true;
    } else if (req.notificationType === 'delivery') {
        isPickup = false;
    } else {
        const reqCat = getCategoryForType(req.equipmentType);
        isPickup = (reqCat === 'GERAIS');
    }

    if (isPickup) {
        return { ms: 7200000, secs: 7200, label: '2h (Retirada na CEIC)' };
    } else {
        return req.isUrgent
            ? { ms: 900000, secs: 900, label: '15min (Emergência)' }
            : { ms: 1200000, secs: 1200, label: '20min (Rotina)' };
    }
};

const TAG_REGEX = /^[A-Z]{4}\d{4}$/;

// =========================================================
// COMPONENTES VISUAIS REUTILIZÁVEIS
// =========================================================

// Componentes visuais da interface (UI) compartilhados.
const LiveTimer = ({ startTime, variant = 'pending', slaLimitSeconds = 1200 }) => {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const start = new Date(startTime).getTime();
        const update = () => {
            const now = new Date().getTime();
            setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
        };
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    const formatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    const isOverdue = elapsed >= slaLimitSeconds;

    let styleClass = '';
    if (variant === 'pending' || variant === 'unavailable_ast') {
        styleClass = isOverdue ? 'bg-red-100 text-red-700 border-red-300 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200';
    } else if (variant === 'notified_op' || variant === 'waitlist_ast') {
        styleClass = 'bg-yellow-100 text-yellow-800 border-yellow-300';
    } else if (variant === 'waitlist_op') {
        styleClass = 'bg-blue-100 text-blue-800 border-blue-300';
    }

    return (
        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold font-mono border shadow-sm
        transition-colors ${styleClass}`} title="Tempo de espera">
            <Clock size={14} />
            {formatted}
        </span>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        available: { color: 'bg-green-100 text-green-700 border-green-200', label: 'Disponível' },
        in_use: { color: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Em Uso' },
        maintenance: { color: 'bg-red-100 text-red-700 border-red-200', label: 'Manutenção' },
        cleaning: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'Higienização' },
        preventive: { color: 'bg-teal-100 text-teal-700 border-teal-200', label: 'Ag. Preventiva' },
        irregular: { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Irregular' },
    };
    const current = config[status] || config.available;
    return <span className={`px-2 py-1 rounded-full text-xs font-bold border ${current.color}
        whitespace-nowrap`}>{current.label}</span>;
};

const UrgencyBadge = ({ isUrgent }) => (
    isUrgent
        ? <span
            className="flex items-center text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
            <Siren size={12} className="mr-1 animate-pulse" /> EMERGÊNCIA
        </span>
        : <span
            className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-200">Rotina</span>
);

const SearchDropdown = ({ value, onChange, options = [], placeholder, className }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(opt => opt.value === value);
    const filteredOptions = options.filter(opt => {
        const normalizedSearch = normLower(search);
        const aliases = Array.isArray(opt.aliases) ? opt.aliases : [];
        return normLower(opt.label).includes(normalizedSearch) ||
            normLower(opt.value).includes(normalizedSearch) ||
            aliases.some(alias => normLower(alias).includes(normalizedSearch));
    });

    useEffect(() => { setFocusedIndex(-1); }, [search, isOpen]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setFocusedIndex(prev => (prev > 0 ? prev - 1 : 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                onChange(filteredOptions[focusedIndex].value);
                setIsOpen(false);
            } else if (filteredOptions.length > 0) {
                onChange(filteredOptions[0].value);
                setIsOpen(false);
            }
        }
    };

    return (
        <div className="relative" ref={ref}>
            <div className={`input flex items-center justify-between cursor-pointer bg-white ${className} ${!selectedOption
                ? 'text-gray-500' : 'text-gray-800'}`} onClick={() => { setIsOpen(!isOpen); setSearch(''); }} tabIndex={0}>
                <span className="truncate pr-4">{selectedOption ? selectedOption.label : placeholder}</span>
                <ChevronDown size={18} className="text-gray-500 shrink-0" />
            </div>
            {isOpen && (
                <div
                    className="absolute z-[9999] w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                    <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center">
                        <Search size={16} className="text-gray-400 ml-2 shrink-0" />
                        <input autoFocus type="text" className="w-full p-2 bg-transparent outline-none text-sm text-gray-800"
                            placeholder="Digite para buscar..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={handleKeyDown} />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt, idx) => (
                                <div key={opt.value} className={`p-3 text-sm cursor-pointer hover:bg-blue-50 transition-colors
                    ${value === opt.value || focusedIndex === idx ? 'bg-blue-100 text-blue-800 font-bold' : 'text-gray-700'}`} onClick={() => {
                                        onChange(opt.value); setIsOpen(false);
                                    }}>
                                    {opt.label}
                                </div>
                            ))
                        ) : (<div className="p-4 text-center text-sm text-gray-500">Nenhum item encontrado.</div>)}
                    </div>
                </div>
            )}
        </div>
    );
};

// =========================================================
// TELAS DO SISTEMA (VIEWS)
// =========================================================

// EXPLICANDO: Daqui para baixo, cada bloco destes representa uma TELA ou uma ABA inteira que as pessoas vão ver.

// View: Tela de Login.
const LoginScreen = ({ onLogin, showNotification }) => {
    const [loginStr, setLoginStr] = useState('');
    const [passwordStr, setPasswordStr] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const doLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const inputLogin = (loginStr || '').trim();
        const inputSenha = (passwordStr || '').trim();

        console.log('Enviando para o BD:', { loginValido: !!inputLogin, senhaValida: !!inputSenha });
        console.log('Tentativa de login:', { login: inputLogin });

        try {
            const { data, error } = await supabase
                .from('ceic_usuarios')
                .select('*')
                .ilike('login', inputLogin)
                .eq('senha', String(inputSenha).trim())
                .maybeSingle();

            console.log('Resultado do Supabase:', { error, data });

            if (error || !data) {
                showNotification('error', 'Login ou senha inválidos.');
                setIsLoading(false);
                return;
            }

            // Se chegou aqui, logou com sucesso
            const profile = {
                role: data.perfil,
                sector: data.setor_nome,
                login: data.login,
                badge: data.login,
                name: data.nome
            };
            console.log('Dados do Perfil para onLogin:', profile);
            onLogin(profile);

        } catch (err) {
            console.error('Erro no login:', err);
            showNotification('error', 'Erro de conexão com o servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                <div
                    className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
                    <Activity className="text-white" size={32} />
                </div>

                <h1 className="text-2xl font-bold text-gray-800 mb-2">CEIC <span
                    className="text-gray-400 font-light">v2.0</span></h1>
                <p className="text-gray-500 mb-6">Acesso ao Sistema</p>

                <form onSubmit={doLogin} className="space-y-4 text-left">
                    <div>
                        <label className="label">Login</label>
                        <input data-testid="login-input" type="text" className="input" value={loginStr} onChange={(e) => setLoginStr(e.target.value)} placeholder="Digite seu login" required autoFocus />
                    </div>
                    <div>
                        <label className="label">Senha</label>
                        <div className="relative">
                            <input data-testid="password-input" type={showPassword ? "text" : "password"} className="input pr-10" value={passwordStr} onChange={(e) => setPasswordStr(e.target.value)} placeholder="Sua senha" required />
                            <button type="button" onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                    <button data-testid="login-submit" type="submit" disabled={isLoading} className="btn-primary w-full mt-6 disabled:bg-gray-300 disabled:cursor-not-allowed">
                        {isLoading ? 'Autenticando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

const LoanedEquipmentSection = ({ requests, inventory }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const loanedList = useMemo(() => {
        const list = [];
        const approvedRequests = requests.filter(r => (r.status === 'approved' || r.status === 'completed') && splitTagList(r.equipmentTag).length > 0);

        approvedRequests.forEach(req => {
            const tags = splitTagList(req.equipmentTag);

            tags.forEach(tag => {
                const invItem = inventory.find(i => normUpper(i.tag) === tag);

                if (invItem && invItem.status !== 'in_use') return;

                const pendingReturn = requests.find(r => r.kind === 'return_pickup' && r.status === 'pending' && splitTagList(r.equipmentTag).includes(tag));
                const isTransferring = invItem && (invItem.transferStatus === 'pending' || invItem.transferTo);
                const isPendingReceive = invItem && invItem.receivedBySector === false;
                const isTransferRejected = invItem && invItem.transferRejected;

                const searchStr = normLower(`${tag} ${req.equipmentType || ''} ${invItem?.type || ''} ${invItem?.location || ''} ${req.sector || ''} ${req.patientBed || ''} ${req.patientName || ''} ${req.patient_mv || ''} ${req.requesterName || ''} ${req.requesterBadge || ''} ${invItem?.transferTo || ''}`);

                list.push({ tag, req, invItem, pendingReturn, isTransferring, isPendingReceive, isTransferRejected, searchStr });
            });
        });
        return list;
    }, [requests, inventory]);

    const filteredList = useMemo(() => {
        if (!searchTerm.trim()) return loanedList;
        const lower = normLower(searchTerm);
        return loanedList.filter(item => item.searchStr.includes(lower));
    }, [loanedList, searchTerm]);

    const transferCount = loanedList.filter(i => i.isTransferring).length;
    const pickupCount = loanedList.filter(i => i.pendingReturn).length;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <Activity className="mr-2 text-blue-500" size={20} /> Equipamentos em Uso
                    </h3>
                    <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        <span>Total: {loanedList.length}</span>
                        {transferCount > 0 && <span className="text-orange-500 font-bold">Em transferência: {transferCount}</span>}
                        {pickupCount > 0 && <span className="text-red-500 font-bold">Aguardando recolhimento: {pickupCount}</span>}
                    </div>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input type="text" className="input pl-9 text-sm w-full" placeholder="Buscar emprestados..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto overflow-x-hidden p-0 m-0 relative">
                {filteredList.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        {loanedList.length === 0 ? "Nenhum equipamento emprestado no momento." : "Nenhum resultado para a busca."}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {filteredList.map((item, idx) => {
                            const { tag, req, invItem, pendingReturn, isTransferring, isPendingReceive, isTransferRejected } = item;
                            const typeName = req.equipmentType || invItem?.type || "Desconhecido";
                            const locName = invItem?.location || req.sector || "Desconhecido";
                            const displayTime = req.fulfilledAt ? formatElapsedVerbose(req.fulfilledAt) : (invItem?.in_use_since ? formatElapsedVerbose(invItem.in_use_since) : "N/A");

                            return (
                                <div key={`${tag}-${idx}`} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col xl:flex-row justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-bold text-blue-800 bg-blue-100 px-2 py-1 rounded text-sm min-w-[80px] text-center">{tag}</span>
                                                <span className="font-bold text-gray-700 uppercase">{typeName}</span>
                                                {!invItem && <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-200">Sem registro no inventário</span>}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                                <div className="flex items-start gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                                    <MapPin size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 w-full">
                                                        <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Local</p>
                                                        <span className="font-semibold text-gray-700">{locName}</span>
                                                        {req.patientBed && <span className="ml-1 text-gray-500">- Leito {req.patientBed}</span>}
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                                    <User size={16} className="text-gray-400 shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="font-medium text-gray-700">{req.patientName || "Não informado"}</span>
                                                        <span className="text-xs text-gray-500 font-mono whitespace-nowrap self-center">{req.patient_mv ? `MV: ${req.patient_mv}` : 'MV: -'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-xs text-gray-500 flex flex-wrap gap-x-4 gap-y-1">
                                                <span><span className="font-semibold">Solicitante:</span> {req.requesterName} {req.requesterBadge && `(${req.requesterBadge})`}</span>
                                                <span><span className="font-semibold">Emprestado há:</span> {displayTime}</span>
                                            </div>

                                            <div className="mt-2 text-xs">
                                                {(req.accessories && req.accessories.length > 0) ? (
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">Com acessórios</span>
                                                        <span className="text-gray-500 italic">{req.accessories.join(', ')}</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">Sem acessórios</span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start xl:items-end gap-2 shrink-0">
                                            {pendingReturn && <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded border border-red-300 shadow-sm flex items-center gap-1"><ArrowDownLeft size={14} /> Aguardando recolhimento</span>}
                                            {isTransferring && <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-1 rounded border border-orange-300 shadow-sm flex items-center gap-1"><ArrowUpRight size={14} /> Em transferência p/ {invItem.transferTo}</span>}
                                            {isPendingReceive && !isTransferring && <span className="text-xs font-bold text-yellow-700 bg-yellow-100 px-2 py-1 rounded border border-yellow-300 shadow-sm flex items-center gap-1"><Clock size={14} /> Recebimento pendente</span>}
                                            {isTransferRejected && <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-1 rounded border border-red-300 shadow-sm flex items-center gap-1"><XCircle size={14} /> Transferência recusada</span>}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

// View: Dashboard da Equipe Operacional (Fila e Atendimento).
const OperatorDashboard = ({ requests, inventory, onViewChange, onFulfill, showNotification, onProcessPickup,
    onCancelRequest, onNotifyRequester, onUpdateTransportTimes, soundEnabled, setSoundEnabled }) => {
    const [filter, setFilter] = useState('all');
    // (fix) soundEnabled vem do App via props
    const pending = requests.filter(r => {
        if (r.status === 'pending' || r.status === 'waitlisted' || r.status === 'pickup_requested') return true;
        if (r.status === 'approved' && isTransportRequest(r.equipmentType)) {
            return !r.returnToCeicTime;
        }
        return false;
    });

    const prevPendingCount = useRef(pending.length);
    const audioRef = useRef(new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"));

    useEffect(() => {
        if (pending.length > prevPendingCount.current && soundEnabled) {
            // Correção: Adicionamos as chaves {} em volta do if para a sintaxe ficar válida
            audioRef.current.play().catch(err => { if (DEBUG_LOGS) console.log("Áudio bloqueado pelo navegador", err); });
        }
        prevPendingCount.current = pending.length;
    }, [pending.length, soundEnabled]);

    const urgentCount = pending.filter(r => r.isUrgent).length;
    const cleaningCount = inventory.filter(i => i.status === 'cleaning').length;
    const maintenanceCount = inventory.filter(i => i.status === 'maintenance').length;

    const filteredPending = pending.filter(r => filter === 'all' || (filter === 'urgent' && r.isUrgent));

    return (
        <div className="space-y-6 pb-20 animate-fade-in" data-testid="operational-dashboard">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <h2 className="text-2xl font-bold text-gray-800">Dashboard Operacional</h2>

                <button onClick={() => setSoundEnabled(!soundEnabled)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold transition-colors ${soundEnabled ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                    title={soundEnabled ? 'Desativar Alerta Sonoro' : 'Ativar Alerta Sonoro'}
                >
                    {soundEnabled ?
                        <Volume2 size={18} /> :
                        <VolumeX size={18} />}
                    <span className="hidden sm:inline">{soundEnabled ? 'Alerta Ativo' : 'Alerta Mudo'}</span>
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500 cursor-pointer hover:bg-red-50
                transition-colors ${filter === 'urgent' ? 'ring-2 ring-red-400 bg-red-50/50' : ''}`} onClick={() =>
                        setFilter('urgent')}>
                    <p className="text-xs font-bold text-gray-400 uppercase">Urgências Pendentes</p>
                    <p className="text-3xl font-bold text-red-600">{urgentCount}</p>
                </div>
                <div className={`bg-white p-4 rounded-xl shadow-sm border-l-4 border-blue-500 cursor-pointer
                hover:bg-blue-50 transition-colors ${filter === 'all' ? 'ring-2 ring-blue-400 bg-blue-50/50' : ''}`}
                    onClick={() => setFilter('all')}>
                    <p className="text-xs font-bold text-gray-400 uppercase">Total Pendente</p>
                    <p className="text-3xl font-bold text-blue-600">{pending.length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-yellow-500 cursor-pointer hover:bg-yellow-50 transition-colors"
                    onClick={() => onViewChange('manutencao')}>
                    <p className="text-xs font-bold text-gray-400 uppercase">Em Higienização</p>
                    <p className="text-3xl font-bold text-yellow-600">{cleaningCount}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500 cursor-pointer hover:bg-orange-50 transition-colors"
                    onClick={() => onViewChange('reparo')}>
                    <p className="text-xs font-bold text-gray-400 uppercase">Manutenção</p>
                    <p className="text-3xl font-bold text-orange-600">{maintenanceCount}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <ClipboardList className="mr-2" size={20} /> Fila de Solicitações {filter === 'urgent' && <span
                            className="text-red-500 ml-2">(Filtrando Urgências)</span>}
                    </h3>
                    <span className="text-xs text-gray-500">{filteredPending.length} aguardando</span>
                </div>
                <div className="divide-y divide-gray-100">
                    {filteredPending.length === 0 ? <div className="p-8 text-center text-gray-400">Nenhuma solicitação
                        encontrada no filtro atual.</div> :
                        filteredPending.slice().sort((a, b) => {
                            const getWeight = (req) => {
                                if (req.isUrgent) return 100;
                                if (req.tevPriority === 1) return 90;
                                if (req.tevPriority === 2) return 80;
                                return 50;
                            };
                            const weightA = getWeight(a);
                            const weightB = getWeight(b);
                            if (weightA !== weightB) return weightB - weightA;
                            return new Date(a.timestamp) - new Date(b.timestamp);
                        }).map(req => (
                            <PendingRequestCard key={req.id} req={req} inventory={inventory} onFulfill={onFulfill}
                                showNotification={showNotification} onProcessPickup={onProcessPickup} onCancel={onCancelRequest}
                                onNotifyRequester={onNotifyRequester} onUpdateTransportTimes={onUpdateTransportTimes} />
                        ))
                    }
                </div>
            </div>

            <LoanedEquipmentSection requests={requests} inventory={inventory} />
        </div>
    );
};

// Componente: Card de Pedido da fila operacional.
const PendingRequestCard = ({ req, inventory, onFulfill, showNotification, onProcessPickup, onCancel,
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

    const isTransport = isTransportRequest(req.equipmentType);
    const transportItemsList = isTransport ? normUpper(req.equipmentType).replace('TRANSPORTE: ', '').split(' + ') : [];
    const isInTransit = req.status === 'approved' && isTransport;

    useEffect(() => {
        if (!req.equipmentType || req.kind === 'return_pickup') return;

        const equipmentsToSearch = isTransport ? transportItemsList : [normUpper(req.equipmentType)];
        const matchingInventory = (inventory || []).filter(item => item.status === 'available' && equipmentsToSearch.includes(normUpper(item.type)));

        if (isTransport) {
            const grouped = {};
            matchingInventory.forEach(item => {
                const itemType = normUpper(item.type);
                if (!grouped[itemType]) grouped[itemType] = [];
                grouped[itemType].push(normUpper(item.tag));
            });
            setAvailableTags(grouped);
        } else {
            setAvailableTags(matchingInventory.map(item => normUpper(item.tag)).filter(Boolean));
        }
    }, [req.equipmentType, req.kind, inventory]);

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
                            data-testid="cancel-reason-input" className="input border-gray-300 focus:border-red-500 focus:ring-red-500" rows="2"
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
                        <button data-testid="cancel-submit-button" onClick={confirmCancel}
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

    if (DEBUG_LOGS) console.log('Filtro Estoque -> Pedido:', req.equipmentType, 'Total no Inventory:', inventory?.length);

    if (req.kind === 'return_pickup') {
        return (
            <>
                <div className={`p-4 transition-colors ${baseStyle}`} data-testid="pending-request-card">
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
                        <button data-testid="cancel-request-button" onClick={() => setIsCancelling(true)} className="h-[40px] px-4 rounded-lg text-red-600 font-bold hover:bg-red-50 flex items-center text-sm transition-colors border border-transparent hover:border-red-200">Cancelar</button>
                        <button data-testid="confirm-request-button" onClick={() => onProcessPickup(req)} className="h-[40px] px-4 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center text-sm">
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
            <div className={`p-4 transition-colors ${baseStyle}`} data-testid="pending-request-card">
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
                    {req.patient_mv && <p><span className="font-semibold">MV:</span> <span
                        className="font-mono bg-gray-100 px-1 rounded">{req.patient_mv}</span></p>}
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
                            {req.notificationMessage && (
                                <div className={`mb-3 border p-3 rounded-lg text-sm flex items-start gap-2 animate-fade-in shadow-sm ${req.notificationType === 'unavailable'
                                    ? 'bg-red-50 border-red-200 text-red-800'
                                    : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                    {req.notificationType === 'unavailable' ? <AlertTriangle size={16} /> : <Send size={16} />}
                                    <div>
                                        <span className="font-bold block text-xs uppercase mb-0.5 opacity-80">Mensagem da CEIC</span>
                                        {req.notificationMessage}
                                    </div>
                                </div>
                            )}
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold text-gray-500 uppercase">Ações Operacionais</p>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => setIsNotifying(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                                        <Send size={14} /> Notificar
                                    </button>
                                    <button data-testid="cancel-request-button" onClick={() => setIsCancelling(true)} className="text-xs font-bold text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">Cancelar</button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex-1">
                                    {req.status === 'pickup_requested' ? (
                                        <button onClick={() => onProcessPickup(req)} className="w-full h-[44px] px-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center justify-center shadow-sm">
                                            <ClipboardList size={18} className="mr-2" /> Devolução/Triagem
                                        </button>
                                    ) : isTransport ? (
                                        <div className="flex flex-col gap-3">
                                            {transportItemsList.map((item, idx) => (
                                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center gap-2">
                                                    <span className="text-xs font-bold text-gray-700 min-w-[160px] truncate"
                                                        title={item}>{item}:</span>
                                                    <div className="relative flex-1" data-testid="equipment-tag-input">
                                                        <Tag className="absolute left-3 top-[14px] text-gray-400 z-10" size={16} />
                                                        <SearchDropdown
                                                            value={multiTags[item] || ''}
                                                            onChange={(val) => setMultiTags({
                                                                ...multiTags,
                                                                [item]: val.toUpperCase()
                                                            })}
                                                            options={(availableTags[item] || []).filter(Boolean).map(t => ({ value: t, label: t }))}
                                                            placeholder={`Buscar e selecionar TAG p/ ${item}...`}
                                                            className="w-full text-sm font-mono pl-[38px] py-[10px]"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                            <button data-testid="confirm-submit-button" onClick={handleConfirm}
                                                className="h-[44px] px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center whitespace-nowrap mt-1 shadow-sm">
                                                <BadgeCheck size={18} className="mr-2" /> Confirmar Todos
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex flex-col sm:flex-row items-stretch gap-2">
                                                <div className="relative flex-1" data-testid="equipment-tag-input">
                                                    <Tag className="absolute left-3 top-[14px] text-gray-400 z-10" size={16} />
                                                    <SearchDropdown
                                                        value={typedTag}
                                                        onChange={(val) => setTypedTag(val.toUpperCase())}
                                                        options={(Array.isArray(availableTags) ? availableTags : []).filter(Boolean).map(t => ({ value: t, label: t }))}
                                                        placeholder="Buscar e selecionar TAG..."
                                                        className="pl-[38px] font-mono w-full min-h-[44px]"
                                                    />
                                                </div>
                                                <button data-testid="confirm-submit-button" onClick={handleConfirm}
                                                    className="h-[44px] px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center whitespace-nowrap">
                                                    <BadgeCheck size={18} className="mr-2" /> Confirmar
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Disp. estoque: <span className="font-bold">{
                                                inventory ? inventory.filter(i => {
                                                    const eqType = String(req.equipmentType || '').trim().toUpperCase();
                                                    const itemType = String(i.type || '').trim().toUpperCase();
                                                    return itemType === eqType && i.status === 'available';
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

const InventoryView = ({ inventory }) => {
    const [selectedType, setSelectedType] = useState('');

    const groupedInventory = useMemo(() => {
        return inventory.reduce((acc, item) => {
            const type = item.type || 'Outros';
            if (!acc[type]) acc[type] = [];
            acc[type].push(item);
            return acc;
        }, {});
    }, [inventory]);

    const types = Object.keys(groupedInventory).sort();
    const selectedItems = selectedType ? groupedInventory[selectedType] : [];
    const availableCount = selectedItems.filter(i => i.status === 'available').length;

    return (
        <div className="pb-20 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Package className="text-blue-600" /> Estoque Central
            </h2>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 relative z-10">
                <label className="label text-gray-700 font-bold mb-2">Filtrar por Tipo de Equipamento:</label>
                <select
                    className="input bg-gray-50 border-gray-300 text-gray-800 font-medium text-lg cursor-pointer hover:border-blue-400 transition-colors"
                    value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                    <option value="">-- Selecione para visualizar o relatório --</option>
                    {types.map(type => <option key={type} value={type}>{type} ({groupedInventory[type].length} itens no
                        total)</option>)}
                </select>
            </div>

            {selectedType && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <List size={20} className="text-blue-600" /> Relatório: {selectedType}
                        </h3>
                        <div className="flex gap-2">
                            <span
                                className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-bold border border-blue-200">Total
                                na Frota: {selectedItems.length}</span>
                            <span
                                className="text-sm bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-bold border border-green-200">Disponíveis:
                                {availableCount}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tag</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Modelo</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Local</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">MV Atual</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tempo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {selectedItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-sm relative">
                                            {item.tag}
                                            {item.preventiveScheduled && item.status !== 'preventive' && <span
                                                className="absolute -top-1 -right-1 flex h-3 w-3"><span
                                                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span
                                                        className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"
                                                        title="Retido para Preventiva"></span></span>}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-700">{item.model}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${item.status === 'allocated' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                                {item.status === 'allocated' ? 'Em Uso' : 'Disponível'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold">
                                            {item.status === 'allocated' ? item.location : 'CEIC'}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-gray-500">
                                            {item.status === 'allocated' ? (item.patient_mv || '-') : '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {item.status === 'allocated' && item.in_use_since ? (
                                                `${Math.floor((new Date() - new Date(item.in_use_since)) / (1000 * 60 * 60 * 24))} dias`
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {!selectedType && (
                <div
                    className="p-12 text-center text-gray-400 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 animate-fade-in">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-500">Nenhum tipo selecionado.</p>
                    <p className="text-sm mt-1">Utilize o menu suspenso acima para carregar o relatório do equipamento desejado.
                    </p>
                </div>
            )}
        </div>
    );
};

// View: Meus Pedidos (Acompanhamento de requisições do colaborador).
const InventoryViewV2 = ({ inventory }) => {
    const [selectedType, setSelectedType] = useState('');
    const [selectedLocation, setSelectedLocation] = useState('');

    const types = useMemo(() => Array.from(new Set((inventory || []).map(item => item.type || 'OUTROS'))).sort(), [inventory]);
    const locations = useMemo(() => Array.from(new Set((inventory || []).map(item => trimText(item.location)).filter(Boolean))).sort(), [inventory]);

    const filteredItems = useMemo(() => {
        return (inventory || [])
            .filter(item => !selectedType || item.type === selectedType)
            .filter(item => !selectedLocation || sameText(item.location, selectedLocation))
            .slice()
            .sort((a, b) => `${a.type || ''}${a.tag || ''}`.localeCompare(`${b.type || ''}${b.tag || ''}`));
    }, [inventory, selectedType, selectedLocation]);

    const availableCount = filteredItems.filter(i => i.status === 'available').length;

    const exportRows = useMemo(() => {
        return filteredItems.map(item => ({
            TAG: item.tag || '-',
            TIPO: item.type || '-',
            MODELO: item.model || '-',
            STATUS: item.status === 'allocated' ? 'EM USO' : 'DISPONÍVEL',
            LOCAL: item.status === 'allocated' ? item.location : 'CEIC',
            MV_ATUAL: item.status === 'allocated' ? (item.patient_mv || '-') : '-',
            TEMPO: item.status === 'allocated' && item.in_use_since
                ? `${Math.floor((new Date() - new Date(item.in_use_since)) / (1000 * 60 * 60 * 24))} dias`
                : '-'
        }));
    }, [filteredItems]);

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const handleExportExcel = () => {
        if (exportRows.length === 0) return;
        const headers = ['TAG', 'TIPO', 'MODELO', 'STATUS', 'LOCAL', 'MV_ATUAL', 'TEMPO'];
        const csv = [headers.join(','), ...exportRows.map(row => headers.map(header => escapeCsv(row[header])).join(','))].join('\n');
        const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `estoque-central-${Date.now()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleExportPdf = () => {
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
            alert("O navegador bloqueou a janela pop-up. Permita pop-ups para gerar o PDF.");
            return;
        }

        const now = new Date().toLocaleString('pt-BR');
        const total = filteredItems.length;
        const available = availableCount;
        const titleStr = 'Relatório de Estoque CEIC';

        let tableRows = '';
        filteredItems.forEach(item => {
            const isScheduled = (item.preventiveScheduled && item.status !== 'preventive') ? 'Sim' : 'Não';
            const statusLabel = item.status === 'allocated' ? 'Em Uso' : 'Disponível';
            const locationLabel = item.status === 'allocated' ? item.location : 'CEIC';
            const mvLabel = item.status === 'allocated' ? (item.patient_mv || '-') : '-';
            const timeLabel = item.status === 'allocated' && item.in_use_since
                ? `${Math.floor((new Date() - new Date(item.in_use_since)) / (1000 * 60 * 60 * 24))} dias`
                : '-';

            tableRows += "<tr>";
            tableRows += "<td>" + (item.tag || '') + "</td>";
            tableRows += "<td>" + (item.type || '-') + "</td>";
            tableRows += "<td>" + (item.model || '-') + "</td>";
            tableRows += "<td>" + statusLabel + " / " + locationLabel + "</td>";
            tableRows += "<td>" + mvLabel + "</td>";
            tableRows += "<td>" + timeLabel + "</td>";
            tableRows += "<td>" + isScheduled + "</td>";
            tableRows += "</tr>";
        });

        // Truque anti-Live Server aplicado aqui nas tags body e html
        const htmlString = "<!DOCTYPE html>\n<html lang='pt-BR'><head><title>" + titleStr + "</title>" +
            "<style>body{font-family:Arial,sans-serif;padding:20px;color:#333}h1{color:#4F46E5;margin-bottom:5px}.meta{font-size:14px;color:#666;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px}th,td{border:1px solid #ddd;padding:8px;text-align:left}th{background-color:#f3f4f6;font-weight:bold}</style>" +
            "</head><bo" + "dy><h1>" + titleStr + "</h1><div class='meta'><p><strong>Gerado em:</strong> " + now + "</p><p><strong>Filtros aplicados:</strong> Tipo: " + (selectedType || 'Todos') + " | Local: " + (selectedLocation || 'Todos') + "</p><p><strong>Resumo:</strong> " + total + " itens listados (" + available + " disponíveis)</p></div>" +
            "<table><thead><tr><th>TAG</th><th>Tipo</th><th>Modelo</th><th>Status / Local</th><th>MV Atual</th><th>Tempo em Uso</th><th>Ag. Preventiva?</th></tr></thead><tbody>" + tableRows + "</tbody></table></bo" + "dy></ht" + "ml>";

        printWindow.document.open();
        printWindow.document.write(htmlString);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 250);
    };

    return (
        <div className="pb-20 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Package className="text-blue-600" /> Estoque Central
            </h2>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 mb-6 relative z-10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="label text-gray-700 font-bold mb-2">Filtrar por Tipo de Equipamento:</label>
                        <select className="input bg-gray-50 border-gray-300 text-gray-800 font-medium" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                            <option value="">Todos os tipos</option>
                            {types.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label text-gray-700 font-bold mb-2">Filtrar por Local:</label>
                        <select className="input bg-gray-50 border-gray-300 text-gray-800 font-medium" value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)}>
                            <option value="">Todos os locais</option>
                            {locations.map(location => <option key={location} value={location}>{location}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex gap-2 flex-wrap">
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-bold border border-blue-200">Total filtrado: {filteredItems.length}</span>
                        <span className="text-sm bg-green-100 text-green-800 px-3 py-1.5 rounded-lg font-bold border border-green-200">Disponíveis: {availableCount}</span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={handleExportExcel} disabled={exportRows.length === 0} className="px-4 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-sm hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">Exportar Excel</button>
                        <button onClick={handleExportPdf} disabled={exportRows.length === 0} className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">Exportar PDF</button>
                    </div>
                </div>
            </div>

            {filteredItems.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <List size={20} className="text-blue-600" /> Relatório do Estoque
                        </h3>
                        <div className="text-sm text-gray-500">Tipo: <span className="font-bold text-gray-700">{selectedType || 'Todos'}</span> | Local: <span className="font-bold text-gray-700">{selectedLocation || 'Todos'}</span></div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white border-b border-gray-200">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tag</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Modelo</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Local</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">MV Atual</th>
                                    <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tempo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-mono text-sm relative">
                                            {item.tag}
                                            {item.preventiveScheduled && item.status !== 'preventive' && <span
                                                className="absolute -top-1 -right-1 flex h-3 w-3"><span
                                                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span><span
                                                        className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"
                                                        title="Retido para Preventiva"></span></span>}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-gray-700">{item.type || '-'}</td>
                                        <td className="p-4 text-sm font-bold text-gray-700">{item.model || '-'}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold border whitespace-nowrap ${item.status === 'allocated' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-green-100 text-green-700 border-green-200'}`}>
                                                {item.status === 'allocated' ? 'Em Uso' : 'Disponível'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold">
                                            {item.status === 'allocated' ? item.location : 'CEIC'}
                                        </td>
                                        <td className="p-4 text-sm font-mono text-gray-500">
                                            {item.status === 'allocated' ? (item.patient_mv || '-') : '-'}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {item.status === 'allocated' && item.in_use_since ? (
                                                `${Math.floor((new Date() - new Date(item.in_use_since)) / (1000 * 60 * 60 * 24))} dias`
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="p-12 text-center text-gray-400 bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-200 animate-fade-in">
                    <Package size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium text-gray-500">Nenhum equipamento encontrado.</p>
                    <p className="text-sm mt-1">Ajuste os filtros para visualizar os itens do estoque central.</p>
                </div>
            )}
        </div>
    );
};

const MyRequestsView = ({ requests, sector, onBack, onCancel, onWaitlist, showNotification, inventory, userProfile, onConfirmTransfer }) => {
    const [cancelModalData, setCancelModalData] = useState(null);

    const openCancelModal = (req, isAutoReason = false) => {
        setCancelModalData({
            reqId: req.id,
            type: req.equipmentType,
            reason: isAutoReason ? 'Cancelado por indisponibilidade do equipamento' : '',
            name: '',
            badge: '',
            isAutoReason
        });
    };

    const confirmCancel = () => {
        if (!cancelModalData.reason || !cancelModalData.name || !cancelModalData.badge) {
            showNotification('error', 'Preencha todos os campos para cancelar a solicitação.');
            return;
        }
        onCancel(cancelModalData.reqId, {
            cancelReason: cancelModalData.reason, cancelName: cancelModalData.name,
            cancelBadge: cancelModalData.badge
        });
        setCancelModalData(null);
    };

    const renderCancelModal = () => {
        if (!cancelModalData) return null;
        return createPortal(
            <div className="modal-overlay z-50">
                <div
                    className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in border border-red-100 max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                            <AlertTriangle size={20} /> Cancelar Solicitação
                        </h3>
                        <button onClick={() => setCancelModalData(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg mb-5 text-sm text-red-800 border border-red-100">
                        <p><span className="font-bold">ID:</span> {cancelModalData.reqId}</p>
                        <p><span className="font-bold">Item:</span> {cancelModalData.type}</p>
                    </div>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="label text-gray-700">Motivo do cancelamento *</label>
                            <textarea className={`input border-gray-300 ${cancelModalData.isAutoReason
                                ? 'bg-gray-100 text-gray-500 font-bold' : 'focus:border-red-500 focus:ring-red-500'}`} rows="2"
                                value={cancelModalData.reason} onChange={e => !cancelModalData.isAutoReason && setCancelModalData({ ...cancelModalData, reason: e.target.value })}
                                required
                                readOnly={cancelModalData.isAutoReason}
                                placeholder="Ex: Encontrado na unidade, desistência, etc.">
                            </textarea>
                        </div>
                        <div><label className="label text-gray-700">Seu Nome *</label><input type="text"
                            className="input border-gray-300 focus:border-red-500" value={cancelModalData.name}
                            onChange={e => setCancelModalData({ ...cancelModalData, name: e.target.value })} placeholder="Nome do profissional" required /></div>
                        <div><label className="label text-gray-700">Sua Matrícula *</label><input type="text"
                            className="input border-gray-300 focus:border-red-500" value={cancelModalData.badge}
                            onChange={e => setCancelModalData({ ...cancelModalData, badge: e.target.value })} placeholder="Ex: 12345" required /></div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setCancelModalData(null)} className="flex-1 py-2.5 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
                        <button onClick={confirmCancel}
                            className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Confirmar</button>
                    </div>
                </div>
            </div>,
            document.body
        );
    };

    return (
        <div className="animate-fade-in w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <List className="text-blue-600" /> Meus Pedidos ({sector})
                </h2>
                <button onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors">
                    <ArrowDownLeft size={18} className="transform rotate-90" /> Voltar
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <Package size={48} className="mb-3 opacity-20" />
                        <p>Nenhum pedido pendente.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {requests.map((req, index) => {
                            let timerVariantAst = 'pending';
                            let timerStartAst = req.timestamp;

                            if (req.isWaitlisted) {
                                timerVariantAst = 'waitlist_ast';
                                timerStartAst = req.waitlistTime;
                            } else if (req.notificationType === 'unavailable') {
                                timerVariantAst = 'unavailable_ast';
                                timerStartAst = req.notificationTime;
                            }

                            return (
                                <div key={`${req.id}-${index}`} data-testid="request-card" className={`p-4 transition-colors ${req.isWaitlisted ? 'bg-orange-50/30'
                                    : 'hover:bg-gray-50'}`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start gap-3 flex-1">
                                            <div className={`p-2 rounded-lg ${req.isEmergency ? 'bg-red-100 text-red-600'
                                                : 'bg-blue-100 text-blue-600'}`}>{req.isEmergency ?
                                                    <Siren size={20} /> :
                                                    <Package size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <h3 data-testid="request-equipment-name" className="font-bold text-gray-800">{req.equipmentType}</h3>
                                                <p className="text-sm text-gray-600 mt-1">{req.accessories && req.accessories.length > 0
                                                    ? req.accessories.join(', ') : 'Sem detalhes adicionais'}</p>
                                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <User size={12} /> <span data-testid="request-patient-name">{req.patientName}</span>
                                                        {req.patient_mv && <span data-testid="request-patient-mv" className="ml-2 font-mono bg-gray-100 px-1 rounded text-[10px]">MV: {req.patient_mv}</span>}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> {new Date(req.timestamp).toLocaleTimeString()}
                                                    </span>
                                                </div>

                                                {req.isWaitlisted && (
                                                    <div
                                                        className="mt-3 bg-orange-100 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in shadow-sm font-bold">
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle size={18} /> EQUIPAMENTO EM FILA DE ESPERA...
                                                        </div>
                                                        <button onClick={() => {
                                                            setCancelModalData({
                                                                reqId: req.id,
                                                                type: req.equipmentType,
                                                                reason: '',
                                                                name: '',
                                                                badge: '',
                                                                isAutoReason: false
                                                            });
                                                        }} className="px-3 py-1.5 bg-white text-red-600 border border-red-200 font-bold rounded-lg shadow-sm text-xs hover:bg-red-700 transition-colors">Cancelar Solicitação</button>
                                                    </div>
                                                )}

                                                {req.status === 'in_transfer' && (
                                                    (() => {
                                                        const equip = inventory?.find(i => normUpper(i.tag) === normUpper(req.equipmentTag));
                                                        const isReceiver = sameText(req.transfer_to, userProfile?.login) || sameText(req.transfer_to, userProfile?.sector) || sameText(equip?.transferTo, userProfile?.login) || sameText(equip?.transferTo, userProfile?.sector);
                                                        if (isReceiver) {
                                                            return (
                                                                <div className="mt-3 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in shadow-sm font-bold">
                                                                    <div className="flex items-center gap-2">
                                                                        <Package size={18} className="animate-pulse" /> EQUIPAMENTO AGUARDANDO CONFIRMAÇÃO...
                                                                    </div>
                                                                    <button onClick={() => onConfirmTransfer(req)} className="px-3 py-1.5 bg-green-600 text-white font-bold rounded-lg shadow-sm text-xs hover:bg-green-700 transition-colors flex items-center gap-2">
                                                                        <CheckCircle size={16} /> Confirmar Recebimento
                                                                    </button>
                                                                </div>
                                                            );
                                                        } else {
                                                            return (
                                                                <div className="mt-3 bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded-lg text-sm flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in shadow-sm font-bold opacity-75">
                                                                    <div className="flex items-center gap-2">
                                                                        <Send size={18} className="animate-pulse" /> Equipamento em Transferência (Bloqueado)
                                                                    </div>
                                                                    <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-md border border-orange-200">
                                                                        Aguardando Aceite da Unidade Destino
                                                                    </span>
                                                                </div>
                                                            );
                                                        }
                                                    })()
                                                )}

                                                {req.status === 'pickup_requested' && (
                                                    <div className="mt-3 p-3 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200">
                                                        <strong>Instrução de Devolução:</strong> {req.catalogo_equipamentos?.instrucao_devolucao || "O equipamento deverá ser entregue na CEIC o mais breve possível, em até 2h."}
                                                    </div>
                                                )}

                                                {req.notificationMessage && !req.isWaitlisted && req.status !== 'approved' && req.status !== 'in_transfer' && (
                                                    <div className={`mt-3 border p-3 rounded-lg text-sm flex flex-col gap-2 animate-fade-in
                                    shadow-sm ${req.notificationType === 'unavailable'
                                                            ? 'bg-red-50 border-red-200 text-red-800'
                                                            : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                                                        <div className="flex items-start gap-2">
                                                            <div className="mt-0.5">{req.notificationType === 'unavailable' ?
                                                                <AlertTriangle size={16} /> :
                                                                <Send size={16} />}
                                                            </div>
                                                            <div>
                                                                <span
                                                                    className="font-bold block text-xs uppercase mb-0.5 opacity-80">Mensagem
                                                                    da CEIC</span>
                                                                {req.notificationMessage}
                                                            </div>
                                                        </div>
                                                        {req.notificationType === 'unavailable' && (
                                                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-red-200/50">
                                                                <button data-testid="waitlist-button" onClick={() => onWaitlist(req.id)} className="px-3 py-1.5 bg-orange-600 text-white font-bold rounded-lg shadow-sm text-xs hover:bg-orange-700 transition-colors">Aguardar em Fila de Espera</button>
                                                                <button onClick={() => openCancelModal(req, true)} className="px-3 py-1.5 bg-red-600 text-white font-bold rounded-lg shadow-sm text-xs hover:bg-red-700 transition-colors">Cancelar Solicitação</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {req.status === 'approved' && isTransportRequest(req.equipmentType) && (
                                                    <div
                                                        className="mt-3 border p-3 rounded-lg text-sm flex flex-col gap-2 animate-fade-in shadow-sm bg-blue-50 border-blue-200 text-blue-800">
                                                        <div className="flex items-start gap-2">
                                                            <div className="mt-0.5">
                                                                <Activity size={16} />
                                                            </div>
                                                            <div>
                                                                <span
                                                                    className="font-bold block text-xs uppercase mb-0.5 opacity-80">Transporte
                                                                    em Curso</span>
                                                                Os equipamentos foram vinculados e o transporte está em atendimento. Não é
                                                                necessário confirmar o recebimento.
                                                                <div
                                                                    className="mt-2 text-xs font-mono bg-white p-2 border border-blue-100 rounded text-gray-700 shadow-sm">
                                                                    <span className="font-bold text-blue-800">TAGs Vinculadas:</span>
                                                                    {req.equipmentTag}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                                            {req.status === 'in_transfer' ? (
                                                (() => {
                                                    const equip = inventory?.find(i => normUpper(i.tag) === normUpper(req.equipmentTag));
                                                    const isReceiver = sameText(req.transfer_to, userProfile?.login) || sameText(req.transfer_to, userProfile?.sector) || sameText(equip?.transferTo, userProfile?.login) || sameText(equip?.transferTo, userProfile?.sector);
                                                    if (isReceiver) {
                                                        return (
                                                            <span className="text-xs font-bold px-2 py-1 rounded bg-purple-100 text-purple-800 border border-purple-200">
                                                                RECEBIMENTO PENDENTE
                                                            </span>
                                                        );
                                                    } else {
                                                        return (
                                                            <span className="text-xs font-bold px-2 py-1 rounded bg-orange-100 text-orange-800 border border-orange-200 animate-pulse">
                                                                EQUIPAMENTO EM TRANSFERÊNCIA
                                                            </span>
                                                        );
                                                    }
                                                })()
                                            ) : (
                                                <span data-testid="request-status" className={`text-xs font-bold px-2 py-1 rounded ${req.isWaitlisted
                                                    ? 'bg-orange-100 text-orange-800' : (req.status === 'approved'
                                                        ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800')}`}>
                                                    {req.isWaitlisted ? 'FILA DE ESPERA' : (req.status === 'approved' ? 'EM CURSO' :
                                                        'PENDENTE')}
                                                </span>
                                            )}
                                            {(req.status === 'pending' || req.isWaitlisted || req.status === 'waitlisted') &&
                                                <LiveTimer startTime={timerStartAst} variant={timerVariantAst}
                                                    slaLimitSeconds={getSlaInfo(req).secs} />}
                                            <p className="text-xs text-gray-400 mt-1">{new Date(req.timestamp).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            {renderCancelModal()}
        </div>
    );
};

const AdminEntregaWrapper = ({ onCreateRequest, showNotification, onBack, adminProfile, equipmentCatalog, ventilatoryCatalog, generalCatalog, transportCatalog, fullCatalog }) => {
    const [selectedSector, setSelectedSector] = useState('');

    if (!selectedSector) {
        return (
            <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Truck className="text-blue-600" /> Nova Entrega Ativa
                    </h2>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex items-start gap-3">
                        <Truck className="text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-800">
                            A <strong>Entrega Ativa</strong> permite que a Gestão crie uma solicitação oficial de equipamento
                            para um setor. O pedido cairá na fila da <strong>Equipe Operacional</strong> para ser atendido e
                            entregue.
                        </p>
                    </div>
                    <label className="label text-gray-700">Selecione o Setor de Destino *</label>
                    <select className="input mb-4 h-[50px] font-medium" value={selectedSector} onChange={e =>
                        setSelectedSector(e.target.value)}>
                        <option value="">Selecione o setor...</option>
                        {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div
                className="w-full max-w-screen-xl mx-auto mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                        <Truck size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-blue-600 font-bold uppercase block">Entrega Ativa para o Setor</span>
                        <span className="text-lg font-black text-blue-900">{selectedSector}</span>
                    </div>
                </div>
                <button onClick={() => setSelectedSector('')} className="text-sm font-bold text-blue-600 hover:text-blue-800 underline transition-colors">Alterar Setor</button>
            </div>
            <NewRequestForm onCreateRequest={onCreateRequest} showNotification={showNotification}
                sectorSelo={selectedSector} onBack={() => setSelectedSector('')}
                adminProfile={adminProfile} equipmentCatalog={equipmentCatalog} ventilatoryCatalog={ventilatoryCatalog} generalCatalog={generalCatalog} transportCatalog={transportCatalog} fullCatalog={fullCatalog}
            />
        </div>
    );
};

// View: Nova Solicitação (Formulário de requisição de equipamentos).
const NewRequestForm = ({ onCreateRequest, showNotification, sectorSelo, onBack, adminProfile, equipmentCatalog, ventilatoryCatalog, generalCatalog, transportCatalog, fullCatalog }) => {
    const [equipmentList, setEquipmentList] = useState([]);
    const [category, setCategory] = useState('');
    const [subType, setSubType] = useState('');
    const [selectedItem, setSelectedItem] = useState('');
    const [accessoryItem, setAccessoryItem] = useState('');
    const [requesterName, setRequesterName] = useState(adminProfile ? adminProfile.name : '');
    const [requesterBadge, setRequesterBadge] = useState(adminProfile ? adminProfile.badge : '');
    const [ramal, setRamal] = useState(adminProfile ? 'Admin' : '');
    const [isEmergency, setIsEmergency] = useState(false);
    const [patientMV, setPatientMV] = useState('');
    const [patientName, setPatientName] = useState('');
    const [patientBed, setPatientBed] = useState('');
    const [checklistModel, setChecklistModel] = useState('');
    const [selectedUltrasoundAccessories, setSelectedUltrasoundAccessories] = useState([]);
    const [selectedVentAccessories, setSelectedVentAccessories] = useState([]);
    const [highFlowCategory, setHighFlowCategory] = useState('Circuito Adulto');
    const [selectedHighFlowItems, setSelectedHighFlowItems] = useState([]);
    const [selectedMonitorAccessories, setSelectedMonitorAccessories] = useState([]);
    const [selectedTransportMonitorAccessories, setSelectedTransportMonitorAccessories] = useState([]);
    const [destinyUnitBed, setDestinyUnitBed] = useState('');
    const [tevScoreType, setTevScoreType] = useState('');
    const [tevScoreValue, setTevScoreValue] = useState('');
    const [patientType, setPatientType] = useState('');
    const [transportDest, setTransportDest] = useState('');
    const [isolation, setIsolation] = useState('');
    const [isolationType, setIsolationType] = useState('');
    const [transportItems, setTransportItems] = useState([]);

    const dynamicCategoryOptions = useMemo(() => {
        const categories = new Set();
        (fullCatalog || []).forEach(item => {
            if (item?.categoria) categories.add(item.categoria);
        });
        return Array.from(categories).sort().map(cat => ({
            value: cat, label: cat
        }));
    }, [fullCatalog]);

    const dynamicEquipmentOptions = useMemo(() => {
        const seen = new Set();
        const sourceCatalog = fullCatalog || [];
        return sourceCatalog
            .filter(item => normUpper(item?.categoria) === normUpper(category))
            .map(item => item?.nome_oficial)
            .filter(label => {
                if (!label || seen.has(label)) return false;
                seen.add(label);
                return true;
            })
            .sort()
            .map(label => ({ value: label, label, aliases: getEquipmentAliases(label) }));
    }, [fullCatalog, category]);

    const selectedChecklistOptions = useMemo(() => {
        const entry = Object.entries(CHECKLIST_OPTIONS).find(([key]) => normUpper(key) === normUpper(selectedItem));
        return entry ? entry[1] : [];
    }, [selectedItem]);

    const MONITOR_ACCESSORIES = ["Manguito Adulto", "Manguito Extra Grande", "Manguito Infantil", "Cabo ECG", "Oxímetro Adulto", "Oxímetro Infantil"];
    const TRANSPORT_MONITOR_OPTIONS = ["Apenas Monitor", "Módulo completo (ECG, Oxímetro e manguito Adulto)", "Manguito Extra Grande", "Manguito infantil"];

    const handleMVChange = (e) => {
        const val = e.target.value; setPatientMV(val);
        if (PATIENT_DB[val]) {
            setPatientName(PATIENT_DB[val].name); showNotification('success', `Paciente encontrado:
    ${PATIENT_DB[val].name}`);
        }
    };

    const handleCategoryChange = (newCat) => {
        setCategory(newCat); setSubType(''); setSelectedItem(''); setAccessoryItem(''); setHighFlowCategory('Circuito Adulto'); setSelectedHighFlowItems([]); setSelectedVentAccessories([]); setSelectedMonitorAccessories([]);
        setSelectedTransportMonitorAccessories([]); setSelectedUltrasoundAccessories([]); setTransportItems([]);
        setTransportDest(''); setIsolation(''); setIsolationType(''); setChecklistModel(''); setDestinyUnitBed('');
        setTevScoreType(''); setTevScoreValue(''); setPatientType('');
    };

    const toggleHighFlowItem = (item) => { setSelectedHighFlowItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };
    const toggleVentAccessory = (item) => { setSelectedVentAccessories(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };
    const toggleMonitorAccessory = (item) => { setSelectedMonitorAccessories(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };
    const toggleTransportMonitorAccessory = (item) => { setSelectedTransportMonitorAccessories(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };
    const toggleTransportItem = (item) => { setTransportItems(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };
    const toggleUltrasoundAccessory = (item) => { setSelectedUltrasoundAccessories(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]); };

    const getEquipmentPayload = () => {
        if (!category) { showNotification('error', 'Selecione a categoria do equipamento.'); return null; }
        if (category === 'GERAIS' && !selectedItem) {
            showNotification('error', 'Selecione o equipamento desejado.');
            return null;
        }
        if (category === 'VENTILATORIA' && !subType) {
            showNotification('error', 'Selecione o tipo de ventilação.');
            return null;
        }

        let finalEquip = ''; let finalDetails = ''; let requestTevPriority = null;

        if (category && !normUpper(category).includes('VENTILATORIA') && !normUpper(category).includes('TRANSPORTE')) {
            const norm = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();

            finalEquip = String(selectedItem || '').trim().toUpperCase();

            if (norm(selectedItem).includes('MONITOR MULTIPARAMETRICO')) {
                if (selectedMonitorAccessories.length > 0) finalDetails = `Acessórios: ${selectedMonitorAccessories.join(', ')}`;
            } else if (norm(selectedItem).includes('MONITOR DE TRANSPORTE')) {
                if (selectedTransportMonitorAccessories.length > 0) finalDetails = `Configuração: ${selectedTransportMonitorAccessories.join(', ')}`;
                else { showNotification('error', 'Selecione os acessórios do Monitor de Transporte.'); return null; }
            } else if (norm(selectedItem).includes('ULTRASSOM') || norm(selectedItem).includes('USG')) {
                if (selectedUltrasoundAccessories.length > 0) finalDetails = `Itens: ${selectedUltrasoundAccessories.join(', ')}`;
            } else {
                let extras = [];
                if (checklistModel) extras.push(`Modelo/Kit: ${checklistModel}`);
                if (accessoryItem) extras.push(`Acessórios Gerais: ${accessoryItem}`);

                if (isTevCompressorType(selectedItem)) {
                    const scoreNum = parseInt(tevScoreValue, 10);
                    let tevPriorityLevel = null;
                    if (tevScoreType === 'Pádua') {
                        if (scoreNum <= 4) {
                            showNotification('error', 'Score Pádua de baixo risco. O uso do Compressor Vascular não está indicado!');
                            return null;
                        } tevPriorityLevel = 1;
                    } else if (tevScoreType === 'Caprini') {
                        if (scoreNum < 3) {
                            showNotification('error', 'Score Caprini de baixo risco. O uso do Compressor Vascular não está indicado!');
                            return null;
                        } else if (scoreNum >= 3 && scoreNum <= 4) tevPriorityLevel = 2; else tevPriorityLevel = 1;
                    } if
                        (sameText(sectorSelo, 'Centro Cirúrgico')) {
                        if (!destinyUnitBed || !tevScoreType || !tevScoreValue) {
                            showNotification('error', 'Preencha todos os campos do Score TEV e Destino.'); return null;
                        }
                        extras.push(`Destino: ${destinyUnitBed} | Score TEV (${tevScoreType}): ${tevScoreValue}`);
                    } else {
                        if
                            (!patientType || !tevScoreType || !tevScoreValue) {
                            showNotification('error', 'Preencha os campos de Tipo de Paciente e Score TEV.'); return null;
                        }
                        extras.push(`Paciente ${patientType} | TEV (${tevScoreType}): ${tevScoreValue}`);
                    }
                    requestTevPriority = tevPriorityLevel;
                } if (extras.length > 0) finalDetails = extras.join(' - ');
            }
        } else if (category && normUpper(category).includes('VENTILATORIA')) {
            const norm = (s) => String(s ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toUpperCase();

            const selectedCatItem = (ventilatoryCatalog || []).find(i => norm(i.nome_oficial) === norm(subType));
            let catalogo_id = selectedCatItem?.id || null;
            finalEquip = String(subType || '').trim().toUpperCase();

            const normalizedSubType = norm(subType);
            const ventTypeConfig = equipmentCatalog.VENTILATORIA.types[normalizedSubType];
            const hasAccessories = ventTypeConfig && ventTypeConfig.accessories && ventTypeConfig.accessories.length > 0;

            if (hasAccessories) {
                if (selectedVentAccessories.length === 0) {
                    showNotification('error', 'Selecione pelo menos um acessório ou circuito.');
                    return null;
                }
                finalDetails = `Itens/Acessórios: ${selectedVentAccessories.join(', ')}`;
            }
        } else if (category && normUpper(category).includes('TRANSPORTE')) {
            if (transportItems.length === 0) {
                showNotification('error', 'Selecione ao menos um item de transporte.');
                return null;
            }
            finalEquip = `Transporte: ${transportItems.join(' + ')}`;
            const isolInfo = isolation === 'Sim' ? `Isolamento: ${isolationType}` : 'Sem Isolamento';
            const emergInfo = isEmergency ? ' | EMERGÊNCIA' : '';
            finalDetails = `Destino: ${transportDest} | ${isolInfo}${emergInfo}`;
            if (!transportDest || !isolation) {
                showNotification('error', 'Preencha todos os campos de transporte.');
                return null;
            }
            if (isolation === 'Sim' && !isolationType) {
                showNotification('error', 'Informe o tipo de isolamento.');
                return null;
            }
        }

        const allAccessories = []; if (finalDetails) allAccessories.push(finalDetails);

        return {
            equipmentType: String(finalEquip).trim().toUpperCase(), accessories: allAccessories, tevPriority: requestTevPriority,
            destinyUnitBed: destinyUnitBed
        };
    };

    const handleAddAnother = (e) => {
        e.preventDefault();
        if (!requesterBadge.trim() || !patientMV.trim() || !patientName.trim() || !patientBed.trim()) {
            showNotification('error', 'Preencha os dados básicos do paciente primeiro.'); return;
        }
        const equipData = getEquipmentPayload();
        if (!equipData) return;
        setEquipmentList(prev => [...prev, equipData]);
        showNotification('success', 'Equipamento salvo! Pode adicionar o próximo abaixo.');
        handleCategoryChange('');
    };

    const handleSubmitAll = (e) => {
        e.preventDefault();
        if (!requesterBadge.trim() || !patientMV.trim() || !patientName.trim() || !patientBed.trim()) {
            showNotification('error', 'Preencha os dados do paciente.'); return;
        }
        const finalCart = [...equipmentList];
        if (category) {
            const currentEquip = getEquipmentPayload();
            if (!currentEquip) return;
            finalCart.push(currentEquip);
        }
        if (finalCart.length === 0) { showNotification('error', 'Adicione pelo menos um equipamento à solicitação.'); return; }

        finalCart.forEach(item => {
            onCreateRequest({
                ...item, patientName, patientMV, patientBed, requesterName, requesterBadge, extension:
                    ramal, sector: sectorSelo, isUrgent: isEmergency, kind: 'equipment_request'
            });
        });

        setEquipmentList([]); setIsEmergency(false); setPatientName(''); setPatientMV(''); setPatientBed('');
        handleCategoryChange('');
    };

    const removeEquipmentFromList = (index) => setEquipmentList(prev => prev.filter((_, i) => i !== index));

    return (
        <div
            className="bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-sm border border-gray-100 w-full max-w-screen-xl mx-auto animate-fade-in relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <PlusCircle size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Nova Solicitação</h2>
                    </div>
                </div>
                <button onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                    <ArrowDownLeft size={18} className="transform rotate-90" /> Voltar
                </button>
            </div>

            <form onSubmit={handleSubmitAll} className="space-y-6" data-testid="request-form">
                <div
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <div><label className="text-xs font-bold text-gray-500 uppercase">Setor</label>
                        <div data-testid="request-sector" className="text-2xl font-bold text-blue-600">{sectorSelo}</div>
                    </div>
                    <div className="flex items-center"><label
                        className="flex items-center space-x-3 cursor-pointer"><input type="checkbox"
                            data-testid="request-urgent" checked={isEmergency} onChange={(e) => setIsEmergency(e.target.checked)}
                            className="w-5 h-5 text-red-600 rounded" /><span className={`font-bold ${isEmergency
                                ? 'text-red-600' : 'text-gray-700'}`}>Pedido Emergencial?</span></label></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="label">Nome Solicitante *</label><input
                        data-testid="request-requester-name" required type="text" className="input" value={requesterName} onChange={e =>
                            setRequesterName(e.target.value)} /></div>
                    <div><label className="label">Matrícula *</label><input data-testid="request-requester-badge" required type="text" className="input"
                        value={requesterBadge} onChange={e => setRequesterBadge(e.target.value)} /></div>
                    <div><label className="label">Ramal *</label><input data-testid="request-extension" required type="text" className="input"
                        value={ramal} onChange={e => setRamal(e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="label">Registro MV*</label><input data-testid="request-patient-mv" required type="text" className="input"
                        value={patientMV} onChange={handleMVChange} placeholder="Ex: MV458512" /></div>
                    <div><label className="label">Nome do Paciente *</label><input data-testid="request-patient-name" required type="text"
                        className="input" value={patientName} onChange={e => setPatientName(e.target.value)} />
                    </div>
                    <div><label className="label">Leito do Paciente *</label><input data-testid="request-patient-bed" required type="text"
                        className="input font-bold" value={patientBed} onChange={e =>
                            setPatientBed(e.target.value.replace(/\D/g, '').substring(0, 2))} placeholder="Ex: 05"
                        maxLength="2" /></div>
                </div>
                <hr className="border-gray-100" />

                {equipmentList.length > 0 && (
                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 mb-6 animate-fade-in">
                        <h4 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
                            <Package size={18} /> Equipamentos Adicionados ({equipmentList.length})
                        </h4>
                        <ul className="space-y-2">
                            {equipmentList.map((eq, idx) => (
                                <li key={idx}
                                    className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 text-sm shadow-sm">
                                    <div className="flex-1"><span
                                        className="font-bold text-gray-800">{eq.equipmentType}</span>{eq.accessories &&
                                            eq.accessories.length > 0 && <p className="text-gray-500 mt-1">
                                                {eq.accessories.join(' | ')}</p>}</div>
                                    <button type="button" onClick={() => removeEquipmentFromList(idx)}
                                        className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors ml-4"
                                        title="Remover Item">
                                        <X size={18} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div data-testid="request-equipment-type">
                    <label className="label text-lg text-blue-800 font-bold">Categoria do Equipamento</label>
                    <SearchDropdown value={category} onChange={handleCategoryChange}
                        options={dynamicCategoryOptions} placeholder="Selecione a categoria..." className="border-blue-200 bg-blue-50/30 h-[50px] text-lg font-medium" />
                </div>

                {category && normUpper(category).includes('VENTILATORIA') && (() => {
            const norm = (s) => String(s ?? '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .trim()
                .toUpperCase();

            const optionsDropdown = (ventilatoryCatalog || []).map(item => ({ value: item.nome_oficial, label: item.nome_oficial }));

            const normalizedSubType = norm(subType);
            const ventTypeConfig = equipmentCatalog.VENTILATORIA.types[normalizedSubType];
            const hasAccessories = ventTypeConfig && ventTypeConfig.accessories && ventTypeConfig.accessories.length > 0;

            return (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="label">Tipo</label>
                            <SearchDropdown value={subType} onChange={(val) => {
                                setSubType(val);
                                setAccessoryItem(''); setHighFlowCategory('Circuito Adulto');
                                setSelectedHighFlowItems([]); setSelectedVentAccessories([]);
                            }}
                                options={optionsDropdown} placeholder="Selecione o tipo..." />
                        </div>

                        {hasAccessories && (
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                                <label className="label text-blue-800 font-bold mb-3">Selecione os itens desejados:</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {ventTypeConfig.accessories.map((item) => (
                                        <label key={item} className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                                            <input type="checkbox" checked={selectedVentAccessories.includes(item)} onChange={() => toggleVentAccessory(item)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" />
                                            <span className="text-gray-700 font-medium text-sm">{item}</span>
                                        </label>
                                    ))}
                                </div>
                                <p className="text-xs text-blue-600 mt-2 font-bold">Selecionados: {selectedVentAccessories.length > 0 ? selectedVentAccessories.join(', ') : 'Nenhum'}</p>
                            </div>
                        )}
                    </div>
                </div>
            );
        })()}

                {category && !normUpper(category).includes('VENTILATORIA') && !normUpper(category).includes('TRANSPORTE') && (
                    <div className="animate-fade-in" data-testid="request-equipment-item">
                        <label className="label">Equipamento</label>
                        <SearchDropdown value={selectedItem} onChange={(val) => {
                            setSelectedItem(val);
                            setAccessoryItem(''); setChecklistModel(''); setSelectedMonitorAccessories([]);
                            setSelectedTransportMonitorAccessories([]); setSelectedUltrasoundAccessories([]);
                            setDestinyUnitBed(''); setPatientType(''); setTevScoreType(normUpper(val) === 'COMPRESSOR PARA TERAPIA VASCULAR' &&
                                sameText(sectorSelo, 'Centro Cirúrgico') ? 'Caprini' : ''); setTevScoreValue('');
                        }}
                            options={dynamicEquipmentOptions} placeholder="Buscar e selecionar equipamento..." />

                        {selectedChecklistOptions.length > 0 && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in">
                                <label className="label text-blue-800">Selecione o Modelo/Kit:</label><select
                                    value={checklistModel} onChange={e => setChecklistModel(e.target.value)}
                                    className="input bg-white"><option value="">Selecione...</option>
                                    {selectedChecklistOptions.map(opt => <option key={opt} value={opt}>{opt}
                                    </option>)}</select></div>
                        )}

                        {normUpper(selectedItem) === 'MONITOR MULTIPARAMETRICO' && (
                            <div className="mt-3 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                                <label className="label text-blue-800 font-bold mb-3">Selecione os Acessórios:</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {MONITOR_ACCESSORIES.map((item) => (
                                        <label key={item}
                                            className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"><input
                                                type="checkbox" checked={selectedMonitorAccessories.includes(item)}
                                                onChange={() => toggleMonitorAccessory(item)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /><span
                                                    className="text-gray-700 font-medium text-sm">{item}</span></label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {normUpper(selectedItem) === 'ULTRASSOM' && (
                            <div className="mt-3 bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                                <label className="label text-blue-800 font-bold mb-3">Itens Necessários:</label>
                                <div className="flex flex-col gap-2">
                                    {["Protetor de transdutor", "Gel de contato"].map(item => (
                                        <label key={item}
                                            className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"><input
                                                type="checkbox" checked={selectedUltrasoundAccessories.includes(item)}
                                                onChange={() => toggleUltrasoundAccessory(item)} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" /><span
                                                    className="text-gray-700 font-medium text-sm">{item}</span></label>
                                    ))}
                                </div>
                                <p className="text-xs text-blue-600 mt-2 font-bold">Selecionados:
                                    {selectedUltrasoundAccessories.length > 0 ? selectedUltrasoundAccessories.join(', ')
                                        : 'Nenhum'}</p>
                            </div>
                        )}

                        {normUpper(selectedItem) === 'MONITOR DE TRANSPORTE' && (
                            <div className="mt-3 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-fade-in">
                                <label className="label text-purple-800 font-bold mb-3">Configuração do Monitor de
                                    Transporte (Patch 21):</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {TRANSPORT_MONITOR_OPTIONS.map((item) => (
                                        <label key={item}
                                            className="flex items-center space-x-3 p-2 bg-white rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50"><input
                                                type="checkbox" checked={selectedTransportMonitorAccessories.includes(item)}
                                                onChange={() => toggleTransportMonitorAccessory(item)} className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" /><span
                                                    className="text-gray-700 font-medium text-sm">{item}</span></label>
                                    ))}
                                </div>
                            </div>
                        )}

                        {normUpper(selectedItem) === 'SOLICITAR SOMENTE OS ACESSORIOS' && (
                            <div className="mt-3"><label className="label">Qual acessório?</label><select
                                value={accessoryItem} onChange={e => setAccessoryItem(e.target.value)}
                                className="input"><option value="">Selecione...</option>
                                {equipmentCatalog.GERAIS.accessoryItems.map(i => <option key={i} value={i}>{i}</option>
                                )}</select></div>
                        )}

                        {normUpper(selectedItem) === 'COMPRESSOR PARA TERAPIA VASCULAR' && (
                            <div className={`mt-4 p-5 rounded-xl border animate-fade-in shadow-sm
                                ${sameText(sectorSelo, 'Centro Cirúrgico') ? 'bg-red-50 border-red-200'
                                    : 'bg-blue-50 border-blue-200'}`}>
                                <h4 className={`${sameText(sectorSelo, 'Centro Cirúrgico') ? 'text-red-800' : 'text-blue-800'}
                                    font-bold mb-4 flex items-center gap-2`}>
                                    <AlertTriangle size={18} /> Requisitos Específicos: {sameText(sectorSelo, 'Centro Cirúrgico') ? 'Centro Cirúrgico' : 'Compressor para Terapia Vascular'}
                                </h4>
                                <div className="space-y-4">
                                    {sameText(sectorSelo, 'Centro Cirúrgico') && (
                                        <div><label className="label text-red-900">Unidade/Leito de destino *</label><input
                                            type="text"
                                            className="input border-red-200 focus:border-red-500 focus:ring-red-500"
                                            value={destinyUnitBed} onChange={e => setDestinyUnitBed(e.target.value)}
                                            placeholder="Ex: UTI 3 - Leito 12" /></div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {sameText(sectorSelo, 'Centro Cirúrgico') ? (
                                            <div>
                                                <label className="label text-red-900">Protocolo TEV *</label>
                                                <div
                                                    className="input bg-red-100 border-red-200 text-red-800 font-bold flex items-center opacity-90 cursor-not-allowed">
                                                    Caprini (Fixo)</div>
                                            </div>
                                        ) : (
                                            <>
                                                <div>
                                                    <label className="label text-blue-900">Tipo de Paciente *</label>
                                                    <select className="input bg-white border-blue-200" value={patientType}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            setPatientType(val);
                                                            if (val === 'Clínico') setTevScoreType('Pádua');
                                                            else if (val === 'Cirúrgico') setTevScoreType('Caprini');
                                                            else setTevScoreType('');
                                                            setTevScoreValue('');
                                                        }}>
                                                        <option value="">Selecione...</option>
                                                        <option value="Clínico">Clínico</option>
                                                        <option value="Cirúrgico">Cirúrgico</option>
                                                    </select>
                                                </div>
                                                {patientType && (
                                                    <div className="animate-fade-in">
                                                        <label className="label text-blue-900">Protocolo TEV *</label>
                                                        <div
                                                            className="input bg-blue-100 border-blue-200 text-blue-800 font-bold flex items-center opacity-90 cursor-not-allowed">
                                                            {tevScoreType}</div>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {(tevScoreType || sameText(sectorSelo, 'Centro Cirúrgico')) && (
                                            <div className="animate-fade-in md:col-span-2 lg:col-span-1"><label
                                                className={`label ${sameText(sectorSelo, 'Centro Cirúrgico') ? 'text-red-900'
                                                    : 'text-blue-900'}`}>Valor do Score ({sameText(sectorSelo, 'Centro Cirúrgico')
                                                        ? 'Caprini' : tevScoreType}) *</label><input type="number"
                                                            className={`input font-bold ${sameText(sectorSelo, 'Centro Cirúrgico')
                                                                ? 'border-red-200 focus:border-red-500 focus:ring-red-500 text-red-800'
                                                                : 'border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-blue-800'
                                                                }`} value={tevScoreValue} onChange={e => {
                                                                    setTevScoreValue(e.target.value); if (sameText(sectorSelo, 'Centro Cirúrgico'))
                                                                        setTevScoreType('Caprini');
                                                                }} placeholder="Ex: 4" /></div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {category && normUpper(category).includes('TRANSPORTE') && (
                    <div className="animate-fade-in bg-orange-50 p-4 rounded-xl border border-orange-200 space-y-4">
                        <select value={transportDest} onChange={e => setTransportDest(e.target.value)} className="input">
                            <option value="">Destino...</option>{equipmentCatalog.TRANSPORTE.destinations.map(i => <option
                                key={i} value={i}>{i}</option>)}</select>
                        <div className="bg-white p-3 rounded-lg border border-orange-100">
                            <label className="label font-bold text-orange-800 mb-2">Itens para Transporte:</label>
                            <div className="space-y-2">
                                {(transportCatalog || []).map(item => item.nome_oficial).map(item => (
                                    <label key={item}
                                        className="flex items-center space-x-3 cursor-pointer hover:bg-orange-50 p-1 rounded transition-colors"><input
                                            type="checkbox" checked={transportItems.includes(item)} onChange={() =>
                                                toggleTransportItem(item)} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" /><span
                                                    className="text-gray-700 font-medium">{item}</span></label>
                                ))}
                            </div>
                            <p className="text-xs text-orange-600 mt-2 font-bold">Selecionados: {transportItems.length >
                                0 ? transportItems.join(', ') : 'Nenhum'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border border-orange-100">
                            <div className="grid grid-cols-2 gap-4">
                                <select value={isolation} onChange={e => setIsolation(e.target.value)} className="input bg-white"><option value="">Isolamento?</option>
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                </select>
                                {isolation === 'Sim' && <select value={isolationType}
                                    onChange={e => setIsolationType(e.target.value)} className="input"><option value="">
                                        Tipo?</option>
                                    <option value="CONTATO">CONTATO</option>
                                    <option value="RESPIRATÓRIO">RESPIRATÓRIO</option>
                                    <option value="CONTATO + RESPIRATÓRIO">AMBOS</option>
                                </select>}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-100">
                    <button data-testid="create-request-button" type="button" onClick={handleAddAnother} disabled={!category}
                        className="flex-1 h-[50px] rounded-xl border-2 border-blue-600 text-blue-600 font-bold hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                        <PlusCircle size={20} /> Solicitar Outro Equipamento
                    </button>
                    <button data-testid="request-submit" type="submit" disabled={!category && equipmentList.length === 0}
                        className="flex-1 btn-primary h-[50px] text-lg shadow-lg shadow-blue-200 flex items-center justify-center gap-2 disabled:opacity-50">Confirmar
                        Solicitação
                        <ArrowUpRight size={20} />
                    </button>
                </div>
            </form>
        </div>
    );
};

// View: Devolução e Triagem de equipamentos recolhidos.
const ReturnView = ({ inventory, onReturnByTag, showNotification, initialData }) => {
    const [typedTag, setTypedTag] = useState('');
    const [step, setStep] = useState(1);
    const [isDefective, setIsDefective] = useState(false);
    const [defectDesc, setDefectDesc] = useState('');
    const [returnedAllAccessories, setReturnedAllAccessories] = useState(true);
    const [unitNotified, setUnitNotified] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setTypedTag(normUpper(initialData.tag || initialData.type || ''));
            if (initialData.tag) setStep(2);
            if (initialData.hasDefect) { setIsDefective(true); setDefectDesc(initialData.defectDesc || ''); }
        }
    }, [initialData]);

    const [patientDamage, setPatientDamage] = useState(false);
    const [notificationNumber, setNotificationNumber] = useState('');
    const returnOptions = useMemo(() => {
        return (inventory || [])
            .filter(item => item?.tag)
            .map(item => ({
                value: normUpper(item.tag),
                label: `${normUpper(item.tag)} - ${normUpper(item.type)} (${trimText(item.model) || '-'})`
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
    }, [inventory]);

    const found = useMemo(() => {
        const tagUpper = normUpper(typedTag);
        if (!tagUpper) return null;
        return inventory.find(i => normUpper(i.tag) === tagUpper);
    }, [typedTag, inventory]);

    const proceed = () => {
        if (!typedTag.trim()) { showNotification('error', 'Digite a TAG do equipamento.'); return; }
        if (!found) { showNotification('error', 'TAG não encontrada.'); return; }
        if (found && (found.status === 'cleaning' || found.status === 'maintenance')) {
            showNotification('error', `A TAG ${found.tag} já está em ${found.status === 'cleaning' ? 'higienização' : 'manutenção'}.`);
            return;
        }
        setStep(2);
    };

    const confirm = async () => {
        if (!found) { showNotification('error', 'TAG não encontrada.'); return; }
        if (isDefective && !defectDesc.trim()) { showNotification('error', 'Descreva o defeito.'); return; }
        if (found.status === 'cleaning' || found.status === 'maintenance') {
            showNotification('error', `A TAG ${found.tag} já está em ${found.status === 'cleaning' ? 'higienização' : 'manutenção'}.`);
            return;
        }

        setIsSubmitting(true);
        const ok = await onReturnByTag({
            tag: normUpper(typedTag), hasDefect: isDefective, defectDescription: defectDesc.trim(),
            returnedAllAccessories, unitNotified, patientDamage, notificationNumber
        });
        setIsSubmitting(false);

        if (ok) {
            setTypedTag(''); setStep(1); setIsDefective(false); setDefectDesc(''); setReturnedAllAccessories(true);
            setUnitNotified(false); setPatientDamage(false); setNotificationNumber('');
        }
    };

    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Devolução e Triagem (CEIC)</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                {step === 1 && (
                    <div className="space-y-4">
                        <label className="label">Digite a TAG do Equipamento</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            {initialData ? (
                                <input
                                    type="text"
                                    value={normUpper(initialData.tag || initialData.type || '')}
                                    readOnly
                                    className="input w-full pl-12 font-mono uppercase bg-gray-100 cursor-not-allowed text-gray-500"
                                />
                            ) : (
                                <SearchDropdown value={normUpper(typedTag)} onChange={(val) => setTypedTag(normUpper(val))}
                                    options={returnOptions} placeholder="Pesquisar TAG (ex.: EVNI…, EETV…, ECEX…)"
                                    className="w-full pl-12 font-mono uppercase" />
                            )}
                        </div>
                        <button onClick={proceed} className="btn-primary w-full">AVANÇAR PARA TRIAGEM</button>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-xl text-center">
                            <p className="text-sm text-gray-500">Item</p>
                            <p className="text-xl font-bold text-gray-800">{found?.tag}</p>
                            <p className="text-xs text-gray-400 mt-1">Modelo: {found?.model} • Setor atual: {found ?
                                formatItemLocation(found) : '-'}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                            <p className="text-sm font-bold text-blue-900 mb-2">Retornou com todos os acessórios?</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setReturnedAllAccessories(true)}
                                    className={`flex-1 h-[44px] rounded-xl border font-bold ${returnedAllAccessories
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-blue-700 border-blue-200'
                                        }`}
                                >
                                    SIM
                                </button>

                                <button
                                    onClick={() => setReturnedAllAccessories(false)}
                                    className={`flex-1 h-[44px] rounded-xl border font-bold ${!returnedAllAccessories
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white text-blue-700 border-blue-200'
                                        }`}
                                >
                                    NÃO
                                </button>
                            </div>
                        </div>
                        <div className="text-center">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">O equipamento apresentou defeito?</h3>
                            <div className="flex gap-4 justify-center">
                                <button onClick={() => setIsDefective(false)} className={`flex-1 p-4 rounded-xl border-2
                                    transition-all ${!isDefective ? 'border-green-500 bg-green-50 text-green-700' :
                                        'border-gray-200'}`}>
                                    <CheckCircle className="mx-auto mb-2" /> NÃO <br /><span
                                        className="text-xs font-normal">Vai para Higienização</span>
                                </button>
                                <button onClick={() => setIsDefective(true)} className={`flex-1 p-4 rounded-xl border-2
                                    transition-all ${isDefective ? 'border-red-500 bg-red-50 text-red-700' :
                                        'border-gray-200'}`}>
                                    <AlertTriangle className="mx-auto mb-2" /> SIM <br /><span
                                        className="text-xs font-normal">Vai para Manutenção</span>
                                </button>
                            </div>
                        </div>
                        {isDefective && (
                            <div className="space-y-3 animate-fade-in">
                                <div><label className="label">Descrição do Defeito *</label><textarea className="input"
                                    rows="3" value={defectDesc}
                                    onChange={e => setDefectDesc(e.target.value)} placeholder="Descreva o problema..." /></div>
                                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-4">
                                    <div>
                                        <p className="text-sm font-bold text-red-900 mb-2">Unidade foi notificada?</p>
                                        <div className="flex gap-3 mb-3">
                                            <button onClick={() => setUnitNotified(true)} className={`flex-1 h-[44px] rounded-xl border font-bold ${unitNotified ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-200'}`}>SIM</button>
                                            <button onClick={() => setUnitNotified(false)} className={`flex-1 h-[44px] rounded-xl border font-bold ${!unitNotified ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-200'}`}>NÃO</button>
                                        </div>
                                        <div className="animate-fade-in"><label className="label text-red-800">Nº da Notificação (Opcional)</label><input className="input border-red-300" value={notificationNumber} onChange={e => setNotificationNumber(e.target.value)} placeholder="Ex: NOT-2023-001" /></div>
                                    </div>
                                    <hr className="border-red-200" />
                                    <div>
                                        <p className="text-sm font-bold text-red-900 mb-2">Houve dano ao paciente?</p>
                                        <div className="flex gap-3">
                                            <button onClick={() => setPatientDamage(true)} className={`flex-1 h-[44px] rounded-xl border font-bold ${patientDamage ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-200'}`}>SIM</button>
                                            <button onClick={() => setPatientDamage(false)} className={`flex-1 h-[44px] rounded-xl border font-bold ${!patientDamage ? 'bg-red-600 text-white border-red-600' : 'bg-white text-red-700 border-red-200'}`}>NÃO</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setStep(1)} className="flex-1 py-3 text-gray-500 font-medium">Voltar</button>
                            <button onClick={confirm} disabled={isSubmitting} className="flex-[2] h-[44px] rounded-xl bg-gray-900 text-white font-bold hover:bg-black flex items-center justify-center disabled:opacity-60 disabled:cursor-not-allowed">{isSubmitting ? 'CONFIRMANDO...' : 'CONFIRMAR CHECK-IN'}</button>
                        </div>
                    </div>
                )
                }
            </div >
        </div >
    );
};

// View: Limpeza e Expurgo (Fila de higienização).
const CleaningView = ({ inventory, onRelease }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [releasingId, setReleasingId] = useState(null);
    const cleaningItems = inventory.filter(i => i.status === 'cleaning');

    const filteredItems = useMemo(() => {
        if (!searchTerm.trim()) return cleaningItems;
        const lower = normLower(searchTerm);
        return cleaningItems.filter(i =>
            (i.tag && normLower(i.tag).includes(lower)) ||
            (i.type && normLower(i.type).includes(lower)) ||
            (i.model && normLower(i.model).includes(lower)) ||
            (i.location && normLower(i.location).includes(lower))
        );
    }, [cleaningItems, searchTerm]);

    return (
        <div className="pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center"><SprayCan className="mr-2 text-yellow-600" /> Sala de Expurgo / Higienização</h2>
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        className="input pl-10"
                        placeholder="Buscar por TAG, tipo ou modelo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredItems.map(item => (
                    <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-yellow-200 relative overflow-hidden flex flex-col h-full">
                        <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] md:text-xs px-3 py-1 rounded-bl-lg font-bold uppercase tracking-wide">Em Limpeza</div>

                        <div className="flex-1 mb-4 pr-20">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="font-mono font-bold text-lg text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{item.tag}</span>
                            </div>
                            <h3 className="font-bold text-md text-gray-800 uppercase leading-snug mb-2">{item.type || 'Tipo Não Informado'}</h3>
                            <div className="text-sm text-gray-600 space-y-1">
                                <p><span className="font-medium">Modelo:</span> {item.model || 'N/A'}</p>
                                {item.location && <p><span className="font-medium">Local:</span> {item.location}</p>}
                            </div>
                        </div>

                        <button
                            onClick={async () => {
                                setReleasingId(item.id);
                                await onRelease(item.id);
                                setReleasingId(null);
                            }}
                            disabled={releasingId === item.id}
                            className={`w-full mt-auto h-[44px] text-white rounded-xl text-sm font-bold flex items-center justify-center transition-colors shadow-sm ${releasingId === item.id ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                        >
                            {releasingId === item.id ? (
                                <>Liberando...</>
                            ) : (
                                <><CheckCircle size={18} className="mr-2" /> LIBERAR ITEM</>
                            )}
                        </button>
                    </div>
                ))}

                {cleaningItems.length === 0 && <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">Nenhum equipamento aguardando higienização.</div>}
                {cleaningItems.length > 0 && filteredItems.length === 0 && <div className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">Nenhum resultado para a busca.</div>}
            </div>
        </div>
    );
};

// View: Manutenção (Fila de equipamentos em reparo/engenharia).
const MaintenanceView = ({ inventory, onReturn, showNotification, onBack }) => {
    const maintenanceItems = inventory.filter(i => i.status === 'maintenance');
    const [modalItem, setModalItem] = useState(null);

    const [returner, setReturner] = useState('');
    const [receiver, setReceiver] = useState('');
    const [badge, setBadge] = useState('');
    const [notes, setNotes] = useState('');

    const confirmReturn = () => {
        if (!returner || !receiver || !badge) {
            showNotification('error', 'Preencha os campos obrigatórios (Quem devolveu, Quem recebeu e Matrícula).');
            return;
        }
        onReturn(modalItem.id, { returner, receiver, badge, notes });
        setModalItem(null); setReturner(''); setReceiver(''); setBadge(''); setNotes('');
    };

    return (
        <div className="pb-20 animate-fade-in max-w-6xl mx-auto">
            {modalItem && createPortal(
                <div className="modal-overlay z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-orange-600 flex items-center gap-2">
                                <Wrench size={20} /> Retorno de Manutenção
                            </h3>
                            <button onClick={() => setModalItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-lg mb-5 text-sm text-orange-800 border border-orange-100">
                            <p className="font-bold text-base">{modalItem.model}</p>
                            <p className="font-mono">{modalItem.tag}</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="label text-gray-700">Quem devolveu? (Técnico/Empresa) *</label>
                                <input className="input border-gray-300 focus:border-orange-500 focus:ring-orange-500" value={returner} onChange={e => setReturner(e.target.value)} placeholder="Nome do técnico" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label text-gray-700">Quem recebeu? *</label>
                                    <input className="input border-gray-300 focus:border-orange-500 focus:ring-orange-500" value={receiver} onChange={e => setReceiver(e.target.value)} placeholder="Seu nome" required />
                                </div>
                                <div>
                                    <label className="label text-gray-700">Sua Matrícula *</label>
                                    <input className="input border-gray-300 focus:border-orange-500 focus:ring-orange-500" value={badge} onChange={e => setBadge(e.target.value)} placeholder="Ex: 12345" required />
                                </div>
                            </div>
                            <div>
                                <label className="label text-gray-700">Observações (Opcional)</label>
                                <textarea className="input border-gray-300 focus:border-orange-500 focus:ring-orange-500" rows="3" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Detalhes do reparo efetuado, peças substituídas..."></textarea>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setModalItem(null)} className="flex-1 py-3 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button onClick={confirmReturn}
                                className="flex-[2] py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors shadow-lg shadow-orange-200 flex justify-center items-center">Confirmar
                                Retorno</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                    <Wrench className="mr-2 text-orange-600" /> Equipamentos em Manutenção
                </h2>
                <button onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors">
                    <ArrowDownLeft size={18} className="transform rotate-90" /> Voltar
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {maintenanceItems.map(item => (
                    <div key={item.id}
                        className="bg-white p-5 rounded-xl shadow-sm border border-orange-200 relative flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-bold text-xl text-gray-800">{item.tag}</h3>
                                <p className="text-sm font-medium text-gray-500">{item.model}</p>
                            </div>
                            <span
                                className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded font-bold border border-red-100 flex items-center gap-1">
                                <AlertTriangle size={12} /> Com Defeito
                            </span>
                        </div>

                        <div
                            className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 space-y-2 border border-gray-100 flex-1">
                            <p><span className="font-bold text-gray-500">Data de Parada:</span> {item.returnDate ? new
                                Date(item.returnDate).toLocaleDateString() : 'Desconhecida'}</p>
                            <p><span className="font-bold text-gray-500">Origem do Equipamento:</span> <span
                                className="text-blue-700 font-medium">{item.previousLocation || 'Não informada'}</span></p>
                            <div className="pt-2 border-t border-gray-200">
                                <p><span className="font-bold text-gray-500 block mb-1">Descrição do Defeito:</span>
                                    <span className="italic">"{item.defectDescription || 'Sem descrição'}"</span></p>
                            </div>
                            <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                                <span className="font-bold text-gray-500">Notificação Unidade:</span>
                                {item.unitNotified ? (
                                    <span
                                        className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">{item.notificationNumber
                                            || 'Registrada'}</span>
                                ) : (
                                    <span className="text-gray-400">Não Houve</span>
                                )}
                            </div>
                        </div>

                        <button onClick={() => setModalItem(item)} className="w-full mt-4 h-[44px] bg-orange-600 text-white rounded-lg text-sm font-bold hover:bg-orange-700 flex items-center justify-center shadow-orange-100 shadow-lg transition-colors">
                            <Wrench size={16} className="mr-2" /> REGISTRAR RETORNO DA MANUTENÇÃO
                        </button>
                    </div>
                ))}
                {maintenanceItems.length === 0 && <div
                    className="col-span-full p-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center">
                    <CheckCircle size={48} className="mb-3 opacity-20 text-green-500" />
                    <p className="text-lg">Nenhum equipamento em manutenção.</p>
                </div>}
            </div>
        </div>
    );
};

// View: Equipamentos na Área (Aparelhos alocados no setor logado).
const MyAreaEquipmentView = ({ inventory, sector, requests, onRequestPickup, onTransferEquipment,
    onConfirmTransfer, onConfirmReceipt, showNotification, onBack, userProfile }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const [collaboratorName, setCollaboratorName] = useState('');
    const [collaboratorBadge, setCollaboratorBadge] = useState('');

    const [hasIssue, setHasIssue] = useState('');
    const [issueDescription, setIssueDescription] = useState('');

    const [transferModalOpen, setTransferModalOpen] = useState(false);
    const [destinationSector, setDestinationSector] = useState('');
    const [destinationBed, setDestinationBed] = useState('');

    const [receiveModalOpen, setReceiveModalOpen] = useState(false);
    const [receiveAction, setReceiveAction] = useState('accept');

    const [receiptModalOpen, setReceiptModalOpen] = useState(false);
    const [confirmingReceiptTag, setConfirmingReceiptTag] = useState(null);

    const [unidades, setUnidades] = useState([]);

    useEffect(() => {
        const fetchUnidades = async () => {
            const { data, error } = await supabase
                .from('ceic_usuarios')
                .select('login, nome')
                .order('login', { ascending: true });
            if (!error && data) {
                setUnidades(data);
            }
        };
        fetchUnidades();
    }, []);

    console.log("🕵️ DEBUG TELA DA ÁREA:", {
        totalEquipamentosRecebidos: inventory?.length || "UNDEFINED - Prop não chegou",
        meuLogin: userProfile?.login,
        meuSetor: sector
    });

    const myEquipments = (inventory || []).filter(e => {
        if (!e.location) return false;

        const loc = String(e.location).trim().toUpperCase();
        const transTo = String(e.transferTo || '').trim().toUpperCase();
        const userLogin = String(userProfile?.login || '').trim().toUpperCase();

        // O equipamento pertence à unidade logada se a localização ou o destino em trânsito baterem com o login.
        const isMine = (loc === userLogin || transTo === userLogin);

        // Exibe equipamentos que estão na unidade e não foram recolhidos pela CEIC
        const activeStatuses = ['in_use', 'allocated', 'pickup_requested', 'disponivel'];

        return loc !== 'CEIC' && isMine && activeStatuses.includes(e.status);
    });

    const groupedEquipments = myEquipments.reduce((acc, item) => {
        if (!acc[item.model]) { acc[item.model] = []; }
        acc[item.model].push(item);
        return acc;
    }, {});
    const equipmentNames = Object.keys(groupedEquipments).sort();

    const handleReturnClick = (item) => {
        setSelectedItem(item); setCollaboratorName(''); setCollaboratorBadge(''); setHasIssue('');
        setIssueDescription(''); setModalOpen(true);
    };

    const confirmReturn = () => {
        if (!collaboratorName || !collaboratorBadge) {
            showNotification('error', 'Preencha nome e matrícula.');
            return;
        }
        if (hasIssue === 'Sim' && !issueDescription.trim()) { showNotification('error', 'Descreva o problema identificado.'); return; }
        onRequestPickup({
            equipmentTag: selectedItem.tag, collaboratorName, collaboratorBadge, hasIssue,
            issueDescription
        });
        setModalOpen(false);
    };

    const handleTransferClick = (item) => {
        setSelectedItem(item); setCollaboratorName(''); setCollaboratorBadge(''); setDestinationSector('');
        setDestinationBed(''); setTransferModalOpen(true);
    };

    const confirmTransfer = () => {
        if (!destinationSector || !collaboratorName || !collaboratorBadge) { showNotification('error', 'Preencha todos os campos obrigatórios.'); return; }
        onTransferEquipment({
            equipmentTag: selectedItem.tag, destination: destinationSector, destinationBed,
            collaboratorName, collaboratorBadge
        });
        setTransferModalOpen(false);
    };

    const handleConfirmTransferClick = (item) => {
        const pedido = requests.find(r => normUpper(r.equipmentTag).includes(normUpper(item.tag)) && r.status === 'in_transfer');
        onConfirmTransfer(item, pedido);
    };

    const handleReceiptClick = (item) => {
        setSelectedItem(item); setCollaboratorName(''); setCollaboratorBadge(''); setReceiptModalOpen(true);
    };

    const confirmReceiptSubmit = async () => {
        if (!collaboratorName || !collaboratorBadge) {
            showNotification('error', 'Preencha nome e matrícula.');
            return;
        }
        setConfirmingReceiptTag(selectedItem.tag);
        const ok = await onConfirmReceipt({ equipmentTag: selectedItem.tag, collaboratorName, collaboratorBadge });
        setConfirmingReceiptTag(null);
        if (ok) setReceiptModalOpen(false);
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {modalOpen && createPortal(
                <div className="modal-overlay">
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800">Devolver Equipamento</h3>
                            <button onClick={() => setModalOpen(false)}>
                                <X className="text-gray-400" />
                            </button>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800">
                            <p className="font-bold">{selectedItem?.model}</p>
                            <p className="font-mono">{selectedItem?.tag}</p>
                        </div>
                        <div className="space-y-3 mb-4">
                            <div><label className="label">Seu Nome</label><input className="input"
                                value={collaboratorName} onChange={e => setCollaboratorName(e.target.value)}
                                placeholder="Nome completo" /></div>
                            <div><label className="label">Sua Matrícula</label><input className="input"
                                value={collaboratorBadge} onChange={e => setCollaboratorBadge(e.target.value)}
                                placeholder="00000" /></div>
                            <div>
                                <label className="label">Houve algum problema com o equipamento?</label>
                                <select className="input" value={hasIssue} onChange={e => setHasIssue(e.target.value)}>
                                    <option value="">Selecione...</option>
                                    <option value="Não">Não</option>
                                    <option value="Sim">Sim</option>
                                </select>
                            </div>
                            {hasIssue === 'Sim' && (
                                <div className="animate-fade-in bg-red-50 p-3 rounded-lg border border-red-100">
                                    <label className="label text-red-800">Qual o problema? *</label>
                                    <textarea className="input border-red-200" value={issueDescription}
                                        onChange={e => setIssueDescription(e.target.value)} required placeholder="Descreva a avaria ou defeito..." rows="2"></textarea>
                                </div>
                            )}
                        </div>
                        <button onClick={confirmReturn} className="btn-primary w-full">Confirmar Devolução</button>
                    </div>
                </div>,
                document.body
            )}

            {transferModalOpen && createPortal(
                <div className="modal-overlay">
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in border border-purple-200 max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-purple-700 flex items-center gap-2">
                                <Send size={20} /> Remanejar Equipamento
                            </h3>
                            <button onClick={() => setTransferModalOpen(false)}>
                                <X className="text-gray-400 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg mb-4 text-sm text-purple-800">
                            <p className="font-bold">{selectedItem?.model}</p>
                            <p className="font-mono">{selectedItem?.tag}</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label text-gray-700">Setor/Unidade *</label>
                                    <select
                                        className="input border-purple-200 focus:border-purple-500 focus:ring-purple-500"
                                        value={destinationSector} onChange={e => setDestinationSector(e.target.value)}>
                                        <option value="">Selecione a unidade de destino</option>
                                        {unidades.filter(u => u.login !== sector).map(u => (
                                            <option key={u.login} value={u.login}>
                                                {u.login} - {u.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="label text-gray-700">Leito Destino</label>
                                    <input type="text" className="input border-purple-200 focus:border-purple-500"
                                        value={destinationBed} onChange={e => setDestinationBed(e.target.value)}
                                        placeholder="Ex: Leito 05" />
                                </div>
                            </div>
                            <div>
                                <label className="label text-gray-700">Paciente Vinculado</label>
                                <input className="input bg-gray-100 text-gray-500 cursor-not-allowed"
                                    value={selectedItem?.patient_mv ? `${selectedItem.patientName || 'Desconhecido'} (MV: ${selectedItem.patient_mv})` : 'Nenhum paciente vinculado'} disabled />
                                <p className="text-[10px] text-gray-400 mt-1">O paciente não pode ser alterado durante o
                                    remanejamento.</p>
                            </div>
                            <div><label className="label text-gray-700">Seu Nome *</label><input
                                className="input border-gray-300" value={collaboratorName} onChange={e =>
                                    setCollaboratorName(e.target.value)} placeholder="Responsável pelo envio" /></div>
                            <div><label className="label text-gray-700">Sua Matrícula *</label><input
                                className="input border-gray-300" value={collaboratorBadge} onChange={e =>
                                    setCollaboratorBadge(e.target.value)} placeholder="Ex: 12345" /></div>
                        </div>
                        <button onClick={confirmTransfer}
                            className="w-full py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200">Confirmar
                            Remanejamento</button>
                    </div>
                </div>,
                document.body
            )}

            {receiveModalOpen && createPortal(
                <div className="modal-overlay">
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className={`text-lg font-bold flex items-center gap-2 ${receiveAction === 'accept'
                                ? 'text-green-600' : 'text-red-600'}`}>
                                {receiveAction === 'accept' ? <>
                                    <CheckCircle size={20} /> Aceitar Equipamento
                                </> : <>
                                    <XCircle size={20} /> Recusar Remanejamento
                                </>}
                            </h3>
                            <button onClick={() => setReceiveModalOpen(false)}>
                                <X className="text-gray-400 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg mb-4 text-sm text-gray-800 border border-gray-200">
                            <p className="font-bold">{selectedItem?.model}</p>
                            <p className="font-mono">{selectedItem?.tag}</p>
                            <p className="text-gray-500 mt-1">Enviado por: <span
                                className="font-medium text-gray-700">{selectedItem?.transferBy || 'Não identificado'}</span></p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div><label className="label text-gray-700">Seu Nome *</label><input
                                className="input border-gray-300" value={collaboratorName} onChange={e =>
                                    setCollaboratorName(e.target.value)} placeholder="Responsável pelo recebimento" /></div>
                            <div><label className="label text-gray-700">Sua Matrícula *</label><input
                                className="input border-gray-300" value={collaboratorBadge} onChange={e =>
                                    setCollaboratorBadge(e.target.value)} placeholder="Ex: 12345" /></div>
                        </div>
                        <button onClick={confirmReceive} className={`w-full py-3 text-white font-bold rounded-xl
                            transition-colors shadow-lg ${receiveAction === 'accept'
                                ? 'bg-green-600 hover:bg-green-700 shadow-green-200'
                                : 'bg-red-600 hover:bg-red-700 shadow-red-200'}`}>
                            {receiveAction === 'accept' ? 'Confirmar Aceite' : 'Confirmar Recusa'}
                        </button>
                    </div>
                </div>,
                document.body
            )}

            {receiptModalOpen && createPortal(
                <div className="modal-overlay">
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-blue-600 flex items-center gap-2">
                                <CheckCircle size={20} /> Confirmar Recebimento
                            </h3>
                            <button onClick={() => setReceiptModalOpen(false)}>
                                <X className="text-gray-400 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                            <p className="font-bold">{selectedItem?.model}</p>
                            <p className="font-mono">{selectedItem?.tag}</p>
                            <p className="text-blue-600 mt-1 text-xs">A CEIC informou a entrega deste equipamento na sua
                                unidade.</p>
                        </div>
                        <div className="space-y-4 mb-6">
                            <div><label className="label text-gray-700">Seu Nome *</label><input
                                className="input border-gray-300" value={collaboratorName} onChange={e =>
                                    setCollaboratorName(e.target.value)} placeholder="Responsável pelo recebimento" /></div>
                            <div><label className="label text-gray-700">Sua Matrícula *</label><input
                                className="input border-gray-300" value={collaboratorBadge} onChange={e =>
                                    setCollaboratorBadge(e.target.value)} placeholder="Ex: 12345" /></div>
                        </div>
                        <button onClick={confirmReceiptSubmit}
                            disabled={confirmingReceiptTag === selectedItem?.tag}
                            className="w-full py-3 text-white font-bold rounded-xl transition-colors shadow-lg bg-blue-600 hover:bg-blue-700 shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed">
                            {confirmingReceiptTag === selectedItem?.tag ? 'Confirmando...' : 'Confirmar Entrega'}
                        </button>
                    </div>
                </div>,
                document.body
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <MapPin className="text-blue-600" /> Equipamentos na Área: {sector}
                </h2>
                <button onClick={onBack}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg shadow-sm transition-colors">
                    <ArrowDownLeft size={18} className="transform rotate-90" /> Voltar
                </button>
            </div>

            {equipmentNames.length === 0 ? <div
                className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-20" />
                <p>Nenhum equipamento registrado nesta área.</p>
            </div> :
                <div className="space-y-6">
                    {equipmentNames.map(modelName => (
                        <div key={modelName}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                <Package className="text-blue-600" size={20} />
                                <h3 className="font-bold text-gray-800 text-lg">{modelName}</h3>
                                <span
                                    className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold ml-auto">Qtd:
                                    {groupedEquipments[modelName].length}</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {groupedEquipments[modelName].sort((a, b) => (a.tag || '').localeCompare(b.tag || '')).map(item => {
                                    const pickupRequest = requests.find(r => r.status === 'pickup_requested' && splitTagList(r.equipmentTag).includes(normUpper(item.tag)));
                                    const isPendingPickup = !!pickupRequest;

                                    const isPendingTransferToMe = (sameText(item.transferTo, sector) || sameText(item.transferTo, userProfile?.login)) && item.transferStatus === 'in_transit';
                                    const isMyItemTransferring = (sameText(item.location, sector) || sameText(item.location, userProfile?.login)) && item.transferStatus === 'in_transit';
                                    const isRejected = (sameText(item.location, sector) || sameText(item.location, userProfile?.login)) && item.transferStatus === 'rejected';
                                    const canTransfer = (sameText(item.location, sector) || sameText(item.location, userProfile?.login)) && (!item.transferStatus || item.transferStatus === 'completed');
                                    const needsReceiptConfirmation = false;

                                    return (
                                        <div key={item.id} className={`p-4 flex flex-col hover:bg-blue-50/30 transition-colors
                                ${isPendingTransferToMe ? 'bg-green-50/30' : ''}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <Tag size={16} className="text-gray-400" />
                                                        <span
                                                            className="font-mono font-bold text-gray-700 text-lg">{item.tag}</span>
                                                        {isPendingTransferToMe && <span
                                                            className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-full font-bold shadow-sm animate-pulse">Recebimento
                                                            Pendente</span>}
                                                        {isMyItemTransferring && <span
                                                            className="text-xs bg-orange-100 text-orange-800 border border-orange-200 px-2 py-0.5 rounded-full font-bold">Aguardando
                                                            aceite em {item.transferTo}{item.transferToBed ? `
                                                (${item.transferToBed})` : ''}</span>}
                                                        {isRejected && <span
                                                            className="text-xs bg-red-100 text-red-800 border border-red-200 px-2 py-0.5 rounded-full font-bold animate-pulse">Remanejamento
                                                            Recusado!</span>}
                                                    </div>
                                                    <div className="text-sm text-gray-500 mt-2 flex flex-wrap items-center gap-3">
                                                        {item.patient_mv && (
                                                            <span
                                                                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md text-gray-700 shadow-sm">
                                                                <User size={14} className="text-blue-500" />
                                                                <span className="font-bold">{item.patientName || 'Paciente não identificado'}</span>
                                                                <span className="text-xs text-gray-400 font-mono">(MV:
                                                                    {item.patient_mv})</span>
                                                            </span>
                                                        )}
                                                        {item.specificLocation && !isPendingTransferToMe && <span
                                                            className="text-blue-600 font-medium flex items-center gap-1">
                                                            <MapPin size={14} /> {formatItemLocation(item)}
                                                        </span>}
                                                        {isPendingTransferToMe && <span
                                                            className="text-gray-600 font-medium ml-2">Origem:
                                                            {item.location}</span>}
                                                    </div>
                                                </div>

                                                {isPendingPickup ? (
                                                    <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200">
                                                        <strong>Instrução de Devolução:</strong> {pickupRequest?.catalogo_equipamentos?.instrucao_devolucao || "O equipamento deverá ser entregue na CEIC o mais breve possível, em até 2h."}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        {isPendingTransferToMe ? (
                                                            <button onClick={() => handleConfirmTransferClick(item)} className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg border border-green-200 hover:bg-green-100 font-bold text-sm transition-colors shadow-sm">
                                                                <CheckCircle size={16} /> Aceitar
                                                            </button>
                                                        ) : isMyItemTransferring ? (
                                                            <span className="text-sm text-gray-400 font-medium italic mr-2">Bloqueado em
                                                                trânsito...</span>
                                                        ) : needsReceiptConfirmation ? (
                                                            <button onClick={() => handleReceiptClick(item)} disabled={confirmingReceiptTag === item.tag} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 font-bold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                                                                <CheckCircle size={16} /> {confirmingReceiptTag === item.tag ? 'Confirmando...' : 'Confirmar Recebimento'}
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button onClick={() => handleTransferClick(item)} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 font-bold text-sm transition-colors shadow-sm">
                                                                    <Send size={16} /> Remanejar
                                                                </button>
                                                                <button onClick={() => handleReturnClick(item)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 font-bold text-sm transition-colors shadow-sm">
                                                                    <LogOut size={16} /> Devolver
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            }
        </div>
    );
};

// Views Administrativas / Liderança (Dashboards de gestão).
const AdminOcorrencias = ({ inventory, onUpdateNotification, onUpdateServiceRequest, showNotification }) => {
    const [editingId, setEditingId] = useState(null);
    const [notifNumber, setNotifNumber] = useState('');

    const [editingReqId, setEditingReqId] = useState(null);
    const [reqNum, setReqNum] = useState('');

    const occurrences = inventory.filter(i => i.status === 'maintenance');

    const total = occurrences.length;
    const withDamage = occurrences.filter(i => i.patientDamage).length;
    const notified = occurrences.filter(i => i.unitNotified || i.notificationNumber).length;

    return (
        <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-red-600" /> Gestão de Ocorrências e Danos
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Equip. em Manutenção</p>
                    <p className="text-3xl font-black text-gray-800 mt-1">{total}</p>
                </div>
                <div
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-red-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Dano ao Paciente Relatado</p>
                    <p className="text-3xl font-black text-red-600 mt-1">{withDamage}</p>
                </div>
                <div
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-purple-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Notificados no Sistema</p>
                    <p className="text-3xl font-black text-purple-600 mt-1">{notified}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <List size={18} /> Relatório de Quebras e Avarias (Ativas)
                    </h3>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded font-bold">{total}
                        Registros</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="p-4 font-bold text-gray-500 uppercase">Data/Hora</th>
                                <th className="p-4 font-bold text-gray-500 uppercase">Equipamento</th>
                                <th className="p-4 font-bold text-gray-500 uppercase">Setor de Origem</th>
                                <th className="p-4 font-bold text-gray-500 uppercase">Defeito Relatado na Triagem
                                </th>
                                <th className="p-4 font-bold text-gray-500 uppercase">Nº Notificação</th>
                                <th className="p-4 font-bold text-gray-500 uppercase">Req. Serviço (OS)</th>
                                <th className="p-4 font-bold text-gray-500 uppercase">Dano?</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {occurrences.length > 0 ? occurrences.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600 font-medium">
                                        {item.returnDate ? new Date(item.returnDate).toLocaleDateString() : '-'}
                                        <span className="block text-xs text-gray-400 font-normal">{item.returnDate ? new
                                            Date(item.returnDate).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : ''}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-bold font-mono text-gray-800 block">{item.tag}</span>
                                        <span className="text-xs text-gray-500">{item.model}</span>
                                    </td>
                                    <td className="p-4 font-bold text-blue-700">{item.previousLocation || 'Não informada'}</td>
                                    <td className="p-4 text-gray-600 italic max-w-xs" title={item.defectDescription}>
                                        "{item.defectDescription || 'Sem descrição'}"</td>
                                    <td className="p-4 w-48">
                                        {editingId === item.id ? (
                                            <div className="flex items-center gap-2 animate-fade-in">
                                                <input type="text"
                                                    className="input py-1 px-2 text-sm w-32 border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                                                    value={notifNumber} onChange={(e) => setNotifNumber(e.target.value)}
                                                    placeholder="Nº Notificação" autoFocus />
                                                <button onClick={() => {
                                                    onUpdateNotification(item.id, notifNumber);
                                                    setEditingId(null); showNotification('success', 'Notificação atualizada!');
                                                }} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Salvar">
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                    title="Cancelar">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <div>
                                                    {item.unitNotified || item.notificationNumber
                                                        ? <span
                                                            className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-1 rounded border border-purple-200">{item.notificationNumber
                                                                || 'Registrada'}</span>
                                                        : <span className="text-gray-400 text-xs">Não houve</span>}
                                                </div>
                                                <button onClick={() => {
                                                    setEditingId(item.id);
                                                    setNotifNumber(item.notificationNumber || '');
                                                }} className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Editar/Adicionar Notificação">
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 w-48">
                                        {editingReqId === item.id ? (
                                            <div className="flex items-center gap-2 animate-fade-in">
                                                <input type="text"
                                                    className="input py-1 px-2 text-sm w-32 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                                    value={reqNum} onChange={(e) => setReqNum(e.target.value)}
                                                    placeholder="Nº OS" autoFocus />
                                                <button onClick={() => {
                                                    onUpdateServiceRequest(item.id, reqNum);
                                                    setEditingReqId(null); showNotification('success', 'Requisição atualizada!');
                                                }} className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors" title="Salvar">
                                                    <CheckCircle size={16} />
                                                </button>
                                                <button onClick={() => setEditingReqId(null)} className="p-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                                    title="Cancelar">
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between group">
                                                <div>
                                                    {item.serviceRequestNumber
                                                        ? <span
                                                            className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded border border-blue-200">{item.serviceRequestNumber}</span>
                                                        : <span className="text-gray-400 text-xs">Pendente</span>}
                                                </div>
                                                <button onClick={() => {
                                                    setEditingReqId(item.id);
                                                    setReqNum(item.serviceRequestNumber || '');
                                                }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Editar/Adicionar Requisição">
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {item.patientDamage
                                            ? <span
                                                className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded border border-red-200 flex items-center w-max gap-1">
                                                <AlertTriangle size={12} /> SIM
                                            </span>
                                            : <span
                                                className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded border border-gray-200">NÃO</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="p-12 text-center text-gray-500">
                                        <CheckCircle size={48} className="mx-auto mb-3 opacity-20 text-green-500" />
                                        Nenhuma ocorrência ou equipamento quebrado no momento.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdminTransportIndicators = ({ requests }) => {
    const transportRequests = requests.filter(r => r.status === 'approved' &&
        isTransportRequest(r.equipmentType));

    const todayStr = new Date().toISOString().substring(0, 10);
    const [startDate, setStartDate] = useState(`${todayStr}T00:00`);
    const [endDate, setEndDate] = useState(`${todayStr}T23:59`);

    const isWithinRange = (timestamp) => {
        if (!timestamp) return false;
        const t = new Date(timestamp).getTime();
        const s = startDate ? new Date(startDate).getTime() : 0;
        const e = endDate ? new Date(endDate).getTime() : Infinity;
        return t >= s && t <= e;
    }; const filteredTransports = transportRequests.filter(r =>
        isWithinRange(r.timestamp));

    const parseTimeStr = (reqTimestamp, timeStr) => {
        if (!timeStr) return null;
        const baseDate = new Date(reqTimestamp);
        const [hours, minutes] = timeStr.split(':');
        const t = new Date(baseDate);
        t.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);

        if (t.getTime() < baseDate.getTime()) { t.setDate(t.getDate() + 1); } return t.getTime();
    }; const
        totalTransports = filteredTransports.length; let completedTransports = 0; let totalTransitToUnitMs = 0;
    let countTransitToUnit = 0; let totalInUnitMs = 0; let countInUnit = 0; let totalReturnMs = 0; let
        countReturn = 0; let totalDurationMs = 0; let countTotalDuration = 0; filteredTransports.forEach(r => {
            if (r.returnToCeicTime) completedTransports++;

            const approvedTime = new Date(r.fulfilledAt || r.timestamp).getTime();
            const arrTime = parseTimeStr(r.fulfilledAt || r.timestamp, r.arrivalTime);
            const depTime = parseTimeStr(r.fulfilledAt || r.timestamp, r.departureTime);
            const retCeicTime = parseTimeStr(r.fulfilledAt || r.timestamp, r.returnToCeicTime);

            if (arrTime && approvedTime) {
                const diff = Math.max(0, arrTime - approvedTime);
                totalTransitToUnitMs += diff;
                countTransitToUnit++;
            }

            if (depTime && arrTime) {
                const diff = Math.max(0, depTime - arrTime);
                totalInUnitMs += diff;
                countInUnit++;
            }

            if (retCeicTime && depTime) {
                const diff = Math.max(0, retCeicTime - depTime);
                totalReturnMs += diff;
                countReturn++;
            }

            if (retCeicTime && approvedTime) {
                const diff = Math.max(0, retCeicTime - approvedTime);
                totalDurationMs += diff;
                countTotalDuration++;
            }
        });

    const avgFormat = (totalMs, count) => {
        if (count === 0) return '--';
        const avgMs = totalMs / count;
        const m = Math.floor(avgMs / 60000);
        return `${m}m`;
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Activity className="text-orange-500" /> Indicadores de Transporte
                </h2>
                <div
                    className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Início</label>
                        <input type="datetime-local"
                            className="bg-gray-50 border border-gray-300 rounded text-xs px-2 py-1 outline-none"
                            value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Fim</label>
                        <input type="datetime-local"
                            className="bg-gray-50 border border-gray-300 rounded text-xs px-2 py-1 outline-none"
                            value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-blue-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Total de Transportes Iniciados
                    </p>
                    <p className="text-3xl font-black text-gray-800 mt-1">{totalTransports}</p>
                    <p className="text-xs text-gray-400 mt-2">No período filtrado</p>
                </div>
                <div
                    className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-l-4 border-green-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Transportes Finalizados</p>
                    <p className="text-3xl font-black text-gray-800 mt-1">{completedTransports} <span
                        className="text-sm text-gray-400">({totalTransports > 0 ?
                            Math.round((completedTransports / totalTransports) * 100) : 0}%)</span></p>
                    <p className="text-xs text-green-600 mt-2">Retorno para CEIC Registrado</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <Clock size={18} /> Tempos Médios de Operação (TMA de Transporte)
                    </h3>
                </div>
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                    <div className="p-6 text-center hover:bg-gray-50 transition-colors">
                        <p
                            className="text-xs font-bold text-gray-500 uppercase mb-2 h-8 flex items-center justify-center">
                            Transito (Saída CEIC &rarr; Unidade)</p>
                        <p className="text-3xl font-black text-blue-600">{avgFormat(totalTransitToUnitMs,
                            countTransitToUnit)}</p>
                        <p className="text-xs text-gray-400 mt-2">{countTransitToUnit} registros avaliados
                        </p>
                    </div>
                    <div className="p-6 text-center hover:bg-gray-50 transition-colors">
                        <p
                            className="text-xs font-bold text-gray-500 uppercase mb-2 h-8 flex items-center justify-center">
                            Duração do Procedimento na Unidade</p>
                        <p className="text-3xl font-black text-purple-600">{avgFormat(totalInUnitMs,
                            countInUnit)}</p>
                        <p className="text-xs text-gray-400 mt-2">{countInUnit} registros avaliados</p>
                    </div>
                    <div className="p-6 text-center hover:bg-gray-50 transition-colors">
                        <p
                            className="text-xs font-bold text-gray-500 uppercase mb-2 h-8 flex items-center justify-center">
                            Retorno (Saída Unidade &rarr; CEIC)</p>
                        <p className="text-3xl font-black text-orange-600">{avgFormat(totalReturnMs,
                            countReturn)}</p>
                        <p className="text-xs text-gray-400 mt-2">{countReturn} registros avaliados</p>
                    </div>
                    <div className="p-6 text-center bg-green-50/50 hover:bg-green-50 transition-colors">
                        <p
                            className="text-xs font-bold text-green-800 uppercase mb-2 h-8 flex items-center justify-center">
                            Tempo Total (Ciclo Completo)</p>
                        <p className="text-3xl font-black text-green-700">{avgFormat(totalDurationMs,
                            countTotalDuration)}</p>
                        <p className="text-xs text-green-600 mt-2 opacity-80">{countTotalDuration} ciclos
                            completos avaliados</p>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                        <List size={18} /> Detalhamento Operacional de Transportes
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">ID / Setor
                                    Destino</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase">Data Liberação
                                </th>
                                <th
                                    className="p-3 text-xs font-bold text-gray-500 uppercase text-center border-l">
                                    Chegou Unidade</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">
                                    Saiu Unidade</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">
                                    Retornou Unidade</th>
                                <th className="p-3 text-xs font-bold text-gray-500 uppercase text-center">
                                    Retornou CEIC</th>
                                <th
                                    className="p-3 text-xs font-bold text-gray-500 uppercase text-center border-l bg-gray-50">
                                    Ciclo Completo?</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredTransports.length > 0 ? filteredTransports.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-3">
                                        <div className="font-mono text-gray-800 font-bold">{item.id}</div>
                                        <div className="text-xs text-blue-600 mt-0.5">{item.accessories?.[0] ?
                                            item.accessories[0].split('|')[0] : 'Destino Desconhecido'}</div>
                                    </td>
                                    <td className="p-3 text-gray-600">
                                        {item.fulfilledAt ? new Date(item.fulfilledAt).toLocaleDateString() :
                                            ''}
                                        <span className="block text-xs">{item.fulfilledAt ? new
                                            Date(item.fulfilledAt).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            }) : ''}</span>
                                    </td>
                                    <td className="p-3 text-center border-l font-mono text-gray-700">
                                        {item.arrivalTime || '-'}</td>
                                    <td className="p-3 text-center font-mono text-gray-700">{item.departureTime
                                        || '-'}</td>
                                    <td className="p-3 text-center font-mono text-gray-700">
                                        {item.returnToUnitTime || '-'}</td>
                                    <td className="p-3 text-center font-mono font-bold text-green-700">
                                        {item.returnToCeicTime || '-'}</td>
                                    <td className="p-3 text-center border-l bg-gray-50">
                                        {item.returnToCeicTime ?
                                            <CheckCircle size={16} className="text-green-500 mx-auto" /> :
                                            <Clock size={16} className="text-orange-500 mx-auto"
                                                title="Em andamento" />}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">Nenhum registro de
                                        transporte encontrado no período.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdminRemanejamento = ({ inventory, onRemanejamento, showNotification, unidades }) => {
    const [selectedTag, setSelectedTag] = useState('');
    const [destinationSector, setDestinationSector] = useState('');
    const [destinationBed, setDestinationBed] = useState('');
    const [patient_mv, setPatient_mv] = useState('');
    const [patientName, setPatientName] = useState('');
    const [collaboratorName, setCollaboratorName] = useState('');
    const [collaboratorBadge, setCollaboratorBadge] = useState('');

    const availableEquipments = inventory.filter(i => i.status === 'available');

    const handleMVChange = (e) => {
        const val = e.target.value; setPatient_mv(val);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedTag || !destinationSector || !collaboratorName || !collaboratorBadge) {
            showNotification('error', 'Preencha todos os campos obrigatórios com asterisco (*).');
            return;
        }

        onRemanejamento({
            tag: selectedTag, destination: destinationSector, destinationBed, patient_mv,
            patientName, collaboratorName, collaboratorBadge
        });

        setSelectedTag(''); setDestinationSector(''); setDestinationBed(''); setPatient_mv('');
        setPatientName(''); setCollaboratorName(''); setCollaboratorBadge('');
    };

    return (
        <div className="pb-20 animate-fade-in max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                <Send className="text-purple-600" /> Remanejamento de Equipamentos
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div
                    className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-8 flex items-start gap-3">
                    <AlertCircle className="text-purple-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-purple-800">
                        Utilize esta ferramenta para <strong>remanejar</strong> um equipamento em estoque
                        para um setor assistencial. O equipamento constará na aba da unidade aguardando que
                        eles cliquem em "Confirmar Recebimento".
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-700 border-b pb-2">1. Seleção de Equipamento e
                            Destino</h3>
                        <div>
                            <label className="label">Equipamento (Apenas itens Disponíveis) *</label>
                            <SearchDropdown value={selectedTag} onChange={setSelectedTag}
                                options={availableEquipments.map(e => ({
                                    value: e.tag, label: `${e.tag} -
                                            ${e.model} (${e.type})`
                                }))}
                                placeholder="Selecione ou busque a TAG do equipamento..."
                                className="border-gray-300 h-[50px] font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label">Setor de Destino *</label>
                                <select className="input h-[50px]" value={destinationSector} onChange={e =>
                                    setDestinationSector(e.target.value)}>
                                    <option value="">Selecione o setor...</option>
                                    {unidades?.map(u => (
                                        <option key={u.login} value={u.login}>
                                            {u.login} - {u.nome || u.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="label">Leito de Destino</label>
                                <input type="text" className="input h-[50px]" value={destinationBed}
                                    onChange={e => setDestinationBed(e.target.value)} placeholder="Ex: Leito 12" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-gray-700 border-b pb-2">2. Vínculo do Paciente <span
                            className="text-gray-400 font-normal text-sm">(Opcional)</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label">Registro MV</label><input type="text"
                                className="input" value={patient_mv} onChange={handleMVChange}
                                placeholder="Ex: 123456" /></div>
                            <div><label className="label">Nome do Paciente</label><input type="text"
                                className="input" value={patientName} onChange={e =>
                                    setPatientName(e.target.value)} placeholder="Se conhecido..." /></div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <h3 className="font-bold text-gray-700 border-b pb-2">3. Responsável pelo
                            Remanejamento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="label">Seu Nome *</label><input type="text"
                                className="input" value={collaboratorName} onChange={e =>
                                    setCollaboratorName(e.target.value)} placeholder="Nome do responsável da CEIC" /></div>
                            <div><label className="label">Sua Matrícula *</label><input type="text"
                                className="input" value={collaboratorBadge} onChange={e =>
                                    setCollaboratorBadge(e.target.value)} placeholder="Ex: 98765" /></div>
                        </div>
                    </div>

                    <div className="pt-6">
                        <button type="submit"
                            className="w-full h-[50px] rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center justify-center gap-2 shadow-lg shadow-purple-200 transition-colors text-lg">
                            Confirmar Remanejamento
                            <ArrowUpRight size={20} />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminDashboard = ({ inventory, requests }) => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const [startDate, setStartDate] = useState(`${todayStr}T00:00`);
    const [endDate, setEndDate] = useState(`${todayStr}T23:59`);

    const totalItems = inventory.length;
    const availableItems = inventory.filter(i => i.status === 'available').length;
    const inUseItems = inventory.filter(i => i.status === 'in_use').length;
    const maintenanceItems = inventory.filter(i => i.status === 'maintenance').length;
    const cleaningItems = inventory.filter(i => i.status === 'cleaning').length;

    const calcPct = (val) => totalItems === 0 ? 0 : Math.round((val / totalItems) * 100);

    const isWithinRange = (timestamp) => {
        if (!timestamp) return false;
        const t = new Date(timestamp).getTime();
        const s = startDate ? new Date(startDate).getTime() : 0;
        const e = endDate ? new Date(endDate).getTime() : Infinity;
        return t >= s && t <= e;
    }; const filteredRequests = requests.filter(r => isWithinRange(r.timestamp));

    const approvedRequests = filteredRequests.filter(r => r.status === 'approved');
    const completedReturns = filteredRequests.filter(r => r.kind === 'return_pickup' && r.status ===
        'completed').length;
    let countGerais = 0; let countVent = 0; let countTransp = 0;

    approvedRequests.forEach(r => {
        const type = r.equipmentType || '';
        if (isTransportRequest(type)) {
            countTransp++;
        } else if (['VENTILADOR PULMONAR', 'GERADOR DE FLUXO', 'OXIDO NITRICO', 'APENAS ACESSORIOS'].some(vb => normUpper(type).startsWith(vb))) {
            countVent++;
        } else {
            countGerais++;
        }
    });

    return (
        <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto" data-testid="management-dashboard">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 className="text-purple-600" /> Painel Gerencial de Frota
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200" data-testid="metrics-card">
                    <p className="text-xs font-bold text-gray-500 uppercase">Total da Frota</p>
                    <p className="text-3xl font-black text-gray-800 mt-1">{totalItems}</p>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-b-4 border-green-500" data-testid="metrics-card">
                    <p className="text-xs font-bold text-gray-500 uppercase">Pronto Uso</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-black text-green-600">{availableItems}</p>
                        <span
                            className="text-sm font-bold text-gray-400">({calcPct(availableItems)}%)</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-b-4 border-blue-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Em Uso Clínico</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-black text-blue-600">{inUseItems}</p>
                        <span
                            className="text-sm font-bold text-gray-400">({calcPct(inUseItems)}%)</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-b-4 border-yellow-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Higienização</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-black text-yellow-600">{cleaningItems}</p>
                        <span
                            className="text-sm font-bold text-gray-400">({calcPct(cleaningItems)}%)</span>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl shadow-sm border-b-4 border-red-500">
                    <p className="text-xs font-bold text-gray-500 uppercase">Manutenção</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-3xl font-black text-red-600">{maintenanceItems}</p>
                        <span
                            className="text-sm font-bold text-gray-400">({calcPct(maintenanceItems)}%)</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div
                        className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Settings size={18} className="text-gray-500" /> Visão Operacional Diária
                        </h3>
                        <div
                            className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <div className="flex flex-col">
                                <label
                                    className="text-[10px] font-bold text-gray-500 uppercase">Início</label>
                                <input type="datetime-local" data-testid="report-filter-start"
                                    className="bg-white border border-gray-300 rounded text-xs px-2 py-1 outline-none focus:border-blue-500"
                                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="flex flex-col">
                                <label
                                    className="text-[10px] font-bold text-gray-500 uppercase">Fim</label>
                                <input type="datetime-local" data-testid="report-filter"
                                    className="bg-white border border-gray-300 rounded text-xs px-2 py-1 outline-none focus:border-blue-500"
                                    value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600 font-medium">Solicitações Pendentes</span>
                            <span className="font-bold text-blue-600">{filteredRequests.filter(r =>
                                r.status === 'pending').length}</span>
                        </div>

                        <div className="bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                            <div
                                className="flex justify-between items-center p-3 border-b border-gray-200 bg-gray-50">
                                <span className="text-gray-600 font-medium">Solicitações Atendidas
                                    (Total)</span>
                                <span
                                    className="font-bold text-green-600">{approvedRequests.length}</span>
                            </div>
                            <div className="bg-white divide-y divide-gray-50">
                                <div
                                    className="flex justify-between items-center py-2.5 px-4 text-sm hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                                        Equipamentos Gerais
                                    </span>
                                    <span className="font-bold text-gray-700">{countGerais}</span>
                                </div>
                                <div
                                    className="flex justify-between items-center py-2.5 px-4 text-sm hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400"></div>
                                        Assistência Ventilatória
                                    </span>
                                    <span className="font-bold text-gray-700">{countVent}</span>
                                </div>
                                <div
                                    className="flex justify-between items-center py-2.5 px-4 text-sm hover:bg-gray-50 transition-colors">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div>
                                        Transporte
                                    </span>
                                    <span className="font-bold text-gray-700">{countTransp}</span>
                                </div>
                            </div>
                        </div>

                        <div
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-purple-400">
                            <span className="text-gray-600 font-medium">Devoluções Realizadas</span>
                            <span className="font-bold text-purple-600">{completedReturns}</span>
                        </div>

                        <div
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400">
                            <span className="text-gray-600 font-medium">Equipamentos em Fila de
                                Espera</span>
                            <span className="font-bold text-orange-600">{filteredRequests.filter(r =>
                                r.isWaitlisted && r.status === 'pending').length}</span>
                        </div>

                        <div
                            className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-red-400">
                            <span className="text-gray-600 font-medium">Solicitações Canceladas</span>
                            <span className="font-bold text-red-600">{filteredRequests.filter(r =>
                                r.status === 'cancelled').length}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div
                        className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center">
                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                            <AlertTriangle size={18} /> Alerta de Ociosidade (Manutenção)
                        </h3>
                    </div>
                    <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
                        {inventory.filter(i => i.status === 'maintenance').map(item => (
                            <div key={item.id}
                                className="p-4 flex justify-between items-center hover:bg-gray-50">
                                <div>
                                    <p className="font-bold text-gray-800">{item.tag}</p>
                                    <p className="text-xs text-gray-500">{item.model}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium text-red-600">
                                        {formatElapsed(item.returnDate)} parados</p>
                                </div>
                            </div>
                        ))}
                        {inventory.filter(i => i.status === 'maintenance').length === 0 && (
                            <div className="p-8 text-center text-gray-500">Nenhum equipamento quebrado no
                                momento.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const AdminFleetCRUD = ({ inventory, onAdd, onEdit, onDelete, showNotification }) => {
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const initialFormState = {
        tag: '', model: '', type: '', status: 'available', location: 'CEIC'
    };
    const [formData, setFormData] = useState(initialFormState);

    const filteredInventory = inventory.filter(item =>
        item.tag.toLowerCase().includes(search.toLowerCase()) ||
        item.model.toLowerCase().includes(search.toLowerCase()) ||
        item.type.toLowerCase().includes(search.toLowerCase())
    );

    const openModal = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({
                tag: item.tag, model: item.model, type: item.type, status: item.status, location:
                    item.location
            });
        } else {
            setEditingId(null);
            setFormData(initialFormState);
        }
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.tag.trim() || !formData.model.trim() || !formData.type.trim()) {
            showNotification('error', 'Preencha os campos TAG, Modelo e Tipo.');
            return;
        }

        const activeStatuses = ['available', 'in_use'];
        const tagExists = inventory.some(i =>
            normUpper(i.tag) === normUpper(formData.tag) &&
            activeStatuses.includes(normLower(i.status)) &&
            i.id !== editingId
        );
        if (tagExists) {
            showNotification('error', 'REGRA_NEGOCIO_EQUIPAMENTO_ATIVO_DUPLICADO: Já existe equipamento ativo com esta TAG.');
            return;
        }

        if (editingId) {
            onEdit(editingId, { ...formData, tag: formData.tag.toUpperCase() });
        } else {
            onAdd({ ...formData, tag: formData.tag.toUpperCase() });
        }
        setIsModalOpen(false);
    };

    return (
        <div className="pb-20 animate-fade-in max-w-6xl mx-auto" data-testid="equipment-management-screen">
            {isModalOpen && createPortal(
                <div className="modal-overlay z-50">
                    <div
                        className="bg-white p-6 rounded-2xl shadow-2xl max-w-md w-full animate-fade-in max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-5 border-b pb-3">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Database size={20} className="text-purple-600" />
                                {editingId ? 'Editar Equipamento' : 'Novo Equipamento'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4" data-testid="equipment-form">
                            <div>
                                <label className="label">TAG do Patrimônio *</label>
                                <input data-testid="equipment-tag-input" className="input font-mono uppercase" value={formData.tag}
                                    onChange={e => setFormData({ ...formData, tag: String(e.target.value).toUpperCase() })}
                                    placeholder="Ex: EVEN0001" autoFocus />
                            </div>
                            <div>
                                <label className="label">Modelo do Equipamento *</label>
                                <input data-testid="equipment-model-input" className="input" value={formData.model} onChange={e =>
                                    setFormData({ ...formData, model: e.target.value })} placeholder="Ex: Bennett 840" />
                            </div>
                            <div>
                                <label className="label">Tipo Genérico (Categoria) *</label>
                                <input data-testid="equipment-type-input" className="input uppercase" value={formData.type} onChange={e =>
                                    setFormData({ ...formData, type: String(e.target.value).toUpperCase() })} placeholder="Ex: VMI" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="label">Status</label>
                                    <select data-testid="equipment-status-select" className="input" value={formData.status} onChange={e =>
                                        setFormData({ ...formData, status: e.target.value })}>
                                        <option value="available">Disponível</option>
                                        <option value="in_use">Em Uso</option>
                                        <option value="maintenance">Manutenção</option>
                                        <option value="cleaning">Higienização</option>
                                        <option value="preventive">Ag. Preventiva</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="label">Localização</label>
                                    <input className="input" list="locationOptions"
                                        value={formData.location} onChange={e => setFormData({
                                            ...formData,
                                            location: e.target.value
                                        })} placeholder="Ex: CEIC" />
                                    <datalist id="locationOptions">
                                        <option value="CEIC" />
                                        <option value="Ag. Preventiva" />
                                        <option value="Engenharia Clínica" />
                                        <option value="Expurgo CEIC" />
                                        {['03DN', '03DS', '04GN', '04GS', '04CC', '04DN', '04DS', 'Centro Cirúrgico'].map(l =>
                                            <option key={l} value={l} />)}
                                    </datalist>
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Cancelar</button>
                                <button data-testid="equipment-save-button" type="submit"
                                    className="flex-1 py-2 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-200">Salvar
                                    Dados</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            <div
                className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Database className="text-purple-600" /> Gestão da Frota (CRUD)
                </h2>
                <button data-testid="create-equipment-button" onClick={() => openModal()} className="h-[44px] px-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 flex items-center shadow-lg shadow-purple-200 transition-colors">
                    <PlusCircle size={20} className="mr-2" /> Adicionar Equipamento
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div
                    className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input data-testid="equipment-search-input" className="input pl-10 bg-white"
                            placeholder="Buscar por TAG, Modelo ou Tipo..." value={search} onChange={e =>
                                setSearch(e.target.value)} />
                    </div>
                    <span className="text-sm font-bold text-gray-500 ml-4 hidden md:block">Total:
                        {filteredInventory.length} itens</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">TAG</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Modelo
                                </th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Tipo</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status
                                    Local</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredInventory.length > 0 ? filteredInventory.map(item => (
                                <tr key={item.id} data-testid="equipment-row" className="hover:bg-gray-50 transition-colors">
                                    <td data-testid="equipment-real-tag" className="p-4 font-mono font-bold text-gray-800">{item.tag}</td>
                                    <td className="p-4 text-sm font-medium text-gray-600">{item.model}</td>
                                    <td className="p-4 text-sm text-gray-600">{item.type}</td>
                                    <td data-testid="equipment-real-status" className="p-4 text-sm">
                                        <StatusBadge status={item.status} /> <span
                                            data-testid="equipment-real-location"
                                            className="text-xs text-gray-400 block mt-1">{item.location}</span>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-gray-500">Nenhum
                                        equipamento encontrado na busca.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const AdminIndicators = ({ inventory, requests }) => {
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    const baseInventory = inventory.filter(i => getCategoryForType(i.type) !== 'TRANSPORTE');
    const baseRequests = requests.filter(r => getCategoryForType(r.equipmentType) !== 'TRANSPORTE');

    const filteredInventory = selectedCategory === 'ALL'
        ? baseInventory
        : baseInventory.filter(i => getCategoryForType(i.type) === selectedCategory);

    const filteredRequests = selectedCategory === 'ALL'
        ? baseRequests
        : baseRequests.filter(r => getCategoryForType(r.equipmentType) === selectedCategory);

    const totalInventory = filteredInventory.length;
    const availableRate = totalInventory > 0 ? Math.round((filteredInventory.filter(i => i.status
        === 'available').length / totalInventory) * 100) : 0;
    const maintRate = totalInventory > 0 ? Math.round((filteredInventory.filter(i => i.status ===
        'maintenance').length / totalInventory) * 100) : 0;

    const totalRequests = filteredRequests.length;
    const urgentRequests = filteredRequests.filter(r => r.isUrgent).length;
    const urgentRate = totalRequests > 0 ? Math.round((urgentRequests / totalRequests) * 100) : 0;

    const cancelledRequests = filteredRequests.filter(r => r.status === 'cancelled').length;
    const cancelRate = totalRequests > 0 ? Math.round((cancelledRequests / totalRequests) * 100) :
        0;

    const reqCounts = filteredRequests.reduce((acc, req) => {
        if (req.equipmentType) {
            acc[req.equipmentType] = (acc[req.equipmentType] || 0) + 1;
        }
        return acc;
    }, {});
    const topRequested = Object.entries(reqCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const sectorCounts = filteredRequests.reduce((acc, req) => {
        const sec = req.sector || req.unit || 'Não informado';
        acc[sec] = (acc[sec] || 0) + 1;
        return acc;
    }, {});
    const topSectors = Object.entries(sectorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const approvedRequestsWithTime = filteredRequests.filter(r => r.status === 'approved' &&
        r.fulfilledAt);
    let totalFulfillmentTimeMs = 0;
    let slaMetCount = 0;

    approvedRequestsWithTime.forEach(r => {
        const start = new Date(r.timestamp).getTime();
        const end = new Date(r.fulfilledAt).getTime();
        const diff = Math.max(0, end - start);
        totalFulfillmentTimeMs += diff;

        const slaLimitMs = getSlaInfo(r).ms;
        if (diff <= slaLimitMs) slaMetCount++;
    }); const
        avgFulfillmentTimeMs = approvedRequestsWithTime.length > 0 ? totalFulfillmentTimeMs /
            approvedRequestsWithTime.length : 0;
    const avgFulfillmentMins = Math.floor(avgFulfillmentTimeMs / 60000);
    const avgFulfillmentSecs = Math.floor((avgFulfillmentTimeMs % 60000) / 1000);
    const formattedTMA = approvedRequestsWithTime.length > 0 ? `${avgFulfillmentMins}m
                            ${avgFulfillmentSecs.toString().padStart(2, '0')}s` : '--';

    const slaComplianceRate = approvedRequestsWithTime.length > 0 ? Math.round((slaMetCount /
        approvedRequestsWithTime.length) * 100) : 0;

    const TABS = [
        { id: 'ALL', label: 'Visão Global' },
        { id: 'GERAIS', label: 'Equipamentos Gerais' },
        { id: 'VENTILATORIA', label: 'Assistência Ventilatória' }
    ];

    return (
        <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto" data-testid="management-dashboard">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <LineChart className="text-purple-600" /> Indicadores de Performance
                </h2>
            </div>

            <div
                className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 overflow-x-auto">
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setSelectedCategory(tab.id)}
                        className={`flex-1 py-2.5 px-4 text-sm font-bold rounded-lg whitespace-nowrap
                                        transition-colors ${selectedCategory === tab.id ? 'bg-purple-600 text-white shadow-md shadow-purple-200' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div key={selectedCategory} className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200" data-testid="metrics-card">
                        <p className="text-xs font-bold text-gray-500 uppercase">Total de
                            Solicitações</p>
                        <p className="text-3xl font-black text-gray-800 mt-1">{totalRequests}</p>
                        <p className="text-xs text-gray-400 mt-2">No período/categoria</p>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200" data-testid="metrics-card">
                        <p className="text-xs font-bold text-gray-500 uppercase">Disponibilidade de
                            Frota</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-3xl font-black text-blue-600">{availableRate}%</p>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-blue-500 h-full transition-all duration-500"
                                style={{ width: `${availableRate}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200" data-testid="metrics-card">
                        <p className="text-xs font-bold text-gray-500 uppercase">Taxa de Urgências
                        </p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-3xl font-black text-red-600">{urgentRate}%</p>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-red-500 h-full transition-all duration-500"
                                style={{ width: `${urgentRate}%` }}></div>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200" data-testid="metrics-card">
                        <p className="text-xs font-bold text-gray-500 uppercase">Taxa de Quebra /
                            Manut.</p>
                        <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-3xl font-black text-orange-600">{maintRate}%</p>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div className="bg-orange-500 h-full transition-all duration-500"
                                style={{ width: `${maintRate}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mt-6 mb-6" data-testid="report-card">
                    <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Clock size={18} className="text-blue-500" /> Indicadores de Nível de
                        Serviço (SLA)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div
                            className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Tempo
                                    Médio (TMA)</p>
                                <p className="text-2xl font-black text-blue-900">{formattedTMA}</p>
                                <p className="text-xs text-blue-600 mt-1">Meta Dinâmica: 15m / 20m /
                                    2h</p>
                            </div>
                            <div className="bg-white p-3 rounded-full text-blue-500 shadow-sm">
                                <Activity size={24} />
                            </div>
                        </div>

                        <div className={`p-4 rounded-lg border flex items-center justify-between
                                                ${approvedRequestsWithTime.length > 0 && slaComplianceRate >= 90 ?
                                'bg-green-50 border-green-100' : approvedRequestsWithTime.length > 0 ?
                                    'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                            <div>
                                <p className={`text-xs font-bold uppercase mb-1
                                                        ${approvedRequestsWithTime.length > 0 && slaComplianceRate >= 90
                                        ? 'text-green-800' : approvedRequestsWithTime.length > 0 ?
                                            'text-orange-800' : 'text-gray-500'}`}>Conformidade SLA</p>
                                <p className={`text-2xl font-black
                                                        ${approvedRequestsWithTime.length > 0 && slaComplianceRate >= 90
                                        ? 'text-green-900' : approvedRequestsWithTime.length > 0 ?
                                            'text-orange-900' :
                                            'text-gray-700'}`}>{approvedRequestsWithTime.length > 0 ?
                                                `${slaComplianceRate}%` : '--'}</p>
                                <p className={`text-xs mt-1 ${approvedRequestsWithTime.length > 0 &&
                                    slaComplianceRate >= 90 ? 'text-green-600' :
                                    approvedRequestsWithTime.length > 0 ? 'text-orange-600' :
                                        'text-gray-400'}`}>Meta: &gt; 90% dentro do prazo</p>
                            </div>
                            <div className={`bg-white p-3 rounded-full shadow-sm
                                                    ${approvedRequestsWithTime.length > 0 && slaComplianceRate >= 90 ?
                                    'text-green-500' : approvedRequestsWithTime.length > 0 ?
                                        'text-orange-500' : 'text-gray-400'}`}>
                                <BadgeCheck size={24} />
                            </div>
                        </div>

                        <div
                            className="bg-purple-50 p-4 rounded-lg border border-purple-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-purple-800 uppercase mb-1">
                                    Volume Base (SLA)</p>
                                <p className="text-2xl font-black text-purple-900">
                                    {approvedRequestsWithTime.length}</p>
                                <p className="text-xs text-purple-600 mt-1">Total de pedidos
                                    finalizados</p>
                            </div>
                            <div className="bg-white p-3 rounded-full text-purple-500 shadow-sm">
                                <CheckCircle size={24} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5" data-testid="report-card">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <Package size={18} className="text-purple-500" /> Equipamentos Mais
                            Solicitados
                        </h3>
                        <div className="space-y-4">
                            {topRequested.length > 0 ? topRequested.map(([equip, count], index) => {
                                const maxCount = topRequested[0][1];
                                const pct = Math.round((count / maxCount) * 100);
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span
                                                className="font-medium text-gray-700 truncate pr-4">{equip}</span>
                                            <span className="font-bold text-gray-900">{count}</span>
                                        </div>
                                        <div
                                            className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-purple-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                )
                            }) : <p className="text-sm text-gray-500">Sem dados suficientes nesta
                                categoria.</p>}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5" data-testid="report-card">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <MapPin size={18} className="text-blue-500" /> Setores Que Mais
                            Solicitam
                        </h3>
                        <div className="space-y-4">
                            {topSectors.length > 0 ? topSectors.map(([sec, count], index) => {
                                const maxCount = topSectors[0][1];
                                const pct = Math.round((count / maxCount) * 100);
                                return (
                                    <div key={index}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span
                                                className="font-medium text-gray-700 truncate pr-4">{sec}</span>
                                            <span className="font-bold text-gray-900">{count}</span>
                                        </div>
                                        <div
                                            className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}></div>
                                        </div>
                                    </div>
                                )
                            }) : <p className="text-sm text-gray-500">Sem dados suficientes nesta
                                categoria.</p>}
                        </div>
                    </div>

                    <div
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 md:col-span-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="p-3 bg-red-50 text-red-600 rounded-full">
                                <XCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold">Solicitações
                                    Canceladas</p>
                                <p className="text-xl font-black text-gray-800">{cancelledRequests}
                                    <span
                                        className="text-xs font-normal text-gray-400">({cancelRate}%)</span>
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="p-3 bg-green-50 text-green-600 rounded-full">
                                <CheckCircle size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold">Pedidos Atendidos</p>
                                <p className="text-xl font-black text-gray-800">
                                    {filteredRequests.filter(r => r.status === 'approved').length}
                                </p>
                            </div>
                        </div>
                        <div className="hidden sm:block h-10 w-px bg-gray-200"></div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-full">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-bold">Devoluções Concluídas
                                </p>
                                <p className="text-xl font-black text-gray-800">
                                    {filteredRequests.filter(r => r.kind === 'return_pickup' &&
                                        r.status === 'completed').length}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

const GlobalStyles = () => (
    <style>
        {
            ` .btn-primary {
                                        background-color: #2563eb;
                                        color: white;
                                        padding-left: 1.5rem;
                                        padding-right: 1.5rem;
                                        height: 44px;
                                        border-radius: 0.75rem;
                                        font-weight: 700;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        transition: all 0.15s;
                                    }

                                    .btn-primary:hover {
                                        background-color: #1d4ed8;
                                    }

                                    .btn-primary:active {
                                        transform: scale(0.95);
                                    }

                                    .btn-primary:disabled {
                                        opacity: 0.5;
                                        transform: none;
                                        cursor: not-allowed;
                                    }

                                    .input {
                                        width: 100%;
                                        border-radius: 0.5rem;
                                        border: 1px solid #d1d5db;
                                        padding: 0.75rem;
                                        outline: none;
                                        transition: all 0.15s;
                                    }

                                    .input:focus {
                                        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.5);
                                        border-color: #2563eb;
                                    }

                                    .label {
                                        display: block;
                                        font-size: 0.875rem;
                                        font-weight: 500;
                                        color: #374151;
                                        margin-bottom: 0.25rem;
                                    }

                                    @keyframes fadeIn {
                                        from {
                                            opacity: 0;
                                            transform: translateY(10px);
                                        }

                                        to {
                                            opacity: 1;
                                            transform: translateY(0);
                                        }
                                    }

                                    .animate-fade-in {
                                        animation: fadeIn 0.3s ease-out forwards;
                                    }

                                    .modal-overlay {
                                        position: fixed;
                                        top: 0;
                                        left: 0;
                                        right: 0;
                                        bottom: 0;
                                        background-color: rgba(0, 0, 0, 0.5);
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        z-index: 100;
                                        animation: fadeIn 0.2s ease-out;
                                        padding: 1rem;
                                    }

                                    `
        }
    </style>
);

const AdminPreventivaView = ({ inventory, onSchedule, onSegregate, onComplete }) => {
    const [tagsInput, setTagsInput] = useState('');
    const [activeTab, setActiveTab] = useState('agendados');

    const scheduledItems = inventory.filter(i => i.preventiveScheduled && i.status !==
        'preventive');
    const segregatedItems = inventory.filter(i => i.status === 'preventive');

    const handleSchedule = () => {
        if (!tagsInput.trim()) return;
        onSchedule(tagsInput);
        setTagsInput('');
    };

    return (
        <div className="space-y-6 pb-20 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <CalendarClock className="text-orange-600" /> Plano de Manutenção Preventiva
                </h2>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">Agendar Alerta de Recolhimento</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Insira as TAGs dos equipamentos que devem passar por preventiva neste
                            mês.
                            O sistema bloqueará a liberação destes itens. Cole a lista separada por
                            vírgulas ou quebras de linha.
                        </p>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <textarea className="input flex-1 min-h-[80px] font-mono text-sm"
                        placeholder="Ex: EVEN0001, EAFQ0002&#10;EVEN0039" value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                    ></textarea>
                    <button onClick={handleSchedule}
                        className="btn-primary bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-200 h-auto md:w-48 whitespace-nowrap flex flex-col items-center justify-center gap-1">
                        <CalendarClock size={20} />
                        <span>Agendar Preventiva</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="flex border-b border-gray-200">
                    <button onClick={() => setActiveTab('agendados')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab ===
                            'agendados' ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50/30'
                            : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            Aguardando Segregação <span
                                className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">{scheduledItems.length}</span>
                        </span>
                    </button>
                    <button onClick={() => setActiveTab('segregados')}
                        className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab ===
                            'segregados' ? 'text-teal-600 border-b-2 border-teal-600 bg-teal-50/30' :
                            'text-gray-500 hover:bg-gray-50'}`}
                    >
                        <span className="flex items-center justify-center gap-2">
                            Segregados (Parados) <span
                                className="bg-gray-200 text-gray-700 py-0.5 px-2 rounded-full text-xs">{segregatedItems.length}</span>
                        </span>
                    </button>
                </div>

                <div className="p-0">
                    {activeTab === 'agendados' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                            Equipamento</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                            Status Atual / Local</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                            Ação Imediata</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {scheduledItems.length > 0 ? scheduledItems.map(item => (
                                        <tr key={item.id}
                                            className="hover:bg-orange-50/30 transition-colors">
                                            <td className="p-4">
                                                <span
                                                    className="font-mono font-bold text-gray-800 block">{item.tag}</span>
                                                <span className="text-sm text-gray-500">{item.model}</span>
                                            </td>
                                            <td className="p-4">
                                                <StatusBadge status={item.status} />
                                                <div
                                                    className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                                    <MapPin size={14} /> {formatItemLocation(item)}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {item.status === 'available' ? (
                                                    <button onClick={() => onSegregate(item.tag)} className="px-4 py-2 bg-orange-100 text-orange-800 font-bold text-sm rounded-lg hover:bg-orange-200 border border-orange-200 shadow-sm transition-colors flex items-center gap-2">
                                                        <AlertTriangle size={16} /> Confirmar Segregação
                                                    </button>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">Retenção
                                                        automática ao retornar.</span>
                                                )}
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="3" className="p-12 text-center text-gray-400">
                                                Nenhum alerta de preventiva aguardando recolhimento.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeTab === 'segregados' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                            Equipamento</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                            Data da Segregação</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                            Tempo Parado</th>
                                        <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                            Ação</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {segregatedItems.length > 0 ? segregatedItems.map(item => (
                                        <tr key={item.id} className="hover:bg-teal-50/30 transition-colors">
                                            <td className="p-4">
                                                <span
                                                    className="font-mono font-bold text-gray-800 block">{item.tag}</span>
                                                <span className="text-sm text-gray-500">{item.model}</span>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {item.preventiveSegregatedAt ? new
                                                    Date(item.preventiveSegregatedAt).toLocaleString() : 'Não registrada'}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className="px-2 py-1 bg-red-50 text-red-700 text-xs font-bold border border-red-200 rounded-lg flex items-center w-max gap-1">
                                                    <Clock size={14} />
                                                    {formatElapsed(item.preventiveSegregatedAt ||
                                                        item.preventiveScheduledAt)}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <button onClick={() => {
                                                    if (window.confirm(`Deseja concluir a
                                                                preventiva e liberar o equipamento ${item.tag} para
                                                                uso?`)) onComplete(item.tag)
                                                }} className="px-4 py-2 bg-teal-600 text-white font-bold text-sm rounded-lg hover:bg-teal-700 shadow-sm shadow-teal-200 transition-colors flex items-center gap-2">
                                                    <CheckCircle size={16} /> Concluir e Liberar
                                                </button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center text-gray-400">
                                                Nenhum equipamento retido aguardando manutenção preventiva.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const mapPedidoLegacy = (p) => {
    if (!p) return null;
    return {
        ...p,
        id: p.id || '',
        status: String(p.status || '').toLowerCase(),
        kind: p.kind || '',
        equipmentType: String(p.equipmentType || p.equipmenttype || p["equipmentType"] || '').trim().toUpperCase(),
        equipmentTag: String(p.equipmentTag || p.equipmenttag || p["equipmentTag"] || '').trim().toUpperCase(),
        sector: p.sector || '',
        patientName: p.patientName || p.patientname || '',
        patient_mv: p.patient_mv || p.patientmv || '',
        patientBed: p.patientBed || p.patientbed || '',
        requesterName: p.requesterName || p.requestername || '',
        requesterBadge: p.requesterBadge || p.requesterbadge || '',
        accessories: Array.isArray(p.accessories) ? p.accessories : (p.accessories ? [p.accessories] : []),
        fulfilledAt: p.fulfilledAt || p.fulfilledat || null,
        timestamp: p.timestamp || null
    };
};

const AdminUsersView = ({ onLogout }) => {
    const [users, setUsers] = useState([]);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ login: '', senha: '', perfil: 'ASSISTENCIAL', setor_nome: '' });

    const fetchUsers = async () => {
        const { data } = await supabase.from('ceic_usuarios').select('*').order('login');
        if (data) setUsers(data);
    };

    useEffect(() => { fetchUsers(); }, []);

    const filtered = users.filter(u =>
        (u.login?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (u.setor_nome?.toLowerCase() || '').includes(search.toLowerCase())
    );

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
            const payload = {
                login: norm(formData.login),
                perfil: norm(formData.perfil),
                setor_nome: norm(formData.setor_nome)
            };

            if (formData.senha) payload.senha = formData.senha; // Só atualiza senha se preencheu

            let response;
            if (editingId) {
                response = await supabase.from('ceic_usuarios').update(payload).eq('id', editingId).select();
            } else {
                if (!formData.senha) {
                    alert("Senha é obrigatória para novos usuários!");
                    return;
                }
                response = await supabase.from('ceic_usuarios').insert([payload]).select();
            }

            const { data, error } = response;
            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            setModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error("Erro ao salvar usuário:", error);
            alert(`Erro ao salvar: ${error.message}`);
        }
    };

    const handleDelete = async (id, login) => {
        if (confirm(`Tem certeza que deseja excluir o usuário ${login}?`)) {
            try {
                const { data, error } = await supabase.from('ceic_usuarios').delete().eq('id', id).select();
                if (error || !data || data.length === 0) {
                    throw new Error('Operação não persistiu no banco');
                }
                fetchUsers();
            } catch (error) {
                console.error("Erro ao excluir usuário:", error);
                alert(`Erro ao excluir: ${error.message}`);
            }
        }
    };

    const openModal = (u = null) => {
        if (u) {
            setEditingId(u.id);
            setFormData({ login: u.login, senha: '', perfil: u.perfil, setor_nome: u.setor_nome || '' });
        } else {
            setEditingId(null);
            setFormData({ login: '', senha: '', perfil: 'ASSISTENCIAL', setor_nome: '' });
        }
        setModalOpen(true);
    };

    return (
        <div className="pb-20 animate-fade-in max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><User className="text-blue-600" /> Gestão de Usuários</h2>
                <button onClick={() => openModal()} className="btn-primary flex items-center gap-2"><PlusCircle size={20} /> Novo Usuário</button>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
                <div className="relative w-full md:w-96"><Search className="absolute left-3 top-2.5 text-gray-400" size={18} /><input className="input pl-10" placeholder="Buscar por login ou setor..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr><th className="p-4 font-bold text-gray-500">LOGIN</th><th className="p-4 font-bold text-gray-500">SETOR</th><th className="p-4 font-bold text-gray-500">PERFIL</th><th className="p-4 font-bold text-gray-500 text-right">AÇÕES</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtered.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="p-4 font-mono font-bold text-gray-800">{u.login}</td>
                                <td className="p-4 text-gray-600">{u.setor_nome || '-'}</td>
                                <td className="p-4"><span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-bold">{u.perfil}</span></td>
                                <td className="p-4 text-right">
                                    <button onClick={() => openModal(u)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(u.id, u.login)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {modalOpen && createPortal(
                <div className="modal-overlay z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md animate-fade-in max-h-[85vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <User className="text-blue-600" size={20} />
                                {editingId ? 'Editar Usuário' : 'Novo Usuário'}
                            </h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div><label className="label">Login *</label><input className="input uppercase font-mono" value={formData.login} onChange={e => setFormData({ ...formData, login: e.target.value })} required autoFocus /></div>
                            <div><label className="label">{editingId ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}</label><input type="password" className="input" value={formData.senha} onChange={e => setFormData({ ...formData, senha: e.target.value })} /></div>
                            <div><label className="label">Perfil *</label><select className="input" value={formData.perfil} onChange={e => setFormData({ ...formData, perfil: e.target.value })}>
                                <option value="ASSISTENCIAL">ASSISTENCIAL</option><option value="OPERACIONAL">OPERACIONAL</option><option value="GESTAO">GESTAO</option><option value="ADMIN">ADMIN</option><option value="TESTE">TESTE</option>
                            </select></div>
                            <div><label className="label">Nome do Setor</label><input className="input uppercase" value={formData.setor_nome} onChange={e => setFormData({ ...formData, setor_nome: e.target.value })} placeholder="Ex: UTI DA EMERGENCIA" /></div>
                            <div className="flex gap-3 pt-4"><button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-2.5 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button><button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200">Salvar</button></div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// Componente App: Gerenciamento principal de estado, rotas e integração com o Supabase.
function App() {
    const [userProfile, setUserProfile] = useState(null);
    const [currentView, setCurrentView] = useState('login');
    const [isLoading, setIsLoading] = useState(true);

    // =============================================================
    // MELHORIA (Relatório): Alerta sonoro no Operacional quando chega nova solicitação
    // - Toca um beep curto via WebAudio
    // - Possui controle (liga/desliga) e trava (throttle) para evitar repetição
    // =============================================================
    const [soundEnabled, setSoundEnabled] = useState(() => {
        try { return localStorage.getItem('ceic_sound_enabled') !== '0'; } catch { return true; }
    });
    const lastBeepRef = useRef(0);

    const playNewRequestBeep = () => {
        if (!soundEnabled) return;
        const now = Date.now();
        if (now - lastBeepRef.current < 5000) return; // throttle 5s
        lastBeepRef.current = now;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.value = 0.06;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            setTimeout(() => { osc.stop(); ctx.close(); }, 160);
        } catch (e) { }
    };

    useEffect(() => {
        try { localStorage.setItem('ceic_sound_enabled', soundEnabled ? '1' : '0'); } catch { }
    }, [soundEnabled]);
    const [inventory, setInventory] = useState([]);
    const [requests, setRequests] = useState([]);
    const [ventilatoryCatalog, setVentilatoryCatalog] = useState([]);
    const [generalCatalog, setGeneralCatalog] = useState([]);
    const [transportCatalog, setTransportCatalog] = useState([]);
    const [fullCatalog, setFullCatalog] = useState([]);

    const availableLocations = useMemo(() => {
        const locs = Array.from(new Set(inventory.map(i => i.location).filter(Boolean))).sort();
        return locs.length > 0 ? locs : ['CEIC', 'Ag. Preventiva', 'Engenharia Clínica', 'Expurgo CEIC', '03DN', '03DS', '04GN', '04GS', '04CC', '04DN', '04DS', 'Centro Cirúrgico'];
    }, [inventory]);

    const equipmentCatalog = useMemo(() => ({
        GERAIS: { label: "Equipamentos Gerais", accessoryItems: ["Espaçador / Aeropuff", "Célula de Capnografia", "20 Sacos para acondicionamento de circuitos (saco infectante)"] },
        VENTILATORIA: {
            label: "ASSISTÊNCIA VENTILATÓRIA",
            types: {
                "VENTILADOR PULMONAR NAO INVASIVO": {
                    accessories: ["Circuito", "Circuito BPAP", "Circuito CPAP", "Máscara Orofacial (sem válvula exalatória)", "Máscara Orofacial (com válvula exalatória)", "Máscara Performax (sem válvula exalatória - azul)", "Máscara Performax (com válvula exalatória - branca/laranja)", "Máscara Nasal"]
                },
                "VENTILADOR PULMONAR INVASIVO": {
                    accessories: ["Umidificação Passiva", "Umidificação ativa"]
                },
                "ALTO FLUXO": {
                    accessories: ["Circuito Adulto", "Circuito Infantil", "Cânula nasal Adulto P", "Cânula nasal Adulto M", "Cânula nasal Adulto G", "Cânula de interface para TQT", "Cânula nasal Infantil (Roxa - até 20L/min)", "Cânula nasal Pediátrica (Verde - até 25L/min)"]
                },
                "GERADOR DE FLUXO": {
                    accessories: ["Circuito Adulto", "Circuito Infantil", "Cânula nasal Adulto P", "Cânula nasal Adulto M", "Cânula nasal Adulto G", "Cânula de interface para TQT", "Cânula nasal Infantil (Roxa - até 20L/min)", "Cânula nasal Pediátrica (Verde - até 25L/min)"]
                },
                "CASSETE EXPIRATORIO": { accessories: [] },
                "VENTILOMETRO": { accessories: [] }
            }
        },
        TRANSPORTE: {
            label: "Equipamentos para Transporte de Paciente", destinations: ["Centro cirúrgico 9º PAMB", "ICESP", "INCOR", "IOT", "Ressonância magnética", "Tomografia 3o andar",
                "Tomografia 4o andar", "Radiologia intervencionista", "11DN", "11DS", "11EE", "11FF", "11GN", "09UAN/UAC - PAMB 9",
                "07AA - UTI", "04GN", "04GS", "PS - Sala de emergência cirúrgica", "PS -Sala de emergência clínica"]
        }
    }), []);

    // Abstração de banco removida conforme as regras.
    useEffect(() => {
        // Carrega os dados iniciais do inventário e requisições ao iniciar a aplicação.
        const fetchInitialData = async () => {
            setIsLoading(true);
            // Busca equipamentos
            try {
                const { data: eqData, error: eqError } = await supabase.from('equipamentos').select('*');

                console.log("🕵️ DEBUG FETCH EQUIPAMENTOS (Amostra):", eqData && eqData.length > 0 ? eqData[0] : "Vazio");

                if (eqData && !eqError) {
                    const formatado = (eqData || []).map(item => ({
                        ...item,
                        patient_mv: item.patient_mv,
                        in_use_since: item.in_use_since
                    }));
                    setInventory(formatado.map(mapEquip).filter(Boolean));
                } else if (eqError) {
                    console.error("Erro ao buscar equipamentos:", eqError);
                }
            } catch (err) {
                console.error('Erro de conexão ao buscar equipamentos', err);
            }

            // Busca pedidos
            try {
                const { data: reqData, error: reqError } = await supabase.from('pedidos').select('*, catalogo_equipamentos(instrucao_devolucao)');
                if (reqData && !reqError) {
                    setRequests((reqData || []).map(mapPedido).filter(Boolean));
                } else if (reqError) {
                    console.error("Erro ao buscar pedidos:", reqError);
                }
            } catch (err) {
                console.error('Erro de conexão ao buscar pedidos', err);
            }

            try {
                const { data: catData, error: catError } = await supabase
                    .from('catalogo_equipamentos')
                    .select('*');

                if (catData && !catError) {
                    setFullCatalog(catData);
                    const normUpper = (s) => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toUpperCase();
                    setGeneralCatalog(catData.filter(i => !normUpper(i.categoria).includes('VENTILATORIA') && !normUpper(i.categoria).includes('TRANSPORTE')));
                    setVentilatoryCatalog(catData.filter(i => normUpper(i.categoria).includes('VENTILATORIA')));
                    setTransportCatalog(catData.filter(i => normUpper(i.categoria).includes('TRANSPORTE')));
                }
                else if (catError) console.error("Erro ao buscar catalogo_equipamentos:", catError);
            } catch (err) {
                console.error('Erro de conexão ao buscar catalogo_equipamentos', err);
            }
            setIsLoading(false);
        };

        fetchInitialData();

        // Subscrevendo eventos Realtime para as tabelas
        // Subscrição do Supabase Realtime para sincronização das tabelas instântaneamente entre os clientes.
        const equipamentosChannel = supabase.channel('custom-equipamentos-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'equipamentos' }, (payload) => {
                if (DEBUG_LOGS) console.log('Realtime Equipamentos:', payload);

                if (payload.eventType === 'INSERT') {
                    const nextItem = mapEquip(payload.new);
                    setInventory(prev => {
                        if (!nextItem || prev.find(i => i.id === payload.new.id)) return prev;
                        return [...prev, nextItem];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    const nextItem = mapEquip(payload.new);
                    setInventory(prev => prev.map(item => item.id === payload.new.id ? nextItem : item));
                } else if (payload.eventType === 'DELETE') {
                    setInventory(prev => prev.filter(item => item.id !== payload.old.id));
                }
            })
            .subscribe();

        const pedidosChannel = supabase.channel('custom-pedidos-channel')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (payload) => {
                if (DEBUG_LOGS) console.log('Realtime Pedidos:', payload);
                if (payload.eventType === 'INSERT') {
                    const nextItem = mapPedido(payload.new);
                    setRequests(prev => {
                        if (!nextItem || prev.find(i => i.id === payload.new.id)) return prev;
                        return [nextItem, ...prev];
                    });
                } else if (payload.eventType === 'UPDATE') {
                    const nextItem = mapPedido(payload.new);
                    setRequests(prev => prev.map(item => item.id === payload.new.id ? nextItem : item));
                } else if (payload.eventType === 'DELETE') {
                    setRequests(prev => prev.filter(item => item.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(equipamentosChannel);
            supabase.removeChannel(pedidosChannel);
        };
    }, []);

    const [notification, setNotification] = useState(null);
    const notificationTimeoutRef = useRef(null);

    const [triageData, setTriageData] = useState(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const showNotification = (type, message) => {
        setNotification({ type, message });
        if (notificationTimeoutRef.current) clearTimeout(notificationTimeoutRef.current);
        notificationTimeoutRef.current = setTimeout(() => setNotification(null), 7000);
    };

    const handleLogin = (profile) => {
        setUserProfile(profile);
        const p = String(profile.role).toUpperCase();
        if (p === 'ASSISTENCIAL') setCurrentView('nova_solicitacao');
        else if (p === 'OPERACIONAL') setCurrentView('dashboard');
        else if (p === 'GESTAO') setCurrentView('admin_dashboard');
        else if (p === 'ADMIN') setCurrentView('admin_users');
        else if (p === 'TESTE' || p === 'ADMIN_TESTE') setCurrentView('admin_frota');
        else setCurrentView('login');
    };

    const handleLogout = () => { setUserProfile(null); setCurrentView('login'); };

    // Manipuladores de eventos (Handlers) para ações de interface dos usuários.

    const handleAddEquipment = async (newItem) => {
        try {
            const tagStr = String(newItem.tag || '').trim().toUpperCase();
            const typeStr = String(newItem.type || '').trim().toUpperCase();

            const { data: activeEquipment, error: activeCheckError } = await supabase
                .from('equipamentos')
                .select('id, tag, status')
                .eq('tag', tagStr)
                .in('status', ['available', 'in_use'])
                .limit(1);

            if (activeCheckError) throw activeCheckError;
            if (activeEquipment && activeEquipment.length > 0) {
                throw new Error('REGRA_NEGOCIO_EQUIPAMENTO_ATIVO_DUPLICADO: já existe equipamento ativo com esta TAG.');
            }

            const { data, error } = await supabase
                .from('equipamentos')
                .insert([{
                    tag: tagStr,
                    type: typeStr,
                    model: String(newItem.model || '').trim(),
                    status: String(newItem.status || 'available').trim().toLowerCase(),
                    location: String(newItem.location || 'CEIC').trim(),
                    specificLocation: null,
                    patient_mv: null,
                    in_use_since: null
                }])
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
            showNotification('success', `Equipamento ${tagStr} inserido na frota.`);
        } catch (error) {
            console.error("Erro handleAddEquipment:", error);
            showNotification('error', `Erro ao adicionar: ${error.message}`);
        }
    };

    const handleEditEquipment = async (id, updatedData) => {
        try {
            const tagStr = String(updatedData.tag || '').trim().toUpperCase();
            const typeStr = String(updatedData.type || '').trim().toUpperCase();

            const { data, error } = await supabase
                .from('equipamentos')
                .update({
                    tag: tagStr,
                    type: typeStr,
                    model: String(updatedData.model || '').trim(),
                    status: String(updatedData.status || '').trim().toLowerCase(),
                    location: String(updatedData.location || '').trim()
                })
                .eq('id', id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
            showNotification('success', 'Dados do equipamento atualizados.');
        } catch (error) {
            console.error("Erro handleEditEquipment:", error);
            showNotification('error', `Erro ao atualizar: ${error.message}`);
        }
    };

    const handleDeleteEquipment = async (id) => {
        try {
            const { data, error } = await supabase
                .from('equipamentos')
                .delete()
                .eq('id', id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
            showNotification('success', 'Equipamento inativado e removido da frota do sistema.');
        } catch (error) {
            console.error("Erro handleDeleteEquipment:", error);
            showNotification('error', `Erro ao excluir: ${error.message}`);
        }
    };

    const handleCreateRequest = async (requestData) => {
        try {
            const resolvedSector = requestData?.sector || userProfile?.sector || 'CEIC (Geral)';
            const selectedEquipmentType = requestData?.equipmentType || 'Não Informado';
            const normalizedEquipmentType = normalizeEquipmentTypeForDb(selectedEquipmentType);

            const payloadFormatado = {
                kind: 'solicitacao',
                status: 'pending',
                equipment_type: normalizedEquipmentType,
                catalogo_id: requestData?.catalogo_id || null,
                // Força os dados do usuário logado para garantir integridade
                sector: userProfile?.sector || 'Emergência',
                patient_name: String(requestData?.patientName || 'Não Informado').trim(),
                patient_mv: String(requestData?.patient_mv || '000000').trim(),
                patient_bed: String(requestData?.patientBed || '00').trim(),
                requester_name: userProfile?.name || 'Solicitante não identificado',
                requester_badge: userProfile?.login || '00000',
                extension: String(requestData?.extension || '-').trim(),
                is_urgent: !!requestData?.isUrgent,
                accessories: Array.isArray(requestData?.accessories) && requestData.accessories.length > 0
                    ? requestData.accessories
                    : null
            };

            console.log('Enviando payload formatado para pedidos:', payloadFormatado);

            const { data, error } = await supabase.from('pedidos').insert([payloadFormatado]).select().single();

            if (error) {
                console.error('Erro Supabase Insert:', error);
                throw error;
            }

            if (!data) {
                throw new Error('OPERACAO_NAO_PERSISTIU_PEDIDO: Sem dados de retorno.');
            }

            const pedidoPersistido = mapPedido(data);

            setRequests(function (prev) {
                const exists = prev.some(function (p) { return p.id === pedidoPersistido.id; });
                if (exists) return prev;
                return [pedidoPersistido, ...prev];
            });

            showNotification('success', 'Solicitação enviada com sucesso!');
            setCurrentView('meus_pedidos');

        } catch (error) {
            console.error('Erro detalhado em handleCreateRequest:', error);
            showNotification('error', `Falha ao enviar pedido: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const handleFulfillRequest = async (request, tagInput) => {
        if (!tagInput || tagInput.length === 0) {
            showNotification('error', 'Por favor, insira a(s) TAG(s) do equipamento.');
            return;
        }

        const tagsArray = Array.isArray(tagInput) ? tagInput : [tagInput];
        const equipmentsToAssign = [];
        const cleanedTagsForDb = [];

        // Extrai e normaliza os tipos de equipamento requeridos para validação estrutural.
        let expectedTypes = [];
        if (isTransportRequest(request.equipmentType)) {
            expectedTypes = normUpper(request.equipmentType).replace('TRANSPORTE: ', '').split(' + ').map(normUpper);
        } else {
            expectedTypes = [normUpper(request.equipmentType)];
        }

        for (let i = 0; i < tagsArray.length; i++) {
            const cleanTag = normUpper(tagsArray[i]);
            if (!cleanTag) continue;

            // Validação de Segurança: Impede a inserção de TAG idêntica em múltiplas posições.
            if (cleanedTagsForDb.includes(cleanTag)) {
                showNotification('error', `A TAG ${cleanTag} foi inserida em duplicidade neste pedido.`);
                return;
            }

            cleanedTagsForDb.push(cleanTag);

            const equipment = inventory.find(eq => normUpper(eq.tag) === cleanTag);

            if (!equipment) {
                showNotification('error', `TAG inválida: ${cleanTag}`);
                return;
            }

            if (equipment.status !== 'available') {
                const statusLabel = {
                    in_use: 'em uso',
                    cleaning: 'em higienização',
                    maintenance: 'em manutenção',
                    preventive: 'retido para preventiva'
                }[equipment.status] || equipment.status;
                showNotification('error', `A TAG ${cleanTag} não pode ser entregue porque está ${statusLabel}.`);
                return;
            }

            // Validação de Segurança: Assegura correspondência exata entre equipamento escaneado e requisito.
            const nomeBanco = normUpper(equipment.type);
            let baseExpected = expectedTypes[i] || expectedTypes[0];
            const nomeEsperado = normUpper(baseExpected);

            const tipoBate = nomeBanco === nomeEsperado;

            if (!tipoBate) {
                showNotification('error', `A TAG ${cleanTag} é de um(a) "${equipment.type}", mas o pedido exige "${expectedTypes[i] || expectedTypes[0]}".`);
                return;
            }

            if (equipment.preventiveScheduled) {
                showNotification('error', `ATENÇÃO: O equipamento ${cleanTag} está retido para Preventiva!`);
                return;
            }

            equipmentsToAssign.push(equipment);
        }

        if (equipmentsToAssign.length === 0) return;

        let specLoc = request.patientBed || null;
        if (isTevCompressorType(request.equipmentType) && sameText(request.sector || request.unit, 'Centro Cirúrgico')) {
            specLoc = request.destinyUnitBed || null;
        }

        const isTransport = isTransportRequest(request.equipmentType);

        try {
            const arrivalTime = new Date().toISOString();
            const { data, error } = await supabase
                .from('pedidos')
                .update({
                    status: 'delivered',
                    equipment_tag: cleanedTagsForDb.join(', '),
                    arrival_time: arrivalTime
                })
                .eq('id', request.id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco de pedidos');
            }

            // BLINDAGEM: Update na tabela equipamentos com a coluna status e a nova location
            const { error: eqError } = await supabase
                .from('equipamentos')
                .update({
                    status: 'allocated',
                    location: request.requesterBadge || request.sector || request.login,
                    patient_mv: request.patient_mv || null,
                    in_use_since: new Date().toISOString()
                })
                .in('id', equipmentsToAssign.map(eq => eq.id));

            if (eqError) {
                console.error('Erro estrito no update de equipamentos:', eqError);
                throw new Error(`Falha ao atualizar estoque: ${eqError.message}`);
            }

            // Atualiza estado local de pedidos
            const updatedReq = mapPedido(data[0]);
            setRequests(prev => prev.map(r => r.id === request.id ? updatedReq : r));

            // Atualiza inventário local
            setInventory(prev => prev.map(eq =>
                equipmentsToAssign.some(e => e.id === eq.id)
                    ? { ...eq, status: 'allocated', location: request.requesterBadge || request.sector || request.login, patient_mv: request.patient_mv || null, in_use_since: new Date().toISOString() }
                    : eq
            ));

            showNotification('success', cleanedTagsForDb.length > 1 ? 'Equipamentos vinculados com sucesso!' : `Equipamento ${cleanedTagsForDb[0]} vinculado com sucesso!`);
        } catch (error) {
            console.error("Erro ao confirmar:", error);
            showNotification('error', `Falha ao salvar no banco: ${error.message}`);
        }
    };

    const handleUpdateTransportTimes = async (requestId, times) => {
        try {
            const dbTimes = {
                arrival_time: times.arrivalTime,
                departure_time: times.departureTime,
                return_to_unit_time: times.returnToUnitTime,
                return_to_ceic_time: times.returnToCeicTime
            };
            const { data, error } = await supabase
                .from('pedidos')
                .update(dbTimes)
                .eq('id', requestId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            const updatedReq = mapPedido(data[0]);
            setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));

            showNotification('success', 'Tempos de transporte gravados com sucesso!');
        } catch (error) {
            console.error('Erro ao atualizar tempos de transporte:', error);
            showNotification('error', `Erro ao gravar tempos: ${error.message}`);
        }
    };

    const handleProcessPickup = async (request) => {
        try {
            setTriageData({
                tag: request.equipmentTag, type: request.equipmentType, hasDefect: request.problemReported === 'Sim',
                defectDesc: request.problemDescription
            });
            const { data, error } = await supabase
                .from('pedidos')
                .update({ status: 'completed' })
                .eq('id', request.id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            const updatedReq = mapPedido(data[0]);
            setRequests(prev => prev.map(r => r.id === request.id ? updatedReq : r));
            setCurrentView('triagem');
        } catch (error) {
            console.error('Erro ao processar retirada:', error);
            showNotification('error', `Erro ao processar retirada: ${error.message}`);
        }
    };

    const handleCancelRequest = async (requestId, cancelData) => {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .update({
                    status: 'cancelled',
                    cancel_name: userProfile?.name || 'Operacional',
                    cancel_badge: userProfile?.login || 'N/A'
                })
                .eq('id', requestId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            const updatedReq = mapPedido(data[0]);
            setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));

            showNotification('success', 'Solicitação cancelada com sucesso.');
        } catch (error) {
            console.error('Erro ao cancelar solicitação:', error);
            showNotification('error', `Erro ao cancelar: ${error.message}`);
        }
    };

    const handleWaitlistRequester = async (requestId) => {
        try {
            const { data, error } = await supabase
                .from('pedidos')
                .update({
                    status: 'waitlisted',
                    is_waitlisted: true,
                    waitlist_time: new Date().toISOString()
                })
                .eq('id', requestId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            const updatedReq = mapPedido(data[0]);
            setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));

            showNotification('success', 'Pedido em fila de espera!');
        } catch (error) {
            console.error('Erro ao colocar em fila de espera:', error);
            showNotification('error', `Erro ao colocar em espera: ${error.message}`);
        }
    };

    const handleNotifyRequester = async (requestId, message, type) => {
        try {
            const notificationTime = new Date().toISOString();
            const { data, error } = await supabase
                .from('pedidos')
                .update({
                    notification_message: message,
                    notification_type: type,
                    notification_time: notificationTime
                })
                .eq('id', requestId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            // Atualiza estado local para refletir a mensagem no card imediatamente
            const updatedReq = mapPedido(data[0]);
            setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));

            showNotification('success', 'Notificação enviada!');
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            showNotification('error', `Erro ao enviar notificação: ${error.message}`);
        }
    };

    const handleReturnByTag = async ({ tag, hasDefect, defectDescription, returnedAllAccessories, unitNotified, patientDamage, notificationNumber }) => {
        const cleanTag = normUpper(tag);
        const item = inventory.find(i => normUpper(i.tag) === cleanTag);

        if (!item || !item.id) {
            console.error("Item ou ID não encontrado para a TAG:", tag);
            showNotification('error', 'Erro: ID do equipamento não localizado no sistema.');
            return false;
        }

        if (item.status === 'cleaning' || item.status === 'maintenance') {
            showNotification('error', `A TAG ${item.tag} já está em ${item.status === 'cleaning' ? 'higienização' : 'manutenção'}.`);
            return false;
        }

        const nextStatus = hasDefect ? 'maintenance' : 'cleaning';
        const nextLocation = hasDefect ? 'Engenharia Clínica' : 'Expurgo CEIC';

        const supabaseUpdates = {
            status: nextStatus,
            location: nextLocation
        };

        const localUpdates = {
            ...supabaseUpdates,
            previousLocation: item.location || 'Não informado',
            specificLocation: null,
            returnDate: new Date().toISOString(),
            returnedAllAccessories: !!returnedAllAccessories,
            transferStatus: null,
            transferTo: null,
            transferToBed: null,
            transferBy: null,
            transferRejected: false,
            patient_mv: null,
            patientName: null,
            in_use_since: null
        };

        if (hasDefect) {
            localUpdates.defectdescription = defectDescription ?? '';
            localUpdates.unitnotified = !!unitNotified;
            localUpdates.notificationnumber = notificationNumber ?? '';
            localUpdates.patientdamage = !!patientDamage;
            localUpdates.servicerequestnumber = null;
        }

        try {
            const { data, error: equipError } = await supabase
                .from('equipamentos')
                .update(supabaseUpdates)
                .eq('id', item.id)
                .select();

            if (equipError) {
                console.error("🕵️ ERRO EXATO NA DEVOLUÇÃO DO EQUIPAMENTO:", equipError.message, equipError.details, equipError.hint);
                throw new Error(`Erro: ${equipError.message}`);
            }

            if (!data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            setInventory(prev => prev.map(it => (normUpper(it.tag) === cleanTag ? mapEquip({ ...it, ...localUpdates }) : it)));
            setTriageData(null);
            showNotification(hasDefect ? 'error' : 'success', hasDefect ? 'Enviado para Manutenção.' : 'Baixa concluída! Item enviado ao Expurgo.');
            return true;
        } catch (error) {
            console.error("Erro na atualização Supabase:", error);
            showNotification('error', `Erro no Banco: ${error.message}`);
            return false;
        }
    };

    const handleReleaseItem = async (itemId) => {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        const payloadLiberacao = item.preventiveScheduled
            ? {
                status: 'preventive',
                location: 'Ag. Preventiva',
                specific_location: null,
                preventive_segregated_at: new Date().toISOString()
            }
            : {
                status: 'available',
                location: 'CEIC',
                specific_location: null
            };

        try {
            const { data, error: releaseError } = await supabase
                .from('equipamentos')
                .update(payloadLiberacao)
                .eq('id', itemId)
                .select();

            if (releaseError) {
                console.error("❌ ERRO SUPABASE [EXPURGO]:", releaseError.message, releaseError.details, releaseError.hint);
                throw new Error(`Operação não persistiu: ${releaseError.message}`);
            }

            if (!data || data.length === 0) {
                throw new Error('Equipamento não encontrado ou não atualizado.');
            }

            setInventory(prev => (prev || []).map(it => it.id === itemId ? mapEquip(data[0]) : it));
            showNotification('success', item.preventiveScheduled ? `Item ${item.tag} segregado para preventiva.` : `Equipamento ${item.tag} liberado com sucesso!`);
        } catch (error) {
            showNotification('error', `Falha ao liberar equipamento: ${error.message}`);
            console.error('Release failed:', error);
        }
    };
    const handleReturnFromMaintenance = async (itemId, dataArgs) => {
        const item = inventory.find(i => i.id === itemId);
        if (!item) return;

        const nextStatus = item.preventiveScheduled ? 'preventive' : 'available';
        const nextLocation = item.preventiveScheduled ? 'Ag. Preventiva' : 'CEIC';

        const updates = {
            status: nextStatus,
            location: nextLocation,
            preventiveSegregatedAt: item.preventiveScheduled ? new Date().toISOString() : null,
            specificLocation: null,
            defectDescription: null,
            unitNotified: false,
            notificationNumber: null,
            patientDamage: false,
            previousLocation: null,
            returnDate: null,
            patient_mv: null,
            patientName: null,
            in_use_since: null,
            serviceRequestNumber: null
        };

        try {
            const { data, error } = await supabase
                .from('equipamentos')
                .update(updates)
                .eq('id', itemId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
            showNotification('success', 'Equipamento retornado da manutenção com sucesso!');
        } catch (error) {
            showNotification('error', `Falha ao retornar da manutenção: ${error.message}`);
        }
    };

    const handleSchedulePreventive = async (tagsList) => {
        const tags = tagsList.split(/[\s,;\n]+/).map(t => t.trim().toUpperCase()).filter(t => t);
        if (tags.length === 0) return;

        let foundCount = 0;
        let notFound = [];

        for (const tag of tags) {
            const item = inventory.find(i => i.tag && i.tag.trim().toUpperCase() === tag.trim().toUpperCase());
            if (item) {
                if (!item.preventiveScheduled) {
                    try {
                        const { data, error } = await supabase
                            .from('equipamentos')
                            .update({
                                preventiveScheduled: true,
                                preventiveScheduledAt: new Date().toISOString()
                            })
                            .eq('id', item.id)
                            .select();

                        if (error || !data || data.length === 0) {
                            throw new Error('Operação não persistiu no banco');
                        }
                        foundCount++;
                    } catch (err) {
                        console.error(`Erro ao agendar preventiva para ${tag}:`, err);
                    }
                }
            } else {
                notFound.push(tag);
            }
        }

        if (foundCount > 0) showNotification('success', `${foundCount} equipamento(s) com alerta de preventiva ativado.`);
        if (notFound.length > 0) setTimeout(() => showNotification('error', `As seguintes TAGs não constam na frota: ${notFound.join(', ')}`), 1500);
    };

    const handleSegregatePreventive = async (tag) => {
        const item = inventory.find(i => normUpper(i.tag) === normUpper(tag));
        if (!item) return;

        try {
            const { data, error } = await supabase
                .from('equipamentos')
                .update({
                    status: 'preventive', location: 'Ag. Preventiva', preventiveSegregatedAt: new Date().toISOString()
                })
                .eq('id', item.id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
            showNotification('success', `Equipamento ${tag} segregado para preventiva.`);
        } catch (error) {
            showNotification('error', `Erro ao segregar: ${error.message}`);
        }
    };

    const handleCompletePreventive = async (tag) => {
        const item = inventory.find(i => normUpper(i.tag) === normUpper(tag));
        if (!item) return;

        try {
            const { data, error } = await supabase
                .from('equipamentos')
                .update({
                    status: 'available', location: 'CEIC', preventiveScheduled: false,
                    preventiveSegregatedAt: null, preventiveScheduledAt: null
                })
                .eq('id', item.id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
            showNotification('success', `Preventiva do ${tag} concluída. Item disponível.`);
        } catch (error) {
            showNotification('error', `Erro ao concluir preventiva: ${error.message}`);
        }
    };

    const handleUpdateNotification = async (itemId, notificationNumber) => {
        const hasNotif = notificationNumber.trim().length > 0;
        try {
            const { data, error } = await supabase
                .from('equipamentos')
                .update({
                    unitNotified: hasNotif,
                    notificationNumber: hasNotif ? notificationNumber.trim() : null
                })
                .eq('id', itemId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
        } catch (error) {
            console.error("Erro handleUpdateNotification:", error);
            throw error;
        }
    };

    const handleUpdateServiceRequest = async (itemId, reqNumber) => {
        try {
            const { data, error } = await supabase
                .from('equipamentos')
                .update({
                    serviceRequestNumber: reqNumber.trim().length > 0 ? reqNumber.trim() : null
                })
                .eq('id', itemId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
        } catch (error) {
            console.error("Erro handleUpdateServiceRequest:", error);
            throw error;
        }
    };

    const handleRequestPickup = async ({ equipmentTag, collaboratorName, collaboratorBadge, hasIssue, issueDescription }) => {
        try {
            const item = inventory.find(i => normUpper(i.tag) === normUpper(equipmentTag));
            if (!item) {
                showNotification('error', 'Equipamento não encontrado.');
                return;
            }

            const newReq = {
                status: 'pickup_requested',
                kind: 'recolhimento',
                equipment_tag: item.tag,
                equipment_type: item.type,
                sector: userProfile?.sector || item.location || 'CEIC',
                requester_name: userProfile?.name || collaboratorName,
                requester_badge: userProfile?.login || collaboratorBadge,
                accessories: null
            };

            const { data, error } = await supabase.from('pedidos').insert([newReq]).select();
            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco de pedidos');
            }

            // Atualiza a tabela equipamentos com status de devolução
            const { error: eqError } = await supabase.from('equipamentos')
                .update({ status: 'pickup_requested' })
                .eq('tag', item.tag);

            if (eqError) {
                throw new Error('Erro ao atualizar status do equipamento para devolução.');
            }

            // Atualiza inventário local
            setInventory(prev => prev.map(eq => normUpper(eq.tag) === normUpper(item.tag) ? { ...eq, status: 'pickup_requested' } : eq));

            if (data && data[0]) {
                setRequests(prev => [mapPedido(data[0]), ...prev]);
            }

            showNotification('success', 'Solicitação de retirada enviada.');

        } catch (error) {
            console.error('Erro em handleRequestPickup:', error);
            showNotification('error', `Erro ao solicitar retirada: ${error.message}`);
        }
    };

    const handleTransferEquipment = async ({ equipmentTag, destination, destinationBed, collaboratorName, collaboratorBadge }) => {
        const item = inventory.find(i => normUpper(i.tag) === normUpper(equipmentTag));
        if (!item) return;

        // Garante que apenas a sigla limpa seja salva e processada em todo o fluxo
        destination = destination ? destination.trim().split(' ')[0] : '';

        try {
            // BLINDAGEM: Atualiza apenas transfer_status e transfer_to, sem mudar a location ainda
            const { data: eqData, error: eqError } = await supabase
                .from('equipamentos')
                .update({
                    transfer_status: 'in_transit',
                    transfer_to: destination
                })
                .eq('tag', equipmentTag)
                .select();

            if (eqError || !eqData || eqData.length === 0) {
                throw new Error('Operação não persistiu no banco de equipamentos');
            }

            // Tenta atualizar o pedido ativo para manter histórico coerente
            const activeReq = requests.find(r => normUpper(r.equipmentTag).includes(normUpper(equipmentTag)) && (r.status === 'delivered' || r.status === 'aprovado' || r.status === 'approved'));
            if (activeReq) {
                await supabase
                    .from('pedidos')
                    .update({
                        status: 'in_transfer',
                        transfer_to: destination
                    })
                    .eq('id', activeReq.id);
            }

            // Atualiza inventário local
            setInventory(prev => prev.map(eq =>
                normUpper(eq.tag) === normUpper(equipmentTag) ? { ...eq, transferStatus: 'in_transit', transferTo: destination } : eq
            ));

            if (activeReq) {
                setRequests(prev => prev.map(r => r.id === activeReq.id ? { ...r, status: 'in_transfer', transfer_to: destination } : r));
            }

            showNotification('success', `Transferência de ${equipmentTag} para ${destination} iniciada.`);
        } catch (error) {
            console.error('Erro ao iniciar remanejamento:', error);
            showNotification('error', `Erro ao iniciar remanejamento: ${error.message}`);
        }
    };

    const handleConfirmTransfer = async (item, pedido) => {
        try {
            // 1. Atualiza o Equipamento (Payload Limpo e Sanitizado):
            const payloadAtualizacao = {
                location: userProfile?.login, // Envia estritamente a sigla do login
                transfer_status: null,        // Limpa usando null nativo
                transfer_to: null             // Limpa usando null nativo
            };

            const { error: equipError } = await supabase.from('equipamentos')
                .update(payloadAtualizacao)
                .eq('tag', item.tag);

            if (equipError) {
                console.error("❌ ERRO DETALHADO DO SUPABASE 400:", {
                    mensagem: equipError.message,
                    detalhes: equipError.details,
                    dica: equipError.hint
                });
                throw equipError;
            }

            // 2. Atualiza o Pedido (se houver pedido ativo):
            let pedidoAtualizado = null;
            if (pedido) {
                const { data, error } = await supabase.from('pedidos').update({
                    status: 'delivered', // Volta ao status de entregue/normal
                    sector: userProfile?.login, // A posse do pedido passa para o novo setor
                    requester_name: userProfile?.name,
                    requester_badge: userProfile?.login
                }).eq('id', pedido.id).select();
                if (error) throw error;
                if (data && data[0]) pedidoAtualizado = data[0];
            }

            // Atualiza estado local
            setInventory(prev => prev.map(eq =>
                normUpper(eq.tag) === normUpper(item.tag) ? { ...eq, location: userProfile?.login, transferStatus: null, transferTo: null, receivedBySector: userProfile?.login } : eq
            ));

            if (pedidoAtualizado) {
                setRequests(prev => prev.map(r => r.id === pedido.id ? mapPedido(pedidoAtualizado) : r));
            }

            showNotification('success', 'Recebimento do equipamento confirmado.');
        } catch (error) {
            showNotification('error', `Erro ao confirmar recebimento: ${error.message}`);
        }
    };

    const handleResolveTransfer = async ({ equipmentTag, action, collaboratorName, collaboratorBadge }) => {
        const item = inventory.find(i => normUpper(i.tag) === normUpper(equipmentTag));
        if (!item) return;

        let updates;
        if (action === 'accept') {
            updates = {
                location: item.transferTo, specificLocation: item.transferToBed || null,
                transferStatus: null, transferTo: null, transferToBed: null, transferBy: null,
                transferRejected: false, receivedBySector: true
            };
        } else {
            updates = {
                transferStatus: null, transferTo: null, transferToBed: null, transferBy: null,
                transferRejected: true
            };
        }

        try {
            const { data, error } = await supabase
                .from('equipamentos')
                .update(updates)
                .eq('id', item.id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }
            showNotification(action === 'accept' ? 'success' : 'error', action === 'accept' ? 'Equipamento aceito com sucesso.' : 'Remanejamento recusado. O equipamento permanecerá na origem.');
        } catch (error) {
            showNotification('error', `Erro ao resolver remanejamento: ${error.message}`);
        }
    };

    const handleConfirmReceipt = async ({ equipmentTag, collaboratorName, collaboratorBadge }) => {
        try {
            const item = inventory.find(i => normUpper(i.tag) === normUpper(equipmentTag));
            if (!item) return false;

            const destinationSector = item.transferTo || userProfile?.sector || item.location;
            const updates = {
                receivedBySector: true,
                transferStatus: null,
                transferTo: null,
                transferToBed: null,
                transferRejected: false,
                location: destinationSector
            };

            const { data, error } = await supabase
                .from('equipamentos')
                .update(updates)
                .eq('id', item.id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            showNotification('success', 'Recebimento confirmado! Equipamento alocado com sucesso.');

            const requestToComplete = requests.find(r =>
                r.status === 'approved' && splitTagList(r.equipmentTag).includes(normUpper(equipmentTag))
            );
            if (requestToComplete) {
                const { data: reqData, error: reqError } = await supabase
                    .from('pedidos')
                    .update({ status: 'completed' })
                    .eq('id', requestToComplete.id)
                    .select();
                if (reqError || !reqData || reqData.length === 0) {
                    throw new Error('Operação não persistiu no banco (pedidos)');
                }
            }
            return true;

        } catch (error) {
            console.error('Erro ao confirmar recebimento:', error);
            showNotification('error', `Erro ao confirmar recebimento: ${error.message}`);
            return false;
        }
    };

    const handleRemanejamento = async ({ tag, destination, destinationBed, patient_mv, patientName, collaboratorName, collaboratorBadge }) => {
        const item = inventory.find(i => normUpper(i.tag) === normUpper(tag));
        if (!item) return;

        // Garante que apenas a sigla limpa seja salva e processada em todo o fluxo
        destination = destination ? destination.trim().split(' ')[0] : '';

        try {
            // BLINDAGEM: Atualiza apenas transfer_status e transfer_to, sem mudar a location ainda
            const { data: eqData, error: eqError } = await supabase
                .from('equipamentos')
                .update({
                    transfer_status: 'in_transit',
                    transfer_to: destination
                })
                .eq('tag', tag)
                .select();

            if (eqError || !eqData || eqData.length === 0) {
                throw new Error('Operação não persistiu no banco de equipamentos');
            }

            // Tenta atualizar o pedido ativo para manter histórico coerente
            const activeReq = requests.find(r => normUpper(r.equipmentTag).includes(normUpper(tag)) && (r.status === 'delivered' || r.status === 'aprovado' || r.status === 'approved'));
            if (activeReq) {
                await supabase
                    .from('pedidos')
                    .update({
                        status: 'in_transfer',
                        transfer_to: destination
                    })
                    .eq('id', activeReq.id);
            }

            // Atualiza inventário localmente para refletir a intenção
            setInventory(prev => prev.map(eq =>
                normUpper(eq.tag) === normUpper(tag) ? { ...eq, transferStatus: 'in_transit', transferTo: destination } : eq
            ));

            if (activeReq) {
                setRequests(prev => prev.map(r => r.id === activeReq.id ? { ...r, status: 'in_transfer', transfer_to: destination } : r));
            }

            showNotification('success', `Transferência de ${tag} para ${destination} iniciada (Aguardando aceite).`);
            setCurrentView('admin_dashboard');
        } catch (error) {
            showNotification('error', `Erro ao iniciar remanejamento: ${error.message}`);
        }
    };

    const handleNavClick = (id) => {
        setCurrentView(id);
        setIsMobileMenuOpen(false);
    };

    const mySectorPendingRequests = useMemo(() => {
        return requests.filter(p =>
            ['pending', 'acknowledged', 'preparing', 'in_transit', 'waitlisted', 'in_transfer', 'pickup_requested'].includes(p.status) &&
            (p.sector === userProfile?.login || p.requesterBadge === userProfile?.login || p.transfer_to === userProfile?.login)
        );
    }, [requests, userProfile]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <Activity className="text-blue-600 animate-spin mb-4" size={48} />
                    <p className="text-gray-500 font-medium">Carregando dados do sistema...</p>
                </div>
            </div>
        );
    }

    if (!userProfile) {
        return (
            <>
                <GlobalStyles />
                <LoginScreen onLogin={handleLogin} showNotification={showNotification} />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-base w-full overflow-x-hidden flex flex-col">
            <GlobalStyles />
            {notification && (
                <div data-testid={notification.type === 'success' ? "request-success-message" : "notification-message"} className={`fixed top-4 md:top-8 left-1/2 transform -translate-x-1/2 z-[100] px-4
                                    py-3 md:px-8 md:py-5 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex
                                    items-center justify-between w-[90%] max-w-lg md:w-auto md:min-w-[350px]
                                    animate-fade-in border-2 ${notification.type === 'error'
                        ? 'bg-red-600 border-red-400 ring-4 ring-red-600/30'
                        : 'bg-green-600 border-green-400 ring-4 ring-green-600/30'}`}>
                    <div className="flex items-center text-white min-w-0">
                        {notification.type === 'error' ?
                            <AlertCircle className="mr-3 md:mr-4 flex-shrink-0" size={24} /> :
                            <CheckCircle className="mr-3 md:mr-4 flex-shrink-0" size={24} />}
                        <span
                            className="font-bold text-sm md:text-lg shadow-sm truncate">{notification.message}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-1.5 rounded-full flex-shrink-0">
                        <X size={18} />
                    </button>
                </div>
            )}

            <header
                className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <Activity className="text-blue-600" size={24} />
                    <h1 className="text-xl font-bold text-blue-700 tracking-tight">CEIC</h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
            </header>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in" onClick={() =>
                    setIsMobileMenuOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 w-64
                                        z-50 flex flex-col transform transition-transform duration-300 ease-in-out
                                        md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl'
                    : '-translate-x-full'}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-blue-700 tracking-tight">CEIC
                            <span className="text-gray-400 font-light">v2.0</span></h1>
                        <p
                            className="text-xs text-gray-400 mt-1 uppercase tracking-wider font-bold">
                            {userProfile.role}</p>

                        {userProfile && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-sm font-bold text-blue-800">
                                    {userProfile.login}
                                </p>
                                <p className="text-xs font-medium text-gray-600 truncate" title={userProfile.nome || userProfile.name}>
                                    {userProfile.nome || userProfile.name}
                                </p>
                            </div>
                        )}
                    </div>
                    <button className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
                        onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto space-y-1">
                    {SIDEBAR_ITEMS.filter(item =>
                        item.roles.includes(userProfile.role)).map(item => {
                            const IconComponent = item.icon;
                            return (
                                <button key={item.id} data-testid={item.testId} onClick={() => handleNavClick(item.id)}
                                    className={`flex items-center w-full p-3 rounded-xl mb-1 transition-all
                                                duration-200 group ${currentView === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}`}>
                                    <IconComponent size={22} className={currentView === item.id ? ''
                                        : 'opacity-70 group-hover:opacity-100'} />
                                    <span className="ml-3 font-medium">{item.label}</span>
                                </button>
                            )
                        })}
                </nav>

                <div className="p-4 border-t border-gray-100"><button data-testid="logout-button" onClick={handleLogout}
                    className="flex items-center w-full p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                    <LogOut size={20} className="mr-3" /> Sair
                </button></div>
            </aside >

            <main
                className="md:ml-64 p-4 sm:p-6 md:p-8 min-h-[calc(100vh-64px)] md:min-h-screen flex-1 min-w-0 w-full md:w-auto overflow-x-hidden">
                {currentView === 'admin_dashboard' &&
                    <AdminDashboard inventory={inventory} requests={requests} />}
                {currentView === 'admin_indicadores' &&
                    <AdminIndicators inventory={inventory} requests={requests} />}
                {currentView === 'admin_transporte' &&
                    <AdminTransportIndicators requests={requests} />}
                {currentView === 'admin_frota' &&
                    <AdminFleetCRUD inventory={inventory} onAdd={handleAddEquipment}
                        onEdit={handleEditEquipment} onDelete={handleDeleteEquipment}
                        showNotification={showNotification} />}
                {currentView === 'admin_ocorrencias' &&
                    <AdminOcorrencias inventory={inventory}
                        onUpdateNotification={handleUpdateNotification}
                        onUpdateServiceRequest={handleUpdateServiceRequest}
                        showNotification={showNotification} />}
                {currentView === 'admin_preventiva' &&
                    <AdminPreventivaView inventory={inventory} onSchedule={handleSchedulePreventive}
                        onSegregate={handleSegregatePreventive}
                        onComplete={handleCompletePreventive} />}
                {currentView === 'admin_remanejamento' &&
                    <AdminRemanejamento inventory={inventory} onRemanejamento={handleRemanejamento}
                        showNotification={showNotification} unidades={unidades} />}
                {currentView === 'admin_entrega_ativa' && <AdminEntregaWrapper
                    onCreateRequest={handleCreateRequest} showNotification={showNotification}
                    onBack={() => setCurrentView('admin_dashboard')} adminProfile={userProfile} equipmentCatalog={equipmentCatalog} ventilatoryCatalog={ventilatoryCatalog} generalCatalog={generalCatalog} transportCatalog={transportCatalog} fullCatalog={fullCatalog}
                />}

                {currentView === 'dashboard' &&
                    <OperatorDashboard requests={requests} inventory={inventory}
                        onViewChange={setCurrentView} onFulfill={handleFulfillRequest}
                        showNotification={showNotification}
                        onProcessPickup={handleProcessPickup}
                        onCancelRequest={handleCancelRequest}
                        onNotifyRequester={handleNotifyRequester}
                        onUpdateTransportTimes={handleUpdateTransportTimes} soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} />}
                {currentView === 'triagem' &&
                    <ReturnView inventory={inventory} onReturnByTag={handleReturnByTag}
                        showNotification={showNotification} initialData={triageData} />}
                {currentView === 'manutencao' &&
                    <CleaningView inventory={inventory} onRelease={handleReleaseItem} />}
                {currentView === 'reparo' && <MaintenanceView inventory={inventory}
                    onReturn={handleReturnFromMaintenance}
                    showNotification={showNotification} onBack={() =>
                        setCurrentView('dashboard')} />}
                {currentView === 'estoque' &&
                    <InventoryViewV2 inventory={inventory} />}

                {currentView === 'nova_solicitacao' && <NewRequestForm
                    onCreateRequest={handleCreateRequest}
                    showNotification={showNotification} sectorSelo={userProfile.sector}
                    onBack={() => setCurrentView('meus_pedidos')} equipmentCatalog={equipmentCatalog} ventilatoryCatalog={ventilatoryCatalog} generalCatalog={generalCatalog} transportCatalog={transportCatalog} fullCatalog={fullCatalog} />}
                {currentView === 'meus_pedidos' && <MyRequestsView
                    requests={mySectorPendingRequests} sector={userProfile.sector}
                    inventory={inventory} userProfile={userProfile}
                    onBack={() => setCurrentView('nova_solicitacao')}
                    onCancel={handleCancelRequest}
                    onWaitlist={handleWaitlistRequester}
                    onConfirmTransfer={handleConfirmTransfer}
                    showNotification={showNotification} />}
                {currentView === 'equipamentos_area' && (
                    <MyAreaEquipmentView inventory={inventory}
                        sector={userProfile.sector}
                        userProfile={userProfile}
                        requests={requests}
                        onRequestPickup={handleRequestPickup}
                        onTransferEquipment={handleTransferEquipment}
                        onConfirmTransfer={handleConfirmTransfer}
                        onConfirmReceipt={handleConfirmReceipt}
                        showNotification={showNotification} onBack={() =>
                            setCurrentView('meus_pedidos')}
                    />
                )}
                {currentView === 'admin_users' && <AdminUsersView onLogout={handleLogout} />}
            </main>
        </div >
    );
}






export default App;

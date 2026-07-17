import { supabase } from './supabaseClient';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    LayoutDashboard, Package, AlertTriangle, Activity, Settings, Tag, ArrowUpRight,
    ArrowDownLeft, User, Clock, LogOut, SprayCan, ClipboardList, Siren, CheckCircle,
    AlertCircle, Search, BadgeCheck, PlusCircle, List, MapPin, X, Send, ChevronDown,
    ChevronUp, XCircle, Menu, Wrench, BarChart3, Database, Edit, Trash2, LineChart,
    Volume2, VolumeX, Truck, CalendarClock, Eye, EyeOff, ChevronLeft, ChevronRight, ArrowRight,
    HelpCircle, LifeBuoy, UserPlus, Briefcase, PackageOpen
} from 'lucide-react';
import logoCeic from './assets/logo-ceic.png';

// =========================================================
// BANCO DE DADOS FIXO E CONSTANTES GERAIS
// =========================================================

// Definição de constantes e opções estáticas do sistema (perfil de usuários, setores, etc).
const ROLES = { OPERATOR: 'Equipe Operacional', REQUESTER: 'Equipe Assistencial', ADMINISTRATOR: 'Gestão / Liderança' };
const LOCATIONS = ['03DN', '03DS', '04GN', '04GS', '04CC', '04DN', '04DS', 'Centro Cirúrgico'];

const SIDEBAR_ITEMS = [
    { id: 'admin_dashboard', label: 'Painel Gerencial', icon: BarChart3, roles: ['GESTAO', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Gerencial', testId: 'nav-gestao' },
    { id: 'admin_indicadores', label: 'Indicadores', icon: LineChart, roles: ['GESTAO', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Gerencial', testId: 'nav-relatorios' },
    { id: 'admin_frota', label: 'Gestão da Frota', icon: Database, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Gerencial', testId: 'nav-equipamentos' },
    { id: 'admin_ocorrencias', label: 'Gestão de Ocorrências', icon: AlertTriangle, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Gerencial' },
    { id: 'admin_preventiva', label: 'Plano de Preventivas', icon: CalendarClock, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Gerencial' },
    { id: 'admin_remanejamento', label: 'Remanejamento', icon: Send, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Gerencial' },
    { id: 'admin_entrega_ativa', label: 'Entrega Ativa', icon: Truck, roles: ['ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Gerencial' },
    { id: 'dashboard', label: 'Dashboard Geral', icon: LayoutDashboard, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Operacional', testId: 'nav-dashboard-operacional' },
    { id: 'estoque', label: 'Estoque Central', icon: Package, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Operacional' },
    { id: 'triagem', label: 'Triagem / Devolução', icon: ClipboardList, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Operacional', testId: 'nav-triagem' },
    { id: 'manutencao', label: 'Higienização / Limpeza', icon: SprayCan, roles: ['OPERACIONAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Operacional', testId: 'nav-expurgo' },
    { id: 'nova_solicitacao', label: 'Nova Solicitação', icon: PlusCircle, roles: ['ASSISTENCIAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Assistencial', testId: 'nav-nova-solicitacao' },
    { id: 'meus_pedidos', label: 'Meus Pedidos', icon: List, roles: ['ASSISTENCIAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Assistencial', testId: 'nav-meus-pedidos' },
    { id: 'equipamentos_area', label: 'Equipamentos do Setor', icon: MapPin, roles: ['ASSISTENCIAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Assistencial' },
    { id: 'admin_users', label: 'Gestão de Utilizadores', icon: User, roles: ['ADMIN', 'GERENCIAL'], group: 'Sistema e Suporte' },
    { id: 'admin_plantonistas', label: 'Autorizações de Plantão', icon: UserPlus, roles: ['GESTAO', 'ADMIN', 'GERENCIAL'], group: 'Sistema e Suporte' },
    { id: 'admin_suporte', label: 'Chamados de Suporte', icon: LifeBuoy, roles: ['ADMIN', 'GESTAO', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Sistema e Suporte' },
    { id: 'suporte_tecnico', label: 'Suporte Técnico', icon: HelpCircle, roles: ['OPERACIONAL', 'ASSISTENCIAL', 'ADMIN', 'TESTE', 'ADMIN_TESTE', 'GERENCIAL'], group: 'Sistema e Suporte' },
];

const CHECKLIST_OPTIONS = { "Monitor de Pressão Intracraniana (PIC)": ["Apenas Kit: Módulo + Cabo", "Maleta completa: Monitor + cabo + módulo + cabos + fonte + Suporte"] };

const PATIENT_DB = {}; // Se não existir um banco local de pacientes, inicie vazio para evitar o erro.

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

};

const TEV_INDICATIONS = {
    'Perioperatório': [
        { group: 'Indicação Absoluta', items: ['Neurocirurgia (NCR)', 'Politrauma'] },
        { group: 'Alto Risco (Requer Caprini > 4)', items: ['Cirurgia ortopédica de grande porte', 'Cirurgia oncológica', 'Contraindicação à profilaxia farmacológica', 'Mobilidade reduzida ou imobilidade prolongada', 'Cirurgia com tempo de duração ≥ 120 minutos'] }
    ],
    'Obstétrica': [
        { group: 'Critério Fixo', items: ['Gestação Múltipla'] },
        { group: 'Intraoperatório (Centro Obstétrico)', items: ['Cirurgia fetal intraútero', 'Cirurgia com previsão de duração > 2 horas', 'Placenta prévia / acretismo', 'Alto risco de perda sanguínea / politransfusão', 'Instabilidade hemodinâmica'] },
        { group: 'Internação / Puerpério', items: ['Escore ≥ 3 associado a contraindicação farmacológica, pausa cirúrgica, ou janela de 12h pré-medicação', 'Escore 2 + Restrição ao leito', 'Escore 2 + Aguardando deambulação (até 8h)'] }
    ]
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
        patientName: trimText(raw.patient_name || raw.patientName || raw.patientname || raw.nome_paciente || 'Não Informado'),
        patient_mv: trimText(raw.patient_mv || raw.patient_mv || raw.patientmv || raw.mv || raw.registro_mv || '000000'),
        patientBed: trimText(raw.patient_bed || raw.patientBed || raw.patientbed || raw.leito || ''),
        requesterName: trimText(raw.requester_name || raw.requesterName || raw.requestername || raw.solicitante || 'ANÔNIMO'),
        requesterBadge: trimText(raw.requester_badge || raw.requesterBadge || raw.requesterbadge || raw.matricula || '00000'),
        requester_ramal: raw.requester_ramal || raw.requesterRamal || '',
        problem_reported: raw.problem_reported || false,
        problem_description: trimText(raw.problem_description || ''),
        accessories: Array.isArray(raw.accessories) ? raw.accessories : (raw.accessories ? [raw.accessories] : []),
        isUrgent: !!(raw.is_urgent || raw.isUrgent || raw.isurgent),
        isWaitlisted: !!(raw.is_waitlisted || raw.isWaitlisted || raw.iswaitlisted || raw.status === 'waitlisted'),
        waitlistTime: raw.waitlist_time || raw.waitlistTime || raw.waitlisttime || null,
        extension: raw.extension || '-',
        notificationMessage: raw.notification_message || raw.notificationMessage || raw.notificationmessage || null,
        notificationType: raw.notification_type || raw.notificationType || raw.notificationtype || null,
        notificationTime: raw.notification_time || raw.notificationTime || raw.notificationtime || null,
        fulfilledAt: raw.fulfilled_at || raw.fulfilledAt || raw.fulfilledat || null,
        transfer_to: raw.transfer_to || raw.transferTo || raw.transferto || null,
        timestamp: raw.timestamp || raw.created_at || raw.createdAt || raw.createdat || null,
        catalogo_equipamentos: raw.catalogo_equipamentos || null,
        cancelName: raw.cancel_name || raw.cancelName || raw.cancelname || null,
        cancelBadge: raw.cancel_badge || raw.cancelBadge || raw.cancelbadge || null,
        cancelReason: raw.cancel_reason || raw.cancelReason || raw.cancelreason || null,
        tevPriority: raw.tev_priority != null ? Number(raw.tev_priority) : (raw.tevPriority != null ? Number(raw.tevPriority) : null),
        tevGroup: raw.tev_group || raw.tevGroup || null
    };
};

const mapEquip = (raw) => {
    if (!raw) return null;
    const location = trimText(raw.location || raw.Location || 'CEIC');
    const model = trimText(raw.model || raw.Model || '');
    const specificLocation = trimText(raw.specific_location || raw.specificLocation || raw.specificlocation || raw.SpecificLocation || '');
    const transferTo = trimText(raw.transfer_to || raw.transferTo || raw.transferto || '');
    const transferToBed = trimText(raw.transfer_to_bed || raw.transferToBed || raw.transfertobed || '');
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
        patientName: trimText(raw.patient_name || raw.patientName || raw.patientname || ''),
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
        unitNotified: raw.unitNotified ?? raw.unitnotified ?? false,
        patientDamage: raw.patientDamage ?? raw.patientdamage ?? false,
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
        available: { label: 'Disponível', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
        allocated: { label: 'Em Uso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        in_use: { label: 'Em Uso', color: 'bg-blue-100 text-blue-800 border-blue-200' },
        maintenance: { label: 'Manutenção', color: 'bg-red-100 text-red-800 border-red-200' },
        cleaning: { label: 'Higienização', color: 'bg-amber-100 text-amber-800 border-amber-200' },
        preventive: { label: 'Ag. Preventiva', color: 'bg-purple-100 text-purple-800 border-purple-200' },
        irregular: { label: 'Irregular', color: 'bg-orange-100 text-orange-800 border-orange-200' },
        inactive: { label: 'Inativo', color: 'bg-slate-100 text-slate-500 border-slate-200' }
    };

    const current = config[status] || config.available;

    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${current.color}`}>
            {current.label}
        </span>
    );
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
    const [dropDirection, setDropDirection] = useState('down');
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => { if (ref.current && !ref.current.contains(event.target)) setIsOpen(false); };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            // If less than 260px space below AND enough space above, open upwards
            if (window.innerHeight - rect.bottom < 260 && rect.top > 260) {
                setDropDirection('up');
            } else {
                setDropDirection('down');
            }
        }
    }, [isOpen]);

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
                    className={`absolute z-[9999] w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden animate-fade-in ${dropDirection === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'}`}>
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

            // Verifica se é um usuário temporário e se expirou
            if (data.expires_at) {
                const now = new Date();
                const expiresAt = new Date(data.expires_at);
                if (now > expiresAt) {
                    showNotification('error', 'Seu login temporário expirou. Realize um novo cadastro.');
                    setIsLoading(false);
                    return;
                }
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

    const [isPlantonistaModalOpen, setIsPlantonistaModalOpen] = useState(false);
    const [planNome, setPlanNome] = useState('');
    const [planMatricula, setPlanMatricula] = useState('');
    const [planEmail, setPlanEmail] = useState('');
    const [planSenha, setPlanSenha] = useState('');
    const [planIsLoading, setPlanIsLoading] = useState(false);

    const handlePlantonistaRegister = async (e) => {
        e.preventDefault();
        setPlanIsLoading(true);
        
        try {
            const matricula = planMatricula.trim();
            const nome = planNome.trim();
            const email = planEmail.trim();
            const senha = planSenha.trim();

            if (!matricula || !nome || !email || !senha) {
                showNotification('error', 'Preencha todos os campos.');
                setPlanIsLoading(false);
                return;
            }

            if (!/^\d{4}$/.test(senha)) {
                showNotification('error', 'A senha deve conter exatamente 4 números.');
                setPlanIsLoading(false);
                return;
            }

            // 0. Verifica a Lista Branca
            const { data: authUser, error: authError } = await supabase
                .from('ceic_plantonistas_autorizados')
                .select('id')
                .eq('matricula', matricula)
                .ilike('email', email)
                .maybeSingle();
            
            if (authError || !authUser) {
                showNotification('error', 'Acesso negado. Matrícula ou e-mail não constam na lista de autorizados.');
                setPlanIsLoading(false);
                return;
            }

            // 1. Verifica se já existe o usuário (upsert manual se login for unique)
            const { data: existingUser } = await supabase
                .from('ceic_usuarios')
                .select('id')
                .eq('login', matricula)
                .maybeSingle();

            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 12);
            const expiresAtIso = expiresAt.toISOString();

            if (existingUser) {
                const { error: updateError } = await supabase
                    .from('ceic_usuarios')
                    .update({ 
                        expires_at: expiresAtIso, 
                        senha: senha,
                        nome: nome 
                    })
                    .eq('login', matricula);
                if (updateError) throw updateError;
            } else {
                const { error: insertError } = await supabase
                    .from('ceic_usuarios')
                    .insert([{
                        login: matricula,
                        senha: senha,
                        nome: nome,
                        matricula: matricula,
                        perfil: 'OPERACIONAL',
                        setor_nome: 'CEIC',
                        expires_at: expiresAtIso
                    }]);
                if (insertError) throw insertError;
            }

            // 2. Registra no histórico de plantões
            const { error: histError } = await supabase
                .from('ceic_historico_plantoes')
                .insert([{
                    matricula: matricula,
                    nome: nome,
                    inicio_plantao: new Date().toISOString(),
                    fim_plantao: expiresAtIso
                }]);
            
            if (histError) console.error("Falha ao registrar histórico do plantão", histError);

            showNotification('success', 'Plantão registrado com sucesso! Validade de 12 horas. Faça o login.');
            setLoginStr(matricula);
            setPasswordStr(senha);
            setIsPlantonistaModalOpen(false);
            setPlanNome('');
            setPlanMatricula('');
            setPlanEmail('');
            setPlanSenha('');
        } catch (err) {
            console.error(err);
            showNotification('error', 'Erro ao cadastrar plantão. Verifique sua conexão.');
        } finally {
            setPlanIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
                {/* CABEÇALHO DO LOGIN ATUALIZADO */}
                <div className="flex flex-col items-center mb-8 text-center">
                    <img 
                        src={logoCeic} 
                        alt="Logo CEIC Instituto Central" 
                        className="h-28 w-auto object-contain mb-4 drop-shadow-sm" 
                    />
                    {/* Opcional: Você pode manter ou remover o texto abaixo, já que o logo já diz CEIC */}
                    <h2 className="text-xl font-bold text-gray-800">Acesso ao Sistema</h2>
                </div>

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

                <div className="mt-6 border-t border-gray-100 pt-4">
                    <button 
                        type="button" 
                        onClick={() => setIsPlantonistaModalOpen(true)}
                        className="text-xs text-gray-400 hover:text-blue-500 hover:underline transition-colors focus:outline-none"
                    >
                        Acesso Perfil Operacional
                    </button>
                </div>
            </div>

            {isPlantonistaModalOpen && createPortal(
                <div className="modal-overlay">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in relative max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
                            <h3 className="text-lg font-bold text-gray-800">Cadastro de Plantão (12h)</h3>
                            <button onClick={() => setIsPlantonistaModalOpen(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mb-4">Este acesso é exclusivo para plantonistas eventuais do perfil Operacional e expirará automaticamente após 12 horas.</p>
                        
                        <form onSubmit={handlePlantonistaRegister} className="space-y-4" autoComplete="off">
                            <div>
                                <label className="label">Nome Completo</label>
                                <input type="text" className="input" value={planNome} onChange={e => setPlanNome(e.target.value)} required placeholder="" autoComplete="new-password" />
                            </div>
                            <div>
                                <label className="label">Matrícula (Seu Login)</label>
                                <input type="text" className="input" value={planMatricula} onChange={e => setPlanMatricula(e.target.value)} required placeholder="" autoComplete="new-password" />
                            </div>
                            <div>
                                <label className="label">E-mail Corporativo</label>
                                <input type="email" className="input" value={planEmail} onChange={e => setPlanEmail(e.target.value)} required placeholder="" autoComplete="new-password" />
                            </div>
                            <div>
                                <label className="label">Senha <span className="text-gray-400 font-normal text-xs ml-1">(senha de 4 números)</span></label>
                                <input type="password" inputMode="numeric" maxLength={4} className="input" value={planSenha} onChange={e => setPlanSenha(e.target.value.replace(/\D/g, '').slice(0, 4))} required placeholder="" autoComplete="new-password" />
                            </div>
                            <button type="submit" disabled={planIsLoading} className="btn-primary w-full mt-2">
                                {planIsLoading ? 'Registrando...' : 'Confirmar Plantão'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}
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

const OperatorDashboard = ({ requests, inventory, onViewChange, onFulfill, showNotification, onProcessPickup,
    onCancelRequest, onNotifyRequester, soundEnabled, setSoundEnabled }) => {
    const [filter, setFilter] = useState('all');
    // (fix) soundEnabled vem do App via props
    const pending = requests.filter(r => {
        // Ignorar pedidos que são transferências de remanejamento (possuem transfer_to definido)
        if (r.status === 'in_transfer' && r.transfer_to) return false;
        
        if (r.status === 'pending' || r.status === 'waitlisted' || r.status === 'pickup_requested' || r.status === 'in_transfer') return true;
        return false;
    });

    const isFirstRender = useRef(true);
    const prevSeenIds = useRef(new Set());

    const playNotificationSound = () => {
        try {
            // Disparar popup do sistema operacional (Browser Notification)
            if ("Notification" in window && Notification.permission === "granted") {
                try {
                    new Notification("Novo Pedido na CEIC", { 
                        body: "Há um novo pedido pendente no dashboard.",
                        icon: logoCeic 
                    });
                } catch (e) {
                    if (DEBUG_LOGS) console.log("Erro ao emitir Notification", e);
                }
            }

            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return;
            const ctx = new AudioCtx();
            
            // Toca um beep duplo rápido
            const playBeep = (freq, startTime, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
                
                gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
                
                osc.start(ctx.currentTime + startTime);
                osc.stop(ctx.currentTime + startTime + duration);
            };

            playBeep(880, 0, 0.2); // Nota A5
            playBeep(1046.50, 0.2, 0.4); // Nota C6
        } catch (err) {
            if (DEBUG_LOGS) console.log("Áudio bloqueado ou falhou", err);
        }
    };

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            prevSeenIds.current = new Set(pending.map(p => p.id));
            return;
        }

        const currentIds = new Set(pending.map(p => p.id));
        let hasNew = false;

        for (const id of currentIds) {
            if (!prevSeenIds.current.has(id)) {
                hasNew = true;
                break;
            }
        }

        if (hasNew && soundEnabled) {
            playNotificationSound();
        }

        prevSeenIds.current = currentIds;
    }, [pending, soundEnabled]);

    const urgentCount = pending.filter(r => r.isUrgent).length;
    const cleaningCount = inventory.filter(i => i.status === 'cleaning').length;
    const maintenanceCount = inventory.filter(i => i.status === 'maintenance').length;

    const filteredPending = pending.filter(r => filter === 'all' || (filter === 'urgent' && r.isUrgent));

    const sortedFilteredPending = useMemo(() => {
        let items = [...filteredPending];
        const nonTevItems = [];
        const tevItemsByPriority = { 1: [], 2: [], 3: [], 4: [] };
        
        items.forEach(req => {
            if (req.tevPriority != null) {
                const p = req.tevPriority;
                if (!tevItemsByPriority[p]) tevItemsByPriority[p] = [];
                tevItemsByPriority[p].push(req);
            } else {
                nonTevItems.push(req);
            }
        });
        
        const sortedTevItems = [];
        [1, 2, 3, 4].forEach(p => {
            let pItems = tevItemsByPriority[p];
            if (pItems && pItems.length > 0) {
                const groups = { 'Clínico': [], 'Cirúrgico': [], 'Perioperatório': [], 'Obstétrica': [], 'Outros': [] };
                pItems.forEach(r => {
                    const g = r.tevGroup || 'Outros';
                    if (groups[g]) groups[g].push(r);
                    else groups['Outros'].push(r);
                });
                Object.keys(groups).forEach(g => {
                    groups[g].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                });
                const order = ['Clínico', 'Cirúrgico', 'Perioperatório', 'Obstétrica', 'Outros'];
                let added = true;
                while (added) {
                    added = false;
                    order.forEach(g => {
                        if (groups[g].length > 0) {
                            sortedTevItems.push(groups[g].shift());
                            added = true;
                        }
                    });
                }
            }
        });
        
        return items.sort((a, b) => {
             const getWeight = (req) => {
                 if (req.isUrgent) return 100;
                 if (req.tevPriority === 1) return 90;
                 if (req.tevPriority === 2) return 80;
                 if (req.tevPriority === 3) return 70;
                 if (req.tevPriority === 4) return 60;
                 return 50;
             };
             const wA = getWeight(a);
             const wB = getWeight(b);
             if (wA !== wB) return wB - wA;
             if (a.tevPriority != null && b.tevPriority != null && a.tevPriority === b.tevPriority) {
                 return sortedTevItems.indexOf(a) - sortedTevItems.indexOf(b);
             }
             return new Date(a.timestamp) - new Date(b.timestamp);
        });
    }, [filteredPending]);

    const inTransitEquipments = inventory.filter(i => i.transferStatus === 'in_transit');

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
                        sortedFilteredPending.map(req => (
                            <PendingRequestCard key={req.id} req={req} inventory={inventory} onFulfill={onFulfill}
                                showNotification={showNotification} onProcessPickup={onProcessPickup} onCancel={onCancelRequest}
                                onNotifyRequester={onNotifyRequester} />
                        ))
                    }
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-visible">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-700 flex items-center">
                        <Truck className="mr-2" size={20} /> Equipamentos em Trânsito
                    </h3>
                    <span className="text-xs text-gray-500">{inTransitEquipments.length} em trânsito</span>
                </div>
                <div className="divide-y divide-gray-100 p-4 space-y-3">
                    {inTransitEquipments.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">Nenhum equipamento em trânsito no momento.</div>
                    ) : (
                        inTransitEquipments.map(item => (
                            <div key={item.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-blue-800">{item.type || item.model || 'Equipamento'} - {item.tag}</span>
                                    <span className="text-xs text-gray-600 mt-1">De: <strong>{item.location}</strong> ➔ Para: <strong>{item.transferTo}{item.transferToBed ? ` (${item.transferToBed})` : ''}</strong></span>
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-1 rounded w-fit">Aguardando Recebimento</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Componente: Card de Pedido da fila operacional.
const PendingRequestCard = ({ req, inventory, onFulfill, showNotification, onProcessPickup, onCancel,
    onNotifyRequester }) => {
    const [typedTag, setTypedTag] = useState('');
    const [multiTags, setMultiTags] = useState({});
    const [isCancelling, setIsCancelling] = useState(false);
    const [isNotifying, setIsNotifying] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelName, setCancelName] = useState('');
    const [cancelBadge, setCancelBadge] = useState('');



    const [availableTags, setAvailableTags] = useState([]);

    const isCapnografia = normUpper(req.equipmentType) === 'MODULO DE CAPNOGRAFIA + CABO' || normUpper(req.equipmentType) === 'MODULO DE CAPNOGRAFIA';
    const isAltoFluxo = normUpper(req.equipmentType) === 'ALTO FLUXO';
    const isInvasivo = normUpper(req.equipmentType) === 'VENTILADOR PULMONAR INVASIVO';
    const isMultiTag = isCapnografia || isAltoFluxo || isInvasivo;
    
    let multiTagItemsList = [];
    if (isCapnografia) multiTagItemsList = ['MÓDULO DE CAPNOGRAFIA', 'CABO DE CAPNOGRAFIA', 'CÉLULA DE CAPNOGRAFIA'];
    if (isAltoFluxo) multiTagItemsList = ['ALTO FLUXO', 'UMIDIFICADOR'];
    if (isInvasivo) {
        multiTagItemsList = ['VENTILADOR PULMONAR INVASIVO', 'CASSETE EXPIRATÓRIO'];
        const hasUmidificacaoAtiva = Array.isArray(req.accessories) && req.accessories.some(a => String(a || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes('UMIDIFICACAO ATIVA'));
        if (hasUmidificacaoAtiva) multiTagItemsList.push('UMIDIFICADOR');
    }
    

    useEffect(() => {
        if (!req.equipmentType || req.kind === 'return_pickup') return;

        const equipmentsToSearch = isMultiTag ? multiTagItemsList.map(normUpper) : [normUpper(req.equipmentType)];
        const matchingInventory = (inventory || []).filter(item => item.status === 'available' && equipmentsToSearch.includes(normUpper(item.type)));

        if (isMultiTag) {
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
        if (isMultiTag) {
            const enteredTags = [];
            for (const item of multiTagItemsList) {
                const t = (multiTags[item] || '').trim().toUpperCase();
                if (!t) {
                    showNotification('error', `Por favor, informe a TAG para "${item}".`);
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
            if (!tag) { showNotification('error', 'Por favor, informe a TAG.'); return; }
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
        : req.isWaitlisted
            ? 'bg-orange-50 border-l-4 border-orange-500'
            : 'hover:bg-blue-50 border-b border-gray-100';

    let timerVariantOp = 'pending';
    if (req.isWaitlisted) timerVariantOp = 'waitlist_op';
    else if (req.notificationTime) timerVariantOp = 'notified_op';

    if (DEBUG_LOGS) console.log('Filtro Estoque -> Pedido:', req.equipmentType, 'Total no Inventory:', inventory?.length);

    if (req.kind === 'return_pickup') {
        return (
            <>
                <div className={`p-4 transition-colors ${baseStyle}`} data-testid="pending-request-card">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center flex-wrap gap-2">
                            <span className="text-sm font-bold text-gray-800">{req.equipmentType}</span>
                            {req.equipmentTag && (
                                <span className="font-mono font-bold bg-white px-2 py-0.5 text-xs text-gray-700 border border-gray-300 rounded shadow-sm">
                                    {req.equipmentTag}
                                </span>
                            )}
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
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="col-span-2">
                            <span className="font-semibold">Setor:</span> {req.sector || req.unit || '-'} 
                            <span className="ml-2 font-bold text-blue-700">(R: {req.requester_ramal || req.extension || '-'})</span>
                        </div>
                        <div>
                            <span className="font-semibold">Solicitante:</span> {req.requester_name || req.requesterName || '-'}
                        </div>
                        <div>
                            <span className="font-semibold">Matrícula:</span> {req.requester_badge || req.requesterBadge || '-'}
                        </div>
                        <div>
                            <span className="font-semibold">Paciente:</span> {req.patient_name || req.patientName || '-'}
                        </div>
                        <div>
                            <span className="font-semibold">Leito:</span> {req.patient_bed || req.patientBed || '-'}
                        </div>
                        <div className="col-span-2">
                            <span className="font-semibold">MV:</span> <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{req.patient_mv || '000000'}</span>
                        </div>
                        <div className="col-span-2 mt-1 bg-gray-50 p-2 rounded border border-gray-100">
                            <p><span className="font-semibold">TAG a Recolher:</span> <span
                                className="font-mono font-bold bg-white px-1 border rounded">{req.equipmentTag}</span></p>
                        </div>
                    </div>
                    {(req.problem_reported === true || req.problem_reported === 'true') && (
                        <div className="mt-2 mb-3 bg-red-50 border border-red-200 text-red-700 p-2 rounded text-sm flex flex-col">
                            <span className="font-bold flex items-center gap-1">
                                ⚠️ Atenção: Equipamento com Defeito
                            </span>
                            <span className="italic mt-1 text-xs">{req.problem_description || 'Nenhuma descrição fornecida.'}</span>
                        </div>
                    )}
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
                        <span className="text-sm font-bold text-gray-800">{req.equipmentType}</span>
                        {req.equipmentTag && (
                            <span className="font-mono font-bold bg-white px-2 py-0.5 text-xs text-gray-700 border border-gray-300 rounded shadow-sm">
                                {req.equipmentTag}
                            </span>
                        )}
                        <span
                            className="text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded"
                            title="Prazo SLA">{getSlaInfo(req).label}</span>
                        {req.isWaitlisted && <span
                            className="text-xs font-bold bg-orange-200 text-orange-800 border border-orange-300 px-2 py-1 rounded">FILA
                            DE ESPERA</span>}
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
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3 mt-2">
                    <div className="col-span-2">
                        <span className="font-semibold">Setor:</span> {req.sector || req.unit || '-'} 
                        <span className="ml-2 font-bold text-blue-700">(R: {req.requester_ramal || req.extension || '-'})</span>
                    </div>
                    <div>
                        <span className="font-semibold">Solicitante:</span> {req.requester_name || req.requesterName || '-'}
                    </div>
                    <div>
                        <span className="font-semibold">Matrícula:</span> {req.requester_badge || req.requesterBadge || '-'}
                    </div>
                    <div>
                        <span className="font-semibold">Paciente:</span> {req.patient_name || req.patientName || '-'}
                    </div>
                    <div>
                        <span className="font-semibold">Leito:</span> {req.patient_bed || req.patientBed || '-'}
                    </div>
                    <div className="col-span-2">
                        <span className="font-semibold">MV:</span> <span className="font-mono bg-gray-100 px-1 py-0.5 rounded text-xs">{req.patient_mv || '000000'}</span>
                    </div>
                    {req.accessories && req.accessories.length > 0 && <div className="col-span-2"><span className="font-semibold">Detalhes:</span> {req.accessories.join(', ')}</div>}
                </div>

                {(req.kind === 'recolhimento' || req.kind === 'return_pickup') && (req.problem_reported === true || req.problem_reported === 'true') && (
                    <div className="mt-2 mb-3 bg-red-50 border border-red-200 text-red-700 p-2 rounded text-sm flex flex-col">
                        <span className="font-bold flex items-center gap-1">
                            ⚠️ Atenção: Equipamento com Defeito
                        </span>
                        <span className="italic mt-1 text-xs">{req.problem_description || 'Nenhuma descrição fornecida.'}</span>
                    </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-100">

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
                            {req.kind !== 'recolhimento' && req.status !== 'in_transfer' && (
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-xs font-bold text-gray-500 uppercase">Ações Operacionais</p>
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setIsNotifying(true)} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
                                            <Send size={14} /> Notificar
                                        </button>
                                        <button data-testid="cancel-request-button" onClick={() => setIsCancelling(true)} className="text-xs font-bold text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">Cancelar</button>
                                    </div>
                                </div>
                            )}
                            <div className="flex flex-col gap-2">
                                <div className="flex-1">
                                    {req.status === 'in_transfer' ? (
                                        <div className="bg-green-50 border border-green-200 text-green-900 p-4 rounded-xl text-sm shadow-sm flex items-center gap-3">
                                            <Send size={18} className="animate-pulse text-green-600" />
                                            <div>
                                                <p className="font-bold">Equipamento Alocado</p>
                                                <p className="text-xs opacity-80">Aguardando confirmação de recebimento na unidade destino.</p>
                                            </div>
                                        </div>
                                    ) : req.status === 'pickup_requested' ? (
                                        <button onClick={() => onProcessPickup(req)} className="w-full h-[44px] px-4 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 flex items-center justify-center shadow-sm">
                                            <ClipboardList size={18} className="mr-2" /> Devolução/Triagem
                                        </button>
                                    ) : String(req.equipmentType || '').trim().toUpperCase() === 'APENAS ACESSÓRIOS' || String(req.equipmentType || '').trim().toUpperCase() === 'APENAS ACESSORIOS' ? (
                                        <button onClick={() => onFulfill(req, 'ACESSORIOS')} className="w-full h-[44px] px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex items-center justify-center shadow-sm">
                                            <BadgeCheck size={18} className="mr-2" /> Concluir Entrega de Acessórios
                                        </button>
                                    ) : isMultiTag ? (
                                        <div className="flex flex-col gap-3">
                                            {multiTagItemsList.map((item, idx) => (
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
                                                            options={(availableTags[normUpper(item)] || []).filter(Boolean).map(t => ({ value: t, label: t }))}
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

    const getStatusLabel = (status) => {
        const config = { available: 'Disponível', in_use: 'Em Uso', allocated: 'Em Uso', maintenance: 'Manutenção', cleaning: 'Higienização', preventive: 'Ag. Preventiva', irregular: 'Irregular', inactive: 'Inativo' };
        return config[status] || 'Disponível';
    };

    const types = useMemo(() => Array.from(new Set((inventory || []).filter(item => item.status !== 'inactive').map(item => item.type || 'OUTROS'))).sort(), [inventory]);
    const locations = useMemo(() => Array.from(new Set((inventory || []).filter(item => item.status !== 'inactive').map(item => trimText(item.location)).filter(Boolean))).sort(), [inventory]);

    const filteredItems = useMemo(() => {
        return (inventory || [])
            .filter(item => item.status !== 'inactive')
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
            STATUS: getStatusLabel(item.status), // AGORA USA O STATUS REAL
            LOCAL: item.status !== 'available' ? item.location : 'CEIC',
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
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="p-4 text-sm font-bold">
                                            {item.status !== 'available' ? item.location : 'CEIC'}
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
    const isSupervisor09B2 = String(userProfile?.login || '').trim().toUpperCase() === '09B2';

    const groupedRequests = useMemo(() => {
        if (!isSupervisor09B2) return { 'Meus Pedidos': requests };
        return requests.reduce((acc, req) => {
            const key = (req.transfer_to || req.sector || 'Desconhecido').split(' - ')[0];
            if (!acc[key]) acc[key] = [];
            acc[key].push(req);
            return acc;
        }, {});
    }, [requests, isSupervisor09B2]);

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

    const [receiptModalData, setReceiptModalData] = useState(null);

    const openReceiptModal = (req) => {
        setReceiptModalData({
            req,
            name: '',
            badge: ''
        });
    };

    const confirmReceipt = () => {
        if (!receiptModalData.name.trim() || !receiptModalData.badge.trim()) {
            showNotification('error', 'Preencha nome e matrícula para receber o equipamento.');
            return;
        }
        onConfirmTransfer(receiptModalData.req, null, { name: receiptModalData.name, badge: receiptModalData.badge });
        setReceiptModalData(null);
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

    const renderReceiptModal = () => {
        if (!receiptModalData) return null;
        return createPortal(
            <div className="modal-overlay z-50">
                <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-fade-in border border-green-100 max-h-[85vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-green-600 flex items-center gap-2">
                            <CheckCircle size={20} /> Confirmar Recebimento
                        </h3>
                        <button onClick={() => setReceiptModalData(null)} className="text-gray-400 hover:text-gray-600">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg mb-5 text-sm text-green-800 border border-green-200">
                        <p><span className="font-bold">Item:</span> {receiptModalData.req.equipmentType}</p>
                        <p className="font-mono text-lg font-bold mt-1">TAG(s): {receiptModalData.req.equipmentTag}</p>
                        <p className="text-green-600 mt-2 text-xs">A CEIC informou a entrega deste equipamento na sua unidade. Confirme o recebimento abaixo.</p>
                    </div>
                    <div className="space-y-4 mb-6">
                        <div>
                            <label className="label text-gray-700">Seu Nome *</label>
                            <input className="input border-gray-300 focus:border-green-500 focus:ring-green-500"
                                value={receiptModalData.name} onChange={e => setReceiptModalData({ ...receiptModalData, name: e.target.value })}
                                required placeholder="Responsável pelo recebimento" />
                        </div>
                        <div>
                            <label className="label text-gray-700">Sua Matrícula *</label>
                            <input className="input border-gray-300 focus:border-green-500 focus:ring-green-500"
                                value={receiptModalData.badge} onChange={e => setReceiptModalData({ ...receiptModalData, badge: e.target.value })}
                                required placeholder="Ex: 12345" />
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setReceiptModalData(null)} className="flex-1 py-2.5 text-gray-600 font-bold bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors">Voltar</button>
                        <button onClick={confirmReceipt} className="flex-1 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-200">Confirmar</button>
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
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {requests.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <Package size={48} className="mb-3 opacity-20" />
                        <p>Nenhum pedido pendente.</p>
                    </div>
                ) : (
                    <div>
                        {Object.keys(groupedRequests).sort().map(groupName => (
                            <div key={groupName} className="mb-6 last:mb-0">
                                {isSupervisor09B2 && (
                                    <div className="bg-gray-100 px-4 py-2 font-bold text-gray-700 uppercase border-b border-gray-200">
                                        Unidade: {groupName}
                                    </div>
                                )}
                                <div className="divide-y divide-gray-100 bg-white">
                                    {groupedRequests[groupName].map((req, index) => {
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
                                                        {(req.patient_mv || req.patientBed) && (
                                                            <span data-testid="request-patient-mv" className="ml-2 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">
                                                                {req.patient_mv ? `MV: ${req.patient_mv}` : 'MV: N/D'}
                                                                {req.patientBed ? ` | Leito/Sala: ${req.patientBed}` : ''}
                                                            </span>
                                                        )}
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
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <Package size={18} className="animate-pulse shrink-0" /> 
                                                                        <span>AGUARDANDO CONFIRMAÇÃO... <span className="ml-1 font-mono bg-white px-2 py-0.5 rounded text-green-900 border border-green-300 shadow-sm">TAG(s): {req.equipmentTag}</span></span>
                                                                    </div>
                                                                    {!isSupervisor09B2 && (
                                                                        <button onClick={() => openReceiptModal(req)} className="px-3 py-1.5 bg-green-600 text-white font-bold rounded-lg shadow-sm text-xs hover:bg-green-700 transition-colors flex items-center gap-2">
                                                                            <CheckCircle size={16} /> Confirmar Recebimento
                                                                        </button>
                                                                    )}
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


                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 ml-4 shrink-0">
                                            <div className="flex items-center gap-2">
                                                {!isSupervisor09B2 && req.status !== 'approved' && req.status !== 'in_transfer' && (
                                                    <button onClick={() => openCancelModal(req, false)} className="text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded text-xs font-bold transition-colors border border-red-100 flex items-center gap-1" title="Cancelar Pedido">
                                                        <XCircle size={14} /> Cancelar
                                                    </button>
                                                )}
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
                                            </div>
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
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {renderCancelModal()}
            {renderReceiptModal()}
        </div>
    );
};

const AdminDirectDeliveryForm = ({ onDirectDelivery, showNotification, inventory, unidades, sectorLogin, onBack }) => {
    const [tag, setTag] = useState('');
    const [patientMV, setPatientMV] = useState('');
    const [patientBed, setPatientBed] = useState('');
    const [patientName, setPatientName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const availableEquipment = useMemo(() => {
        return inventory.filter(e => ['CEIC', 'ESTOQUE CENTRAL'].includes(e.location) && ['available', 'in_use', 'allocated'].includes(e.status))
            .sort((a, b) => a.tag.localeCompare(b.tag));
    }, [inventory]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!tag || !sectorLogin) {
            showNotification('error', 'Preencha a TAG e o Setor de Destino.');
            return;
        }
        setSubmitting(true);
        await onDirectDelivery({ tag, destinationSector: sectorLogin, patientMV, patientBed, patientName });
        setSubmitting(false);
        setTag(''); setPatientMV(''); setPatientBed(''); setPatientName('');
    };

    const sectorName = unidades?.find(u => u.login === sectorLogin)?.nome || sectorLogin;

    return (
        <div className="animate-fade-in">
            <div className="w-full max-w-screen-xl mx-auto mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-purple-50 p-4 rounded-xl border border-purple-200 shadow-sm gap-3">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                        <Truck size={20} />
                    </div>
                    <div>
                        <span className="text-xs text-purple-600 font-bold uppercase block">Entrega Direta para o Setor</span>
                        <span className="text-lg font-black text-purple-900">{sectorLogin} - {sectorName}</span>
                    </div>
                </div>
                <button onClick={onBack} className="text-sm font-bold text-purple-600 hover:text-purple-800 underline transition-colors">Alterar Setor</button>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="label">TAG do Equipamento (Apenas disponíveis) *</label>
                        <SearchDropdown 
                            value={tag} 
                            onChange={setTag}
                            options={availableEquipment.map(eq => ({ value: eq.tag, label: `${eq.tag} - ${eq.type || eq.model}` }))}
                            placeholder="Selecione ou busque a TAG do equipamento..."
                            className="border-gray-300 h-[50px] font-medium"
                        />
                    </div>
                    <div>
                        <label className="label">Nome do Paciente (Opcional)</label>
                        <input type="text" className="input" value={patientName} onChange={e => setPatientName(e.target.value)} />
                    </div>
                    <div>
                        <label className="label">MV do Paciente (Opcional)</label>
                        <input type="text" className="input" value={patientMV} onChange={e => setPatientMV(e.target.value.replace(/\D/g, ''))} />
                    </div>
                    <div>
                        <label className="label">Leito / Sala (Opcional)</label>
                        <input type="text" className="input" value={patientBed} onChange={e => setPatientBed(e.target.value)} />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 shadow-md">
                        <Truck size={20} /> {submitting ? 'Registrando...' : 'Realizar Entrega Direta'}
                    </button>
                </div>
            </form>
        </div>
    );
};

const AdminEntregaWrapper = ({ onCreateRequest, showNotification, onBack, adminProfile, equipmentCatalog, ventilatoryCatalog, generalCatalog, transportCatalog, fullCatalog, inventory, unidades, onDirectDelivery }) => {
    const [activeTab, setActiveTab] = useState('nova_solicitacao');
    const [selectedSector, setSelectedSector] = useState('');
    const [selectedDirectSector, setSelectedDirectSector] = useState('');

    return (
        <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Truck className="text-blue-600" /> Entrega de Equipamentos
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setActiveTab('nova_solicitacao')}
                        className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'nova_solicitacao' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        Nova Solicitação (Equipe CEIC)
                    </button>
                    <button onClick={() => setActiveTab('entrega_direta')}
                        className={`px-4 py-2 rounded-md font-bold text-sm transition-colors ${activeTab === 'entrega_direta' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                        Entregar Equipamento
                    </button>
                </div>
            </div>

            {activeTab === 'nova_solicitacao' ? (
                <>
                    {!selectedSector ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6 flex items-start gap-3">
                                <Truck className="text-blue-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800">
                                    A <strong>Nova Solicitação</strong> permite que a Gestão crie um pedido oficial para um setor. O pedido cairá na fila da <strong>Equipe Operacional</strong> para ser atendido e entregue.
                                </p>
                            </div>
                            <label className="label text-gray-700">Selecione o Setor de Destino *</label>
                            <select className="input mb-4 h-[50px] font-medium" value={selectedSector} onChange={e => setSelectedSector(e.target.value)}>
                                <option value="">Selecione o setor...</option>
                                {(unidades || []).filter(u => u.login !== 'CEIC').map(u => (
                                    <option key={u.login} value={u.login}>{u.login} - {u.nome}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div className="animate-fade-in">
                            <div className="w-full max-w-screen-xl mx-auto mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <span className="text-xs text-blue-600 font-bold uppercase block">Solicitação para o Setor</span>
                                        <span className="text-lg font-black text-blue-900">{selectedSector} - {unidades?.find(u => u.login === selectedSector)?.nome || ''}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedSector('')} className="text-sm font-bold text-blue-600 hover:text-blue-800 underline transition-colors">Alterar Setor</button>
                            </div>
                            <NewRequestForm onCreateRequest={onCreateRequest} showNotification={showNotification}
                                sectorSelo={selectedSector} onBack={() => setSelectedSector('')}
                                adminProfile={adminProfile} equipmentCatalog={equipmentCatalog} ventilatoryCatalog={ventilatoryCatalog} generalCatalog={generalCatalog} fullCatalog={fullCatalog} />
                        </div>
                    )}
                </>
            ) : (
                <>
                    {!selectedDirectSector ? (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6 flex items-start gap-3">
                                <Truck className="text-purple-600 shrink-0 mt-0.5" />
                                <p className="text-sm text-purple-800">
                                    A <strong>Entrega Direta</strong> permite que a Gestão transfira um equipamento diretamente para um setor logado, gerando um pedido automático que cairá na fila da unidade para Confirmação de Recebimento.
                                </p>
                            </div>
                            <label className="label text-gray-700">Selecione o Login de Destino (Setor) *</label>
                            <select className="input mb-4 h-[50px] font-medium border-purple-200 focus:border-purple-500" value={selectedDirectSector} onChange={e => setSelectedDirectSector(e.target.value)}>
                                <option value="">Selecione o setor...</option>
                                {(unidades || []).filter(u => u.login !== 'CEIC').map(u => (
                                    <option key={u.login} value={u.login}>{u.login} - {u.nome}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <AdminDirectDeliveryForm onDirectDelivery={onDirectDelivery} showNotification={showNotification} inventory={inventory} unidades={unidades} sectorLogin={selectedDirectSector} onBack={() => setSelectedDirectSector('')} />
                    )}
                </>
            )}
        </div>
    );
};

// View: Nova Solicitação (Formulário de requisição de equipamentos).
const NewRequestForm = ({ onCreateRequest, showNotification, sectorSelo, onBack, adminProfile, equipmentCatalog, ventilatoryCatalog, generalCatalog, fullCatalog, userProfile }) => {
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
    const [ventObservation, setVentObservation] = useState('');
    const [highFlowCategory, setHighFlowCategory] = useState('Circuito Adulto');
    const [selectedHighFlowItems, setSelectedHighFlowItems] = useState([]);
    const [selectedMonitorAccessories, setSelectedMonitorAccessories] = useState([]);
    const [selectedTransportMonitorAccessories, setSelectedTransportMonitorAccessories] = useState([]);
    const [destinyUnitBed, setDestinyUnitBed] = useState('');
    const [tevScoreType, setTevScoreType] = useState('');
    const [tevScoreValue, setTevScoreValue] = useState('');
    const [patientType, setPatientType] = useState('');
    const [tevIndications, setTevIndications] = useState([]);

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

    const currentTevPriorityLevel = useMemo(() => {
        let level = 4;
        const scoreNum = parseInt(tevScoreValue, 10);
        const hasIndication = (keyword) => tevIndications.some(i => normUpper(i).includes(normUpper(keyword)));
        
        if (patientType === 'Perioperatório' && (hasIndication('Neurocirurgia') || hasIndication('Politrauma'))) {
            level = 1;
        } else if (patientType === 'Obstétrica' && (hasIndication('Cirurgia fetal') || hasIndication('duração > 2 horas') || hasIndication('risco de perda sanguínea') || hasIndication('Instabilidade hemodinâmica'))) {
            level = 1;
        } else if (patientType === 'Obstétrica' && hasIndication('Gestação Múltipla')) {
            level = 2;
        } else if ((patientType === 'Clínico' || patientType === 'Cirúrgico' || patientType === 'Perioperatório') && ((tevScoreType === 'Caprini' && scoreNum >= 4) || (tevScoreType === 'Pádua' && scoreNum === 4))) {
            level = 2;
        } else if (patientType === 'Obstétrica' && scoreNum === 3) {
            level = 2;
        } else if (patientType === 'Obstétrica' && scoreNum === 2) {
            level = 3;
        }
        return level;
    }, [tevScoreValue, patientType, tevIndications, tevScoreType]);

    useEffect(() => {
        if (isTevCompressorType(selectedItem) && currentTevPriorityLevel !== 1 && isEmergency) {
            setIsEmergency(false);
        }
    }, [selectedItem, currentTevPriorityLevel, isEmergency]);

    const MONITOR_ACCESSORIES = ["Manguito Adulto", "Manguito Extra Grande", "Manguito Infantil", "Cabo ECG", "Oxímetro Adulto", "Oxímetro Infantil"];
    const TRANSPORT_MONITOR_OPTIONS = ["Apenas Monitor", "Módulo completo (ECG, Oxímetro e manguito Adulto)", "Manguito Extra Grande", "Manguito infantil"];

    const handleMVChange = (e) => {
        const val = e.target.value.replace(/\D/g, ''); setPatientMV(val);
        if (PATIENT_DB[val]) {
            setPatientName(PATIENT_DB[val].name); showNotification('success', `Paciente encontrado:
    ${PATIENT_DB[val].name}`);
        }
    };

    const handleCategoryChange = (newCat) => {
        setCategory(newCat); setSubType(''); setSelectedItem(''); setAccessoryItem(''); setHighFlowCategory('Circuito Adulto'); setSelectedHighFlowItems([]); setSelectedVentAccessories([]); setSelectedMonitorAccessories([]); setVentObservation('');
        setSelectedTransportMonitorAccessories([]); setSelectedUltrasoundAccessories([]); setTransportItems([]);
        setIsolation(''); setIsolationType(''); setChecklistModel(''); setDestinyUnitBed('');
        setTevScoreType(''); setTevScoreValue(''); setPatientType(''); setTevIndications([]);
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

        let finalEquip = ''; let finalDetails = ''; let requestTevPriority = null; let requestTevGroup = null;

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
                    if (!patientType) { showNotification('error', 'Preencha o Tipo de Paciente.'); return null; }
                    if (!tevScoreValue) { showNotification('error', 'Preencha o valor do Score TEV.'); return null; }
                    
                    const scoreNum = parseInt(tevScoreValue, 10);
                    let tevPriorityLevel = 4;
                    
                    if (tevScoreType === 'Caprini' && (scoreNum < 1 || scoreNum > 5)) { showNotification('error', 'Score Caprini inválido (deve ser entre 1 e 5).'); return null; }
                    if (tevScoreType === 'Pádua' && (scoreNum < 1 || scoreNum > 4)) { showNotification('error', 'Score Pádua inválido (deve ser entre 1 e 4).'); return null; }
                    if (tevScoreType === 'Obst.' && (scoreNum < 1 || scoreNum > 3)) { showNotification('error', 'Score Obstétrico inválido (deve ser entre 1 e 3).'); return null; }

                    const hasIndication = (keyword) => tevIndications.some(i => normUpper(i).includes(normUpper(keyword)));
                    
                    if (patientType === 'Perioperatório' && (hasIndication('Neurocirurgia') || hasIndication('Politrauma'))) {
                        tevPriorityLevel = 1;
                    } else if (patientType === 'Obstétrica' && (hasIndication('Cirurgia fetal') || hasIndication('duração > 2 horas') || hasIndication('risco de perda sanguínea') || hasIndication('Instabilidade hemodinâmica'))) {
                        tevPriorityLevel = 1;
                    } else if (patientType === 'Obstétrica' && hasIndication('Gestação Múltipla')) {
                        tevPriorityLevel = 2;
                    } else if ((patientType === 'Clínico' || patientType === 'Cirúrgico' || patientType === 'Perioperatório') && ((tevScoreType === 'Caprini' && scoreNum >= 4) || (tevScoreType === 'Pádua' && scoreNum === 4))) {
                        tevPriorityLevel = 2;
                    } else if (patientType === 'Obstétrica' && scoreNum === 3) {
                        tevPriorityLevel = 2;
                    } else if (patientType === 'Obstétrica' && scoreNum === 2) {
                        tevPriorityLevel = 3;
                    }

                    requestTevGroup = patientType;
                    requestTevPriority = tevPriorityLevel;
                    
                    extras.push(`Paciente: ${patientType}`);
                    extras.push(`Score TEV: ${tevScoreType} (${tevScoreValue})`);
                    if (tevIndications.length > 0) {
                        extras.push(`Indicações: ${tevIndications.join(', ')}`);
                    }
                    if (sameText(sectorSelo, 'Centro Cirúrgico') && destinyUnitBed) {
                        extras.push(`Destino: ${destinyUnitBed}`);
                    }
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

            const isAccessoryOnly = norm(subType) === 'APENAS ACESSORIOS';
            if (isAccessoryOnly && !accessoryItem) {
                showNotification('error', 'Selecione para qual equipamento deseja os acessórios.');
                return null;
            }

            const activeTypeForAccessories = isAccessoryOnly ? norm(accessoryItem) : norm(subType);
            const ventTypeConfig = equipmentCatalog.VENTILATORIA.types[activeTypeForAccessories];
            const hasAccessories = ventTypeConfig && ventTypeConfig.accessories && ventTypeConfig.accessories.length > 0;

            if (hasAccessories) {
                if (selectedVentAccessories.length === 0) {
                    showNotification('error', 'Selecione pelo menos um acessório ou circuito.');
                    return null;
                }
                finalDetails = `Itens/Acessórios: ${selectedVentAccessories.join(', ')}`;
                if (isAccessoryOnly) {
                    finalDetails = `Para ${accessoryItem} - ` + finalDetails;
                }
                if (ventObservation && ventObservation.trim() !== '') {
                    finalDetails += ` | Obs: ${ventObservation.trim()}`;
                }
            }
        }

        const allAccessories = []; if (finalDetails) allAccessories.push(finalDetails);

        return {
            equipmentType: String(finalEquip).trim().toUpperCase(), accessories: allAccessories, tevPriority: requestTevPriority, tevGroup: requestTevGroup,
            destinyUnitBed: destinyUnitBed
        };
    };

    const getSurgicalBlock = () => {
        const login = String(userProfile?.login || '').toUpperCase();
        const sector = String(sectorSelo || '').toUpperCase();
        
        if (login.includes('BLOCO1') || sector.includes('BLOCO1')) return 'CC_BLOCO1';
        if (login.includes('BLOCO2') || sector.includes('BLOCO2')) return 'CC_BLOCO2';
        if (login.includes('BLOCO3') || sector.includes('BLOCO3')) return 'CC_BLOCO3';
        if (login.includes('BLOCO4') || sector.includes('BLOCO4')) return 'CC_BLOCO4';
        if (login === '10B1' || sector === '10B1' || login.includes('PS') || sector.includes('PS') || login.includes('PRONTO SOCORRO') || sector.includes('PRONTO SOCORRO')) return '10B1';
        
        if (sector.includes('CIRURG') || sector.includes('CENTRO CIRÚRGICO')) return 'ANY_CC';
        return null;
    };

    const handleAddAnother = (e) => {
        e.preventDefault();
        if (!requesterBadge.trim() || !patientMV.trim() || !patientName.trim() || !patientBed.trim()) {
            showNotification('error', 'Preencha os dados básicos do paciente primeiro.'); return;
        }

        const loginOrSector = getSurgicalBlock();
            
        if (loginOrSector) {
            const pBedNum = parseInt(patientBed, 10);
            let isValid = true;
            if (loginOrSector === 'CC_BLOCO1' && (pBedNum < 1 || pBedNum > 10)) isValid = false;
            else if (loginOrSector === 'CC_BLOCO2' && (pBedNum < 11 || pBedNum > 20)) isValid = false;
            else if (loginOrSector === 'CC_BLOCO3' && ![24, 25, 29, 30].includes(pBedNum)) isValid = false;
            else if (loginOrSector === '10B1' && ![21, 22, 23, 26, 27, 28].includes(pBedNum)) isValid = false;
            else if (loginOrSector === 'CC_BLOCO4' && ![31, 32, 33, 34].includes(pBedNum)) isValid = false;
            
            if (!isValid) {
                showNotification('error', 'Essa sala não pertence ao bloco cirúrgico selecionado.');
                return;
            }
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
        
        const loginOrSector = getSurgicalBlock();
            
        if (loginOrSector) {
            const pBedNum = parseInt(patientBed, 10);
            let isValid = true;
            if (loginOrSector === 'CC_BLOCO1' && (pBedNum < 1 || pBedNum > 10)) isValid = false;
            else if (loginOrSector === 'CC_BLOCO2' && (pBedNum < 11 || pBedNum > 20)) isValid = false;
            else if (loginOrSector === 'CC_BLOCO3' && ![24, 25, 29, 30].includes(pBedNum)) isValid = false;
            else if (loginOrSector === '10B1' && ![21, 22, 23, 26, 27, 28].includes(pBedNum)) isValid = false;
            else if (loginOrSector === 'CC_BLOCO4' && ![31, 32, 33, 34].includes(pBedNum)) isValid = false;
            
            if (!isValid) {
                showNotification('error', 'Essa sala não pertence ao bloco cirúrgico selecionado.');
                return;
            }
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
                            disabled={isTevCompressorType(selectedItem) && currentTevPriorityLevel !== 1}
                            className="w-5 h-5 text-red-600 rounded disabled:opacity-50 disabled:cursor-not-allowed" /><span className={`font-bold ${isEmergency
                                ? 'text-red-600' : 'text-gray-700'} ${isTevCompressorType(selectedItem) && currentTevPriorityLevel !== 1 ? 'opacity-50' : ''}`}>Pedido Emergencial?</span></label></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="md:col-span-1"><label className="label">Nome Solicitante *</label><input
                        data-testid="request-requester-name" required type="text" className="input" value={requesterName} onChange={e =>
                            setRequesterName(e.target.value)} /></div>
                    <div><label className="label">Matrícula *</label><input data-testid="request-requester-badge" required type="text" className="input"
                        value={requesterBadge} onChange={e => setRequesterBadge(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 12345" /></div>
                    <div><label className="label">Ramal *</label><input data-testid="request-extension" required type="text" className="input"
                        value={ramal} onChange={e => setRamal(e.target.value.replace(/\D/g, ''))} placeholder="Ex: 8000" /></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><label className="label">Registro MV*</label><input data-testid="request-patient-mv" required type="text" className="input"
                        value={patientMV} onChange={handleMVChange} placeholder="Ex: 458512" /></div>
                    <div><label className="label">Nome do Paciente *</label><input data-testid="request-patient-name" required type="text"
                        className="input" value={patientName} onChange={e => setPatientName(e.target.value)} />
                    </div>
                    <div><label className="label">{getSurgicalBlock() ? 'Sala do procedimento *' : 'Leito do Paciente *'}</label><input data-testid="request-patient-bed" required type="text"
                        className="input font-bold" value={patientBed} onChange={e =>
                            setPatientBed(e.target.value.replace(/\D/g, '').substring(0, 2))} placeholder={getSurgicalBlock() ? 'Ex: Sala 05' : 'Ex: Leito 05'}
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
                    optionsDropdown.push({ value: 'APENAS ACESSÓRIOS', label: 'Apenas Acessórios (Avulsos)' });

                    const isAccessoryOnly = norm(subType) === 'APENAS ACESSORIOS';
                    // Se for apenas acessórios, buscamos a config baseada na seleção do menu de acessórios, caso contrário, do subType principal
                    const activeTypeForAccessories = isAccessoryOnly ? norm(accessoryItem) : norm(subType);
                    const ventTypeConfig = equipmentCatalog.VENTILATORIA.types[activeTypeForAccessories];
                    const hasAccessories = ventTypeConfig && ventTypeConfig.accessories && ventTypeConfig.accessories.length > 0;

                    const accessoryDeviceOptions = [
                        { value: 'VENTILADOR PULMONAR NAO INVASIVO', label: 'Ventilador Pulmonar Não Invasivo' },
                        { value: 'VENTILADOR PULMONAR INVASIVO', label: 'Ventilador Pulmonar Invasivo' },
                        { value: 'ALTO FLUXO', label: 'Alto fluxo' },
                        { value: 'GERADOR DE FLUXO', label: 'Gerador de fluxo' }
                    ];

                    return (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="label">Tipo</label>
                                    <SearchDropdown value={subType} onChange={(val) => {
                                        setSubType(val);
                                        setAccessoryItem(''); setHighFlowCategory('Circuito Adulto');
                                        setSelectedHighFlowItems([]); setSelectedVentAccessories([]); setVentObservation('');
                                    }}
                                        options={optionsDropdown} placeholder="Selecione o tipo..." />
                                </div>
                                
                                {isAccessoryOnly && (
                                    <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 animate-fade-in relative z-20">
                                        <label className="label text-yellow-800 font-bold mb-2">Para qual equipamento você precisa de acessórios?</label>
                                        <SearchDropdown value={accessoryItem} onChange={(val) => {
                                            setAccessoryItem(val);
                                            setSelectedHighFlowItems([]); setSelectedVentAccessories([]); setVentObservation('');
                                        }}
                                            options={accessoryDeviceOptions} placeholder="Selecione o equipamento alvo..." className="bg-white" />
                                    </div>
                                )}

                                {(hasAccessories && (!isAccessoryOnly || accessoryItem)) && (
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
                                        
                                        {normUpper(subType).includes('VENTILADOR PULMONAR INVASIVO') && selectedVentAccessories.length > 0 && (
                                            <div className="mt-4">
                                                <label className="label text-blue-800 font-bold mb-2">Observações Adicionais (Opcional):</label>
                                                <input 
                                                    type="text" 
                                                    value={ventObservation}
                                                    onChange={(e) => setVentObservation(e.target.value)}
                                                    className="input w-full border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-sm"
                                                    placeholder="Digite informações adicionais sobre a umidificação..."
                                                />
                                            </div>
                                        )}
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
                            setDestinyUnitBed(''); setPatientType(''); setTevIndications([]);
                            setTevScoreType(''); setTevScoreValue('');
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
                                        <div>
                                            <label className="label text-blue-900">Tipo de Paciente *</label>
                                            <select className="input bg-white border-blue-200" value={patientType}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setPatientType(val);
                                                    if (val === 'Clínico') setTevScoreType('Pádua');
                                                    else if (val === 'Cirúrgico' || val === 'Perioperatório') setTevScoreType('Caprini');
                                                    else if (val === 'Obstétrica') setTevScoreType('Obst.');
                                                    else setTevScoreType('');
                                                    setTevScoreValue('');
                                                    setTevIndications([]);
                                                }}>
                                                <option value="">Selecione...</option>
                                                <option value="Clínico">Clínico</option>
                                                <option value="Cirúrgico">Cirúrgico</option>
                                                <option value="Perioperatório">Perioperatório (Centro Cirúrgico)</option>
                                                <option value="Obstétrica">Paciente Obstétrica</option>
                                            </select>
                                        </div>

                                        {patientType && (
                                            <div className="animate-fade-in">
                                                <label className="label text-blue-900">Score TEV *</label>
                                                <div className="input bg-blue-100 border-blue-200 text-blue-800 font-bold flex items-center opacity-90 cursor-not-allowed">
                                                    {tevScoreType}
                                                </div>
                                            </div>
                                        )}

                                        {tevScoreType && (
                                            <div className="animate-fade-in md:col-span-2 lg:col-span-1">
                                                <label className="label text-blue-900">Valor do Score ({tevScoreType}) *</label>
                                                <select
                                                    className="input font-bold border-blue-200 focus:border-blue-500 focus:ring-blue-500 text-blue-800 bg-white"
                                                    value={tevScoreValue} onChange={e => setTevScoreValue(e.target.value)}
                                                >
                                                    <option value="" disabled>Selecione...</option>
                                                    {tevScoreType === 'Pádua' && (
                                                        <>
                                                            <option value="1">1</option>
                                                            <option value="2">2</option>
                                                            <option value="3">3</option>
                                                            <option value="4">&ge; 4</option>
                                                        </>
                                                    )}
                                                    {tevScoreType === 'Caprini' && (
                                                        <>
                                                            <option value="1">1</option>
                                                            <option value="2">2</option>
                                                            <option value="3">3</option>
                                                            <option value="4">4</option>
                                                            <option value="5">&ge; 5</option>
                                                        </>
                                                    )}
                                                    {tevScoreType === 'Obst.' && (
                                                        <>
                                                            <option value="1">1</option>
                                                            <option value="2">2</option>
                                                            <option value="3">3</option>
                                                        </>
                                                    )}
                                                </select>
                                            </div>
                                        )}

                                        {patientType && TEV_INDICATIONS[patientType] && (
                                            <div className="md:col-span-2 mt-4 space-y-4 animate-fade-in">
                                                <label className="label text-blue-900">Indicações e Agravantes</label>
                                                <div className="bg-white p-4 rounded-lg border border-blue-100 shadow-sm space-y-3">
                                                    {TEV_INDICATIONS[patientType].flatMap(g => g.items).map(item => (
                                                        <label key={item} className="flex items-start gap-2 cursor-pointer group">
                                                            <input type="checkbox"
                                                                className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                                                checked={tevIndications.includes(item)}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setTevIndications(prev => [...prev, item]);
                                                                    } else {
                                                                        setTevIndications(prev => prev.filter(i => i !== item));
                                                                    }
                                                                }}
                                                            />
                                                            <span className="text-sm text-gray-700 group-hover:text-blue-900 transition-colors">{item}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
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

// View: Limpeza e Higienização (Fila de higienização).
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
                <h2 className="text-2xl font-bold text-gray-800 flex items-center"><SprayCan className="mr-2 text-yellow-600" /> Sala de Higienização</h2>
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
    const [receiptActionType, setReceiptActionType] = useState('receipt'); // 'receipt' or 'transfer'
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

    const isSupervisor09B2 = String(userProfile?.login || '').trim().toUpperCase() === '09B2';
    const blocosCC = ['CC_BLOCO1', 'CC_BLOCO2', 'CC_BLOCO3', 'CC_BLOCO4'];

    const myEquipments = (inventory || []).filter(e => {
        if (!e.location) return false;

        const loc = String(e.location).trim().toUpperCase();
        const transTo = String(e.transferTo || '').trim().toUpperCase();
        const userLogin = String(userProfile?.login || '').trim().toUpperCase();
        const inTransit = e.transferStatus === 'in_transit';

        let isMine = false;
        if (isSupervisor09B2) {
            isMine = blocosCC.includes(loc) || (inTransit && blocosCC.includes(transTo));
        } else {
            isMine = (loc === userLogin || (inTransit && transTo === userLogin));
        }

        // Exibe equipamentos que estão na unidade e não foram recolhidos pela CEIC
        const activeStatuses = ['in_use', 'allocated', 'pickup_requested', 'disponivel'];

        return loc !== 'CEIC' && isMine && activeStatuses.includes(e.status);
    });

    const groupedEquipments = myEquipments.reduce((acc, item) => {
        let unitKey = 'Equipamentos do Setor';
        if (isSupervisor09B2) {
            const loc = String(item.location || '').trim().toUpperCase();
            const transTo = String(item.transferTo || '').trim().toUpperCase();
            if (item.transferStatus === 'in_transit' && blocosCC.includes(transTo)) {
                unitKey = transTo;
            } else {
                unitKey = loc || 'Desconhecido';
            }
        }
        
        const typeKey = item.type || item.model || 'Desconhecido';
        
        if (!acc[unitKey]) acc[unitKey] = {};
        if (!acc[unitKey][typeKey]) acc[unitKey][typeKey] = [];
        acc[unitKey][typeKey].push(item);
        return acc;
    }, {});
    const hasAnyEquipment = Object.keys(groupedEquipments).length > 0;

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
        setSelectedItem(item);
        setCollaboratorName('');
        setCollaboratorBadge('');
        setReceiptActionType('transfer');
        setReceiptModalOpen(true);
    };

    const handleReceiptClick = (item) => {
        setSelectedItem(item);
        setCollaboratorName('');
        setCollaboratorBadge('');
        setReceiptActionType('receipt');
        setReceiptModalOpen(true);
    };

    const confirmReceiptSubmit = async () => {
        if (!collaboratorName || !collaboratorBadge) {
            showNotification('error', 'Preencha nome e matrícula.');
            return;
        }
        setConfirmingReceiptTag(selectedItem.tag);
        
        let ok = false;
        if (receiptActionType === 'transfer') {
            const pedido = requests.find(r => normUpper(r.equipmentTag).includes(normUpper(selectedItem.tag)) && r.status === 'in_transfer');
            try {
                await onConfirmTransfer(selectedItem, pedido, { name: collaboratorName, badge: collaboratorBadge });
                ok = true;
            } catch (err) {
                ok = false;
            }
        } else {
            ok = await onConfirmReceipt({ equipmentTag: selectedItem.tag, collaboratorName, collaboratorBadge });
        }
        
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
                                    <label className="label text-gray-700">{['CC_BLOCO1', 'CC_BLOCO2', 'CC_BLOCO3', 'CC_BLOCO4', '10B1'].includes(destinationSector) ? 'Sala' : ((unidades?.find(u => u.login === destinationSector)?.nome?.toUpperCase().includes('CIRURG') || destinationSector === '09B2') ? 'Sala Cirúrgica' : 'Leito Destino')}</label>
                                    <input type="text" className="input border-purple-200 focus:border-purple-500"
                                        value={destinationBed} onChange={e => setDestinationBed(e.target.value)}
                                        placeholder={['CC_BLOCO1', 'CC_BLOCO2', 'CC_BLOCO3', 'CC_BLOCO4', '10B1'].includes(destinationSector) ? 'Ex: Sala 03' : ((unidades?.find(u => u.login === destinationSector)?.nome?.toUpperCase().includes('CIRURG') || destinationSector === '09B2') ? 'Ex: Sala 03' : 'Ex: Leito 05')} />
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
                        <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm text-blue-800 border border-blue-200">
                            <p className="font-bold text-base mb-2">{selectedItem?.type || 'Equipamento'} {selectedItem?.model ? `- ${selectedItem.model}` : ''}</p>
                            <p className="font-mono text-xl font-bold my-2 text-blue-900 bg-white px-3 py-1.5 rounded-lg border border-blue-200 shadow-sm inline-block">TAG: {selectedItem?.tag}</p>
                            <p className="text-blue-600 mt-2 text-xs">A CEIC informou a entrega deste equipamento na sua
                                unidade. Confirme o recebimento abaixo.</p>
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
                    <MapPin className="text-blue-600" /> Equipamentos do Setor: {sector}
                </h2>
            </div>

            {!hasAnyEquipment ? <div
                className="p-12 text-center bg-white rounded-2xl border border-gray-100 text-gray-400">
                <Package size={48} className="mx-auto mb-3 opacity-20" />
                <p>Nenhum equipamento registrado nesta área.</p>
            </div> :
                <div className="space-y-8">
                    {Object.keys(groupedEquipments).sort().map(unitName => (
                        <div key={unitName}>
                            {isSupervisor09B2 && (
                                <h2 className="text-xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
                                    Unidade: {unitName}
                                </h2>
                            )}
                            <div className="space-y-6">
                                {Object.keys(groupedEquipments[unitName]).sort().map(modelName => (
                                    <div key={`${unitName}-${modelName}`}
                                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                                            <Package className="text-blue-600" size={20} />
                                            <h3 className="font-bold text-gray-800 text-lg">{modelName}</h3>
                                            <span
                                                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold ml-auto">Qtd:
                                                {groupedEquipments[unitName][modelName].length}</span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {groupedEquipments[unitName][modelName].sort((a, b) => (a.tag || '').localeCompare(b.tag || '')).map(item => {
                                    const pickupRequest = requests.find(r => r.status === 'pickup_requested' && splitTagList(r.equipmentTag).includes(normUpper(item.tag)));
                                    const isPendingPickup = !!pickupRequest;
                                    const isBeingTriaged = item.status === 'pickup_requested' && !isPendingPickup;

                                    const isPendingTransferToMe = (sameText(item.transferTo, sector) || sameText(item.transferTo, userProfile?.login)) && item.transferStatus === 'in_transit';
                                    const isMyItemTransferring = (sameText(item.location, sector) || sameText(item.location, userProfile?.login)) && item.transferStatus === 'in_transit';
                                    const isRejected = (sameText(item.location, sector) || sameText(item.location, userProfile?.login)) && item.transferStatus === 'rejected';
                                    const canTransfer = (sameText(item.location, sector) || sameText(item.location, userProfile?.login)) && (!item.transferStatus || item.transferStatus === 'completed');
                                    const needsReceiptConfirmation = false;

                                    // BUSCA O PEDIDO VINCULADO PARA PEGAR O NOME DO PACIENTE
                                    const pedidoRelacionado = (requests || []).find(r => r.equipmentTag?.includes(normUpper(item.tag)));
                                    const displayPatientName = item.patientName || pedidoRelacionado?.patientName || 'Paciente não identificado';
                                    
                                    // Pela nova regra: specificLocation é a sala/leito oficial do equipamento (origem se em trânsito, destino se aceito).
                                    const displayPatientBed = item.specificLocation || item.patientBed || item.patientbed || item.patient_bed || pedidoRelacionado?.patientBed || pedidoRelacionado?.patientbed || pedidoRelacionado?.patient_bed || '';
                                    
                                    // Regra de Rótulo (Sala vs Leito)
                                    const sectorUpper = String(sector || userProfile?.login || '').toUpperCase();
                                    const isCCorOBST = sectorUpper.includes('CC_') || sectorUpper === '09B2' || sectorUpper === '10B1' || sectorUpper.includes('OBSTETRICO');
                                    const locLabel = isCCorOBST ? 'Sala' : 'Leito';

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
                                                        {(item.patient_mv || displayPatientName !== 'Paciente não identificado' || displayPatientBed) && (
                                                            <span
                                                                className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-md text-gray-700 shadow-sm">
                                                                <User size={14} className="text-blue-500" />
                                                                <span className="font-bold">{displayPatientName}</span>
                                                                <span className="text-xs text-gray-400 font-mono">
                                                                    ({item.patient_mv ? `MV: ${item.patient_mv}` : 'MV: N/D'}{displayPatientBed ? ` | ${locLabel}: ${displayPatientBed}` : ''})
                                                                </span>
                                                            </span>
                                                        )}
                                                        {isPendingTransferToMe && <span
                                                            className="text-gray-600 font-medium ml-2 flex items-center gap-1"><MapPin size={14} /> Origem:
                                                            {item.location} {item.specificLocation ? `- Sala/Leito: ${item.specificLocation}` : ''}</span>}
                                                    </div>
                                                </div>

                                                {isPendingPickup ? (
                                                    <div className="mt-2 p-2 bg-blue-50 text-blue-800 text-sm rounded border border-blue-200">
                                                        <strong>Instrução de Devolução:</strong> {pickupRequest?.catalogo_equipamentos?.instrucao_devolucao || "O equipamento deverá ser entregue na CEIC o mais breve possível, em até 2h."}
                                                    </div>
                                                ) : isBeingTriaged ? (
                                                    <div className="mt-2 p-3 bg-purple-50 text-purple-800 text-sm rounded border border-purple-200 font-medium">
                                                        Equipamento recepcionado na CEIC
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
                                                            !isSupervisor09B2 && (
                                                                <button onClick={() => handleReceiptClick(item)} disabled={confirmingReceiptTag === item.tag} className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-100 font-bold text-sm transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed">
                                                                    <CheckCircle size={16} /> {confirmingReceiptTag === item.tag ? 'Confirmando...' : 'Confirmar Recebimento'}
                                                                </button>
                                                            )
                                                        ) : (
                                                            !isSupervisor09B2 && (
                                                                <>
                                                                    <button onClick={() => handleTransferClick(item)} className="flex items-center gap-2 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 hover:bg-purple-100 font-bold text-sm transition-colors shadow-sm">
                                                                        <Send size={16} /> Remanejar
                                                                    </button>
                                                                    <button onClick={() => handleReturnClick(item)} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-600 rounded-lg border border-red-100 hover:bg-red-100 font-bold text-sm transition-colors shadow-sm">
                                                                        <LogOut size={16} /> Devolver
                                                                    </button>
                                                                </>
                                                            )
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
                                        <div className="font-mono font-bold text-gray-800 text-sm">{item.tag}</div>
                                        <div className="text-xs font-bold text-gray-500">{item.type}</div>
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
                                                }} className="p-1.5 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-100"
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
                                                }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
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
                                <label className="label">{(unidades?.find(u => u.login === destinationSector)?.nome?.toUpperCase().includes('CIRURG') || destinationSector === '09B2') ? 'Sala Cirúrgica' : 'Leito de Destino'}</label>
                                <input type="text" className="input h-[50px]" value={destinationBed}
                                    onChange={e => setDestinationBed(e.target.value)} placeholder={(unidades?.find(u => u.login === destinationSector)?.nome?.toUpperCase().includes('CIRURG') || destinationSector === '09B2') ? 'Ex: Sala 03' : 'Ex: Leito 12'} />
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
    const [appliedStart, setAppliedStart] = useState(`${todayStr}T00:00`);
    const [appliedEnd, setAppliedEnd] = useState(`${todayStr}T23:59`);
    const [isWaitlistAnalysisOpen, setIsWaitlistAnalysisOpen] = useState(false);
    const [isCanceledAnalysisOpen, setIsCanceledAnalysisOpen] = useState(false);
    const [isReturnsAnalysisOpen, setIsReturnsAnalysisOpen] = useState(false);
    const [isApprovedAnalysisOpen, setIsApprovedAnalysisOpen] = useState(false);

    const totalItems = inventory.length;
    const availableItems = inventory.filter(i => i.status === 'available').length;
    const inUseItems = inventory.filter(i => i.status === 'in_use').length;
    const maintenanceItems = inventory.filter(i => i.status === 'maintenance').length;
    const cleaningItems = inventory.filter(i => i.status === 'cleaning').length;

    const calcPct = (val) => totalItems === 0 ? 0 : Math.round((val / totalItems) * 100);

    const isWithinRange = (timestamp) => {
        if (!timestamp) return false;
        let ts = String(timestamp);
        if (ts.includes(' ') && !ts.includes('T')) {
            ts = ts.replace(' ', 'T');
        }
        const t = new Date(ts).getTime();
        const s = appliedStart ? new Date(appliedStart).getTime() : 0;
        const e = appliedEnd ? new Date(appliedEnd).getTime() : Infinity;
        return !isNaN(t) && t >= s && t <= e;
    }; const filteredRequests = requests.filter(r => isWithinRange(r.timestamp));

    const approvedRequests = filteredRequests.filter(r => ['approved', 'aprovado', 'delivered', 'completed', 'in_transit', 'in_transfer'].includes(r.status));
    
    const completedReturnsList = filteredRequests.filter(r => ['return_pickup', 'recolhimento'].includes(r.kind) && ['completed', 'concluido'].includes(r.status))
        .sort((a, b) => new Date(b.fulfilledAt || b.timestamp).getTime() - new Date(a.fulfilledAt || a.timestamp).getTime());
    const completedReturns = completedReturnsList.length;

    let countGerais = 0; let countVent = 0; let countTransp = 0;

    approvedRequests.forEach(r => {
        const type = r.equipmentType || '';
        if (normUpper(type).includes('TRANSPORTE')) {
            countTransp++;
        } else if (['VENTILADOR PULMONAR', 'GERADOR DE FLUXO', 'OXIDO NITRICO', 'APENAS ACESSORIOS'].some(vb => normUpper(type).startsWith(vb))) {
            countVent++;
        } else {
            countGerais++;
        }
    });

    const waitlistHistory = filteredRequests.filter(r => r.waitlistTime !== null);
    const totalWaitlisted = waitlistHistory.length;
    
    const calculateWaitTime = (req) => {
        if (!req.waitlistTime) return 0;
        const start = new Date(req.waitlistTime).getTime();
        let end;
        if (req.status === 'waitlisted') {
            end = new Date().getTime(); 
        } else {
            end = req.notificationTime ? new Date(req.notificationTime).getTime() : 
                  (req.fulfilled_at ? new Date(req.fulfilled_at).getTime() : new Date().getTime());
        }
        return Math.floor(Math.max(0, end - start) / (1000 * 60)); 
    };

    let totalWaitTimeMins = 0;
    
    const waitlistDetails = waitlistHistory.map(req => {
        const timeMins = calculateWaitTime(req);
        totalWaitTimeMins += timeMins;
        
        let waitStatus = 'Aguardando';
        if (['approved', 'aprovado', 'delivered', 'completed', 'in_transit', 'in_transfer'].includes(req.status)) waitStatus = 'Atendido';
        else if (['canceled', 'cancelado', 'cancelled'].includes(req.status)) waitStatus = 'Cancelado';
        
        return {
            ...req,
            timeMins,
            waitStatus
        };
    }).sort((a, b) => new Date(b.waitlistTime).getTime() - new Date(a.waitlistTime).getTime()); 
    
    const waitlistedCompleted = waitlistDetails.filter(r => r.waitStatus === 'Atendido').length;
    const waitlistedCanceled = waitlistDetails.filter(r => r.waitStatus === 'Cancelado').length;
    const waitlistedCurrent = waitlistDetails.filter(r => r.waitStatus === 'Aguardando').length;
    const avgWaitTimeMins = totalWaitlisted > 0 ? Math.round(totalWaitTimeMins / totalWaitlisted) : 0;
    
    const formatWaitTime = (mins) => {
        if (mins < 60) return `${mins} min`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return `${h}h ${m}m`;
    };

    const canceledRequestsList = filteredRequests.filter(r => ['cancelled', 'canceled', 'cancelado'].includes(r.status))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const totalCanceled = canceledRequestsList.length;

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

            <div className="flex flex-col gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <div
                        className="flex flex-col xl:flex-row xl:items-center justify-between mb-4 gap-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2">
                            <Settings size={18} className="text-gray-500" /> Visão Operacional Diária
                        </h3>
                        <div className="flex flex-wrap items-end gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200">
                            <div className="flex flex-col w-full sm:w-auto">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Início</label>
                                <input type="datetime-local" data-testid="report-filter-start"
                                    className="bg-white border border-gray-300 rounded text-xs px-2 py-1.5 outline-none focus:border-blue-500 w-full"
                                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div className="flex flex-col w-full sm:w-auto">
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Fim</label>
                                <input type="datetime-local" data-testid="report-filter"
                                    className="bg-white border border-gray-300 rounded text-xs px-2 py-1.5 outline-none focus:border-blue-500 w-full"
                                    value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                            <button
                                onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate); }}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                            >
                                <Search size={14} /> Atualizar
                            </button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-gray-600 font-medium">Solicitações Pendentes</span>
                            <span className="font-bold text-blue-600">{filteredRequests.filter(r =>
                                r.status === 'pending').length}</span>
                        </div>

                        <button
                            onClick={() => setIsApprovedAnalysisOpen(!isApprovedAnalysisOpen)}
                            className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-green-400 hover:bg-green-50 transition-colors focus:outline-none cursor-pointer mt-2"
                        >
                            <span className="text-gray-600 font-medium text-left">Solicitações Atendidas</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-green-600">{approvedRequests.length}</span>
                                {isApprovedAnalysisOpen ? <ChevronUp size={16} className="text-green-400" /> : <ChevronDown size={16} className="text-green-400" />}
                            </div>
                        </button>

                        {isApprovedAnalysisOpen && (
                            <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden animate-fade-in my-2">
                                <div className="bg-white divide-y divide-gray-50">
                                    <div
                                        className="flex justify-between items-center py-3 px-4 text-sm hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-600 flex items-center gap-2 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                                            Equipamentos Gerais
                                        </span>
                                        <span className="font-bold text-gray-800">{countGerais}</span>
                                    </div>
                                    <div
                                        className="flex justify-between items-center py-3 px-4 text-sm hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-600 flex items-center gap-2 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                                            Assistência Ventilatória
                                        </span>
                                        <span className="font-bold text-gray-800">{countVent}</span>
                                    </div>
                                    <div
                                        className="flex justify-between items-center py-3 px-4 text-sm hover:bg-gray-50 transition-colors">
                                        <span className="text-gray-600 flex items-center gap-2 font-medium">
                                            <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                                            Transporte
                                        </span>
                                        <span className="font-bold text-gray-800">{countTransp}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setIsReturnsAnalysisOpen(!isReturnsAnalysisOpen)}
                            className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-purple-400 hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer mt-2"
                        >
                            <span className="text-gray-600 font-medium text-left">Devoluções Realizadas</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-purple-600">{completedReturns}</span>
                                {isReturnsAnalysisOpen ? <ChevronUp size={16} className="text-purple-400" /> : <ChevronDown size={16} className="text-purple-400" />}
                            </div>
                        </button>
                        
                        {isReturnsAnalysisOpen && (
                            <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden animate-fade-in my-2">
                                <div className="bg-purple-50 p-3 border-b border-purple-100 flex flex-col gap-3">
                                    <h3 className="font-bold text-purple-800 flex items-center gap-2 text-sm">
                                        <PackageOpen size={16} /> Análise de Devoluções
                                    </h3>
                                    <div className="flex gap-4 text-xs font-medium justify-between px-2">
                                        <div className="flex flex-col items-center"><span className="text-gray-500 text-[9px] uppercase">Total Devolvido</span><span className="text-gray-800">{completedReturns}</span></div>
                                    </div>
                                </div>
                                
                                <div className="max-h-[500px] overflow-y-auto">
                                    {completedReturnsList.length > 0 ? (
                                        <div className="p-3 space-y-4">
                                            <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                                {completedReturnsList.map(item => (
                                                    <div key={item.id} className="p-3 flex flex-col hover:bg-purple-50/30 gap-2">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                                {item.equipmentType}
                                                                {item.equipmentTag && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200">{item.equipmentTag}</span>}
                                                            </p>
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-purple-100 text-purple-700">Devolvido</span>
                                                        </div>
                                                        <div className="flex flex-col gap-1 mt-1">
                                                            <p className="text-[11px] text-gray-500">De onde veio: <span className="font-bold text-purple-700">{item.sector}</span></p>
                                                            <p className="text-[11px] text-gray-500">Horário da Devolução: <span className="font-bold">{new Date(item.fulfilledAt || item.timestamp).toLocaleString('pt-BR')}</span></p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-xs text-gray-500">Nenhum equipamento devolvido no período.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setIsWaitlistAnalysisOpen(!isWaitlistAnalysisOpen)}
                            className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-orange-400 hover:bg-orange-100 transition-colors focus:outline-none cursor-pointer"
                        >
                            <span className="text-gray-600 font-medium text-left">Equipamentos em Fila de
                                Espera</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-orange-600">{totalWaitlisted}</span>
                                {isWaitlistAnalysisOpen ? <ChevronUp size={16} className="text-orange-400" /> : <ChevronDown size={16} className="text-orange-400" />}
                            </div>
                        </button>
                        
                        {isWaitlistAnalysisOpen && (
                            <div className="bg-white rounded-xl shadow-sm border border-orange-200 overflow-hidden animate-fade-in my-2">
                                <div className="bg-orange-50 p-3 border-b border-orange-100 flex flex-col gap-3">
                                    <h3 className="font-bold text-orange-800 flex items-center gap-2 text-sm">
                                        <Clock size={16} /> Análise da Fila de Espera
                                    </h3>
                                    <div className="flex gap-4 text-xs font-medium justify-between px-2">
                                        <div className="flex flex-col items-center"><span className="text-gray-500 text-[9px] uppercase">Total</span><span className="text-gray-800">{totalWaitlisted}</span></div>
                                        <div className="flex flex-col items-center"><span className="text-orange-600 text-[9px] uppercase">Na Fila Hoje</span><span className="text-orange-700">{waitlistedCurrent}</span></div>
                                        <div className="flex flex-col items-center"><span className="text-green-600 text-[9px] uppercase">Atendidos</span><span className="text-green-700">{waitlistedCompleted}</span></div>
                                        <div className="flex flex-col items-center"><span className="text-orange-600 text-[9px] uppercase">Tempo Médio</span><span className="text-orange-700">{formatWaitTime(avgWaitTimeMins)}</span></div>
                                    </div>
                                </div>
                                
                                <div className="max-h-[500px] overflow-y-auto">
                                    {waitlistDetails.length > 0 ? (
                                        <div className="p-3 space-y-4">
                                            {/* Atualmente na Fila */}
                                            {waitlistDetails.filter(i => i.waitStatus === 'Aguardando').length > 0 && (
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-2 border-b pb-1">Atualmente na Fila</h4>
                                                    <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                                        {waitlistDetails.filter(i => i.waitStatus === 'Aguardando').map(item => (
                                                            <div key={item.id} className="p-3 flex flex-col hover:bg-gray-50 bg-orange-50/10 gap-2">
                                                                <div className="flex justify-between items-start">
                                                                    <p className="font-bold text-gray-800 text-sm">{item.equipmentType}</p>
                                                                    <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-orange-100 text-orange-700">Aguardando</span>
                                                                </div>
                                                                <p className="text-[11px] text-gray-500">Setor: <span className="font-bold">{item.sector}</span> | Entrada: {new Date(item.waitlistTime).toLocaleString('pt-BR')}</p>
                                                                <p className="text-[11px] text-gray-400">Paciente: <span className="font-medium text-gray-600">{item.patientName}</span> (MV: {item.patient_mv})</p>
                                                                <div className="text-right mt-1">
                                                                    <p className="text-xs font-bold text-gray-700">Tempo Decorrido</p>
                                                                    <p className="text-base font-black text-orange-600 animate-pulse">{formatWaitTime(item.timeMins)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Histórico (Atendidos / Cancelados) */}
                                            {(waitlistedCompleted > 0 || waitlistedCanceled > 0) && (
                                                <div>
                                                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2 border-b pb-1">Histórico (Atendidos / Cancelados)</h4>
                                                    <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                                        {waitlistDetails.filter(i => i.waitStatus !== 'Aguardando').map(item => (
                                                            <div key={item.id} className={`p-3 flex flex-col hover:bg-gray-50 gap-2 ${item.waitStatus === 'Cancelado' ? 'opacity-70' : ''}`}>
                                                                <div className="flex justify-between items-start">
                                                                    <p className="font-bold text-gray-800 text-sm">{item.equipmentType}</p>
                                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                                                        item.waitStatus === 'Atendido' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                    }`}>{item.waitStatus}</span>
                                                                </div>
                                                                <p className="text-[11px] text-gray-500">Setor: <span className="font-bold">{item.sector}</span> | Entrada: {new Date(item.waitlistTime).toLocaleString('pt-BR')}</p>
                                                                <p className="text-[11px] text-gray-400">Paciente: <span className="font-medium text-gray-600">{item.patientName}</span> (MV: {item.patient_mv})</p>
                                                                <div className="text-right mt-1">
                                                                    <p className="text-xs font-bold text-gray-700">Tempo Total</p>
                                                                    <p className={`text-base font-black ${item.waitStatus === 'Atendido' ? 'text-green-600' : 'text-red-600'}`}>{formatWaitTime(item.timeMins)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-xs text-gray-500">Nenhum registro no período.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setIsCanceledAnalysisOpen(!isCanceledAnalysisOpen)}
                            className="w-full flex justify-between items-center p-3 bg-gray-50 rounded-lg border-l-4 border-red-400 hover:bg-red-50 transition-colors focus:outline-none cursor-pointer mt-2"
                        >
                            <span className="text-gray-600 font-medium text-left">Solicitações Canceladas</span>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-red-600">{totalCanceled}</span>
                                {isCanceledAnalysisOpen ? <ChevronUp size={16} className="text-red-400" /> : <ChevronDown size={16} className="text-red-400" />}
                            </div>
                        </button>
                        
                        {isCanceledAnalysisOpen && (
                            <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden animate-fade-in my-2">
                                <div className="bg-red-50 p-3 border-b border-red-100 flex flex-col gap-3">
                                    <h3 className="font-bold text-red-800 flex items-center gap-2 text-sm">
                                        <XCircle size={16} /> Análise de Cancelamentos
                                    </h3>
                                    <div className="flex gap-4 text-xs font-medium justify-between px-2">
                                        <div className="flex flex-col items-center"><span className="text-gray-500 text-[9px] uppercase">Total</span><span className="text-gray-800">{totalCanceled}</span></div>
                                    </div>
                                </div>
                                
                                <div className="max-h-[500px] overflow-y-auto">
                                    {canceledRequestsList.length > 0 ? (
                                        <div className="p-3 space-y-4">
                                            <div className="divide-y divide-gray-100 border rounded-lg overflow-hidden">
                                                {canceledRequestsList.map(item => (
                                                    <div key={item.id} className="p-3 flex flex-col hover:bg-gray-50 gap-2">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-bold text-gray-800 text-sm">{item.equipmentType}</p>
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${item.waitlistTime ? 'bg-orange-100 text-orange-800 border border-orange-200' : 'bg-red-100 text-red-700'}`}>
                                                                {item.waitlistTime ? 'Cancelado Após Fila' : 'Cancelado'}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500">Setor: <span className="font-bold">{item.sector}</span> | Solicitado em: {new Date(item.timestamp).toLocaleString('pt-BR')}</p>
                                                        <p className="text-[11px] text-gray-400">Paciente: <span className="font-medium text-gray-600">{item.patientName}</span> (MV: {item.patient_mv})</p>
                                                        <div className="mt-2 bg-red-50 p-2 rounded border border-red-100">
                                                            <p className="text-[10px] font-bold text-red-800 uppercase mb-1">Motivo do Cancelamento:</p>
                                                            <p className="text-xs text-red-700 italic">"{item.cancelReason || 'Sem motivo registrado'}"</p>
                                                            <p className="text-[10px] text-red-500 mt-1 text-right border-t border-red-100/50 pt-1">Cancelado por: <span className="font-bold">{item.cancelName || 'N/A'}</span></p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-6 text-center text-xs text-gray-500">Nenhum registro no período.</div>
                                    )}
                                </div>
                            </div>
                        )}
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
    const [selectedType, setSelectedType] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [viewMode, setViewMode] = useState('current');
    const [historyStartDate, setHistoryStartDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 16);
    });
    const [historyEndDate, setHistoryEndDate] = useState(() => {
        return new Date().toISOString().slice(0, 16);
    });
    const [historyLogs, setHistoryLogs] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [timelineModalItem, setTimelineModalItem] = useState(null);
    const [timelineLogs, setTimelineLogs] = useState([]);
    const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            let startTs = String(historyStartDate);
            if (startTs.includes(' ') && !startTs.includes('T')) startTs = startTs.replace(' ', 'T');
            
            let endTs = String(historyEndDate);
            if (endTs.includes(' ') && !endTs.includes('T')) endTs = endTs.replace(' ', 'T');

            const { data, error } = await supabase
                .from('log_movimentacao_equipamentos')
                .select('*')
                .gte('data_transferencia', new Date(startTs).toISOString())
                .lte('data_transferencia', new Date(endTs).toISOString())
                .order('data_transferencia', { ascending: false });

            if (error) throw error;
            
            const enriched = (data || []).map(log => {
                const eq = inventory.find(i => i.id === log.equipamento_id);
                return {
                    ...log,
                    tag: eq?.tag || 'DESCONHECIDO',
                    model: eq?.model || 'DESCONHECIDO',
                    type: eq?.type || 'DESCONHECIDO'
                };
            });
            setHistoryLogs(enriched);
        } catch (err) {
            console.error(err);
            showNotification('error', 'Erro ao carregar histórico: ' + err.message);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchTimeline = async (equipment) => {
        setTimelineModalItem(equipment);
        setIsLoadingTimeline(true);
        try {
            const { data, error } = await supabase
                .from('log_movimentacao_equipamentos')
                .select('*')
                .eq('equipamento_id', equipment.id)
                .order('data_transferencia', { ascending: false });

            if (error) throw error;
            setTimelineLogs(data || []);
        } catch (err) {
            console.error(err);
            showNotification('error', 'Erro ao carregar linha do tempo: ' + err.message);
        } finally {
            setIsLoadingTimeline(false);
        }
    };

    const initialFormState = {
        tag: '', model: '', type: '', status: 'available', location: 'CEIC'
    };
    const [formData, setFormData] = useState(initialFormState);

    const types = useMemo(() => {
        const uniqueTypes = new Set(inventory.map(i => i.type || 'Outros'));
        return Array.from(uniqueTypes).sort();
    }, [inventory]);

    const filteredInventory = inventory.filter(item => {
        const matchesSearch = item.tag.toLowerCase().includes(search.toLowerCase()) ||
            item.model.toLowerCase().includes(search.toLowerCase()) ||
            item.type.toLowerCase().includes(search.toLowerCase());
        const matchesType = selectedType ? item.type === selectedType : true;
        return matchesSearch && matchesType;
    });

    const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const handleExportExcel = () => {
        if (filteredInventory.length === 0) return;
        const headers = ['TAG', 'TIPO', 'MODELO', 'STATUS', 'LOCAL'];
        let csvContent = headers.join(';') + '\n';
        filteredInventory.forEach(item => {
            const row = [item.tag, item.type, item.model, item.status, item.location];
            csvContent += row.map(escapeCsv).join(';') + '\n';
        });
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `frota_${selectedType || 'todos'}.csv`;
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPdf = () => {
        if (filteredInventory.length === 0) return;
        const printWindow = window.open('', '', 'width=800,height=600');
        if (!printWindow) {
            alert("O navegador bloqueou a janela pop-up. Permita pop-ups para gerar o PDF.");
            return;
        }
        const dateStr = new Date().toLocaleString('pt-BR');
        const html = `
            <html><head><title>Relatório de Frota</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
            </style></head>
            <body>
                <h2>Relatório de Frota: ${selectedType || 'Todos'}</h2>
                <p>Gerado em: ${dateStr} | Total: ${filteredInventory.length} itens</p>
                <table>
                    <thead><tr><th>TAG</th><th>Tipo</th><th>Modelo</th><th>Status</th><th>Local</th></tr></thead>
                    <tbody>${filteredInventory.map(i => `<tr><td>${i.tag}</td><td>${i.type}</td><td>${i.model}</td><td>${i.status}</td><td>${i.location}</td></tr>`).join('')}</tbody>
                </table>
                <script>window.onload = function() { window.print(); window.close(); }</script>
            </body></html>
        `;
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
    };

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
                                        <option value="inactive">Inativo (Baixa)</option>
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
                                        <option value="Higienização CEIC" />
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
                    <Database className="text-purple-600" /> Gestão da Frota
                </h2>
                <button data-testid="create-equipment-button" onClick={() => openModal()} className="h-[44px] px-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 flex items-center shadow-lg shadow-purple-200 transition-colors">
                    <PlusCircle size={20} className="mr-2" /> Adicionar Equipamento
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                <div
                    className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input data-testid="equipment-search-input" className="input pl-10 bg-white"
                                placeholder="Buscar por TAG, Modelo ou Tipo..." value={search} onChange={e =>
                                    setSearch(e.target.value)} />
                        </div>
                        <select
                            className="input bg-white w-full md:w-64"
                            value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                            <option value="">Todos os Tipos</option>
                            {types.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                        <span className="text-sm font-bold text-gray-500">Total: {filteredInventory.length} itens</span>
                        <div className="flex gap-2">
                            <button onClick={handleExportExcel} disabled={filteredInventory.length === 0} className="px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed">Exportar Excel</button>
                            <button onClick={handleExportPdf} disabled={filteredInventory.length === 0} className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-bold text-xs hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">Exportar PDF</button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white border-b border-gray-200">
                            <tr>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">TAG</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Equipamento</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status Local</th>
                                <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredInventory.length > 0 ? filteredInventory.map(item => (
                                <tr key={item.id} data-testid="equipment-row" className="hover:bg-gray-50 transition-colors">
                                    <td data-testid="equipment-real-tag" className="p-4 font-mono font-bold text-gray-800">{item.tag}</td>
                                    <td className="p-4 text-sm">
                                        <div className="font-bold text-gray-800">{item.type}</div>
                                        <div className="text-xs text-gray-500">{item.model}</div>
                                    </td>
                                    <td data-testid="equipment-real-status" className="p-4 text-sm">
                                        <StatusBadge status={item.status} /> <span
                                            data-testid="equipment-real-location"
                                            className="text-xs text-gray-400 block mt-1">{item.location}</span>
                                    </td>
                                    <td className="p-4 flex gap-1">
                                        <button onClick={() => fetchTimeline(item)} className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Linha do Tempo">
                                            <Clock size={18} />
                                        </button>
                                        <button onClick={() => openModal(item)} className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors" title="Editar">
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => { 
                                            const confirmText = window.prompt('ATENÇÃO: A exclusão permanente apaga todo o histórico.\n\nPara inativar o equipamento (RECOMENDADO), feche este aviso e altere o status para "Inativo (Baixa)" clicando no botão Editar.\n\nSe você realmente precisa EXCLUIR do banco de dados, digite a palavra EXCLUIR abaixo:');
                                            if (confirmText === 'EXCLUIR') {
                                                onDelete(item.id);
                                            } else if (confirmText !== null) {
                                                alert('Exclusão cancelada. Palavra de segurança incorreta ou vazia.');
                                            }
                                        }} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors" title="Excluir Permanentemente">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500">
                                        Nenhum equipamento encontrado na busca.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {timelineModalItem && createPortal(
                <div className="modal-overlay z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full animate-fade-in max-h-[85vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center mb-5 border-b pb-3 shrink-0">
                            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Clock size={22} className="text-blue-600" /> Linha do Tempo: {timelineModalItem.tag}
                            </h3>
                            <div className="flex gap-3 items-center">
                                <button onClick={() => {
                                    const printWindow = window.open('', '', 'width=800,height=600');
                                    if (!printWindow) return alert('Permita pop-ups para gerar o PDF.');
                                    const html = `
                                        <html><head><title>Relatório de Movimentação - ${timelineModalItem.tag}</title>
                                        <style>
                                            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                                            .header { border-bottom: 2px solid #6b21a8; padding-bottom: 10px; margin-bottom: 20px; }
                                            .meta { font-size: 14px; margin-bottom: 20px; color: #555; }
                                            table { width: 100%; border-collapse: collapse; font-size: 12px; }
                                            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                                            th { background-color: #f4f4f4; color: #333; }
                                            .obs { font-style: italic; color: #666; font-size: 11px; }
                                        </style></head>
                                        <body>
                                            <div class="header">
                                                <h2>Linha do Tempo de Equipamento</h2>
                                                <h3>TAG: ${timelineModalItem.tag} - ${timelineModalItem.type || 'Desconhecido'}</h3>
                                            </div>
                                            <div class="meta">
                                                <p><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</p>
                                                <p><strong>Total de Movimentações Registradas:</strong> ${timelineLogs.length}</p>
                                            </div>
                                            <table>
                                                <thead>
                                                    <tr>
                                                        <th>Data/Hora</th>
                                                        <th>Origem ➔ Destino</th>
                                                        <th>Tempo na Origem</th>
                                                        <th>Responsável</th>
                                                        <th>Observações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${timelineLogs.map((log, index) => {
                                                        const prevLog = timelineLogs[index - 1];
                                                        let durationStr = '-';
                                                        if (prevLog) {
                                                            const diffMs = new Date(prevLog.data_transferencia).getTime() - new Date(log.data_transferencia).getTime();
                                                            const diffHrs = Math.floor(diffMs / 3600000);
                                                            const diffMins = Math.floor((diffMs % 3600000) / 60000);
                                                            durationStr = `${diffHrs}h ${diffMins}m`;
                                                        }
                                                        const resp = String(log.responsavel_badge || 'SISTEMA');
                                                        const respFmt = resp.includes('::') ? `${resp.split('::')[0]} (${resp.split('::')[1]})` : resp;
                                                        return `
                                                            <tr>
                                                                <td>${new Date(log.data_transferencia).toLocaleString('pt-BR')}</td>
                                                                <td><strong>${log.setor_origem || 'CEIC'}</strong> ➔ <strong>${log.setor_destino}</strong></td>
                                                                <td>${durationStr}</td>
                                                                <td>${respFmt}</td>
                                                                <td class="obs">${log.observacoes || '-'}</td>
                                                            </tr>
                                                        `;
                                                    }).join('')}
                                                </tbody>
                                            </table>
                                            <script>window.onload = function() { window.print(); window.close(); }</script>
                                        </body></html>
                                    `;
                                    printWindow.document.write(html);
                                    printWindow.document.close();
                                }} className="px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors">
                                    Exportar PDF
                                </button>
                                <button onClick={() => setTimelineModalItem(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                            </div>
                        </div>
                        <div className="overflow-y-auto pr-2 pb-4 flex-1">
                            {isLoadingTimeline ? (
                                <div className="text-center text-gray-500 py-8">Carregando linha do tempo...</div>
                            ) : timelineLogs.length > 0 ? (
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
                                    {timelineLogs.map((log, index) => {
                                        const prevLog = timelineLogs[index - 1];
                                        let durationStr = '';
                                        if (prevLog) {
                                            const diffMs = new Date(prevLog.data_transferencia).getTime() - new Date(log.data_transferencia).getTime();
                                            const diffHrs = Math.floor(diffMs / 3600000);
                                            const diffMins = Math.floor((diffMs % 3600000) / 60000);
                                            durationStr = `Ficou ${diffHrs}h ${diffMins}m`;
                                        }
                                        return (
                                            <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                    <MapPin size={16} />
                                                </div>
                                                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                                        <time className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded">{new Date(log.data_transferencia).toLocaleString('pt-BR')}</time>
                                                        {durationStr && <div className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">{durationStr}</div>}
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="flex-1 bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                                            <div className="text-[10px] text-slate-400 uppercase font-bold">Origem</div>
                                                            <div className="font-bold text-slate-700">{log.setor_origem || 'CEIC'}</div>
                                                        </div>
                                                        <ArrowRight className="text-slate-300 shrink-0" size={16} />
                                                        <div className="flex-1 bg-purple-50 p-2 rounded border border-purple-100 text-center">
                                                            <div className="text-[10px] text-purple-400 uppercase font-bold">Destino</div>
                                                            <div className="font-bold text-purple-700">{log.setor_destino}</div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1 text-sm bg-slate-50 p-2 rounded">
                                                        <div className="text-xs text-slate-500 font-bold flex items-center gap-1">
                                                            <User size={12}/> Responsável pela Movimentação
                                                        </div>
                                                        <div className="font-medium text-slate-800">{String(log.responsavel_badge || 'SISTEMA').split('::')[0]}</div>
                                                        {String(log.responsavel_badge || '').includes('::') && <div className="text-xs text-slate-500">{String(log.responsavel_badge).split('::')[1]}</div>}
                                                    </div>
                                                    
                                                    {log.observacoes && (
                                                        <div className="mt-3 text-xs bg-red-50 text-red-700 p-2 rounded border border-red-100">
                                                            <strong>Observação/Defeito:</strong> {log.observacoes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center text-gray-500 py-8">Nenhuma movimentação registrada para este equipamento.</div>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const AdminIndicators = ({ inventory, requests }) => {
    const [selectedCategory, setSelectedCategory] = useState('ALL');

    const todayStr = new Date().toISOString().substring(0, 10);
    const [startDate, setStartDate] = useState(`${todayStr}T00:00`);
    const [endDate, setEndDate] = useState(`${todayStr}T23:59`);
    const [appliedStart, setAppliedStart] = useState(`${todayStr}T00:00`);
    const [appliedEnd, setAppliedEnd] = useState(`${todayStr}T23:59`);

    const isWithinRange = (timestamp) => {
        if (!timestamp) return false;
        let ts = String(timestamp);
        if (ts.includes(' ') && !ts.includes('T')) {
            ts = ts.replace(' ', 'T');
        }
        const t = new Date(ts).getTime();
        const s = appliedStart ? new Date(appliedStart).getTime() : 0;
        const e = appliedEnd ? new Date(appliedEnd).getTime() : Infinity;
        return !isNaN(t) && t >= s && t <= e;
    };

    const baseInventory = inventory;
    const baseRequests = requests.filter(r => isWithinRange(r.timestamp));

    const filteredInventory = selectedCategory === 'ALL'
        ? baseInventory
        : baseInventory.filter(i => getCategoryForType(i.type) === selectedCategory);

    const filteredRequests = selectedCategory === 'ALL'
        ? baseRequests
        : baseRequests.filter(r => getCategoryForType(r.equipmentType) === selectedCategory);

    const totalInventory = filteredInventory.length;
    const availableRate = totalInventory > 0 ? Math.round((filteredInventory.filter(i => i.status
        === 'available').length / totalInventory) * 100) : 0;
    const maintRate = totalInventory > 0 ? Math.round((filteredInventory.filter(i => ['maintenance', 'preventive', 'reparo'].includes(i.status)).length / totalInventory) * 100) : 0;

    const totalRequests = filteredRequests.length;
    const urgentRequests = filteredRequests.filter(r => r.isUrgent).length;
    const urgentRate = totalRequests > 0 ? Math.round((urgentRequests / totalRequests) * 100) : 0;

    const cancelledRequests = filteredRequests.filter(r => ['cancelled', 'canceled', 'cancelado'].includes(r.status)).length;
    const cancelRate = totalRequests > 0 ? Math.round((cancelledRequests / totalRequests) * 100) :
        0;

    const completedReturns = filteredRequests.filter(r => ['return_pickup', 'recolhimento'].includes(r.kind) && ['completed', 'concluido'].includes(r.status)).length;

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

    const approvedRequestsWithTime = filteredRequests.filter(r => ['approved', 'aprovado', 'delivered', 'completed', 'in_transit', 'in_transfer'].includes(r.status) &&
        r.fulfilledAt);
    let totalFulfillmentTimeMs = 0;
    let slaMetCount = 0;

    const parseTs = (ts) => {
        if (!ts) return NaN;
        let str = String(ts);
        if (str.includes(' ') && !str.includes('T')) str = str.replace(' ', 'T');
        return new Date(str).getTime();
    };

    approvedRequestsWithTime.forEach(r => {
        const start = parseTs(r.timestamp);
        const end = parseTs(r.fulfilledAt);
        const diff = Math.max(0, end - start);
        if (!isNaN(diff)) {
            totalFulfillmentTimeMs += diff;
            const slaLimitMs = getSlaInfo(r).ms;
            if (diff <= slaLimitMs) slaMetCount++;
        }
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
                <div className="flex flex-wrap items-end gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm w-full md:w-auto">
                    <div className="flex flex-col w-full sm:w-auto">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Início</label>
                        <input type="datetime-local" data-testid="report-filter-start"
                            className="bg-gray-50 border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-purple-500 w-full"
                            value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div className="flex flex-col w-full sm:w-auto">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Fim</label>
                        <input type="datetime-local" data-testid="report-filter"
                            className="bg-gray-50 border border-gray-200 rounded text-xs px-2 py-1.5 outline-none focus:border-purple-500 w-full"
                            value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <button
                        onClick={() => { setAppliedStart(startDate); setAppliedEnd(endDate); }}
                        className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white font-bold py-1.5 px-3 rounded text-xs shadow-sm transition-colors flex items-center justify-center gap-1"
                    >
                        <Search size={14} /> Atualizar
                    </button>
                </div>
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
                                    {filteredRequests.filter(r => ['approved', 'aprovado', 'delivered', 'completed', 'in_transit', 'in_transfer'].includes(r.status)).length}
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
                                    {completedReturns}</p>
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

// Componente de Suporte Técnico para envio de mensagens
const SupportView = ({ userProfile, showNotification }) => {
    const [formData, setFormData] = useState({
        nome: '',
        unidade: userProfile?.name || userProfile?.sector || '',
        ramal: '',
        emailPrefix: '',
        tipo: 'Dúvida',
        mensagem: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.nome || !formData.unidade || !formData.emailPrefix || !formData.mensagem) {
            showNotification('error', 'Preencha todos os campos obrigatórios.');
            return;
        }

        setIsSubmitting(true);
        try {
            const emailFull = formData.emailPrefix + '@hc.fm.usp.br';
            const payload = {
                nome: formData.nome,
                unidade: formData.unidade,
                ramal: formData.ramal,
                email: emailFull,
                tipo: formData.tipo,
                mensagem: formData.mensagem
            };

            const { error } = await supabase.from('ceic_suporte').insert([payload]);
            if (error) throw error;

            showNotification('success', 'Mensagem enviada com sucesso! A equipe de suporte analisará em breve.');
            setFormData({ ...formData, emailPrefix: '', ramal: '', tipo: 'Dúvida', mensagem: '' });
        } catch (error) {
            console.error('Erro ao enviar suporte:', error);
            showNotification('error', 'Erro ao enviar a mensagem. Tente novamente mais tarde.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 sm:p-6 animate-fade-in pb-24">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                <HelpCircle className="text-blue-600" /> Suporte Técnico
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-gray-600 mb-6">Utilize este canal para encaminhar dúvidas, sugestões, elogios ou relatar problemas no sistema. Nossas equipes analisarão seu chamado o mais breve possível.</p>
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6 flex items-start gap-3">
                    <AlertCircle className="shrink-0 mt-0.5 text-yellow-600" size={20} />
                    <div>
                        <p className="font-bold text-sm mb-1">Horário de Atendimento: Segunda a sexta das 06h às 16h.</p>
                        <p className="text-sm">Fora do horário de atendimento e em casos de urgência/emergência, entre em contato com a CEIC através dos ramais <strong>6638</strong> ou <strong>6601</strong>.</p>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Nome Completo *</label>
                            <input type="text" className="input" value={formData.nome} onChange={e => setFormData({ ...formData, nome: e.target.value })} required />
                        </div>
                        <div>
                            <label className="label">Unidade / Setor *</label>
                            <input type="text" className="input bg-gray-100 text-gray-500 cursor-not-allowed" value={formData.unidade} disabled />
                        </div>
                        <div>
                            <label className="label">Ramal</label>
                            <input type="text" className="input" value={formData.ramal} onChange={e => setFormData({ ...formData, ramal: e.target.value })} placeholder="Ex: 9999" />
                        </div>
                        <div>
                            <label className="label">E-mail Institucional *</label>
                            <div className="flex">
                                <input type="text" className="input rounded-r-none border-r-0 focus:z-10 focus:ring-1" value={formData.emailPrefix} onChange={e => setFormData({ ...formData, emailPrefix: e.target.value.replace(/@.*/, '') })} placeholder="seunome" required />
                                <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">@hc.fm.usp.br</span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="label">Tipo de Mensagem *</label>
                        <select className="input h-[50px]" value={formData.tipo} onChange={e => setFormData({ ...formData, tipo: e.target.value })} required>
                            <option value="Dúvida">Dúvida</option>
                            <option value="Sugestão">Sugestão</option>
                            <option value="Elogio">Elogio</option>
                            <option value="Problema">Problema / Falha</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Mensagem *</label>
                        <textarea className="input min-h-[120px] resize-y py-3" value={formData.mensagem} onChange={e => setFormData({ ...formData, mensagem: e.target.value })} placeholder="Descreva aqui sua demanda detalhadamente..." required></textarea>
                    </div>
                    <div className="pt-4">
                        <button type="submit" disabled={isSubmitting} className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            <Send size={18} /> {isSubmitting ? 'Enviando...' : 'Enviar Mensagem'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// Componente Gerencial de Leitura de Suporte
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
                                    <p className="text-sm text-gray-500">{c.email} {c.ramal ? `| Ramal: ${c.ramal}` : ''}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs font-bold px-2 py-1 rounded border ${getTagStyle(c.tipo)}`}>{c.tipo}</span>
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
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap mt-2">{c.resposta}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-bold text-gray-600 flex items-center gap-2"><CheckCircle size={16}/> Registrar Atendimento:</label>
                                        <textarea 
                                            className="input text-sm min-h-[80px]" 
                                            placeholder="O que foi feito para resolver este chamado?"
                                            value={respostas[c.id] || ''}
                                            onChange={(e) => setRespostas({...respostas, [c.id]: e.target.value})}
                                        ></textarea>
                                        <div className="flex justify-end mt-2">
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
                setor_nome: norm(formData.setor_nome),
                nome: norm(formData.setor_nome)
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
    const userProfileRef = useRef(null);
    useEffect(() => {
        userProfileRef.current = userProfile;
    }, [userProfile]);

    const triggerBrowserNotification = (title, body) => {
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        const profileRole = String(userProfileRef.current?.role || '').toUpperCase();
        if (profileRole.includes('OPERACIONAL') || profileRole.includes('ASSISTENCIAL')) {
            try {
                new Notification(title, { body, icon: '/favicon.ico' });
            } catch (e) {
                console.error("Erro ao exibir notificação de navegador", e);
            }
        }
    };

    const [currentView, setCurrentView] = useState('login');
    const [isLoading, setIsLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [expandedSidebarGroups, setExpandedSidebarGroups] = useState({
        'Gerencial': false,
        'Operacional': false,
        'Assistencial': false,
        'Sistema e Suporte': false,
        'Outros': false
    });
    
    const toggleSidebarGroup = (groupName) => {
        setExpandedSidebarGroups(prev => ({
            ...prev,
            [groupName]: !prev[groupName]
        }));
    };

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
    const inventoryRef = useRef([]);
    useEffect(() => { inventoryRef.current = inventory; }, [inventory]);
    const [requests, setRequests] = useState([]);
    const requestsRef = useRef([]);
    useEffect(() => { requestsRef.current = requests; }, [requests]);
    const [ventilatoryCatalog, setVentilatoryCatalog] = useState([]);
    const [generalCatalog, setGeneralCatalog] = useState([]);
    const [fullCatalog, setFullCatalog] = useState([]);
    const [unidades, setUnidades] = useState([]);

    // =========================================================
    // MOTORES DE LOGS PARA HISTÓRICOS E DASHBOARDS (BI)
    // =========================================================
    const registrarLogPedido = async (pedidoId, statusAnterior, statusNovo) => {
        try {
            await supabase.from('logs_pedidos').insert([{
                pedido_id: pedidoId,
                status_anterior: statusAnterior ? String(statusAnterior).toLowerCase() : null,
                status_novo: statusNovo ? String(statusNovo).toLowerCase() : null,
                responsavel_badge: userProfile?.login || 'SISTEMA'
            }]);
        } catch (err) {
            console.error("Falha silenciosa ao gravar log_pedido:", err);
        }
    };

    const registrarLogMovimentacao = async (equipamentoId, origem, destino, pacienteMv, nomeUsuario = null, observacoes = null) => {
        try {
            let responsavelStr = userProfile?.login || 'SISTEMA';
            if (nomeUsuario) {
                responsavelStr = `${responsavelStr}::${nomeUsuario}`;
            }

            const payload = {
                equipamento_id: equipamentoId,
                setor_origem: origem || 'CEIC',
                setor_destino: destino,
                paciente_mv: pacienteMv || null,
                responsavel_badge: responsavelStr
            };
            if (observacoes) {
                payload.observacoes = observacoes;
            }

            const { error } = await supabase.from('log_movimentacao_equipamentos').insert([payload]);
            if (error && error.code === '42703') {
                console.warn('Coluna observacoes não existe, ignorando observações...');
                delete payload.observacoes;
                await supabase.from('log_movimentacao_equipamentos').insert([payload]);
            }
        } catch (err) {
            console.error("Falha silenciosa ao gravar log_movimentacao:", err);
        }
    };

    const availableLocations = useMemo(() => {
        const locs = Array.from(new Set(inventory.map(i => i.location).filter(Boolean))).sort();
        return locs.length > 0 ? locs : ['CEIC', 'Ag. Preventiva', 'Engenharia Clínica', 'Higienização CEIC', '03DN', '03DS', '04GN', '04GS', '04CC', '04DN', '04DS', 'Centro Cirúrgico'];
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
                    setGeneralCatalog(catData.filter(i => !normUpper(i.categoria).includes('VENTILATORIA')));
                    setVentilatoryCatalog(catData.filter(i => normUpper(i.categoria).includes('VENTILATORIA')));
                }
                else if (catError) console.error("Erro ao buscar catalogo_equipamentos:", catError);
            } catch (err) {
                console.error('Erro de conexão ao buscar catalogo_equipamentos', err);
            }
            try {
                const { data: uniData, error: uniError } = await supabase.from('ceic_usuarios').select('login, nome').order('login', { ascending: true });
                if (uniData && !uniError) {
                    setUnidades(uniData);
                } else if (uniError) {
                    console.error("Erro ao buscar unidades:", uniError);
                }
            } catch (err) {
                console.error("Erro de conexão ao buscar unidades", err);
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
                    
                    const oldReq = requestsRef.current.find(req => req.id === payload.new.id);
                    if (oldReq) {
                        if (nextItem.notificationTime && oldReq.notificationTime !== nextItem.notificationTime) {
                            triggerBrowserNotification(
                                'Orientação do Operacional',
                                nextItem.notificationMessage || 'Você tem uma nova orientação sobre o pedido.'
                            );
                        }
                    }
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
        triggerBrowserNotification('Notificação CEIC', message);
    };

    const handleLogin = (profile) => {
        setUserProfile(profile);

        // Solicita permissão de notificação no navegador ao fazer login
        if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
            Notification.requestPermission().catch(console.error);
        }
        const p = String(profile.role).toUpperCase();
        if (p === 'ASSISTENCIAL') {
            if (String(profile.login).toUpperCase() === '09B2') setCurrentView('meus_pedidos');
            else setCurrentView('nova_solicitacao');
        }
        else if (p === 'OPERACIONAL') setCurrentView('dashboard');
        else if (p === 'GESTAO' || p === 'GERENCIAL') setCurrentView('admin_dashboard');
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
                    specific_location: null,
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
            const normalizedEquipmentType = normalizeEquipmentTypeForDb(requestData.equipmentType || 'Não Informado');

            const payloadFormatado = {
                status: 'pending',
                kind: requestData.kind || 'rotina',
                equipment_type: requestData.equipmentType || requestData.equipment_type || normalizedEquipmentType,
                catalogo_id: requestData?.catalogo_id || null,
                
                // O SETOR DEVE INCLUIR O CÓDIGO DO LOGIN (Ex: 04CC - ENF. RETAG...)
                sector: (userProfile?.login && userProfile?.name ? `${userProfile.login} - ${userProfile.name}` : userProfile?.name) || userProfile?.sector || 'Não Informado',
                
                // AQUI PEGAMOS EXATAMENTE O QUE FOI DIGITADO NO FORMULÁRIO (Sem usar userProfile)
                requester_name: requestData.requesterName || requestData.solicitante || requestData.collaboratorName || requestData.nomeSolicitante || 'Não Informado',
                requester_badge: requestData.requesterBadge || requestData.matricula || requestData.badge || requestData.collaboratorBadge || 'Não Informado',
                extension: requestData.extension || requestData.ramal || '-',
                
                accessories: requestData.accessories || null,
                patient_name: requestData.patientName || requestData.nomePaciente || null,
                patient_mv: requestData.patientMV || requestData.patientMv || requestData.mv || null,
                patient_bed: requestData.patientBed || requestData.leito || null,
                is_urgent: !!requestData?.isUrgent,
                tev_priority: requestData.tevPriority || null,
                tev_group: requestData.tevGroup || null
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

            // GRAVAÇÃO DO LOG: Entrada do pedido pendente no sistema
            if (data) {
                await registrarLogPedido(data.id, null, 'pending');
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

    const handleDirectDelivery = async (deliveryData) => {
        try {
            const { tag, destinationSector, patientMV, patientBed, patientName } = deliveryData;
            
            const equipment = inventory.find(e => normUpper(e.tag) === normUpper(tag));
            if (!equipment) {
                showNotification('error', `Equipamento com TAG ${tag} não encontrado no inventário.`);
                return;
            }
            if (!['CEIC', 'ESTOQUE CENTRAL'].includes(equipment.location) || !['available', 'in_use', 'allocated'].includes(equipment.status)) {
                showNotification('error', `Equipamento ${tag} não está disponível na CEIC (Local: ${equipment.location}, Status: ${equipment.status}).`);
                return;
            }

            const now = new Date().toISOString();
            
            const dbPayload = {
                status: 'in_transfer',
                kind: 'equipment_request',
                equipment_type: equipment.type || equipment.model || 'EQUIPAMENTO',
                requester_name: userProfile?.name || 'Gestão CEIC',
                requester_badge: userProfile?.login || '00000',
                sector: destinationSector,
                is_urgent: false,
                patient_name: patientName || '',
                patient_bed: patientBed || '',
                patient_mv: patientMV || '',
                equipment_tag: equipment.tag
            };

            const { data, error } = await supabase.from('pedidos').insert([dbPayload]).select();
            if (error) throw error;
            const newReq = mapPedido(data[0]);

            const invPayload = {
                status: 'in_transfer',
                transfer_to: destinationSector,
                transfer_to_bed: patientBed,
                patient_name: patientName,
                patient_mv: patientMV
            };
            const { error: invError } = await supabase.from('equipamentos').update(invPayload).eq('id', equipment.id);
            if (invError) throw invError;
            
            await registrarLogMovimentacao(equipment.tag, equipment.type, 'Entrega Direta (CEIC)', destinationSector, userProfile?.name || 'Gestão', userProfile?.login || '0000');
            
            setRequests(prev => [...prev, newReq]);
            const updatedEquip = { ...equipment, ...invPayload };
            setInventory(prev => prev.map(e => e.id === equipment.id ? updatedEquip : e));

            showNotification('success', 'Entrega direta realizada com sucesso!');
        } catch (error) {
            console.error('Erro na entrega direta:', error);
            showNotification('error', `Falha ao realizar entrega: ${error.message}`);
        }
    };

    const handleFulfillRequest = async (request, tagInput) => {
        const isAccessoryOnly = String(request.equipmentType || '').trim().toUpperCase() === 'APENAS ACESSÓRIOS' || String(request.equipmentType || '').trim().toUpperCase() === 'APENAS ACESSORIOS';

        if (isAccessoryOnly) {
            try {
                const arrivalTime = new Date().toISOString();
                const { data, error } = await supabase
                    .from('pedidos')
                    .update({
                        status: 'in_transfer',
                        equipment_tag: 'ACESSÓRIOS (S/ TAG)',
                        arrival_time: arrivalTime,
                        fulfilled_at: new Date().toISOString()
                    })
                    .eq('id', request.id)
                    .select();

                if (error || !data || data.length === 0) throw new Error('Falha ao atualizar pedido de acessórios');

                await registrarLogPedido(request.id, request.status, 'in_transfer');

                const updatedReq = mapPedido(data[0]);
                setRequests(prev => prev.map(r => r.id === request.id ? updatedReq : r));

                showNotification('success', 'Entrega de acessórios registrada com sucesso!');
            } catch (error) {
                showNotification('error', `Falha ao registrar entrega: ${error.message}`);
            }
            return;
        }

        if (!tagInput || tagInput.length === 0) {
            showNotification('error', 'Por favor, insira a(s) TAG(s) do equipamento.');
            return;
        }

        const tagsArray = Array.isArray(tagInput) ? tagInput : [tagInput];
        const equipmentsToAssign = [];
        const cleanedTagsForDb = [];

        // Extrai e normaliza os tipos de equipamento requeridos para validação estrutural.
        let expectedTypes = [];
        const normEqType = normUpper(request.equipmentType);
        if (normEqType.includes('CAPNOGRAFIA')) {
            expectedTypes = ['MODULO DE CAPNOGRAFIA', 'CABO DE CAPNOGRAFIA', 'CELULA DE CAPNOGRAFIA'];
        } else if (normEqType === 'ALTO FLUXO') {
            expectedTypes = ['ALTO FLUXO', 'UMIDIFICADOR'];
        } else if (normEqType === 'VENTILADOR PULMONAR INVASIVO') {
            expectedTypes = ['VENTILADOR PULMONAR INVASIVO', 'CASSETE EXPIRATORIO'];
            const hasUmidificacaoAtiva = Array.isArray(request.accessories) && request.accessories.some(a => normUpper(a).includes('UMIDIFICACAO ATIVA'));
            if (hasUmidificacaoAtiva) expectedTypes.push('UMIDIFICADOR');
        } else {
            expectedTypes = [normEqType];
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


        try {
            const arrivalTime = new Date().toISOString();
            const destinationSector = request.requesterBadge || request.sector || request.login;
            const { data, error } = await supabase
                .from('pedidos')
                .update({
                    status: 'in_transfer',
                    equipment_tag: cleanedTagsForDb.join(', '),
                    arrival_time: arrivalTime,
                    fulfilled_at: new Date().toISOString()
                })
                .eq('id', request.id)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco de pedidos');
            }

            // LOG DO PEDIDO: Transição de status na fila
            await registrarLogPedido(request.id, request.status, 'in_transfer');

            // BLINDAGEM: Update na tabela equipamentos com a coluna status e a nova location
            const { error: eqError } = await supabase
                .from('equipamentos')
                .update({
                    status: 'allocated',
                    location: request.requesterBadge || request.sector || request.login,
                    patient_mv: request.patient_mv || null,
                    patient_name: request.patientName || null, // <--- ADICIONE ESTA LINHA
                    in_use_since: new Date().toISOString()
                })
                .in('id', equipmentsToAssign.map(eq => eq.id));

            if (eqError) {
                console.error('Erro estrito no update de equipamentos:', eqError);
                throw new Error(`Falha ao atualizar estoque: ${eqError.message}`);
            }

            // LOG DE MOVIMENTAÇÃO: Grava a saída física de cada equipamento da CEIC para a enfermaria
            for (const eq of equipmentsToAssign) {
                await registrarLogMovimentacao(
                    eq.id,
                    eq.location, // Origem (Ex: CEIC)
                    request.requesterBadge || request.sector || 'UNIDADE', // Destino
                    request.patient_mv,
                    request.requesterName
                );
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
            const dbTimes = {};
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
                pedidoId: request.id, // Armazena o ID do pedido para finalizá-lo APENAS no check-in
                tag: request.equipmentTag, type: request.equipmentType, hasDefect: request.problemReported === 'Sim',
                defectDesc: request.problemDescription
            });
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
                    cancel_name: cancelData?.cancelName || userProfile?.name || 'Operacional',
                    cancel_badge: cancelData?.cancelBadge || userProfile?.login || 'N/A',
                    cancel_reason: cancelData?.cancelReason || 'Sem motivo informado'
                })
                .eq('id', requestId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            // LOG DO PEDIDO: Registra a saída forçada do fluxo
            const pedidoOriginal = requests.find(r => r.id === requestId);
            await registrarLogPedido(requestId, pedidoOriginal?.status || 'pending', 'cancelled');

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
            
            // Prepara as atualizações básicas da notificação
            const updates = {
                notification_message: message,
                notification_type: type,
                notification_time: notificationTime
            };

            // A MÁGICA AQUI: Se a CEIC avisa que vai entregar ou que é para buscar,
            // o sistema entende que a espera acabou e tira o pedido da fila!
            if (type === 'delivery' || type === 'pickup') {
                updates.is_waitlisted = false;
                updates.status = 'pending'; // Retorna ao status normal de pendência
            }

            const { data, error } = await supabase
                .from('pedidos')
                .update(updates)
                .eq('id', requestId)
                .select();

            if (error || !data || data.length === 0) {
                throw new Error('Operação não persistiu no banco');
            }

            // Atualiza estado local para refletir a mensagem no card imediatamente
            const updatedReq = mapPedido(data[0]);
            setRequests(prev => prev.map(r => r.id === requestId ? updatedReq : r));

            showNotification('success', 'Notificação enviada com sucesso!');
        } catch (error) {
            console.error('Erro ao enviar notificação:', error);
            showNotification('error', `Erro ao enviar notificação: ${error.message}`);
        }
    };

    const handleReturnByTag = async ({ tag, hasDefect, defectDescription, returnedAllAccessories, unitNotified, patientDamage, notificationNumber, collaboratorName }) => {
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
        const nextLocation = hasDefect ? 'Engenharia Clínica' : 'Higienização CEIC';

        const supabaseUpdates = {
            status: nextStatus,
            location: nextLocation,
            // CORREÇÃO: Limpando o paciente no Supabase ao dar entrada na Triagem
            patient_mv: null,
            patient_name: null,
            in_use_since: null,
            // CORREÇÃO: Forçando limpeza de qualquer estado de transferência zumbi ou alocação (Prevalência da CEIC)
            specific_location: null,
            transfer_status: null,
            transfer_to: null,
            transfer_to_bed: null
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

            // LOG DE MOVIMENTAÇÃO: Registra que o equipamento saiu da enfermaria de origem e retornou aos cuidados da CEIC
            await registrarLogMovimentacao(
                item.id,
                item.location, // Setor assistencial onde estava alocado
                nextLocation,  // Destino (Higienização CEIC ou Engenharia Clínica)
                item.patient_mv,
                collaboratorName,
                hasDefect ? defectDescription : null
            );

            // Finaliza qualquer pedido pendente aberto para essa TAG (Prevalência da CEIC no Check-in)
            // Se o setor esqueceu de dar o aceite e a CEIC recolheu e bipou, o sistema força a baixa de tudo que ficou "zumbi"
            const activeRequests = requests.filter(r => 
                ['pickup_requested', 'in_transfer', 'approved', 'delivered', 'waitlisted'].includes(r.status) && 
                splitTagList(r.equipmentTag).includes(normUpper(item.tag))
            );
            
            if (activeRequests.length > 0) {
                const requestIds = activeRequests.map(r => r.id);
                await supabase
                    .from('pedidos')
                    .update({ status: 'completed', fulfilled_at: new Date().toISOString() })
                    .in('id', requestIds);
                
                setRequests(prev => prev.map(r => requestIds.includes(r.id) ? { ...r, status: 'completed' } : r));
            }

            setInventory(prev => prev.map(it => (normUpper(it.tag) === cleanTag ? mapEquip({ ...it, ...localUpdates }) : it)));
            setTriageData(null);
            showNotification(hasDefect ? 'error' : 'success', hasDefect ? 'Enviado para Manutenção.' : 'Baixa concluída! Item enviado à Higienização.');
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
                console.error("❌ ERRO SUPABASE [HIGIENIZAÇÃO]:", releaseError.message, releaseError.details, releaseError.hint);
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
        try {
            // 1. Atualiza equipamento (o que já estava funcionando)
            const { error: updateError } = await supabase
                .from('equipamentos')
                .update({
                    status: 'available',
                    location: 'CEIC'
                })
                .eq('id', itemId);

            if (updateError) throw new Error("Erro ao liberar equipamento: " + updateError.message);

            // 2. Tenta salvar o histórico, mas não trava o sistema se falhar
            try {
                const { error: logError } = await supabase
                    .from('historico_manutencao')
                    .insert([{
                        equipamento_id: itemId,
                        returner: dataArgs.returner,
                        receiver: dataArgs.receiver,
                        badge: dataArgs.badge,
                        maintenance_notes: dataArgs.notes
                    }]);
                
                if (logError) console.error("Erro ao salvar histórico (mas equipamento foi liberado):", logError);
            } catch (logErr) {
                console.error("Falha silenciosa ao salvar histórico:", logErr);
            }

            // Sucesso
            showNotification('success', 'Retorno registrado e equipamento liberado!');
            setInventory(prev => prev.map(it => it.id === itemId ? { ...it, status: 'available', location: 'CEIC' } : it));
            
        } catch (error) {
            console.error("Erro crítico na operação de retorno:", error);
            showNotification('error', `Falha ao processar: ${error.message}`);
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

            setInventory(prev => prev.map(i => i.id === itemId ? mapEquip(data[0]) : i));
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

            setInventory(prev => prev.map(i => i.id === itemId ? mapEquip(data[0]) : i));
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
                
                // 1. INVERSÃO DE PRIORIDADE: O local atual do equipamento manda!
                sector: item.location || userProfile?.sector || 'CEIC',
                
                // 2. O QUE FOI DIGITADO NO MODAL MANDA MAIS QUE O LOGIN
                requester_name: collaboratorName || userProfile?.name || 'Não Informado',
                requester_badge: collaboratorBadge || userProfile?.login || '',
                extension: userProfile?.senha || '',
                
                accessories: null,
                patient_name: item.patientName || item.patient_name || null,
                patient_mv: item.patient_mv || null,
                patient_bed: item.specificLocation ? String(item.specificLocation) : null,
                problem_reported: hasIssue === 'Sim',
                problem_description: issueDescription ? String(issueDescription) : null
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
                    transfer_to: destination,
                    transfer_to_bed: destinationBed || null
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
                        patient_bed: destinationBed || null,
                        fulfilled_at: new Date().toISOString()
                    })
                    .eq('id', activeReq.id);
            }

            // Atualiza inventário local
            setInventory(prev => prev.map(eq =>
                normUpper(eq.tag) === normUpper(equipmentTag) ? { ...eq, transferStatus: 'in_transit', transferTo: destination, transferToBed: destinationBed } : eq
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

    const handleConfirmTransfer = async (itemOrReq, optPedido, receiverData = {}) => {
        try {
            let tagsToConfirm = [];
            let pedidoId = null;
            let pedidoObj = null;

            if (itemOrReq && itemOrReq.id && itemOrReq.equipmentTag) {
                // called from MyRequestsView with (req)
                tagsToConfirm = splitTagList(itemOrReq.equipmentTag);
                pedidoId = itemOrReq.id;
                pedidoObj = itemOrReq;
            } else if (itemOrReq && itemOrReq.tag) {
                // called from MyAreaEquipmentView with (item, pedido)
                tagsToConfirm = splitTagList(itemOrReq.tag);
                pedidoId = optPedido?.id;
                pedidoObj = optPedido;
            } else {
                throw new Error("Parâmetros inválidos para confirmação.");
            }

            // Descobre o leito de destino se foi informado na transferencia
            const eqToUpdate = inventory.find(i => tagsToConfirm.includes(normUpper(i.tag)));
            const incomingBed = eqToUpdate?.transferToBed || pedidoObj?.patient_bed || null;

            // 1. Atualiza o Equipamento (Payload Limpo e Sanitizado):
            const payloadAtualizacao = {
                location: userProfile?.login, // Envia estritamente a sigla do login
                transfer_status: null,        // Limpa usando null nativo
                transfer_to: null,            // Limpa usando null nativo
                transfer_to_bed: null,
                specific_location: incomingBed, // ATUALIZA O LEITO NO EQUIPAMENTO!
                received_by_sector: true,
                status: 'allocated',
                in_use_since: new Date().toISOString()
            };

            const { error: equipError } = await supabase.from('equipamentos')
                .update(payloadAtualizacao)
                .in('tag', tagsToConfirm);

            if (equipError) {
                console.error("❌ ERRO DETALHADO DO SUPABASE 400:", {
                    mensagem: equipError.message,
                    detalhes: equipError.details,
                    dica: equipError.hint
                });
                throw equipError;
            }

            // Registrar rastreabilidade do recebedor
            for (const tag of tagsToConfirm) {
                const eq = inventory.find(i => normUpper(i.tag) === normUpper(tag));
                if (eq) {
                    await registrarLogMovimentacao(
                        eq.id,
                        'Em Trânsito',
                        userProfile?.login,
                        pedidoObj?.patient_mv || null,
                        receiverData.name ? `${receiverData.name} (Mat: ${receiverData.badge})` : null,
                        'Equipamento Recebido'
                    );
                }
            }

            // 2. Atualiza o Pedido (se houver pedido ativo):
            let pedidoAtualizado = null;
            if (pedidoId) {
                const { data, error } = await supabase.from('pedidos').update({
                    status: 'delivered', // Volta ao status de entregue/normal
                    sector: userProfile?.login, // A posse do pedido passa para o novo setor
                    requester_name: userProfile?.name,
                    requester_badge: userProfile?.login,
                    fulfilled_at: new Date().toISOString()
                }).eq('id', pedidoId).select();
                if (error) throw error;
                if (data && data[0]) pedidoAtualizado = data[0];
            }

            // Atualiza estado local
            setInventory(prev => prev.map(eq =>
                tagsToConfirm.includes(normUpper(eq.tag)) ? { ...eq, location: userProfile?.login, transferStatus: null, transferTo: null, transferToBed: null, specificLocation: incomingBed, receivedBySector: true, status: 'allocated' } : eq
            ));

            if (pedidoAtualizado) {
                setRequests(prev => prev.map(r => r.id === pedidoId ? mapPedido(pedidoAtualizado) : r));
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
                received_by_sector: true,
                transfer_status: null,
                transfer_to: null,
                transfer_to_bed: null,
                location: destinationSector,
                status: 'allocated',
                in_use_since: new Date().toISOString()
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

            // Registrar rastreabilidade do recebedor
            await registrarLogMovimentacao(
                item.id,
                'Em Trânsito',
                destinationSector,
                null,
                `${collaboratorName} (Mat: ${collaboratorBadge})`,
                'Equipamento Recebido via Remanejamento'
            );

            const requestToComplete = requests.find(r =>
                ['approved', 'in_transfer'].includes(r.status) && splitTagList(r.equipmentTag).includes(normUpper(equipmentTag))
            );
            if (requestToComplete) {
                const { data: reqData, error: reqError } = await supabase
                    .from('pedidos')
                    .update({ status: 'completed', fulfilled_at: new Date().toISOString() })
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

            await registrarLogMovimentacao(
                item.id,
                item.location,
                destination,
                patient_mv,
                collaboratorName
            );

            // Tenta atualizar o pedido ativo para manter histórico coerente
            const activeReq = requests.find(r => normUpper(r.equipmentTag).includes(normUpper(tag)) && (r.status === 'delivered' || r.status === 'aprovado' || r.status === 'approved'));
            if (activeReq) {
                await supabase
                    .from('pedidos')
                    .update({
                        status: 'in_transfer',
                        transfer_to: destination,
                        fulfilled_at: new Date().toISOString()
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
        const isSupervisor09B2 = String(userProfile?.login || '').trim().toUpperCase() === '09B2';
        const blocos = ['CC_BLOCO1', 'CC_BLOCO2', 'CC_BLOCO3', 'CC_BLOCO4'];

        return requests.filter(p => {
            const isActive = ['pending', 'acknowledged', 'preparing', 'in_transit', 'waitlisted', 'in_transfer', 'pickup_requested'].includes(p.status);
            if (!isActive) return false;

            if (isSupervisor09B2) {
                return blocos.includes(p.sector) || blocos.some(b => p.sector && p.sector.startsWith(b + ' - ')) || blocos.includes(p.transfer_to);
            }

            return (p.sector === userProfile?.login || (p.sector && p.sector.startsWith(userProfile?.login + ' - ')) || p.requesterBadge === userProfile?.login || p.transfer_to === userProfile?.login);
        });
    }, [requests, userProfile]);

    const prevMyRequestsRef = useRef([]);
    useEffect(() => {
        const p = String(userProfile?.role || userProfile?.perfil || '').toUpperCase();
        if (p === 'ASSISTENCIAL') {
            const currentReqs = mySectorPendingRequests;
            const prevReqs = prevMyRequestsRef.current;

            if (prevReqs.length > 0 && "Notification" in window && Notification.permission === "granted") {
                currentReqs.forEach(req => {
                    const prevReq = prevReqs.find(p => p.id === req.id);
                    if (prevReq && prevReq.status !== req.status) {
                        let statusText = "Atualizado";
                        if (req.status === 'in_transfer') statusText = "Em Transferência";
                        if (req.status === 'pickup_requested') statusText = "Devolução Solicitada";
                        if (req.status === 'approved') statusText = "Aprovado (Em Curso)";
                        if (req.status === 'waitlisted') statusText = "Fila de Espera";
                        if (req.status === 'completed') statusText = "Finalizado";
                        
                        try {
                            new Notification(`CEIC: Status Atualizado`, {
                                body: `O pedido de ${req.equipmentType} mudou para: ${statusText}`,
                                icon: logoCeic
                            });
                        } catch (e) {
                            if (DEBUG_LOGS) console.log("Erro ao emitir Notification", e);
                        }
                    }
                });
            }
            prevMyRequestsRef.current = currentReqs;
        }
    }, [mySectorPendingRequests, userProfile]);

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
                                    items-center justify-between w-[90%] max-w-md md:w-auto md:min-w-[350px]
                                    animate-fade-in border-2 ${notification.type === 'error'
                        ? 'bg-red-600 border-red-400 ring-4 ring-red-600/30'
                        : 'bg-green-600 border-green-400 ring-4 ring-green-600/30'}`}>
                    <div className="flex items-center text-white min-w-0 flex-1 mr-2">
                        {notification.type === 'error' ?
                            <AlertCircle className="mr-3 md:mr-4 flex-shrink-0" size={24} /> :
                            <CheckCircle className="mr-3 md:mr-4 flex-shrink-0" size={24} />}
                        <span
                            className="font-bold text-sm md:text-base shadow-sm break-words whitespace-normal leading-snug">{notification.message}</span>
                    </div>
                    <button onClick={() => setNotification(null)} className="ml-4 text-white/80 hover:text-white transition-colors bg-black/10 hover:bg-black/20 p-1.5 rounded-full flex-shrink-0">
                        <X size={18} />
                    </button>
                </div>
            )}

            <header
                className="md:hidden bg-white border-b border-gray-200 p-4 sticky top-0 z-40 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-2">
                    <img src={logoCeic} alt="Logo CEIC" className="h-10 w-auto object-contain" />
                </div>
                <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Menu size={24} />
                </button>
            </header>

            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in" onClick={() =>
                    setIsMobileMenuOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 bg-white border-r border-gray-200 
                                        z-50 flex flex-col transform transition-all duration-300 ease-in-out
                                        md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
                                        ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="p-6 border-b border-gray-100 flex justify-between items-center relative">
                    <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100 w-auto'}`}>
                        {/* LOGO NO CABEÇALHO DO SISTEMA */}
                        <div className="flex flex-col items-start justify-center">
                            <img 
                                src={logoCeic} 
                                alt="Logo CEIC" 
                                className="h-16 w-auto object-contain" 
                            />
                        </div>
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
                    
                    <button className="hidden md:flex absolute -right-4 top-6 bg-white border border-gray-200 shadow-sm p-1.5 rounded-full text-gray-500 hover:text-blue-600 transition-colors z-50"
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        title={isSidebarCollapsed ? "Expandir menu" : "Recolher menu"}>
                        {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>

                    <button className={`md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg ${isSidebarCollapsed ? 'ml-0' : 'ml-auto'}`}
                        onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto space-y-4 overflow-x-hidden">
                    {(() => {
                        const allowedItems = SIDEBAR_ITEMS.filter(item =>
                            item.roles.includes(userProfile.role) && !(item.id === 'nova_solicitacao' && String(userProfile.login).toUpperCase() === '09B2')
                        );

                        const grouped = allowedItems.reduce((acc, item) => {
                            const g = item.group || 'Outros';
                            if (!acc[g]) acc[g] = [];
                            acc[g].push(item);
                            return acc;
                        }, {});

                        const order = ['Gerencial', 'Operacional', 'Assistencial', 'Sistema e Suporte', 'Outros'];
                        const groupsToRender = Object.keys(grouped).sort((a, b) => order.indexOf(a) - order.indexOf(b));

                        const groupIcons = {
                            'Gerencial': Briefcase,
                            'Operacional': PackageOpen,
                            'Assistencial': Activity,
                            'Sistema e Suporte': Settings,
                            'Outros': List
                        };

                        return groupsToRender.map((groupName, index) => {
                            const isExpanded = expandedSidebarGroups[groupName] === true; // Default to collapsed
                            const GroupIcon = groupIcons[groupName] || List;
                            
                            return (
                                <div key={groupName} className={`flex flex-col space-y-1 ${index > 0 && isSidebarCollapsed ? 'pt-4 border-t border-gray-100' : ''}`}>
                                    <button 
                                        onClick={() => toggleSidebarGroup(groupName)}
                                        title={isSidebarCollapsed ? groupName : undefined}
                                        className={`flex items-center transition-colors focus:outline-none w-full
                                                    ${isSidebarCollapsed 
                                                        ? 'justify-center p-3 rounded-xl hover:bg-gray-100' 
                                                        : 'px-3 py-1.5 justify-between text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600'}`}
                                    >
                                        {isSidebarCollapsed ? (
                                            <GroupIcon size={24} className={isExpanded ? 'text-blue-600' : 'text-gray-400'} />
                                        ) : (
                                            <>
                                                <span>{groupName}</span>
                                                {isExpanded ? <ChevronDown size={14} className="opacity-60" /> : <ChevronRight size={14} className="opacity-60" />}
                                            </>
                                        )}
                                    </button>
                                    <div className={`flex-col space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'flex max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                        {grouped[groupName].map(item => {
                                            const IconComponent = item.icon;
                                            return (
                                                <button key={item.id} data-testid={item.testId} onClick={() => handleNavClick(item.id)}
                                                    title={isSidebarCollapsed ? item.label : undefined}
                                                    className={`flex items-center p-3 rounded-xl transition-all
                                                                duration-200 group ${currentView === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50 hover:text-blue-600'}
                                                                ${isSidebarCollapsed ? 'justify-center w-full' : 'w-full'}`}>
                                                    <IconComponent size={22} className={`shrink-0 ${currentView === item.id ? '' : 'opacity-70 group-hover:opacity-100'}`} />
                                                    <span className={`font-medium whitespace-nowrap transition-all duration-300 ${isSidebarCollapsed ? 'w-0 opacity-0 ml-0 overflow-hidden' : 'w-auto opacity-100 ml-3'}`}>{item.label}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </nav>

                <div className="p-4 border-t border-gray-100 overflow-hidden">
                    <button data-testid="logout-button" onClick={handleLogout}
                        title={isSidebarCollapsed ? "Sair" : undefined}
                        className={`flex items-center p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors
                            ${isSidebarCollapsed ? 'justify-center w-full' : 'w-full'}`}>
                        <LogOut size={20} className={`shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'}`} />
                        <span className={`transition-all duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>Sair</span>
                    </button>
                </div>
            </aside >

            <main
                className={`transition-all duration-300 ease-in-out p-4 sm:p-6 md:p-8 min-h-[calc(100vh-64px)] md:min-h-screen flex-1 min-w-0 w-full md:w-auto overflow-x-hidden ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                {currentView === 'admin_dashboard' &&
                    <AdminDashboard inventory={inventory} requests={requests} />}
                {currentView === 'admin_indicadores' &&
                    <AdminIndicators inventory={inventory} requests={requests} />}
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
                    onBack={() => setCurrentView('admin_dashboard')} adminProfile={userProfile} equipmentCatalog={equipmentCatalog} ventilatoryCatalog={ventilatoryCatalog} generalCatalog={generalCatalog} fullCatalog={fullCatalog}
                    inventory={inventory} unidades={unidades} onDirectDelivery={handleDirectDelivery}
                />}

                {currentView === 'dashboard' &&
                    <OperatorDashboard requests={requests} inventory={inventory}
                        onViewChange={setCurrentView} onFulfill={handleFulfillRequest}
                        showNotification={showNotification}
                        onProcessPickup={handleProcessPickup}
                        onCancelRequest={handleCancelRequest}
                        onNotifyRequester={handleNotifyRequester}
                        soundEnabled={soundEnabled} setSoundEnabled={setSoundEnabled} />}
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
                    showNotification={showNotification} sectorSelo={userProfile.sector} userProfile={userProfile}
                    onBack={() => setCurrentView('meus_pedidos')} equipmentCatalog={equipmentCatalog} ventilatoryCatalog={ventilatoryCatalog} generalCatalog={generalCatalog} fullCatalog={fullCatalog} />}
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
                {currentView === 'admin_plantonistas' && <AdminPlantonistasAuthView showNotification={showNotification} />}
                {currentView === 'suporte_tecnico' && <SupportView userProfile={userProfile} showNotification={showNotification} />}
                {currentView === 'admin_suporte' && <AdminSupportView userProfile={userProfile} showNotification={showNotification} />}
            </main>
        </div >
    );
}



const AdminPlantonistasAuthView = ({ showNotification }) => {
    const [auths, setAuths] = useState([]);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const [newMatricula, setNewMatricula] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newNome, setNewNome] = useState('');

    const fetchAuths = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('ceic_plantonistas_autorizados')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (data) setAuths(data);
        if (error) console.error("Erro ao carregar autorizações", error);
        setIsLoading(false);
    };

    useEffect(() => {
        fetchAuths();
    }, []);

    const handleAddAuth = async (e) => {
        e.preventDefault();
        if (!newMatricula.trim() || !newEmail.trim() || !newNome.trim()) {
            showNotification('error', 'Preencha Matrícula, Nome e E-mail.');
            return;
        }

        setIsSaving(true);
        const { error } = await supabase
            .from('ceic_plantonistas_autorizados')
            .insert([{
                matricula: newMatricula.trim(),
                email: newEmail.trim(),
                nome: newNome.trim()
            }]);

        if (error) {
            if (error.code === '23505') {
                showNotification('error', 'Esta matrícula já está autorizada.');
            } else {
                showNotification('error', 'Erro ao adicionar autorização.');
            }
        } else {
            showNotification('success', 'Plantonista autorizado com sucesso!');
            setNewMatricula('');
            setNewEmail('');
            setNewNome('');
            fetchAuths();
        }
        setIsSaving(false);
    };

    const handleRemoveAuth = async (id) => {
        if (!window.confirm("Remover esta autorização? O plantonista não poderá mais iniciar plantões.")) return;
        
        const { error } = await supabase
            .from('ceic_plantonistas_autorizados')
            .delete()
            .eq('id', id);
            
        if (error) {
            showNotification('error', 'Erro ao remover autorização.');
        } else {
            showNotification('success', 'Autorização removida.');
            fetchAuths();
        }
    };

    const filtered = auths.filter(a => 
        (a.nome?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (a.matricula?.toLowerCase() || '').includes(search.toLowerCase()) ||
        (a.email?.toLowerCase() || '').includes(search.toLowerCase())
    );

    return (
        <div className="animate-fade-in p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                        <BadgeCheck className="mr-2 text-green-600" /> Lista Branca de Plantonistas
                    </h2>
                    <p className="text-sm text-gray-500">Gerencie quem tem autorização para iniciar plantões no sistema.</p>
                </div>
            </div>

            {/* Formulário de Adição */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <UserPlus size={20} className="mr-2 text-blue-600" /> Autorizar Novo Plantonista
                </h3>
                <form onSubmit={handleAddAuth} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="label">Nome Completo</label>
                        <input type="text" className="input" value={newNome} onChange={e => setNewNome(e.target.value)} placeholder="Ex: Maria Souza" required />
                    </div>
                    <div>
                        <label className="label">Matrícula</label>
                        <input type="text" className="input" value={newMatricula} onChange={e => setNewMatricula(e.target.value)} placeholder="00000" required />
                    </div>
                    <div>
                        <label className="label">E-mail Corporativo</label>
                        <input type="email" className="input" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="nome@hospital.com" required />
                    </div>
                    <button type="submit" disabled={isSaving} className="btn-primary w-full h-[42px] flex items-center justify-center">
                        {isSaving ? 'Adicionando...' : <><PlusCircle size={18} className="mr-2" /> Autorizar</>}
                    </button>
                </form>
            </div>

            {/* Lista de Autorizados */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Plantonistas Autorizados</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" placeholder="Buscar na lista..." className="input pl-10 text-sm h-9"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-gray-100 text-gray-500">
                            <tr>
                                <th className="p-4 font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Matrícula</th>
                                <th className="p-4 font-semibold">E-mail Corporativo</th>
                                <th className="p-4 font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">Carregando autorizações...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan="4" className="p-8 text-center text-gray-400">Nenhum plantonista na lista.</td></tr>
                            ) : filtered.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-800">{a.nome}</td>
                                    <td className="p-4 text-gray-600 font-mono">{a.matricula}</td>
                                    <td className="p-4 text-gray-600">{a.email}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => handleRemoveAuth(a.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Revogar autorização">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default App;

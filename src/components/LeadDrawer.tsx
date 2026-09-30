import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  Mail,
  Phone,
  DollarSign,
  CheckCircle2,
  Send,
  Eye,
  Trash2,
  ArrowRight,
  Zap,
  FileText,
  User,
  Briefcase,
  Linkedin,
  Compass,
  Megaphone,
  Flame,
  Clock,
  Calendar,
  Target,
  AlertTriangle,
  ShieldAlert,
  MessageSquare,
  PhoneCall,
  Bell,
  Paperclip,
  Upload,
  Plus,
  Award,
  XCircle,
  ExternalLink,
  Layers,
  UserCheck,
  Lock,
} from 'lucide-react';
import {
  DealStatus,
  DecisionProfile,
  DEFAULT_LOSS_REASONS,
  FUNNEL_STAGES,
  FunnelStageId,
  Lead,
  LeadAttachment,
  LeadInteraction,
  LeadPriority,
  LeadSource,
  LeadTemperature,
  LossReason,
  ScheduledAlertType,
  ScheduledTaskType,
  UserAccount,
} from '../types/crm';
import {
  calculateFunnelDuration,
  calculateLeadScore,
  crmRepository,
} from '../lib/supabase';

interface LeadDrawerProps {
  isOpen: boolean;
  lead: Lead | null;
  currentUser: UserAccount;
  lossReasons: string[];
  onClose: () => void;
  onSave: (lead: Lead, isNew: boolean) => Promise<void>;
  onDelete?: (leadId: string) => Promise<void>;
  onQuickAction?: (
    lead: Lead,
    actionType: 'view_proposal' | 'send_whatsapp' | 'win_deal'
  ) => Promise<void>;
}

type ModuleTab =
  | 'todos'
  | 'mod1_identificacao'
  | 'mod2_status'
  | 'mod3_diagnostico'
  | 'mod4_interacoes'
  | 'mod5_fechamento';

const LEAD_SOURCES: LeadSource[] = [
  'WhatsApp Comercial',
  'Landing Page',
  'Meta Ads',
  'Google Ads',
  'LinkedIn Outbound',
  'Indicação',
  'Evento / Feira',
];

const DECISION_PROFILES: DecisionProfile[] = [
  'Decisor',
  'Influenciador',
  'Usuário',
];

const TEMPERATURES: LeadTemperature[] = ['Frio', 'Morno', 'Quente'];

const TASK_TYPES: ScheduledTaskType[] = [
  'Ligação',
  'Reunião de Demonstração',
  'Follow-up WhatsApp',
  'Envio de Proposta',
  'E-mail Comercial',
  'Assinatura de Contrato',
];

const ALERT_TYPES: ScheduledAlertType[] = [
  'Alerta Urgente Ativo',
  '15 min antes',
  '1 hora antes',
  '1 dia antes',
  'Sem alerta',
];

export const LeadDrawer: React.FC<LeadDrawerProps> = ({
  isOpen,
  lead,
  currentUser,
  lossReasons,
  onClose,
  onSave,
  onDelete,
  onQuickAction,
}) => {
  const isNew = !lead;
  const isAdmin = currentUser.access_role === 'administrador';
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const registeredUsers: UserAccount[] = crmRepository.getUsers();
  const availableLossReasons =
    lossReasons.length > 0 ? lossReasons : DEFAULT_LOSS_REASONS;

  const [activeModule, setActiveModule] = useState<ModuleTab>('todos');

  // 1. Campos de Identificação
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [decisionProfile, setDecisionProfile] =
    useState<DecisionProfile>('Decisor');
  const [source, setSource] = useState<LeadSource>('Landing Page');
  const [originCampaign, setOriginCampaign] = useState('');

  // 2. Campos de Status Comercial
  const [stage, setStage] = useState<FunnelStageId>('prospeccao');
  const [ownerUsername, setOwnerUsername] = useState(currentUser.username);
  const [ownerName, setOwnerName] = useState(currentUser.full_name);
  const [value, setValue] = useState('25000');
  const [temperature, setTemperature] = useState<LeadTemperature>('Quente');
  const [createdAt, setCreatedAt] = useState(new Date().toISOString());
  const [stageEnteredAt, setStageEnteredAt] = useState(new Date().toISOString());

  // 3. Módulo de Diagnóstico e Qualificação
  const [painPoints, setPainPoints] = useState('');
  const [specificGoals, setSpecificGoals] = useState('');
  const [availableBudget, setAvailableBudget] = useState('');
  const [decisionDeadline, setDecisionDeadline] = useState('');
  const [competitors, setCompetitors] = useState('');

  // 4. Módulo de Interações e Próximos Passos
  const [interactions, setInteractions] = useState<LeadInteraction[]>([]);
  const [callSummary, setCallSummary] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [taskType, setTaskType] =
    useState<ScheduledTaskType>('Follow-up WhatsApp');
  const [taskDate, setTaskDate] = useState(
    new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  );
  const [taskTime, setTaskTime] = useState('14:00');
  const [taskAlert, setTaskAlert] =
    useState<ScheduledAlertType>('1 hora antes');
  const [taskNotes, setTaskNotes] = useState('');

  // Novo item para linha do tempo
  const [newIntChannel, setNewIntChannel] =
    useState<LeadInteraction['channel']>('WhatsApp');
  const [newIntTitle, setNewIntTitle] = useState('');
  const [newIntSummary, setNewIntSummary] = useState('');

  // 5. Módulo de Arquivos e Fechamento
  const [attachments, setAttachments] = useState<LeadAttachment[]>([]);
  const [docCategory, setDocCategory] =
    useState<LeadAttachment['category']>('Proposta Comercial');
  const [dealStatus, setDealStatus] = useState<DealStatus>('Em Andamento');
  const [lossReason, setLossReason] = useState<LossReason>('');

  // Campos auxiliares de automação
  const [priority, setPriority] = useState<LeadPriority>('Alta');
  const [proposalViewed, setProposalViewed] = useState(false);
  const [autoPilot, setAutoPilot] = useState(true);
  const [tagsInput, setTagsInput] = useState('Enterprise, B2B');

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (lead) {
      setName(lead.name);
      setCompany(lead.company);
      setJobTitle(lead.job_title || 'Diretor Comercial');
      setEmail(lead.email);
      setPhone(lead.phone);
      setLinkedinUrl(lead.linkedin_url || '');
      setDecisionProfile(lead.decision_profile || 'Decisor');
      setSource(lead.source);
      setOriginCampaign(lead.origin_campaign || 'Inbound Comercial');

      setStage(lead.stage);
      setOwnerUsername(lead.owner_username || currentUser.username);
      setOwnerName(lead.owner_name || currentUser.full_name);
      setValue(String(lead.value));
      setTemperature(lead.temperature || 'Quente');
      setCreatedAt(lead.created_at);
      setStageEnteredAt(lead.stage_entered_at || lead.created_at);

      setPainPoints(lead.pain_points || '');
      setSpecificGoals(lead.specific_goals || '');
      setAvailableBudget(lead.available_budget || '');
      setDecisionDeadline(lead.decision_deadline || '');
      setCompetitors(lead.competitors || '');

      setInteractions(lead.interactions || []);
      setCallSummary(lead.call_summary || '');
      setInternalNotes(lead.internal_notes || lead.notes || '');
      setTaskType(lead.scheduled_action?.task_type || 'Follow-up WhatsApp');
      setTaskDate(
        lead.scheduled_action?.date ||
          new Date(Date.now() + 86400000).toISOString().slice(0, 10)
      );
      setTaskTime(lead.scheduled_action?.time || '14:00');
      setTaskAlert(lead.scheduled_action?.alert || '1 hora antes');
      setTaskNotes(lead.scheduled_action?.notes || lead.next_action || '');

      setAttachments(lead.attachments || []);
      setDealStatus(
        lead.stage === 'fechado'
          ? 'Ganho'
          : lead.stage === 'perdido'
          ? 'Perdido'
          : lead.deal_status || 'Em Andamento'
      );
      setLossReason(lead.loss_reason || '');

      setPriority(lead.priority);
      setProposalViewed(lead.proposal_viewed);
      setAutoPilot(lead.auto_pilot_enabled);
      setTagsInput(lead.tags.join(', '));
      setConfirmDelete(false);
    } else {
      const nowIso = new Date().toISOString();
      setName('');
      setCompany('');
      setJobTitle('Diretor(a) de Operações');
      setEmail('');
      setPhone('+55 (11) 9');
      setLinkedinUrl('https://linkedin.com/in/');
      setDecisionProfile('Decisor');
      setSource('WhatsApp Comercial');
      setOriginCampaign('Campanha Outbound Q4');

      setStage('prospeccao');
      setOwnerUsername(currentUser.username);
      setOwnerName(currentUser.full_name);
      setValue('28000');
      setTemperature('Quente');
      setCreatedAt(nowIso);
      setStageEnteredAt(nowIso);

      setPainPoints('');
      setSpecificGoals('');
      setAvailableBudget('R$ 25.000 a R$ 35.000 / ano');
      setDecisionDeadline('30 dias');
      setCompetitors('');

      setInteractions([]);
      setCallSummary('');
      setInternalNotes('');
      setTaskType('Reunião de Demonstração');
      setTaskDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10));
      setTaskTime('15:00');
      setTaskAlert('15 min antes');
      setTaskNotes('Apresentar diagnóstico comercial e validar proposta.');

      setAttachments([]);
      setDealStatus('Em Andamento');
      setLossReason('');

      setPriority('Alta');
      setProposalViewed(false);
      setAutoPilot(true);
      setTagsInput('Alta Intenção, B2B');
      setConfirmDelete(false);
    }
  }, [lead, isOpen, currentUser]);

  if (!isOpen) return null;

  const numericValue = Math.max(0, Number(value) || 0);

  const handleStageChange = (newStage: FunnelStageId) => {
    setStage(newStage);
    setStageEnteredAt(new Date().toISOString());
    if (newStage === 'fechado') {
      setDealStatus('Ganho');
      setLossReason('');
    } else if (newStage === 'perdido') {
      setDealStatus('Perdido');
      if (!lossReason) setLossReason(availableLossReasons[0] || 'Preço');
    } else {
      setDealStatus('Em Andamento');
      setLossReason('');
    }
  };

  const handleDealStatusChange = (status: DealStatus) => {
    setDealStatus(status);
    if (status === 'Ganho') {
      setStage('fechado');
      setStageEnteredAt(new Date().toISOString());
      setLossReason('');
    } else if (status === 'Perdido') {
      setStage('perdido');
      setStageEnteredAt(new Date().toISOString());
      if (!lossReason) setLossReason(availableLossReasons[0] || 'Preço');
    } else if (stage === 'fechado' || stage === 'perdido') {
      setStage('negociacao');
      setStageEnteredAt(new Date().toISOString());
      setLossReason('');
    }
  };

  const handleOwnerSelect = (uname: string) => {
    setOwnerUsername(uname);
    if (uname === 'fila') {
      setOwnerName('Fila de Atendimento (Sem Dono)');
      return;
    }
    const found = registeredUsers.find((u) => u.username === uname);
    if (found) setOwnerName(found.full_name);
  };

  const handleAddInteraction = () => {
    if (!newIntTitle.trim() && !newIntSummary.trim()) return;
    const entry: LeadInteraction = {
      id: `int-${Date.now()}`,
      channel: newIntChannel,
      title: newIntTitle.trim() || `Registro de ${newIntChannel} comercial`,
      summary: newIntSummary.trim() || 'Interação registrada no dossiê.',
      author: currentUser.full_name,
      created_at: new Date().toISOString(),
    };
    setInteractions([entry, ...interactions]);
    setNewIntTitle('');
    setNewIntSummary('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeKb = Math.max(1, Math.round(file.size / 1024));
    const formattedSize =
      sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

    const newAttachment: LeadAttachment = {
      id: `att-${Date.now()}`,
      name: file.name,
      category: docCategory,
      size: formattedSize,
      uploaded_at: new Date().toISOString(),
      uploaded_by: currentUser.full_name,
    };

    setAttachments([newAttachment, ...attachments]);
    if (docCategory === 'Proposta Comercial') {
      setProposalViewed(true);
    }
    e.target.value = '';
  };

  const handleGenerateSampleDoc = (
    cat: 'Proposta Comercial' | 'Contrato / Minuta'
  ) => {
    const cleanCompany = (company || 'Cliente').replace(/\s+/g, '_');
    const docName =
      cat === 'Proposta Comercial'
        ? `Proposta_Comercial_${cleanCompany}_R$${numericValue}.pdf`
        : `Minuta_Contrato_${cleanCompany}_2026.pdf`;

    const newAtt: LeadAttachment = {
      id: `att-${Date.now()}`,
      name: docName,
      category: cat,
      size: cat === 'Proposta Comercial' ? '1.6 MB' : '980 KB',
      uploaded_at: new Date().toISOString(),
      uploaded_by: currentUser.full_name,
    };
    setAttachments([newAtt, ...attachments]);
  };

  const previewScore = calculateLeadScore({
    value: numericValue,
    priority,
    engagement_level: temperature,
    temperature,
    decision_profile: decisionProfile,
    proposal_viewed: proposalViewed,
    source,
    stage,
  });

  const durations = calculateFunnelDuration(createdAt, stageEnteredAt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    setSaving(true);
    try {
      const parsedTags = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const scheduledSummary = `${taskType} em ${taskDate
        .split('-')
        .reverse()
        .join('/')} às ${taskTime}`;

      const payload: Lead = {
        id: lead ? lead.id : `lead-${Date.now()}`,
        // Módulo 1: Identificação
        name: name.trim(),
        company: company.trim(),
        job_title: jobTitle.trim() || 'Executivo',
        email: email.trim() || 'contato@empresa.com.br',
        phone: phone.trim() || '+55 (11) 99999-0000',
        linkedin_url: linkedinUrl.trim(),
        decision_profile: decisionProfile,
        source,
        origin_campaign: originCampaign.trim() || 'Inbound Comercial',

        // Módulo 2: Status Comercial
        stage,
        owner_username: ownerUsername,
        owner_name: ownerName,
        value: numericValue,
        temperature,
        created_at: createdAt,
        stage_entered_at: stageEnteredAt,

        // Módulo 3: Diagnóstico e Qualificação
        pain_points: painPoints.trim(),
        specific_goals: specificGoals.trim(),
        available_budget:
          availableBudget.trim() || `R$ ${numericValue.toLocaleString('pt-BR')}`,
        decision_deadline: decisionDeadline.trim() || '30 dias',
        competitors: competitors.trim() || 'Não informado',

        // Módulo 4: Interações e Próximos Passos
        interactions,
        call_summary: callSummary.trim(),
        internal_notes: internalNotes.trim(),
        scheduled_action: {
          task_type: taskType,
          date: taskDate,
          time: taskTime,
          alert: taskAlert,
          notes: taskNotes.trim(),
        },

        // Módulo 5: Arquivos e Fechamento
        attachments,
        deal_status: dealStatus,
        loss_reason:
          dealStatus === 'Perdido'
            ? lossReason || availableLossReasons[0] || 'Preço'
            : '',

        // Inteligência e Automação
        priority,
        score: previewScore,
        engagement_level:
          dealStatus === 'Ganho' ? 'Pronto para Compra' : temperature,
        proposal_viewed: proposalViewed,
        auto_pilot_enabled: autoPilot,
        next_action:
          dealStatus === 'Perdido'
            ? `Venda Perdida (Motivo: ${lossReason || 'Preço'})`
            : dealStatus === 'Ganho'
            ? 'Venda Ganha • Contrato Assinado'
            : taskNotes.trim() || scheduledSummary,
        tags: parsedTags.length > 0 ? parsedTags : ['B2B'],
        notes: internalNotes.trim(),
        last_activity_at: new Date().toISOString(),
      };

      await onSave(payload, isNew);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const showSection = (sec: ModuleTab) =>
    activeModule === 'todos' || activeModule === sec;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-[1px]">
      <div className="w-full max-w-4xl bg-[#F8FAFC] h-full border-l border-slate-200 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white font-mono-num text-[11px] font-semibold">
                  {isNew ? 'NOVO REGISTRO CRM' : `DOSSIÊ: ${lead.id.toUpperCase()}`}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono-num text-[11px] font-bold border ${
                    temperature === 'Quente'
                      ? 'bg-orange-50 text-orange-800 border-orange-200'
                      : temperature === 'Morno'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}
                >
                  Temperatura: {temperature}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono-num text-[11px] font-bold">
                  Score: {previewScore}/100
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono-num text-[11px] font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  Tempo no Funil: {durations.totalLabel}
                </span>
              </div>

              <h2 className="font-display text-lg sm:text-xl font-bold text-slate-900 mt-1.5">
                {isNew
                  ? 'Cadastrar Cliente no Funil (5 Módulos Comerciais)'
                  : `${name || lead.name} — ${company || lead.company}`}
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 5-Module Navigation Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            {[
              { id: 'todos', label: 'Visão 360° (Todos)' },
              { id: 'mod1_identificacao', label: '1. Identificação' },
              { id: 'mod2_status', label: '2. Status Comercial' },
              { id: 'mod3_diagnostico', label: '3. Diagnóstico & BANT' },
              { id: 'mod4_interacoes', label: '4. Interações & Agenda' },
              { id: 'mod5_fechamento', label: '5. Arquivos & Fechamento' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModule(tab.id as ModuleTab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  activeModule === tab.id
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable 5-Module Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6"
        >
          {/* Banner para Lead na Fila Sem Dono */}
          {ownerUsername === 'fila' && (
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-950 block">
                  Lead Sem Dono na Fila de Atendimento
                </span>
                <span className="text-xs text-amber-800">
                  Assuma este lead para vinculá-lo diretamente à sua carteira comercial.
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleOwnerSelect(currentUser.username)}
                className="px-3.5 py-2 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <UserCheck className="w-4 h-4" />
                <span>Assumir para Minha Carteira (@{currentUser.username})</span>
              </button>
            </div>
          )}

          {/* Quick Accelerators for existing leads */}
          {!isNew && onQuickAction && (
            <div className="p-4 rounded-lg bg-[#0F172A] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold">
                  Ações Rápidas de Conversão:
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onQuickAction(lead, 'view_proposal')}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-100 flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-violet-400" />
                  <span>Proposta Lida (+Score)</span>
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAction(lead, 'send_whatsapp')}
                  className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-100 flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>Registrar Follow-up</span>
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAction(lead, 'win_deal')}
                  className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Marcar Venda Ganha</span>
                </button>
              </div>
            </div>
          )}

          {/* =================================================================
              MÓDULO 1: CAMPOS DE IDENTIFICAÇÃO
          ================================================================= */}
          {showSection('mod1_identificacao') && (
            <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-900 text-white font-mono-num text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Módulo de Identificação do Lead
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Nome Completo, Empresa, Cargo, E-mail, Telefone, LinkedIn, Perfil de Decisão, Origem e Campanha
                    </p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono-num text-[11px] font-semibold">
                  Perfil: {decisionProfile}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Henrique Vasconcelos"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa *
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="Ex: Atlas Logística S.A."
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo Executivo
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="Ex: Diretor de Operações (COO)"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    E-mail Corporativo
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@empresa.com.br"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+55 (11) 98888-7777"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-mono-num"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Link do LinkedIn
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="relative flex-1">
                      <Linkedin className="w-3.5 h-3.5 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/perfil"
                        className="w-full pl-8 pr-2.5 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                      />
                    </div>
                    {linkedinUrl && linkedinUrl.startsWith('http') && (
                      <a
                        href={linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Abrir LinkedIn"
                        className="p-2 rounded-md border border-slate-300 bg-slate-50 hover:bg-slate-100 text-blue-600"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Perfil de Decisão
                  </label>
                  <select
                    value={decisionProfile}
                    onChange={(e) =>
                      setDecisionProfile(e.target.value as DecisionProfile)
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-semibold text-slate-800"
                  >
                    {DECISION_PROFILES.map((dp) => (
                      <option key={dp} value={dp}>
                        {dp}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Origem do Lead (Canal de Entrada)
                  </label>
                  <div className="relative">
                    <Compass className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as LeadSource)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    >
                      {LEAD_SOURCES.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Campanha de Origem
                  </label>
                  <div className="relative">
                    <Megaphone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={originCampaign}
                      onChange={(e) => setOriginCampaign(e.target.value)}
                      placeholder="Ex: ABM Enterprise Q4"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              MÓDULO 2: CAMPOS DE STATUS COMERCIAL
          ================================================================= */}
          {showSection('mod2_status') && (
            <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-mono-num text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Módulo de Status Comercial & Ciclo no Funil
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Etapa Atual, Vendedor Responsável (RBAC), Valor Estimado, Temperatura e Tempo no Funil
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Etapa Atual do Funil
                  </label>
                  <select
                    value={stage}
                    onChange={(e) =>
                      handleStageChange(e.target.value as FunnelStageId)
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-semibold"
                  >
                    {FUNNEL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Vendedor Responsável (Owner)</span>
                    {!isAdmin && (
                      <Lock
                        title="Perfil Funcionário: restrito à sua própria carteira ou fila"
                        className="w-3 h-3 text-slate-400"
                      />
                    )}
                  </label>
                  {isAdmin ? (
                    <select
                      value={ownerUsername}
                      onChange={(e) => handleOwnerSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    >
                      <option value="fila">
                        ⏳ Fila de Atendimento (Sem Dono)
                      </option>
                      {registeredUsers.map((u) => (
                        <option key={u.id} value={u.username}>
                          {u.full_name} (@{u.username})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={ownerUsername}
                      onChange={(e) => handleOwnerSelect(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md font-semibold text-slate-800"
                    >
                      <option value={currentUser.username}>
                        {currentUser.full_name} (Minha Carteira)
                      </option>
                      <option value="fila">
                        ⏳ Fila de Atendimento (Sem Dono)
                      </option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Estimado do Negócio (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-mono-num font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Temperatura do Lead
                  </label>
                  <div className="grid grid-cols-3 gap-1">
                    {TEMPERATURES.map((temp) => (
                      <button
                        key={temp}
                        type="button"
                        onClick={() => setTemperature(temp)}
                        className={`py-2 px-2 rounded-md text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                          temperature === temp
                            ? temp === 'Quente'
                              ? 'bg-orange-600 text-white border-orange-600'
                              : temp === 'Morno'
                              ? 'bg-amber-500 text-slate-950 border-amber-500'
                              : 'bg-sky-600 text-white border-sky-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Flame className="w-3 h-3" />
                        <span>{temp}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Timestamps & Total Funnel Time Telemetry Box */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    Data de Criação do Lead
                  </span>
                  <span className="font-mono-num text-xs font-bold text-slate-900 mt-1 block">
                    {new Date(createdAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(createdAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Data de Entrada na Etapa Atual
                  </span>
                  <span className="font-mono-num text-xs font-bold text-slate-900 mt-1 block">
                    {new Date(stageEnteredAt).toLocaleDateString('pt-BR')} (há{' '}
                    {durations.stageLabel})
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-600" />
                    Tempo Total no Funil
                  </span>
                  <span className="font-mono-num text-sm font-extrabold text-emerald-700 mt-0.5 block">
                    {durations.totalLabel} ({durations.totalDays} dias corridos)
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              MÓDULO 3: DIAGNÓSTICO E QUALIFICAÇÃO
          ================================================================= */}
          {showSection('mod3_diagnostico') && (
            <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-violet-600 text-white font-mono-num text-xs font-bold flex items-center justify-center">
                    3
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Módulo de Diagnóstico e Qualificação
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Dores/Desafios, Objetivos, Orçamento Disponível (Budget), Prazo de Decisão e Concorrentes
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Dores / Desafios do Cliente
                  </label>
                  <textarea
                    rows={3}
                    value={painPoints}
                    onChange={(e) => setPainPoints(e.target.value)}
                    placeholder="Quais gargalos operacionais ou perdas financeiras motivaram a conversa?"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    Objetivos Específicos
                  </label>
                  <textarea
                    rows={3}
                    value={specificGoals}
                    onChange={(e) => setSpecificGoals(e.target.value)}
                    placeholder="Qual resultado concreto o cliente espera atingir em 30/60/90 dias?"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 leading-relaxed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Orçamento Disponível (Budget)
                  </label>
                  <input
                    type="text"
                    value={availableBudget}
                    onChange={(e) => setAvailableBudget(e.target.value)}
                    placeholder="Ex: R$ 40.000 - R$ 50.000/ano aprovado"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Prazo de Decisão
                  </label>
                  <input
                    type="text"
                    value={decisionDeadline}
                    onChange={(e) => setDecisionDeadline(e.target.value)}
                    placeholder="Ex: Até dia 20 deste mês"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                    Concorrentes Considerados
                  </label>
                  <input
                    type="text"
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    placeholder="Ex: HubSpot, Pipedrive, RD Station"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </section>
          )}

          {/* =================================================================
              MÓDULO 4: INTERAÇÕES E PRÓXIMOS PASSOS
          ================================================================= */}
          {showSection('mod4_interacoes') && (
            <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-amber-600 text-white font-mono-num text-xs font-bold flex items-center justify-center">
                    4
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Módulo de Interações e Próximos Passos
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Linha do Tempo (E-mails/WhatsApp), Resumo de Ligações, Notas Internas e Próxima Ação Agendada
                    </p>
                  </div>
                </div>
              </div>

              {/* Sub-box: Próxima Ação Agendada (Tipo de Tarefa, Data, Hora e Alerta) */}
              <div className="p-4 rounded-lg bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-amber-600" />
                    Próxima Ação Agendada
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-mono-num text-[11px] font-semibold">
                    Alerta: {taskAlert}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                      Tipo de Tarefa
                    </label>
                    <select
                      value={taskType}
                      onChange={(e) =>
                        setTaskType(e.target.value as ScheduledTaskType)
                      }
                      className="w-full px-2.5 py-2 text-xs bg-white border border-amber-300 rounded-md font-semibold text-slate-900"
                    >
                      {TASK_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                      Data Programada
                    </label>
                    <input
                      type="date"
                      value={taskDate}
                      onChange={(e) => setTaskDate(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-amber-300 rounded-md font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                      Hora
                    </label>
                    <input
                      type="time"
                      value={taskTime}
                      onChange={(e) => setTaskTime(e.target.value)}
                      className="w-full px-2.5 py-2 text-xs bg-white border border-amber-300 rounded-md font-mono-num"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                      Configuração de Alerta
                    </label>
                    <select
                      value={taskAlert}
                      onChange={(e) =>
                        setTaskAlert(e.target.value as ScheduledAlertType)
                      }
                      className="w-full px-2.5 py-2 text-xs bg-white border border-amber-300 rounded-md font-medium"
                    >
                      {ALERT_TYPES.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-amber-950 mb-1">
                    Pauta / Instrução da Próxima Ação
                  </label>
                  <input
                    type="text"
                    value={taskNotes}
                    onChange={(e) => setTaskNotes(e.target.value)}
                    placeholder="Ex: Ligar para validar aprovação da diretoria e enviar link de assinatura"
                    className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-md"
                  />
                </div>
              </div>

              {/* Resumo de Ligações & Notas Internas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                    Resumo de Ligações
                  </label>
                  <textarea
                    rows={3}
                    value={callSummary}
                    onChange={(e) => setCallSummary(e.target.value)}
                    placeholder="Síntese das calls de descoberta, objeções levantadas em voz e acordos verbais..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    Campo de Notas Internas
                  </label>
                  <textarea
                    rows={3}
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    placeholder="Anotações estratégicas internas da equipe comercial..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 leading-relaxed"
                  />
                </div>
              </div>

              {/* Linha do Tempo para Histórico de E-mails / WhatsApp / Ligações */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    Linha do Tempo — Histórico de E-mails, WhatsApp e Ligações (
                    {interactions.length})
                  </h4>
                </div>

                {/* Add interaction bar */}
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      value={newIntChannel}
                      onChange={(e) =>
                        setNewIntChannel(
                          e.target.value as LeadInteraction['channel']
                        )
                      }
                      className="px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md font-semibold"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="E-mail">E-mail</option>
                      <option value="Ligação">Ligação</option>
                      <option value="Reunião">Reunião</option>
                      <option value="Nota">Nota</option>
                    </select>

                    <input
                      type="text"
                      value={newIntTitle}
                      onChange={(e) => setNewIntTitle(e.target.value)}
                      placeholder="Assunto (Ex: Envio de proposta por WhatsApp)"
                      className="sm:col-span-2 px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                    />

                    <button
                      type="button"
                      onClick={handleAddInteraction}
                      className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Registrar</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={newIntSummary}
                    onChange={(e) => setNewIntSummary(e.target.value)}
                    placeholder="Resumo da mensagem enviada/recebida ou pontos discutidos..."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                  />
                </div>

                {/* Timeline List */}
                {interactions.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    Nenhuma interação registrada ainda nesta oportunidade.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {interactions.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-md bg-white border border-slate-200 flex items-start justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded font-mono-num text-[10px] font-bold ${
                                item.channel === 'WhatsApp'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : item.channel === 'E-mail'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : item.channel === 'Ligação'
                                  ? 'bg-violet-50 text-violet-800 border border-violet-200'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {item.channel}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {item.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {item.summary}
                          </p>
                        </div>
                        <div className="text-right shrink-0 font-mono-num text-[10px] text-slate-400">
                          <div>
                            {new Date(item.created_at).toLocaleDateString(
                              'pt-BR'
                            )}
                          </div>
                          <div>{item.author}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* =================================================================
              MÓDULO 5: ARQUIVOS E FECHAMENTO
          ================================================================= */}
          {showSection('mod5_fechamento') && (
            <section className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-mono-num text-xs font-bold flex items-center justify-center">
                    5
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Módulo de Arquivos e Fechamento Comercial
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Anexo de Documentos (Propostas, Contratos), Status da Venda (Ganho/Perdido) e Motivo de Perda
                    </p>
                  </div>
                </div>
              </div>

              {/* Status da Venda & Motivo de Perda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Status da Venda (Resultado Comercial)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDealStatusChange('Em Andamento')}
                      className={`py-2.5 px-2 rounded-md text-xs font-semibold border transition cursor-pointer flex items-center justify-center gap-1 ${
                        dealStatus === 'Em Andamento'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Em Aberto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDealStatusChange('Ganho')}
                      className={`py-2.5 px-2 rounded-md text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                        dealStatus === 'Ganho'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-emerald-50/60 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Ganho</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDealStatusChange('Perdido')}
                      className={`py-2.5 px-2 rounded-md text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1 ${
                        dealStatus === 'Perdido'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-rose-50/60 text-rose-800 border-rose-200 hover:bg-rose-100'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Perdido</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Motivo de Perda
                  </label>
                  {dealStatus === 'Perdido' ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availableLossReasons.map((reason) => (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => setLossReason(reason)}
                          className={`py-2 px-2.5 rounded-md text-xs font-semibold border text-left transition cursor-pointer flex items-center justify-between ${
                            lossReason === reason
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'bg-rose-50/50 text-rose-900 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span className="truncate">{reason}</span>
                          {lossReason === reason && (
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-500">
                      O campo de <strong>Motivo de Perda</strong> é ativado
                      automaticamente caso a venda seja marcada como{' '}
                      <span className="text-rose-700 font-semibold">Perdido</span>.
                    </div>
                  )}
                </div>
              </div>

              {/* Documentos Anexados (Propostas, Contratos) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-display text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-violet-600" />
                      Documentos Anexados — Propostas & Contratos (
                      {attachments.length})
                    </h4>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={docCategory}
                      onChange={(e) =>
                        setDocCategory(
                          e.target.value as LeadAttachment['category']
                        )
                      }
                      className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md font-medium"
                    >
                      <option value="Proposta Comercial">
                        Proposta Comercial
                      </option>
                      <option value="Contrato / Minuta">
                        Contrato / Minuta
                      </option>
                      <option value="Apresentação">Apresentação</option>
                      <option value="Escopo Técnico">Escopo Técnico</option>
                    </select>

                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Anexar Arquivo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleGenerateSampleDoc('Proposta Comercial')
                      }
                      className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      + Gerar PDF Proposta
                    </button>
                  </div>
                </div>

                {attachments.length === 0 ? (
                  <div className="p-4 rounded-md border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    Nenhum documento anexado ainda. Clique em "Anexar Arquivo" ou "+ Gerar PDF Proposta".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="p-3 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 font-mono-num text-[10px] font-semibold">
                            {att.category}
                          </span>
                          <p className="text-xs font-bold text-slate-900 truncate mt-1">
                            {att.name}
                          </p>
                          <p className="text-[10px] font-mono-num text-slate-500">
                            {att.size} •{' '}
                            {new Date(att.uploaded_at).toLocaleDateString(
                              'pt-BR'
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments(
                              attachments.filter((item) => item.id !== att.id)
                            )
                          }
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Remover anexo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </form>

        {/* Drawer Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between gap-3">
          {!isNew && onDelete && isAdmin ? (
            <div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Cliente</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={async () => {
                    await onDelete(lead.id);
                    onClose();
                  }}
                  className="px-3 py-2 rounded-md bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold transition cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              )}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !name.trim() || !company.trim()}
              className="px-5 py-2 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <span>
                {saving
                  ? 'Salvando Dossiê...'
                  : 'Salvar Cliente (5 Módulos)'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

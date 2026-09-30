export type FunnelStageId =
  | 'prospeccao'
  | 'qualificado'
  | 'proposta'
  | 'negociacao'
  | 'fechado'
  | 'perdido';

export type AccessRole = 'administrador' | 'funcionario';

export type LeadSource =
  | 'WhatsApp Comercial'
  | 'Landing Page'
  | 'Meta Ads'
  | 'Google Ads'
  | 'LinkedIn Outbound'
  | 'Indicação'
  | 'Evento / Feira';

export type LeadPriority = 'Alta' | 'Média' | 'Baixa';

export type LeadTemperature = 'Frio' | 'Morno' | 'Quente';

export type EngagementLevel = LeadTemperature | 'Pronto para Compra';

export type DecisionProfile = 'Decisor' | 'Influenciador' | 'Usuário';

export type DealStatus = 'Em Andamento' | 'Ganho' | 'Perdido';

export type LossReason = string;

export type ScheduledTaskType =
  | 'Ligação'
  | 'Reunião de Demonstração'
  | 'Follow-up WhatsApp'
  | 'Envio de Proposta'
  | 'E-mail Comercial'
  | 'Assinatura de Contrato';

export type ScheduledAlertType =
  | 'Alerta Urgente Ativo'
  | '15 min antes'
  | '1 hora antes'
  | '1 dia antes'
  | 'Sem alerta';

export interface ScheduledAction {
  task_type: ScheduledTaskType;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  alert: ScheduledAlertType;
  notes?: string;
}

export interface LeadInteraction {
  id: string;
  channel: 'WhatsApp' | 'E-mail' | 'Ligação' | 'Reunião' | 'Nota';
  title: string;
  summary: string;
  author: string;
  created_at: string;
}

export interface LeadAttachment {
  id: string;
  name: string;
  category:
    | 'Proposta Comercial'
    | 'Contrato / Minuta'
    | 'Apresentação'
    | 'Escopo Técnico';
  size: string;
  uploaded_at: string;
  uploaded_by: string;
  data_url?: string;
}

export interface UserAccount {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  email: string;
  role: string; // Cargo descritivo (ex: Diretora Comercial, Vendedor Sênior, SDR)
  access_role: AccessRole; // 'administrador' (Gestor/Diretor) | 'funcionario' (Vendedor/SDR)
  company: string;
  created_at: string;
}

export interface SystemSettings {
  company_name: string;
  monthly_revenue_goal: number;
  allow_sdr_claim_queue: boolean;
  auto_pilot_global: boolean;
  loss_reasons: string[];
}

export interface Lead {
  id: string;

  // 1. Campos de Identificação
  name: string; // Nome Completo
  company: string; // Empresa
  job_title: string; // Cargo
  email: string; // E-mail
  phone: string; // Telefone
  linkedin_url: string; // Link do LinkedIn
  decision_profile: DecisionProfile; // Perfil de Decisão (Decisor, Influenciador, Usuário)
  source: LeadSource; // Origem do Lead (Canal de Entrada)
  origin_campaign: string; // Campanha de Origem

  // 2. Campos de Status Comercial
  stage: FunnelStageId; // Etapa Atual do Funil
  owner_username: string; // Login do Vendedor Responsável (ou 'fila' para sem dono na fila de atendimento)
  owner_name: string; // Nome do Vendedor Responsável (ou 'Fila de Atendimento')
  value: number; // Valor Estimado do Negócio
  temperature: LeadTemperature; // Temperatura do Lead (Frio, Morno, Quente)
  created_at: string; // Data de Criação
  stage_entered_at: string; // Data de Entrada na Etapa Atual

  // 3. Módulo de Diagnóstico e Qualificação
  pain_points: string; // Dores / Desafios do Cliente
  specific_goals: string; // Objetivos Específicos
  available_budget: string; // Orçamento Disponível (Budget)
  decision_deadline: string; // Prazo de Decisão
  competitors: string; // Concorrentes Considerados

  // 4. Módulo de Interações e Próximos Passos
  interactions: LeadInteraction[]; // Linha do tempo de E-mails / WhatsApp / Ligações
  call_summary: string; // Resumo de Ligações
  internal_notes: string; // Campo de Notas Internas
  scheduled_action: ScheduledAction; // Próxima Ação Agendada (Tipo de Tarefa, Data, Hora e Alerta)

  // 5. Módulo de Arquivos e Fechamento
  attachments: LeadAttachment[]; // Documentos anexados (Propostas, Contratos)
  deal_status: DealStatus; // Status da Venda (Em Andamento / Ganho / Perdido)
  loss_reason: LossReason; // Motivo de Perda

  // Campos de Automação & Inteligência
  priority: LeadPriority;
  score: number;
  engagement_level: EngagementLevel;
  proposal_viewed: boolean;
  auto_pilot_enabled: boolean;
  next_action: string;
  tags: string[];
  notes: string;
  last_activity_at: string;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger_stage: FunnelStageId;
  min_score: number;
  min_value: number;
  require_proposal_viewed: boolean;
  target_stage: FunnelStageId;
  action_channel: 'WhatsApp' | 'E-mail' | 'Webhook CRM' | 'Proposta PDF';
  message_template: string;
  is_active: boolean;
  executions_count: number;
  last_triggered_at: string | null;
}

export interface ActivityLog {
  id: string;
  lead_id: string;
  lead_name: string;
  type:
    | 'automacao'
    | 'mudanca_etapa'
    | 'novo_lead'
    | 'mensagem'
    | 'venda_fechada'
    | 'supabase_sync';
  title: string;
  description: string;
  created_at: string;
}

export interface FunnelStageConfig {
  id: FunnelStageId;
  label: string;
  shortLabel: string;
  probability: number;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  description: string;
}

export const DEFAULT_LOSS_REASONS: string[] = [
  'Preço',
  'Sumiu',
  'Concorrência',
  'Sem Fit Técnico',
];

export const FUNNEL_STAGES: FunnelStageConfig[] = [
  {
    id: 'prospeccao',
    label: '1. Captura & Prospecção',
    shortLabel: 'Prospecção',
    probability: 15,
    accentColor: '#475569',
    borderColor: 'border-slate-300',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    description: 'Leads recém-capturados ou aguardando na fila de atendimento',
  },
  {
    id: 'qualificado',
    label: '2. Qualificado (MQL)',
    shortLabel: 'Qualificado',
    probability: 35,
    accentColor: '#2563EB',
    borderColor: 'border-blue-300',
    badgeBg: 'bg-blue-50',
    badgeText: 'text-blue-700',
    description: 'Diagnóstico de dores, orçamento e decisor validados',
  },
  {
    id: 'proposta',
    label: '3. Proposta Enviada',
    shortLabel: 'Proposta',
    probability: 60,
    accentColor: '#7C3AED',
    borderColor: 'border-violet-300',
    badgeBg: 'bg-violet-50',
    badgeText: 'text-violet-700',
    description: 'Escopo comercial e condições apresentadas ao decisor',
  },
  {
    id: 'negociacao',
    label: '4. Negociação & Follow-up',
    shortLabel: 'Negociação',
    probability: 80,
    accentColor: '#D97706',
    borderColor: 'border-amber-300',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    description: 'Ajuste final de contrato, aprovação jurídica e fechamento',
  },
  {
    id: 'fechado',
    label: '5. Fechado / Ganho',
    shortLabel: 'Ganho',
    probability: 100,
    accentColor: '#059669',
    borderColor: 'border-emerald-400',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-800',
    description: 'Contrato assinado e receita confirmada no caixa',
  },
  {
    id: 'perdido',
    label: 'Perdido / Arquivado',
    shortLabel: 'Perdido',
    probability: 0,
    accentColor: '#DC2626',
    borderColor: 'border-rose-300',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
    description: 'Negócios perdidos com motivo de perda mapeado',
  },
];

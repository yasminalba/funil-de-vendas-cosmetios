import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AccessRole,
  ActivityLog,
  AutomationRule,
  DecisionProfile,
  DEFAULT_LOSS_REASONS,
  EngagementLevel,
  FunnelStageId,
  Lead,
  LeadPriority,
  LeadSource,
  LeadTemperature,
  SystemSettings,
  UserAccount,
} from '../types/crm';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const isConfiguredUrl =
  rawUrl.length > 0 &&
  rawUrl !== 'https://your-project-id.supabase.co' &&
  rawUrl.startsWith('http');

const isConfiguredKey =
  rawKey.length > 0 && rawKey !== 'your-supabase-anon-public-key';

export const isSupabaseEnvConfigured = isConfiguredUrl && isConfiguredKey;

export const supabase: SupabaseClient | null = isSupabaseEnvConfigured
  ? createClient(rawUrl, rawKey)
  : null;

const STORAGE_KEYS = {
  USERS: 'vertice_crm_users_v3',
  CURRENT_USER: 'vertice_crm_current_user_v3',
  LEADS: 'vertice_crm_leads_v3',
  AUTOMATIONS: 'vertice_crm_automations_v3',
  ACTIVITIES: 'vertice_crm_activities_v3',
  SETTINGS: 'vertice_crm_settings_v3',
};

export const SUPABASE_SQL_SCHEMA = `-- ============================================================================
-- VÉRTICE CRM - SCHEMA SQL COMPLETO (RBAC + 5 MÓDULOS COMERCIAIS) PARA SUPABASE
-- Cole e execute este script no SQL Editor do seu projeto Supabase
-- ============================================================================

-- 1. Tabela de Usuários e Permissões RBAC (Administrador vs Funcionário)
CREATE TABLE IF NOT EXISTS public.crm_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'Vendedor / SDR',
  access_role TEXT NOT NULL DEFAULT 'funcionario', -- 'administrador' | 'funcionario'
  company TEXT DEFAULT 'Vértice CRM',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela Completa de Leads e Oportunidades (5 Módulos de Dados por Cliente)
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id TEXT PRIMARY KEY,
  -- Módulo 1: Identificação
  name TEXT NOT NULL,
  company TEXT NOT NULL,
  job_title TEXT DEFAULT 'Diretor Comercial',
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  linkedin_url TEXT DEFAULT '',
  decision_profile TEXT DEFAULT 'Decisor',
  source TEXT NOT NULL DEFAULT 'Landing Page',
  origin_campaign TEXT DEFAULT 'Inbound Q4',
  -- Módulo 2: Status Comercial & RBAC Owner
  stage TEXT NOT NULL DEFAULT 'prospeccao',
  owner_username TEXT DEFAULT 'fila',
  owner_name TEXT DEFAULT 'Fila de Atendimento (Sem Dono)',
  value NUMERIC(14,2) NOT NULL DEFAULT 0,
  temperature TEXT NOT NULL DEFAULT 'Quente',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
  -- Módulo 3: Diagnóstico e Qualificação
  pain_points TEXT DEFAULT '',
  specific_goals TEXT DEFAULT '',
  available_budget TEXT DEFAULT '',
  decision_deadline TEXT DEFAULT '',
  competitors TEXT DEFAULT '',
  -- Módulo 4: Interações e Próximos Passos
  interactions JSONB DEFAULT '[]'::jsonb,
  call_summary TEXT DEFAULT '',
  internal_notes TEXT DEFAULT '',
  scheduled_action JSONB DEFAULT '{}'::jsonb,
  -- Módulo 5: Arquivos e Fechamento
  attachments JSONB DEFAULT '[]'::jsonb,
  deal_status TEXT DEFAULT 'Em Andamento',
  loss_reason TEXT DEFAULT '',
  -- Inteligência e Automação
  priority TEXT NOT NULL DEFAULT 'Alta',
  score INTEGER NOT NULL DEFAULT 70,
  engagement_level TEXT NOT NULL DEFAULT 'Quente',
  proposal_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  auto_pilot_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  next_action TEXT DEFAULT '',
  tags JSONB DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  last_activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Regras de Automação de Conversão
CREATE TABLE IF NOT EXISTS public.crm_automations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  trigger_stage TEXT NOT NULL,
  min_score INTEGER NOT NULL DEFAULT 60,
  min_value NUMERIC(14,2) NOT NULL DEFAULT 0,
  require_proposal_viewed BOOLEAN NOT NULL DEFAULT FALSE,
  target_stage TEXT NOT NULL,
  action_channel TEXT NOT NULL DEFAULT 'WhatsApp',
  message_template TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  executions_count INTEGER NOT NULL DEFAULT 0,
  last_triggered_at TIMESTAMPTZ
);

-- 4. Tabela de Histórico e Auditoria de Conversões
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  lead_name TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.crm_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total crm_users" ON public.crm_users;
CREATE POLICY "Acesso total crm_users" ON public.crm_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total crm_leads" ON public.crm_leads;
CREATE POLICY "Acesso total crm_leads" ON public.crm_leads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total crm_automations" ON public.crm_automations;
CREATE POLICY "Acesso total crm_automations" ON public.crm_automations FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total crm_activities" ON public.crm_activities;
CREATE POLICY "Acesso total crm_activities" ON public.crm_activities FOR ALL USING (true) WITH CHECK (true);

-- Inserir perfis RBAC padrão (Administrador + Funcionários Vendedor/SDR)
INSERT INTO public.crm_users (id, username, password_hash, full_name, email, role, access_role, company)
VALUES
  ('usr-yasyas-01', 'yasyas', '1234', 'Yasmin Alba', 'yasmin.alba@verticecrm.com.br', 'Diretora Comercial (Gestora)', 'administrador', 'Vértice Enterprise'),
  ('usr-lucas-02', 'lucas.mendes', '1234', 'Lucas Mendes', 'lucas.mendes@verticecrm.com.br', 'Vendedor / Account Executive', 'funcionario', 'Vértice Enterprise'),
  ('usr-marina-03', 'marina.sdr', '1234', 'Marina Costa', 'marina.sdr@verticecrm.com.br', 'SDR / Pré-Vendas', 'funcionario', 'Vértice Enterprise')
ON CONFLICT (username) DO NOTHING;
`;

const DEFAULT_SETTINGS: SystemSettings = {
  company_name: 'Vértice Enterprise CRM',
  monthly_revenue_goal: 250000,
  allow_sdr_claim_queue: true,
  auto_pilot_global: true,
  loss_reasons: [...DEFAULT_LOSS_REASONS],
};

const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-yasyas-01',
    username: 'yasyas',
    password_hash: '1234',
    full_name: 'Yasmin Alba',
    email: 'yasmin.alba@verticecrm.com.br',
    role: 'Diretora Comercial (Gestora)',
    access_role: 'administrador',
    company: 'Vértice Enterprise',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 140).toISOString(),
  },
  {
    id: 'usr-lucas-02',
    username: 'lucas.mendes',
    password_hash: '1234',
    full_name: 'Lucas Mendes',
    email: 'lucas.mendes@verticecrm.com.br',
    role: 'Vendedor / Closer B2B',
    access_role: 'funcionario',
    company: 'Vértice Enterprise',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 100).toISOString(),
  },
  {
    id: 'usr-marina-03',
    username: 'marina.sdr',
    password_hash: '1234',
    full_name: 'Marina Costa',
    email: 'marina.sdr@verticecrm.com.br',
    role: 'SDR / Qualificação Inbound',
    access_role: 'funcionario',
    company: 'Vértice Enterprise',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
  },
];

const DEFAULT_LEADS: Lead[] = [
  {
    id: 'lead-101',
    name: 'Henrique Vasconcelos',
    company: 'Atlas Logística S.A.',
    job_title: 'Diretor de Operações (COO)',
    email: 'henrique@atlaslogistica.com.br',
    phone: '+55 (11) 98842-1920',
    linkedin_url: 'https://linkedin.com/in/henrique-vasconcelos-atlas',
    decision_profile: 'Decisor',
    source: 'LinkedIn Outbound',
    origin_campaign: 'ABM Enterprise Logística Q3/Q4',
    stage: 'negociacao',
    owner_username: 'yasyas',
    owner_name: 'Yasmin Alba',
    value: 48500,
    temperature: 'Quente',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    pain_points:
      'Perda de 28% das oportunidades comerciais por falta de follow-up padronizado entre filiais e visibilidade nula de forecast.',
    specific_goals:
      'Unificar 32 vendedores em um único funil Kanban e elevar a taxa de conversão de propostas de 18% para 30% em 90 dias.',
    available_budget: 'R$ 50.000 a R$ 60.000 / ano (Aprovado pela Diretoria)',
    decision_deadline: 'Até 15 do próximo mês',
    competitors: 'Pipedrive Enterprise, HubSpot Sales Pro',
    interactions: [
      {
        id: 'int-101-1',
        channel: 'WhatsApp',
        title: 'Alinhamento de Minuta Contratual',
        summary:
          'Henrique confirmou que o jurídico validou a cláusula de SLA. Aguardando apenas assinatura digital.',
        author: 'Yasmin Alba',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'int-101-2',
        channel: 'Ligação',
        title: 'Call de Negociação de Condições (38 min)',
        summary:
          'Apresentado plano anual com isenção de setup para fechamento nesta semana. Decisor aprovou escopo.',
        author: 'Yasmin Alba',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      },
    ],
    call_summary:
      'Foram realizadas 3 ligações executivas. Na última call (38 min), o COO Henrique confirmou preferência técnica pela nossa plataforma.',
    internal_notes:
      'Cliente estratégico! Caso feche até sexta-feira, liberar pacote de treinamento in-company sem custo adicional.',
    scheduled_action: {
      task_type: 'Assinatura de Contrato',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
      time: '14:30',
      alert: 'Alerta Urgente Ativo',
      notes: 'Conferir assinatura via Clicksign e acionar time de Onboarding.',
    },
    attachments: [
      {
        id: 'att-101-1',
        name: 'Proposta_Comercial_Atlas_Logistica_vFinal.pdf',
        category: 'Proposta Comercial',
        size: '1.8 MB',
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        uploaded_by: 'Yasmin Alba',
      },
      {
        id: 'att-101-2',
        name: 'Minuta_Contrato_Anual_SLA_Enterprise.pdf',
        category: 'Contrato / Minuta',
        size: '940 KB',
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        uploaded_by: 'Yasmin Alba',
      },
    ],
    deal_status: 'Em Andamento',
    loss_reason: '',
    priority: 'Alta',
    score: 92,
    engagement_level: 'Pronto para Compra',
    proposal_viewed: true,
    auto_pilot_enabled: true,
    next_action: 'Assinatura de Contrato agendada para amanhã às 14:30',
    tags: ['Enterprise', 'Anual', 'Decisor'],
    notes: 'Diretor de Operações aprovou o escopo técnico.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
  {
    id: 'lead-102',
    name: 'Camila Fontes',
    company: 'Grupo BioMed Saúde',
    job_title: 'Head de Expansão Comercial',
    email: 'c.fontes@grupobiomed.com.br',
    phone: '+55 (11) 97410-5531',
    linkedin_url: 'https://linkedin.com/in/camilafontes-biomed',
    decision_profile: 'Influenciador',
    source: 'Landing Page',
    origin_campaign: 'Diagnóstico Gratuito Funil Médico 2026',
    stage: 'proposta',
    owner_username: 'lucas.mendes',
    owner_name: 'Lucas Mendes',
    value: 32000,
    temperature: 'Quente',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 11).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    pain_points:
      'Atendimento de leads via WhatsApp descentralizado em 3 clínicas; tempo médio de primeira resposta acima de 4 horas.',
    specific_goals:
      'Reduzir SLA de primeiro atendimento para menos de 5 minutos e rastrear ROI por campanha do Meta Ads.',
    available_budget: 'R$ 30.000 a R$ 35.000 / ano',
    decision_deadline: 'Final deste mês',
    competitors: 'RD Station CRM, Kommo',
    interactions: [
      {
        id: 'int-102-1',
        channel: 'WhatsApp',
        title: 'Confirmação de Recebimento de Proposta',
        summary:
          'Camila informou que apresentará os números ao CFO na reunião de diretoria de quinta-feira.',
        author: 'Lucas Mendes',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
    ],
    call_summary:
      'Call de diagnóstico realizada (25 min). Camila validou todas as funcionalidades e solicitou proposta formal para 3 unidades.',
    internal_notes:
      'Camila é forte influenciadora técnica; envolver o CFO na call de fechamento.',
    scheduled_action: {
      task_type: 'Follow-up WhatsApp',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
      time: '10:00',
      alert: '1 hora antes',
      notes: 'Cobrar feedback da apresentação para a diretoria financeira.',
    },
    attachments: [
      {
        id: 'att-102-1',
        name: 'Proposta_Grupo_BioMed_3_Unidades.pdf',
        category: 'Proposta Comercial',
        size: '2.1 MB',
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
        uploaded_by: 'Lucas Mendes',
      },
    ],
    deal_status: 'Em Andamento',
    loss_reason: '',
    priority: 'Alta',
    score: 84,
    engagement_level: 'Quente',
    proposal_viewed: true,
    auto_pilot_enabled: true,
    next_action: 'Follow-up de proposta aberta via WhatsApp Comercial',
    tags: ['Saúde', 'Multi-unidades'],
    notes: 'Solicitou condição de implantação em 3 clínicas de São Paulo.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: 'lead-103',
    name: 'Rafael Albuquerque',
    company: 'Nexa Fintech Brasil',
    job_title: 'VP de Growth & Vendas B2B',
    email: 'rafael@nexafintech.io',
    phone: '+55 (21) 99612-8400',
    linkedin_url: 'https://linkedin.com/in/rafael-albuquerque-nexa',
    decision_profile: 'Decisor',
    source: 'Meta Ads',
    origin_campaign: 'Ads Escala Comercial Fintechs',
    stage: 'qualificado',
    owner_username: 'marina.sdr',
    owner_name: 'Marina Costa',
    value: 19800,
    temperature: 'Quente',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    pain_points:
      'SDRs utilizam planilhas desconectadas e perdem histórico de ligações na passagem de bastão para os Closers.',
    specific_goals:
      'Automatizar passagem de MQL para SQL com score automático e histórico unificado.',
    available_budget: 'Até R$ 22.000 / ano',
    decision_deadline: 'Em 10 dias',
    competitors: 'HubSpot Starter',
    interactions: [
      {
        id: 'int-103-1',
        channel: 'Ligação',
        title: 'Qualificação BANT Concluída pela SDR',
        summary:
          'Orçamento confirmado e dor crítica validada. Agendada demonstração técnica para entrega de proposta.',
        author: 'Marina Costa',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
      },
    ],
    call_summary:
      'Ligação de descoberta de 20 minutos. Rafael tem autonomia total de orçamento até R$ 25k.',
    internal_notes:
      'Preparar demonstração focada no módulo de RBAC e Lead Scoring.',
    scheduled_action: {
      task_type: 'Envio de Proposta',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString().slice(0, 10),
      time: '16:00',
      alert: '15 min antes',
      notes: 'Apresentar proposta comercial ao vivo e liberar trial assistido.',
    },
    attachments: [],
    deal_status: 'Em Andamento',
    loss_reason: '',
    priority: 'Alta',
    score: 81,
    engagement_level: 'Quente',
    proposal_viewed: false,
    auto_pilot_enabled: true,
    next_action: 'Gerar proposta comercial automática e agendar call de 15 min',
    tags: ['SaaS', 'Rápida Conversão'],
    notes: 'Budget confirmado acima de R$ 15k/ano.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
  },
  {
    id: 'lead-104',
    name: 'Beatriz Monteiro',
    company: 'Construtora Horizonte',
    job_title: 'Gerente Comercial Incorporação',
    email: 'beatriz@construtorahorizonte.com.br',
    phone: '+55 (31) 98231-7712',
    linkedin_url: 'https://linkedin.com/in/beatriz-monteiro-horizonte',
    decision_profile: 'Decisor',
    source: 'WhatsApp Comercial',
    origin_campaign: 'Campanha Lançamento Alto Padrão MG',
    stage: 'prospeccao',
    owner_username: 'fila',
    owner_name: 'Fila de Atendimento (Sem Dono)',
    value: 27400,
    temperature: 'Quente',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    pain_points:
      'Baixa visibilidade sobre os corretores que estão acompanhando leads de alto ticket (> R$ 2 milhões).',
    specific_goals:
      'Monitorar tempo em cada etapa do funil e criar alertas automáticos de estagnação.',
    available_budget: 'R$ 25.000 a R$ 30.000 / ano',
    decision_deadline: 'Próximo trimestre (30 dias)',
    competitors: 'CV CRM, Construtor de Vendas',
    interactions: [
      {
        id: 'int-104-1',
        channel: 'WhatsApp',
        title: 'Lead Entrou na Fila de Atendimento Inbound',
        summary:
          'Beatriz solicitou apresentação executiva após preencher formulário no site. Aguardando vendedor assumir.',
        author: 'Gatilho Inbound',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
      },
    ],
    call_summary: 'Aguardando primeiro contato de SDR ou Vendedor da fila.',
    internal_notes: 'Lead sem dono na fila de atendimento — disponível para qualquer funcionário assumir!',
    scheduled_action: {
      task_type: 'Ligação',
      date: new Date(Date.now() + 1000 * 60 * 60 * 12).toISOString().slice(0, 10),
      time: '11:00',
      alert: 'Alerta Urgente Ativo',
      notes: 'Assumir lead da fila e realizar primeiro diagnóstico.',
    },
    attachments: [],
    deal_status: 'Em Andamento',
    loss_reason: '',
    priority: 'Alta',
    score: 79,
    engagement_level: 'Quente',
    proposal_viewed: false,
    auto_pilot_enabled: true,
    next_action: 'Aguardando na Fila de Atendimento (Disponível para Assumir)',
    tags: ['Fila de Atendimento', 'Imobiliário'],
    notes: 'Lead sem dono na fila de atendimento.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
  {
    id: 'lead-105',
    name: 'Eduardo Peixoto',
    company: 'Solaris Energia Limpa',
    job_title: 'CEO & Fundador',
    email: 'eduardo@solarisenergia.com.br',
    phone: '+55 (41) 99105-4490',
    linkedin_url: 'https://linkedin.com/in/eduardo-peixoto-solaris',
    decision_profile: 'Decisor',
    source: 'Indicação',
    origin_campaign: 'Programa Parceiros Enterprise',
    stage: 'fechado',
    owner_username: 'yasyas',
    owner_name: 'Yasmin Alba',
    value: 64000,
    temperature: 'Quente',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 19).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    pain_points:
      'Ciclo de vendas de usinas solares B2B muito longo (90 dias) sem controle de propostas técnicas anexadas.',
    specific_goals:
      'Reduzir ciclo comercial para 45 dias com controle rigoroso de propostas, contratos e motivos de perda.',
    available_budget: 'R$ 64.000 / ano (Fechado)',
    decision_deadline: 'Imediato (Concluído)',
    competitors: 'Salesforce Essentials',
    interactions: [
      {
        id: 'int-105-1',
        channel: 'Reunião',
        title: 'Fechamento e Assinatura do Contrato Anual',
        summary:
          'Contrato assinado digitalmente por Eduardo Peixoto. Pagamento da primeira parcela confirmado.',
        author: 'Yasmin Alba',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      },
    ],
    call_summary:
      'Foram realizadas 4 reuniões até o fechamento. Decisão unânime da diretoria.',
    internal_notes: 'Cliente referência no setor de energia solar no Sul do Brasil.',
    scheduled_action: {
      task_type: 'Reunião de Demonstração',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3).toISOString().slice(0, 10),
      time: '15:00',
      alert: '1 dia antes',
      notes: 'Reunião de Kickoff e Onboarding com equipe de Sucesso do Cliente.',
    },
    attachments: [
      {
        id: 'att-105-1',
        name: 'Contrato_Assinado_Solaris_Energia_2026.pdf',
        category: 'Contrato / Minuta',
        size: '3.4 MB',
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        uploaded_by: 'Yasmin Alba',
      },
    ],
    deal_status: 'Ganho',
    loss_reason: '',
    priority: 'Alta',
    score: 99,
    engagement_level: 'Pronto para Compra',
    proposal_viewed: true,
    auto_pilot_enabled: true,
    next_action: 'Onboarding iniciado automaticamente',
    tags: ['Enterprise', 'Contrato 24m'],
    notes: 'Venda convertida via fluxo executivo.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'lead-106',
    name: 'Fernanda Siqueira',
    company: 'Varejo Prime Rede',
    job_title: 'Gerente Nacional de Operações',
    email: 'fernanda@varejoprime.com.br',
    phone: '+55 (51) 98440-1182',
    linkedin_url: 'https://linkedin.com/in/fernanda-siqueira-varejo',
    decision_profile: 'Influenciador',
    source: 'Google Ads',
    origin_campaign: 'Search - Funil de Vendas B2B',
    stage: 'negociacao',
    owner_username: 'lucas.mendes',
    owner_name: 'Lucas Mendes',
    value: 24500,
    temperature: 'Morno',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    pain_points:
      'Equipes regionais usam controles manuais em Excel sem separação de acesso entre vendedores.',
    specific_goals:
      'Implantar CRM com RBAC onde cada vendedor enxerga apenas sua própria carteira.',
    available_budget: 'R$ 24.500 / ano',
    decision_deadline: '15 dias',
    competitors: 'Planilhas Internas, Agendor',
    interactions: [
      {
        id: 'int-106-1',
        channel: 'E-mail',
        title: 'Envio de Escopo RBAC e Condições Comerciais',
        summary: 'Enviado detalhamento técnico de permissões por nível de usuário.',
        author: 'Lucas Mendes',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      },
    ],
    call_summary: 'Reunião de 30 min com Fernanda e Diretor de TI.',
    internal_notes: 'Oportunidade quente da carteira de Lucas Mendes.',
    scheduled_action: {
      task_type: 'Ligação',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().slice(0, 10),
      time: '09:30',
      alert: '1 hora antes',
      notes: 'Validar aprovação comercial para emissão de contrato.',
    },
    attachments: [],
    deal_status: 'Em Andamento',
    loss_reason: '',
    priority: 'Alta',
    score: 78,
    engagement_level: 'Morno',
    proposal_viewed: true,
    auto_pilot_enabled: true,
    next_action: 'Ligação de fechamento agendada',
    tags: ['Varejo', 'Mid-Market'],
    notes: 'Forte interesse no módulo RBAC.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
  },
  {
    id: 'lead-107',
    name: 'Marcelo Tavares',
    company: 'Krono Indústria Metalúrgica',
    job_title: 'Diretor Comercial',
    email: 'mtavares@kronoindustria.com.br',
    phone: '+55 (19) 99711-6023',
    linkedin_url: 'https://linkedin.com/in/marcelo-tavares-krono',
    decision_profile: 'Decisor',
    source: 'LinkedIn Outbound',
    origin_campaign: 'Indústria 4.0 Outbound',
    stage: 'fechado',
    owner_username: 'lucas.mendes',
    owner_name: 'Lucas Mendes',
    value: 38900,
    temperature: 'Quente',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 16).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    pain_points: 'Falta de rastreabilidade das propostas enviadas pelos representantes.',
    specific_goals: 'Centralizar histórico de propostas e contratos anexados.',
    available_budget: 'R$ 38.900 / ano (Fechado)',
    decision_deadline: 'Concluído',
    competitors: 'Moskit CRM',
    interactions: [],
    call_summary: 'Negociação concluída em 2 calls executivas por Lucas Mendes.',
    internal_notes: 'Venda fechada da carteira do vendedor Lucas Mendes.',
    scheduled_action: {
      task_type: 'Reunião de Demonstração',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString().slice(0, 10),
      time: '14:00',
      alert: '1 dia antes',
      notes: 'Passagem de bastão para implantação.',
    },
    attachments: [
      {
        id: 'att-107-1',
        name: 'Contrato_Krono_Metalurgica_Assinado.pdf',
        category: 'Contrato / Minuta',
        size: '2.4 MB',
        uploaded_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        uploaded_by: 'Lucas Mendes',
      },
    ],
    deal_status: 'Ganho',
    loss_reason: '',
    priority: 'Alta',
    score: 96,
    engagement_level: 'Pronto para Compra',
    proposal_viewed: true,
    auto_pilot_enabled: true,
    next_action: 'Kickoff agendado com equipe de CS',
    tags: ['Indústria', 'B2B'],
    notes: 'Contrato assinado.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
  {
    id: 'lead-108',
    name: 'Roberto Vasconcelos',
    company: 'TecnoPlast Embalagens',
    job_title: 'Gerente Industrial',
    email: 'roberto@tecnoplast.ind.br',
    phone: '+55 (19) 98122-3301',
    linkedin_url: 'https://linkedin.com/in/roberto-tecnoplast',
    decision_profile: 'Influenciador',
    source: 'Google Ads',
    origin_campaign: 'Busca Indústria CRM 2026',
    stage: 'perdido',
    owner_username: 'lucas.mendes',
    owner_name: 'Lucas Mendes',
    value: 21000,
    temperature: 'Frio',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25).toISOString(),
    stage_entered_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    pain_points: 'Necessitava integração legada com ERP industrial AS/400 local.',
    specific_goals: 'Sincronização bidirecional de estoque fabril em tempo real.',
    available_budget: 'R$ 20.000 / ano',
    decision_deadline: 'Encerrado',
    competitors: 'Módulo Nativo TOTVS',
    interactions: [],
    call_summary: 'Duas reuniões técnicas realizadas com TI da fábrica.',
    internal_notes: 'Arquivado com motivo Sem Fit Técnico.',
    scheduled_action: {
      task_type: 'E-mail Comercial',
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString().slice(0, 10),
      time: '10:00',
      alert: 'Sem alerta',
      notes: 'Reengajar daqui a 60 dias.',
    },
    attachments: [],
    deal_status: 'Perdido',
    loss_reason: 'Sem Fit Técnico',
    priority: 'Baixa',
    score: 25,
    engagement_level: 'Frio',
    proposal_viewed: true,
    auto_pilot_enabled: false,
    next_action: 'Oportunidade arquivada (Motivo: Sem Fit Técnico)',
    tags: ['Indústria', 'Perdido'],
    notes: 'Sem API REST disponível no ERP antigo do cliente.',
    last_activity_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];

const DEFAULT_AUTOMATIONS: AutomationRule[] = [
  {
    id: 'auto-01',
    name: 'Qualificação Instantânea por Lead Score (MQL)',
    description:
      'Avança automaticamente leads em Prospecção com Score >= 75 para Qualificado (MQL) e dispara mensagem consultiva de boas-vindas.',
    trigger_stage: 'prospeccao',
    min_score: 75,
    min_value: 5000,
    require_proposal_viewed: false,
    target_stage: 'qualificado',
    action_channel: 'WhatsApp',
    message_template:
      'Olá {{nome}}, identificamos alto potencial para a {{empresa}}! Preparei um diagnóstico rápido para escalarmos suas vendas.',
    is_active: true,
    executions_count: 14,
    last_triggered_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'auto-02',
    name: 'Envio Automático de Proposta Comercial',
    description:
      'Quando um lead Qualificado atinge Score >= 80 e ticket >= R$ 15.000, gera proposta personalizada e move para Proposta Enviada.',
    trigger_stage: 'qualificado',
    min_score: 80,
    min_value: 15000,
    require_proposal_viewed: false,
    target_stage: 'proposta',
    action_channel: 'Proposta PDF',
    message_template:
      'Proposta Comercial enviada para {{nome}} ({{empresa}}) no valor de {{valor}} com escopo de implantação prioritária.',
    is_active: true,
    executions_count: 9,
    last_triggered_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'auto-03',
    name: 'Acelerador de Negociação (Proposta Visualizada)',
    description:
      'Detecta abertura da proposta em leads com Score >= 82 e move automaticamente para Negociação & Follow-up.',
    trigger_stage: 'proposta',
    min_score: 82,
    min_value: 10000,
    require_proposal_viewed: true,
    target_stage: 'negociacao',
    action_channel: 'WhatsApp',
    message_template:
      'Oi {{nome}}, vi que você acessou nossa proposta para a {{empresa}}. Liberamos isenção de taxa de setup para fechamento nesta semana!',
    is_active: true,
    executions_count: 7,
    last_triggered_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'auto-04',
    name: 'Conversão Automática Fast-Track (Alta Intenção)',
    description:
      'Converte oportunidades em Negociação com Score >= 90 e proposta aprovada/visualizada em Fechado / Ganho.',
    trigger_stage: 'negociacao',
    min_score: 90,
    min_value: 20000,
    require_proposal_viewed: true,
    target_stage: 'fechado',
    action_channel: 'Webhook CRM',
    message_template:
      'Parabéns {{nome}}! Contrato da {{empresa}} ({{valor}}) confirmado e enviado para ativação imediata.',
    is_active: true,
    executions_count: 5,
    last_triggered_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
];

const DEFAULT_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-01',
    lead_id: 'lead-105',
    lead_name: 'Eduardo Peixoto (Solaris Energia Limpa)',
    type: 'venda_fechada',
    title: 'Venda Convertida via Automação (R$ 64.000)',
    description:
      'Regra "Conversão Automática Fast-Track" converteu a oportunidade com Score 99.',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'act-02',
    lead_id: 'lead-101',
    lead_name: 'Henrique Vasconcelos (Atlas Logística S.A.)',
    type: 'automacao',
    title: 'Proposta Visualizada — Movido para Negociação',
    description:
      'Webhook de leitura de proposta detectado (Score 92). Próxima tarefa: Assinatura de Contrato.',
    created_at: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
  },
];

export function calculateFunnelDuration(
  createdAtIso: string,
  stageEnteredAtIso?: string
): {
  totalDays: number;
  totalLabel: string;
  stageDays: number;
  stageLabel: string;
} {
  const now = Date.now();
  const createdMs = new Date(createdAtIso).getTime() || now;
  const stageMs = stageEnteredAtIso
    ? new Date(stageEnteredAtIso).getTime() || createdMs
    : createdMs;

  const diffTotalHours = Math.max(
    1,
    Math.floor((now - createdMs) / (1000 * 60 * 60))
  );
  const totalDays = Math.floor(diffTotalHours / 24);
  const remHours = diffTotalHours % 24;

  const diffStageHours = Math.max(
    1,
    Math.floor((now - stageMs) / (1000 * 60 * 60))
  );
  const stageDays = Math.floor(diffStageHours / 24);
  const remStageHours = diffStageHours % 24;

  const totalLabel =
    totalDays > 0 ? `${totalDays}d ${remHours}h` : `${diffTotalHours}h`;
  const stageLabel =
    stageDays > 0 ? `${stageDays}d ${remStageHours}h` : `${diffStageHours}h`;

  return {
    totalDays,
    totalLabel,
    stageDays,
    stageLabel,
  };
}

export function calculateLeadScore(lead: {
  value: number;
  priority: LeadPriority;
  engagement_level: EngagementLevel;
  temperature?: LeadTemperature;
  decision_profile?: DecisionProfile;
  proposal_viewed: boolean;
  source: LeadSource;
  stage: FunnelStageId;
}): number {
  let score = 35;

  if (lead.value >= 40000) score += 20;
  else if (lead.value >= 20000) score += 15;
  else if (lead.value >= 10000) score += 10;
  else score += 5;

  if (lead.priority === 'Alta') score += 12;
  else if (lead.priority === 'Média') score += 7;

  const temp = lead.temperature || lead.engagement_level;
  if (temp === 'Quente' || lead.engagement_level === 'Pronto para Compra') {
    score += 18;
  } else if (temp === 'Morno') {
    score += 9;
  }

  if (lead.decision_profile === 'Decisor') score += 8;
  else if (lead.decision_profile === 'Influenciador') score += 4;

  if (lead.proposal_viewed) score += 9;

  if (lead.source === 'Indicação' || lead.source === 'WhatsApp Comercial') {
    score += 5;
  }

  if (lead.stage === 'fechado') return 99;
  if (lead.stage === 'perdido') return Math.min(score, 28);

  return Math.max(15, Math.min(99, score));
}

function normalizeUser(u: Partial<UserAccount>): UserAccount {
  const uname = (u.username || 'usuario').toLowerCase();
  const isAdmin =
    u.access_role === 'administrador' ||
    uname === 'yasyas' ||
    (u.role &&
      (u.role.toLowerCase().includes('diretor') ||
        u.role.toLowerCase().includes('gestor') ||
        u.role.toLowerCase().includes('admin') ||
        u.role.toLowerCase().includes('head')));

  return {
    id: u.id || `usr-${Date.now()}`,
    username: uname,
    password_hash: u.password_hash || '1234',
    full_name: u.full_name || uname,
    email: u.email || `${uname}@verticecrm.com.br`,
    role:
      u.role ||
      (isAdmin ? 'Gestor / Diretor Comercial' : 'Vendedor / SDR'),
    access_role: isAdmin ? 'administrador' : 'funcionario',
    company: u.company || 'Vértice Enterprise',
    created_at: u.created_at || new Date().toISOString(),
  };
}

function normalizeLead(raw: Partial<Lead>): Lead {
  const stage: FunnelStageId = raw.stage || 'prospeccao';
  const temp: LeadTemperature =
    raw.temperature ||
    (raw.engagement_level === 'Frio'
      ? 'Frio'
      : raw.engagement_level === 'Morno'
      ? 'Morno'
      : 'Quente');

  const dealStatus =
    stage === 'fechado'
      ? 'Ganho'
      : stage === 'perdido'
      ? 'Perdido'
      : raw.deal_status || 'Em Andamento';

  const ownerUname =
    raw.owner_username !== undefined ? raw.owner_username : 'yasyas';
  const ownerDisplayName =
    ownerUname === 'fila' || ownerUname === ''
      ? 'Fila de Atendimento (Sem Dono)'
      : raw.owner_name || ownerUname;

  return {
    id: raw.id || `lead-${Date.now()}`,
    name: raw.name || 'Cliente Sem Nome',
    company: raw.company || 'Empresa B2B',
    job_title: raw.job_title || 'Diretor Comercial',
    email: raw.email || 'contato@empresa.com.br',
    phone: raw.phone || '+55 (11) 99999-0000',
    linkedin_url: raw.linkedin_url || '',
    decision_profile: raw.decision_profile || 'Decisor',
    source: raw.source || 'Landing Page',
    origin_campaign: raw.origin_campaign || 'Inbound Comercial Q4',
    stage,
    owner_username: ownerUname || 'fila',
    owner_name: ownerDisplayName,
    value: Number(raw.value) || 0,
    temperature: temp,
    created_at: raw.created_at || new Date().toISOString(),
    stage_entered_at:
      raw.stage_entered_at ||
      raw.last_activity_at ||
      raw.created_at ||
      new Date().toISOString(),
    pain_points: raw.pain_points || '',
    specific_goals: raw.specific_goals || '',
    available_budget:
      raw.available_budget ||
      (raw.value
        ? `R$ ${Number(raw.value).toLocaleString('pt-BR')}`
        : 'A confirmar'),
    decision_deadline: raw.decision_deadline || '30 dias',
    competitors: raw.competitors || 'Nenhum informado',
    interactions: Array.isArray(raw.interactions) ? raw.interactions : [],
    call_summary: raw.call_summary || '',
    internal_notes: raw.internal_notes || raw.notes || '',
    scheduled_action:
      raw.scheduled_action && raw.scheduled_action.task_type
        ? raw.scheduled_action
        : {
            task_type: 'Follow-up WhatsApp',
            date: new Date(Date.now() + 1000 * 60 * 60 * 24)
              .toISOString()
              .slice(0, 10),
            time: '10:00',
            alert: '1 hora antes',
            notes: raw.next_action || 'Realizar contato de avanço de etapa',
          },
    attachments: Array.isArray(raw.attachments) ? raw.attachments : [],
    deal_status: dealStatus,
    loss_reason: raw.loss_reason || '',
    priority: raw.priority || 'Alta',
    score: Number(raw.score) || 75,
    engagement_level: raw.engagement_level || temp,
    proposal_viewed: Boolean(raw.proposal_viewed),
    auto_pilot_enabled:
      raw.auto_pilot_enabled !== undefined
        ? Boolean(raw.auto_pilot_enabled)
        : true,
    next_action: raw.next_action || 'Acompanhamento comercial agendado',
    tags: Array.isArray(raw.tags) ? raw.tags : ['B2B'],
    notes: raw.notes || raw.internal_notes || '',
    last_activity_at: raw.last_activity_at || new Date().toISOString(),
  };
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Erro ao salvar cache local:', err);
  }
}

export const crmRepository = {
  getSettings(): SystemSettings {
    const saved = readLocal<SystemSettings>(
      STORAGE_KEYS.SETTINGS,
      DEFAULT_SETTINGS
    );
    if (!Array.isArray(saved.loss_reasons) || saved.loss_reasons.length === 0) {
      saved.loss_reasons = [...DEFAULT_LOSS_REASONS];
    }
    return saved;
  },

  saveSettings(settings: SystemSettings): void {
    writeLocal(STORAGE_KEYS.SETTINGS, settings);
  },

  getUsers(): UserAccount[] {
    const users = readLocal<UserAccount[]>(
      STORAGE_KEYS.USERS,
      DEFAULT_USERS
    ).map(normalizeUser);

    const hasYasyas = users.some((u) => u.username.toLowerCase() === 'yasyas');
    if (!hasYasyas) {
      users.unshift(DEFAULT_USERS[0]);
      writeLocal(STORAGE_KEYS.USERS, users);
    }
    return users;
  },

  async deleteUser(userId: string): Promise<UserAccount[]> {
    const users = this.getUsers().filter(
      (u) => u.id !== userId && u.username !== 'yasyas'
    );
    writeLocal(STORAGE_KEYS.USERS, users);
    if (supabase) {
      try {
        await supabase.from('crm_users').delete().eq('id', userId);
      } catch {
        // Ignore if offline
      }
    }
    return users;
  },

  async updateUserAccessRole(
    userId: string,
    accessRole: AccessRole,
    descriptiveRole: string
  ): Promise<UserAccount[]> {
    const users = this.getUsers().map((u) =>
      u.id === userId
        ? { ...u, access_role: accessRole, role: descriptiveRole }
        : u
    );
    writeLocal(STORAGE_KEYS.USERS, users);
    if (supabase) {
      try {
        const updated = users.find((u) => u.id === userId);
        if (updated) {
          await supabase
            .from('crm_users')
            .upsert(updated, { onConflict: 'id' });
        }
      } catch {
        // Ignore
      }
    }
    return users;
  },

  async authenticate(
    usernameOrEmail: string,
    password: string
  ): Promise<{
    user: UserAccount | null;
    error?: string;
    syncedFromSupabase?: boolean;
  }> {
    const normalized = usernameOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('crm_users')
          .select('*')
          .or(`username.ilike.${normalized},email.ilike.${normalized}`)
          .maybeSingle();

        if (!error && data && data.password_hash === cleanPass) {
          const user = normalizeUser(data as UserAccount);
          this.setCurrentUser(user);
          return { user, syncedFromSupabase: true };
        }
      } catch {
        // Fallback to local
      }
    }

    const users = this.getUsers();
    const matched = users.find(
      (u) =>
        (u.username.toLowerCase() === normalized ||
          u.email.toLowerCase() === normalized) &&
        u.password_hash === cleanPass
    );

    if (!matched) {
      return {
        user: null,
        error:
          'Credenciais inválidas. Utilize "yasyas" (Admin) ou "lucas.mendes" (Funcionário) com senha "1234".',
      };
    }

    this.setCurrentUser(matched);

    if (supabase) {
      supabase
        .from('crm_users')
        .upsert(matched, { onConflict: 'username' })
        .then(() => {});
    }

    return { user: matched };
  },

  async registerUser(payload: {
    username: string;
    password: string;
    full_name: string;
    email: string;
    role: string;
    access_role?: AccessRole;
    company: string;
    autoLogin?: boolean;
  }): Promise<{
    user: UserAccount | null;
    error?: string;
    savedToSupabase: boolean;
  }> {
    const cleanUsername = payload.username.trim().toLowerCase();
    const cleanEmail = payload.email.trim().toLowerCase();
    const users = this.getUsers();

    if (
      users.some(
        (u) =>
          u.username.toLowerCase() === cleanUsername ||
          u.email.toLowerCase() === cleanEmail
      )
    ) {
      return {
        user: null,
        error: 'Este login ou e-mail já está cadastrado no sistema.',
        savedToSupabase: false,
      };
    }

    const newUser: UserAccount = normalizeUser({
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password_hash: payload.password.trim(),
      full_name: payload.full_name.trim(),
      email: cleanEmail,
      role: payload.role.trim() || 'Vendedor / SDR',
      access_role: payload.access_role || 'funcionario',
      company: payload.company.trim() || 'Vértice CRM',
      created_at: new Date().toISOString(),
    });

    const updatedUsers = [newUser, ...users];
    writeLocal(STORAGE_KEYS.USERS, updatedUsers);
    if (payload.autoLogin !== false) {
      this.setCurrentUser(newUser);
    }

    let savedToSupabase = false;
    if (supabase) {
      try {
        const { error } = await supabase
          .from('crm_users')
          .upsert(newUser, { onConflict: 'id' });
        if (!error) savedToSupabase = true;
      } catch {
        savedToSupabase = false;
      }
    }

    return { user: newUser, savedToSupabase };
  },

  getCurrentUser(): UserAccount | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return raw ? normalizeUser(JSON.parse(raw) as UserAccount) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: UserAccount | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(
        STORAGE_KEYS.CURRENT_USER,
        JSON.stringify(normalizeUser(user))
      );
    }
  },

  async fetchAllState(): Promise<{
    leads: Lead[];
    automations: AutomationRule[];
    activities: ActivityLog[];
    supabaseConnected: boolean;
    supabaseTableReady: boolean;
  }> {
    let leads = readLocal<Lead[]>(STORAGE_KEYS.LEADS, DEFAULT_LEADS).map(
      normalizeLead
    );
    let automations = readLocal<AutomationRule[]>(
      STORAGE_KEYS.AUTOMATIONS,
      DEFAULT_AUTOMATIONS
    );
    let activities = readLocal<ActivityLog[]>(
      STORAGE_KEYS.ACTIVITIES,
      DEFAULT_ACTIVITIES
    );
    let supabaseTableReady = false;

    if (supabase) {
      try {
        const { data: remoteLeads, error: leadsError } = await supabase
          .from('crm_leads')
          .select('*')
          .order('created_at', { ascending: false });

        if (!leadsError && remoteLeads) {
          supabaseTableReady = true;
          if (remoteLeads.length > 0) {
            leads = remoteLeads.map((item) => normalizeLead(item));
            writeLocal(STORAGE_KEYS.LEADS, leads);
          } else {
            await supabase.from('crm_leads').upsert(leads, { onConflict: 'id' });
          }
        }

        const { data: remoteAutos, error: autosError } = await supabase
          .from('crm_automations')
          .select('*');

        if (!autosError && remoteAutos) {
          if (remoteAutos.length > 0) {
            automations = remoteAutos.map((a) => ({
              ...a,
              min_score: Number(a.min_score),
              min_value: Number(a.min_value),
              executions_count: Number(a.executions_count),
            })) as AutomationRule[];
            writeLocal(STORAGE_KEYS.AUTOMATIONS, automations);
          } else {
            await supabase
              .from('crm_automations')
              .upsert(automations, { onConflict: 'id' });
          }
        }

        const { data: remoteActs, error: actsError } = await supabase
          .from('crm_activities')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (!actsError && remoteActs && remoteActs.length > 0) {
          activities = remoteActs as ActivityLog[];
          writeLocal(STORAGE_KEYS.ACTIVITIES, activities);
        }
      } catch {
        supabaseTableReady = false;
      }
    }

    return {
      leads,
      automations,
      activities,
      supabaseConnected: isSupabaseEnvConfigured,
      supabaseTableReady,
    };
  },

  async saveLead(lead: Lead): Promise<{ savedToSupabase: boolean }> {
    const normalized = normalizeLead(lead);
    const leads = readLocal<Lead[]>(STORAGE_KEYS.LEADS, DEFAULT_LEADS).map(
      normalizeLead
    );
    const existsIndex = leads.findIndex((l) => l.id === normalized.id);
    if (existsIndex >= 0) {
      leads[existsIndex] = normalized;
    } else {
      leads.unshift(normalized);
    }
    writeLocal(STORAGE_KEYS.LEADS, leads);

    if (supabase) {
      try {
        const { error } = await supabase
          .from('crm_leads')
          .upsert(normalized, { onConflict: 'id' });
        return { savedToSupabase: !error };
      } catch {
        return { savedToSupabase: false };
      }
    }
    return { savedToSupabase: false };
  },

  async saveLeadsBatch(updatedLeads: Lead[]): Promise<{ savedToSupabase: boolean }> {
    const normalizedList = updatedLeads.map(normalizeLead);
    writeLocal(STORAGE_KEYS.LEADS, normalizedList);
    if (supabase) {
      try {
        const { error } = await supabase
          .from('crm_leads')
          .upsert(normalizedList, { onConflict: 'id' });
        return { savedToSupabase: !error };
      } catch {
        return { savedToSupabase: false };
      }
    }
    return { savedToSupabase: false };
  },

  async deleteLead(leadId: string): Promise<void> {
    const leads = readLocal<Lead[]>(STORAGE_KEYS.LEADS, DEFAULT_LEADS).filter(
      (l) => l.id !== leadId
    );
    writeLocal(STORAGE_KEYS.LEADS, leads);
    if (supabase) {
      try {
        await supabase.from('crm_leads').delete().eq('id', leadId);
      } catch {
        // Ignore if offline
      }
    }
  },

  async saveAutomations(automations: AutomationRule[]): Promise<void> {
    writeLocal(STORAGE_KEYS.AUTOMATIONS, automations);
    if (supabase) {
      try {
        await supabase
          .from('crm_automations')
          .upsert(automations, { onConflict: 'id' });
      } catch {
        // Ignore if offline
      }
    }
  },

  async logActivity(
    activity: Omit<ActivityLog, 'id' | 'created_at'>
  ): Promise<ActivityLog> {
    const newEntry: ActivityLog = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    const current = readLocal<ActivityLog[]>(
      STORAGE_KEYS.ACTIVITIES,
      DEFAULT_ACTIVITIES
    );
    const updated = [newEntry, ...current].slice(0, 80);
    writeLocal(STORAGE_KEYS.ACTIVITIES, updated);

    if (supabase) {
      try {
        await supabase.from('crm_activities').insert(newEntry);
      } catch {
        // Ignore if offline
      }
    }

    return newEntry;
  },

  async syncAllToSupabase(): Promise<{
    success: boolean;
    message: string;
    counts: {
      users: number;
      leads: number;
      automations: number;
      activities: number;
    };
  }> {
    const users = this.getUsers();
    const leads = readLocal<Lead[]>(STORAGE_KEYS.LEADS, DEFAULT_LEADS).map(
      normalizeLead
    );
    const automations = readLocal<AutomationRule[]>(
      STORAGE_KEYS.AUTOMATIONS,
      DEFAULT_AUTOMATIONS
    );
    const activities = readLocal<ActivityLog[]>(
      STORAGE_KEYS.ACTIVITIES,
      DEFAULT_ACTIVITIES
    );

    if (!supabase) {
      return {
        success: false,
        message:
          'Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY ainda não configuradas no ambiente. Todos os registros RBAC e os 5 módulos de clientes estão salvos localmente.',
        counts: {
          users: users.length,
          leads: leads.length,
          automations: automations.length,
          activities: activities.length,
        },
      };
    }

    try {
      const [uRes, lRes, aRes, actRes] = await Promise.all([
        supabase.from('crm_users').upsert(users, { onConflict: 'id' }),
        supabase.from('crm_leads').upsert(leads, { onConflict: 'id' }),
        supabase
          .from('crm_automations')
          .upsert(automations, { onConflict: 'id' }),
        supabase.from('crm_activities').upsert(activities, { onConflict: 'id' }),
      ]);

      const firstError = uRes.error || lRes.error || aRes.error || actRes.error;
      if (firstError) {
        return {
          success: false,
          message: `Conectado ao Supabase, porém as tabelas precisam ser atualizadas. Execute o Script SQL na aba Configurações & Supabase (${firstError.message}).`,
          counts: {
            users: users.length,
            leads: leads.length,
            automations: automations.length,
            activities: activities.length,
          },
        };
      }

      return {
        success: true,
        message:
          'Todos os usuários (com níveis RBAC), leads (5 módulos completos), etapas e automações foram sincronizados com sucesso no Supabase!',
        counts: {
          users: users.length,
          leads: leads.length,
          automations: automations.length,
          activities: activities.length,
        },
      };
    } catch (err) {
      return {
        success: false,
        message:
          err instanceof Error
            ? err.message
            : 'Falha ao comunicar com o endpoint Supabase.',
        counts: {
          users: users.length,
          leads: leads.length,
          automations: automations.length,
          activities: activities.length,
        },
      };
    }
  },
};

export function isLeadVisibleToUser(lead: Lead, user: UserAccount): boolean {
  if (user.access_role === 'administrador') {
    return true;
  }
  const ownerUser = (lead.owner_username || '').trim().toLowerCase();
  const ownerName = (lead.owner_name || '').trim().toLowerCase();
  const currentUsername = (user.username || '').trim().toLowerCase();
  const currentFullName = (user.full_name || '').trim().toLowerCase();

  // Unassigned leads in the Attendance Queue are visible to SDRs/Vendedores so they can claim them
  if (
    !ownerUser ||
    ownerUser === 'fila' ||
    ownerName.includes('fila de atendimento') ||
    ownerName.includes('sem dono')
  ) {
    return true;
  }

  return ownerUser === currentUsername || ownerName === currentFullName;
}


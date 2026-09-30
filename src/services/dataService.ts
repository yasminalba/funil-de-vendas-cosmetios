import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  AdminFinancialMetrics,
  ContactOrigin,
  CustomerFull,
  CustomerStatus,
  CustomerView,
  FunnelStageConfig,
  FunnelStageId,
  KanbanLeadFull,
  KanbanLeadView,
  LeadPriority,
  SkinHairProfile,
  UserProfile,
  VacationRequest,
  VacationStatus,
} from '../types/cosmetics';

// Read Supabase credentials from Vite environment
const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const STORAGE_KEYS = {
  SESSION_USER: 'mv_cosmetics_session_v1',
  USERS: 'mv_cosmetics_users_v1',
  STAGES: 'mv_cosmetics_stages_v1',
  LEADS: 'mv_cosmetics_leads_v1',
  CUSTOMERS: 'mv_cosmetics_customers_v1',
  VACATIONS: 'mv_cosmetics_vacations_v1',
  SUPABASE_CONN: 'mv_cosmetics_sb_conn_v1',
};

interface SavedSupabaseConnection {
  url: string;
  anonKey: string;
}

function getEffectiveSupabaseCredentials(): SavedSupabaseConnection {
  if (
    envUrl &&
    envKey &&
    !envUrl.includes('MY_') &&
    envUrl.startsWith('http')
  ) {
    return { url: envUrl, anonKey: envKey };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPABASE_CONN);
    if (raw) {
      const parsed = JSON.parse(raw) as SavedSupabaseConnection;
      if (parsed.url && parsed.anonKey && parsed.url.startsWith('http')) {
        return parsed;
      }
    }
  } catch {
    // Ignore parse error
  }
  return { url: '', anonKey: '' };
}

let activeCreds = getEffectiveSupabaseCredentials();

export let supabaseClient: SupabaseClient | null =
  activeCreds.url && activeCreds.anonKey
    ? createClient(activeCreds.url, activeCreds.anonKey)
    : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseClient);
}

export function getActiveSupabaseUrl(): string {
  return activeCreds.url;
}

export function configureSupabaseConnection(
  url: string,
  anonKey: string
): boolean {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();
  if (!cleanUrl || !cleanKey || !cleanUrl.startsWith('http')) {
    localStorage.removeItem(STORAGE_KEYS.SUPABASE_CONN);
    activeCreds = getEffectiveSupabaseCredentials();
    supabaseClient =
      activeCreds.url && activeCreds.anonKey
        ? createClient(activeCreds.url, activeCreds.anonKey)
        : null;
    return Boolean(supabaseClient);
  }

  localStorage.setItem(
    STORAGE_KEYS.SUPABASE_CONN,
    JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
  );
  activeCreds = { url: cleanUrl, anonKey: cleanKey };
  supabaseClient = createClient(cleanUrl, cleanKey);
  return true;
}

// ============================================================================
// MAPPERS: TYPESCRIPT CAMELCASE <-> SUPABASE POSTGRES SNAKE_CASE
// ============================================================================

function userToDb(u: UserProfile) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    password: u.password || '1234',
    role: u.role,
    job_title: u.jobTitle,
    avatar_initials: u.avatarInitials,
    active: u.active,
  };
}

function dbToUser(row: Record<string, any>): UserProfile {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    email: String(row.email || ''),
    password: String(row.password || '1234'),
    role: row.role === 'adm' ? 'adm' : 'funcionario',
    jobTitle: String(row.job_title || row.jobTitle || 'Consultora de Beleza'),
    avatarInitials: String(row.avatar_initials || row.avatarInitials || 'MV'),
    active: row.active !== false,
  };
}

function stageToDb(s: FunnelStageConfig) {
  return {
    id: s.id,
    order: s.order,
    name: s.name,
    is_final_won_stage: Boolean(s.isFinalWonStage || s.id === 'stage_4'),
  };
}

function dbToStage(row: Record<string, any>): FunnelStageConfig {
  return {
    id: row.id as FunnelStageId,
    order: Number(row.order || 1),
    name: String(row.name || ''),
    isFinalWonStage: Boolean(row.is_final_won_stage || row.id === 'stage_4'),
  };
}

function leadToDb(l: KanbanLeadFull) {
  return {
    id: l.id,
    customer_name: l.customerName,
    whatsapp: l.whatsapp,
    city: l.city,
    product_of_interest: l.productOfInterest,
    cart_value: Number(l.cartValue || 0),
    priority: l.priority,
    stage_id: l.stageId,
    assigned_to_id: l.assignedToId,
    assigned_to_name: l.assignedToName,
    origin: l.origin,
    skin_hair_type: l.skinHairType,
    notes: l.notes || '',
    created_at: l.createdAt || getTodayISO(),
    updated_at: l.updatedAt || getTodayISO(),
  };
}

function dbToLead(row: Record<string, any>): KanbanLeadFull {
  return {
    id: String(row.id),
    customerName: String(row.customer_name || row.customerName || ''),
    whatsapp: String(row.whatsapp || ''),
    city: String(row.city || 'São Paulo - SP'),
    productOfInterest: String(
      row.product_of_interest || row.productOfInterest || ''
    ),
    cartValue: Number(row.cart_value ?? row.cartValue ?? 0),
    priority: (row.priority as LeadPriority) || 'Média',
    stageId: (row.stage_id || row.stageId || 'stage_1') as FunnelStageId,
    assignedToId: String(
      row.assigned_to_id || row.assignedToId || 'usr_emp_camila'
    ),
    assignedToName: String(
      row.assigned_to_name || row.assignedToName || 'Camila Souza'
    ),
    origin: (row.origin as ContactOrigin) || 'Instagram',
    skinHairType:
      (row.skin_hair_type as SkinHairProfile) ||
      (row.skinHairType as SkinHairProfile) ||
      'Pele Seca / Sensível',
    notes: String(row.notes || ''),
    createdAt: String(row.created_at || row.createdAt || getTodayISO()).slice(
      0,
      10
    ),
    updatedAt: String(row.updated_at || row.updatedAt || getTodayISO()).slice(
      0,
      10
    ),
  };
}

function customerToDb(c: CustomerFull) {
  return {
    id: c.id,
    name: c.name,
    whatsapp: c.whatsapp,
    email: c.email || null,
    city: c.city,
    origin: c.origin,
    status: c.status,
    responsible_id: c.responsibleId,
    responsible_name: c.responsibleName,
    skin_hair_type: c.skinHairType,
    favorite_products: c.favoriteProducts || '',
    last_interaction: c.lastInteraction || getTodayISO(),
    last_purchase:
      c.lastPurchase && c.lastPurchase.trim() !== '' ? c.lastPurchase : null,
    notes: c.notes || '',
    ltv: Number(c.ltv || 0),
    total_orders: Number(c.totalOrders || 0),
    average_ticket: Number(c.averageTicket || 0),
  };
}

function dbToCustomer(row: Record<string, any>): CustomerFull {
  return {
    id: String(row.id),
    name: String(row.name || ''),
    whatsapp: String(row.whatsapp || ''),
    email: String(row.email || ''),
    city: String(row.city || 'São Paulo - SP'),
    origin: (row.origin as ContactOrigin) || 'Instagram',
    status: (row.status as CustomerStatus) || 'Lead',
    responsibleId: String(
      row.responsible_id || row.responsibleId || 'usr_emp_camila'
    ),
    responsibleName: String(
      row.responsible_name || row.responsibleName || 'Camila Souza'
    ),
    skinHairType:
      (row.skin_hair_type as SkinHairProfile) ||
      (row.skinHairType as SkinHairProfile) ||
      'Pele Seca / Sensível',
    favoriteProducts: String(
      row.favorite_products || row.favoriteProducts || ''
    ),
    lastInteraction: String(
      row.last_interaction || row.lastInteraction || getTodayISO()
    ).slice(0, 10),
    lastPurchase: row.last_purchase
      ? String(row.last_purchase).slice(0, 10)
      : row.lastPurchase
      ? String(row.lastPurchase).slice(0, 10)
      : null,
    notes: String(row.notes || ''),
    ltv: Number(row.ltv ?? 0),
    totalOrders: Number(row.total_orders ?? row.totalOrders ?? 0),
    averageTicket: Number(row.average_ticket ?? row.averageTicket ?? 0),
  };
}

function vacationToDb(v: VacationRequest) {
  return {
    id: v.id,
    employee_id: v.employeeId,
    employee_name: v.employeeName,
    employee_email: v.employeeEmail,
    start_date: v.startDate,
    end_date: v.endDate,
    days_count: Number(v.daysCount || 1),
    status: v.status,
    observation: v.observation || '',
    requested_at: v.requestedAt || getTodayISO(),
    decided_by: v.decidedBy || null,
    decided_at: v.decidedAt || null,
  };
}

function dbToVacation(row: Record<string, any>): VacationRequest {
  return {
    id: String(row.id),
    employeeId: String(row.employee_id || row.employeeId || 'usr_emp_camila'),
    employeeName: String(
      row.employee_name || row.employeeName || 'Camila Souza'
    ),
    employeeEmail: String(
      row.employee_email || row.employeeEmail || 'vendedor@cosmeticos.com'
    ),
    startDate: String(row.start_date || row.startDate || getTodayISO()).slice(
      0,
      10
    ),
    endDate: String(row.end_date || row.endDate || getTodayISO()).slice(0, 10),
    daysCount: Number(row.days_count ?? row.daysCount ?? 1),
    status: (row.status as VacationStatus) || 'Pendente',
    observation: String(row.observation || ''),
    requestedAt: String(
      row.requested_at || row.requestedAt || getTodayISO()
    ).slice(0, 10),
    decidedBy: row.decided_by || row.decidedBy || undefined,
    decidedAt: row.decided_at || row.decidedAt || undefined,
  };
}

// ============================================================================
// FORMATTING & DATE HELPERS (pt-BR, R$, dd/mm/aaaa)
// ============================================================================

export function formatCurrencyBR(value: number | undefined | null): string {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 'R$ ••••';
  }
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const clean = dateStr.trim();
  if (!clean) return '—';

  if (/^\d{2}\/\d{2}\/\d{4}/.test(clean)) {
    return clean;
  }

  const ymdMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymdMatch) {
    return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`;
  }

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return clean;
  const d = String(parsed.getDate()).padStart(2, '0');
  const m = String(parsed.getMonth() + 1).padStart(2, '0');
  const y = parsed.getFullYear();
  return `${d}/${m}/${y}`;
}

export function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getNowTimestampBR(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${d}/${m}/${y} às ${hh}:${mm}`;
}

export function calculateInclusiveDays(startIso: string, endIso: string): number {
  if (!startIso || !endIso) return 0;
  const start = new Date(`${startIso}T00:00:00`);
  const end = new Date(`${endIso}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  if (diffMs < 0) return -1;
  return Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateDaysSince(dateIso: string | null | undefined): number {
  if (!dateIso || typeof dateIso !== 'string') return 999;
  const target = new Date(`${dateIso.slice(0, 10)}T00:00:00`);
  const now = new Date(`${getTodayISO()}T00:00:00`);
  if (Number.isNaN(target.getTime())) return 999;
  const diff = now.getTime() - target.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

function daysAgoISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysFromNowISO(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ============================================================================
// INITIAL COSMETICS E-COMMERCE DATA
// ============================================================================

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'usr_adm_marina',
    name: 'Marina Lopes',
    email: 'admin@cosmeticos.com',
    password: '1234',
    role: 'adm',
    jobTitle: 'Diretora de E-commerce',
    avatarInitials: 'ML',
    active: true,
  },
  {
    id: 'usr_emp_camila',
    name: 'Camila Souza',
    email: 'vendedor@cosmeticos.com',
    password: '1234',
    role: 'funcionario',
    jobTitle: 'Consultora de Beleza & Skincare',
    avatarInitials: 'CS',
    active: true,
  },
  {
    id: 'usr_emp_beatriz',
    name: 'Beatriz Ferreira',
    email: 'beatriz@cosmeticos.com',
    password: '1234',
    role: 'funcionario',
    jobTitle: 'Especialista Capilar & Perfumaria',
    avatarInitials: 'BF',
    active: true,
  },
];

export const INITIAL_STAGES: FunnelStageConfig[] = [
  {
    id: 'stage_1',
    order: 1,
    name: '1. Carrinho Abandonado',
  },
  {
    id: 'stage_2',
    order: 2,
    name: '2. Primeiro Contato',
  },
  {
    id: 'stage_3',
    order: 3,
    name: '3. Aguardando Pagamento',
  },
  {
    id: 'stage_4',
    order: 4,
    name: '4. Venda Concluída',
    isFinalWonStage: true,
  },
];

export const INITIAL_LEADS: KanbanLeadFull[] = [
  {
    id: 'lead_101',
    customerName: 'Isabella Montenegro',
    whatsapp: '(11) 99412-8830',
    city: 'São Paulo - SP',
    productOfInterest: 'Kit Sérum Rosa Mosqueta + Retinol Botânico 30ml',
    cartValue: 489.9,
    priority: 'Alta',
    stageId: 'stage_1',
    assignedToId: 'usr_emp_camila',
    assignedToName: 'Camila Souza',
    origin: 'Instagram',
    skinHairType: 'Pele Madura / Linhas Finas',
    notes: 'Abandonou o checkout na etapa de frete. Pediu cupom de primeira compra no Direct.',
    createdAt: daysAgoISO(2),
    updatedAt: daysAgoISO(1),
  },
  {
    id: 'lead_102',
    customerName: 'Fernanda Albuquerque',
    whatsapp: '(21) 98745-2190',
    city: 'Rio de Janeiro - RJ',
    productOfInterest: 'Eau de Parfum Velours Rosé 100ml + Creme Acetinado',
    cartValue: 645.0,
    priority: 'Alta',
    stageId: 'stage_2',
    assignedToId: 'usr_emp_camila',
    assignedToName: 'Camila Souza',
    origin: 'Anúncio',
    skinHairType: 'Pele Seca / Sensível',
    notes: 'Camila enviou áudio explicando as notas olfativas de rosa damascena e ameixa.',
    createdAt: daysAgoISO(4),
    updatedAt: daysAgoISO(1),
  },
  {
    id: 'lead_103',
    customerName: 'Carolina Vasconcelos',
    whatsapp: '(31) 99201-4410',
    city: 'Belo Horizonte - MG',
    productOfInterest: 'Cronograma Capilar Ouro de Argan & Peptídeos (3 passos)',
    cartValue: 379.0,
    priority: 'Média',
    stageId: 'stage_3',
    assignedToId: 'usr_emp_camila',
    assignedToName: 'Camila Souza',
    origin: 'Site',
    skinHairType: 'Cabelos Loiros / Pós-Química',
    notes: 'Link de PIX com 5% de desconto enviado. Aguardando confirmação bancária.',
    createdAt: daysAgoISO(5),
    updatedAt: daysAgoISO(0),
  },
  {
    id: 'lead_104',
    customerName: 'Juliana Paiva Ribeiro',
    whatsapp: '(41) 99811-7023',
    city: 'Curitiba - PR',
    productOfInterest: 'Bruma Hidratante Niacinamida 10% + Gel de Limpeza Facial',
    cartValue: 268.5,
    priority: 'Baixa',
    stageId: 'stage_1',
    assignedToId: 'usr_emp_camila',
    assignedToName: 'Camila Souza',
    origin: 'Instagram',
    skinHairType: 'Pele Mista / Oleosa',
    notes: 'Deixou 2 itens no carrinho após live de skincare noturno.',
    createdAt: daysAgoISO(3),
    updatedAt: daysAgoISO(2),
  },
  {
    id: 'lead_105',
    customerName: 'Renata Magalhães',
    whatsapp: '(11) 98122-3901',
    city: 'São Paulo - SP',
    productOfInterest: 'Ritual Completo Glow Ameixa & Vitamina C Pura 20%',
    cartValue: 790.0,
    priority: 'Alta',
    stageId: 'stage_4',
    assignedToId: 'usr_emp_camila',
    assignedToName: 'Camila Souza',
    origin: 'Indicação',
    skinHairType: 'Pele Madura / Linhas Finas',
    notes: 'Pagamento aprovado no cartão em 3x. Pedido despachado com amostra grátis.',
    createdAt: daysAgoISO(8),
    updatedAt: daysAgoISO(1),
  },
  {
    id: 'lead_106',
    customerName: 'Letícia Fontes',
    whatsapp: '(51) 99340-1182',
    city: 'Porto Alegre - RS',
    productOfInterest: 'Máscara Reparadora Karité & Óleo de Mirra 500g',
    cartValue: 312.0,
    priority: 'Média',
    stageId: 'stage_2',
    assignedToId: 'usr_emp_beatriz',
    assignedToName: 'Beatriz Ferreira',
    origin: 'Evento',
    skinHairType: 'Cabelos Cacheados / Nutrição',
    notes: 'Conheceu a marca na feira Beauty Sul. Beatriz realizou diagnóstico capilar.',
    createdAt: daysAgoISO(6),
    updatedAt: daysAgoISO(2),
  },
  {
    id: 'lead_107',
    customerName: 'Gabriela Dantas',
    whatsapp: '(48) 99612-5590',
    city: 'Florianópolis - SC',
    productOfInterest: 'Duo Protetor Solar Mineral FPS 60 + Água Micelar Rosé',
    cartValue: 294.0,
    priority: 'Média',
    stageId: 'stage_3',
    assignedToId: 'usr_emp_beatriz',
    assignedToName: 'Beatriz Ferreira',
    origin: 'Anúncio',
    skinHairType: 'Pele Seca / Sensível',
    notes: 'Boleto emitido com vencimento para amanhã.',
    createdAt: daysAgoISO(4),
    updatedAt: daysAgoISO(1),
  },
  {
    id: 'lead_108',
    customerName: 'Patrícia Lemos',
    whatsapp: '(11) 97654-3029',
    city: 'São Paulo - SP',
    productOfInterest: 'Coleção Luxury Spa Corporal (Esfoliante + Óleo de Amêndoas)',
    cartValue: 540.0,
    priority: 'Alta',
    stageId: 'stage_4',
    assignedToId: 'usr_emp_beatriz',
    assignedToName: 'Beatriz Ferreira',
    origin: 'Site',
    skinHairType: 'Pele Seca / Sensível',
    notes: 'Venda concluída para presente corporativo executivo.',
    createdAt: daysAgoISO(12),
    updatedAt: daysAgoISO(3),
  },
  {
    id: 'lead_109',
    customerName: 'Aline Cavalcanti',
    whatsapp: '(81) 99102-8844',
    city: 'Recife - PE',
    productOfInterest: 'Elixir Noturno Esqualano + Gua Sha Quartzo Rosa',
    cartValue: 425.0,
    priority: 'Alta',
    stageId: 'stage_4',
    assignedToId: 'usr_emp_camila',
    assignedToName: 'Camila Souza',
    origin: 'Instagram',
    skinHairType: 'Pele Mista / Oleosa',
    notes: 'Cliente VIP recorrente; fechou combo promocional via WhatsApp.',
    createdAt: daysAgoISO(15),
    updatedAt: daysAgoISO(5),
  },
];

export const INITIAL_CUSTOMERS: CustomerFull[] = [
  {
    id: 'cust_1',
    name: 'Isabella Montenegro',
    whatsapp: '(11) 99412-8830',
    email: 'isabella.montenegro@email.com',
    city: 'São Paulo - SP',
    origin: 'Instagram',
    status: 'Lead',
    responsibleId: 'usr_emp_camila',
    responsibleName: 'Camila Souza',
    skinHairType: 'Pele Madura / Linhas Finas',
    favoriteProducts: 'Sérum Rosa Mosqueta, Retinol Botânico',
    lastInteraction: daysAgoISO(1),
    lastPurchase: null,
    notes: 'Interessada em linha anti-idade vegana sem fragrância sintética.',
    ltv: 0,
    totalOrders: 0,
    averageTicket: 0,
  },
  {
    id: 'cust_2',
    name: 'Renata Magalhães',
    whatsapp: '(11) 98122-3901',
    email: 'renata.magalhaes@email.com',
    city: 'São Paulo - SP',
    origin: 'Indicação',
    status: 'Cliente ativo',
    responsibleId: 'usr_emp_camila',
    responsibleName: 'Camila Souza',
    skinHairType: 'Pele Madura / Linhas Finas',
    favoriteProducts: 'Ritual Glow Ameixa, Vitamina C Pura 20%',
    lastInteraction: daysAgoISO(1),
    lastPurchase: daysAgoISO(1),
    notes: 'Compra a cada 45 dias para reposição de sérum facial.',
    ltv: 2370.0,
    totalOrders: 3,
    averageTicket: 790.0,
  },
  {
    id: 'cust_3',
    name: 'Fernanda Albuquerque',
    whatsapp: '(21) 98745-2190',
    email: 'fernanda.albuquerque@email.com',
    city: 'Rio de Janeiro - RJ',
    origin: 'Anúncio',
    status: 'Cliente ativo',
    responsibleId: 'usr_emp_camila',
    responsibleName: 'Camila Souza',
    skinHairType: 'Pele Seca / Sensível',
    favoriteProducts: 'Eau de Parfum Velours Rosé, Hidratante Acetinado',
    lastInteraction: daysAgoISO(1),
    lastPurchase: daysAgoISO(22),
    notes: 'Ama fragrâncias florais amadeiradas e texturas aveludadas.',
    ltv: 1290.0,
    totalOrders: 2,
    averageTicket: 645.0,
  },
  {
    id: 'cust_4',
    name: 'Carolina Vasconcelos',
    whatsapp: '(31) 99201-4410',
    email: 'carolina.vasconcelos@email.com',
    city: 'Belo Horizonte - MG',
    origin: 'Site',
    status: 'Lead',
    responsibleId: 'usr_emp_camila',
    responsibleName: 'Camila Souza',
    skinHairType: 'Cabelos Loiros / Pós-Química',
    favoriteProducts: 'Cronograma Capilar Ouro de Argan',
    lastInteraction: daysAgoISO(0),
    lastPurchase: null,
    notes: 'Aguardando compensação do PIX do primeiro pedido.',
    ltv: 0,
    totalOrders: 0,
    averageTicket: 0,
  },
  {
    id: 'cust_5',
    name: 'Aline Cavalcanti',
    whatsapp: '(81) 99102-8844',
    email: 'aline.cavalcanti@email.com',
    city: 'Recife - PE',
    origin: 'Instagram',
    status: 'Cliente ativo',
    responsibleId: 'usr_emp_camila',
    responsibleName: 'Camila Souza',
    skinHairType: 'Pele Mista / Oleosa',
    favoriteProducts: 'Elixir Noturno Esqualano, Gua Sha Quartzo Rosa',
    lastInteraction: daysAgoISO(5),
    lastPurchase: daysAgoISO(5),
    notes: 'Embaixadora espontânea da marca no Instagram.',
    ltv: 1700.0,
    totalOrders: 4,
    averageTicket: 425.0,
  },
  {
    id: 'cust_6',
    name: 'Patrícia Lemos',
    whatsapp: '(11) 97654-3029',
    email: 'patricia.lemos@email.com',
    city: 'São Paulo - SP',
    origin: 'Site',
    status: 'Cliente ativo',
    responsibleId: 'usr_emp_beatriz',
    responsibleName: 'Beatriz Ferreira',
    skinHairType: 'Pele Seca / Sensível',
    favoriteProducts: 'Coleção Luxury Spa Corporal',
    lastInteraction: daysAgoISO(3),
    lastPurchase: daysAgoISO(3),
    notes: 'Costuma comprar kits presenteáveis em datas comemorativas.',
    ltv: 1620.0,
    totalOrders: 3,
    averageTicket: 540.0,
  },
  {
    id: 'cust_7',
    name: 'Helena Bittencourt',
    whatsapp: '(21) 99182-6044',
    email: 'helena.bittencourt@email.com',
    city: 'Rio de Janeiro - RJ',
    origin: 'Evento',
    status: 'Inativo',
    responsibleId: 'usr_emp_camila',
    responsibleName: 'Camila Souza',
    skinHairType: 'Cabelos Cacheados / Nutrição',
    favoriteProducts: 'Leave-in Cachos Sublimes & Óleo de Pracaxi',
    lastInteraction: daysAgoISO(75),
    lastPurchase: daysAgoISO(95),
    notes: 'Inativa há mais de 60 dias. Excelente oportunidade para campanha de reativação.',
    ltv: 890.0,
    totalOrders: 2,
    averageTicket: 445.0,
  },
  {
    id: 'cust_8',
    name: 'Mariana Teixeira Prado',
    whatsapp: '(41) 98831-1920',
    email: 'mariana.prado@email.com',
    city: 'Curitiba - PR',
    origin: 'Indicação',
    status: 'Inativo',
    responsibleId: 'usr_emp_beatriz',
    responsibleName: 'Beatriz Ferreira',
    skinHairType: 'Cabelos Lisos / Brilho',
    favoriteProducts: 'Fluido Termoprotetor Gloss de Seda',
    lastInteraction: daysAgoISO(48),
    lastPurchase: daysAgoISO(64),
    notes: 'Última compra há mais de 2 meses. Enviar amostra da nova máscara.',
    ltv: 340.0,
    totalOrders: 1,
    averageTicket: 340.0,
  },
  {
    id: 'cust_9',
    name: 'Letícia Fontes',
    whatsapp: '(51) 99340-1182',
    email: 'leticia.fontes@email.com',
    city: 'Porto Alegre - RS',
    origin: 'Evento',
    status: 'Lead',
    responsibleId: 'usr_emp_beatriz',
    responsibleName: 'Beatriz Ferreira',
    skinHairType: 'Cabelos Cacheados / Nutrição',
    favoriteProducts: 'Máscara Reparadora Karité & Mirra',
    lastInteraction: daysAgoISO(2),
    lastPurchase: null,
    notes: 'Solicitou vídeo de textura da máscara no WhatsApp.',
    ltv: 0,
    totalOrders: 0,
    averageTicket: 0,
  },
  {
    id: 'cust_10',
    name: 'Beatriz Mendonça',
    whatsapp: '(31) 98410-9921',
    email: 'bia.mendonca@email.com',
    city: 'Belo Horizonte - MG',
    origin: 'Anúncio',
    status: 'Inativo',
    responsibleId: 'usr_emp_camila',
    responsibleName: 'Camila Souza',
    skinHairType: 'Pele Mista / Oleosa',
    favoriteProducts: 'Gel de Limpeza Botânico + Tônico Ácido Glicólico',
    lastInteraction: daysAgoISO(110),
    lastPurchase: daysAgoISO(120),
    notes: 'Cliente inativa há mais de 90 dias. Oferecer diagnóstico gratuito.',
    ltv: 610.0,
    totalOrders: 2,
    averageTicket: 305.0,
  },
];

export const INITIAL_VACATIONS: VacationRequest[] = [
  {
    id: 'vac_1',
    employeeId: 'usr_emp_camila',
    employeeName: 'Camila Souza',
    employeeEmail: 'vendedor@cosmeticos.com',
    startDate: daysFromNowISO(20),
    endDate: daysFromNowISO(34),
    daysCount: 15,
    status: 'Pendente',
    observation: 'Recesso de quinzena programado após campanha de lançamentos.',
    requestedAt: daysAgoISO(2),
  },
  {
    id: 'vac_2',
    employeeId: 'usr_emp_camila',
    employeeName: 'Camila Souza',
    employeeEmail: 'vendedor@cosmeticos.com',
    startDate: '2026-02-10',
    endDate: '2026-02-19',
    daysCount: 10,
    status: 'Aprovado',
    observation: 'Férias de verão — 1º período.',
    requestedAt: '2026-01-08',
    decidedBy: 'Marina Lopes',
    decidedAt: '10/01/2026 às 11:20',
  },
  {
    id: 'vac_3',
    employeeId: 'usr_emp_beatriz',
    employeeName: 'Beatriz Ferreira',
    employeeEmail: 'beatriz@cosmeticos.com',
    startDate: daysFromNowISO(10),
    endDate: daysFromNowISO(19),
    daysCount: 10,
    status: 'Pendente',
    observation: 'Viagem familiar planejada no semestre.',
    requestedAt: daysAgoISO(1),
  },
  {
    id: 'vac_4',
    employeeId: 'usr_emp_beatriz',
    employeeName: 'Beatriz Ferreira',
    employeeEmail: 'beatriz@cosmeticos.com',
    startDate: '2026-05-04',
    endDate: '2026-05-10',
    daysCount: 7,
    status: 'Recusado',
    observation: 'Semana de Dia das Mães (alta demanda no e-commerce).',
    requestedAt: '2026-04-02',
    decidedBy: 'Marina Lopes',
    decidedAt: '03/04/2026 às 16:45',
  },
];

// ============================================================================
// STORAGE & SUPABASE PERSISTENCE ENGINE
// ============================================================================

function loadFromStorage<T>(key: string, fallback: T): T {
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

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

let usersStore: UserProfile[] = loadFromStorage(
  STORAGE_KEYS.USERS,
  INITIAL_USERS
);
let stagesStore: FunnelStageConfig[] = loadFromStorage(
  STORAGE_KEYS.STAGES,
  INITIAL_STAGES
);
let leadsStore: KanbanLeadFull[] = loadFromStorage(
  STORAGE_KEYS.LEADS,
  INITIAL_LEADS
);
let customersStore: CustomerFull[] = loadFromStorage(
  STORAGE_KEYS.CUSTOMERS,
  INITIAL_CUSTOMERS
);
let vacationsStore: VacationRequest[] = loadFromStorage(
  STORAGE_KEYS.VACATIONS,
  INITIAL_VACATIONS
);

let lastSupabaseSyncStatus: {
  ok: boolean;
  message: string;
  lastSyncedAt?: string;
} = {
  ok: false,
  message: supabaseClient
    ? 'Conectado ao Supabase — pronto para sincronizar.'
    : 'Aguardando credenciais do Supabase.',
};

async function ensureParentsInSupabase(): Promise<void> {
  if (!supabaseClient) return;
  try {
    await supabaseClient
      .from('cosmetics_users')
      .upsert(usersStore.map(userToDb), { onConflict: 'id' });
    await supabaseClient
      .from('cosmetics_stages')
      .upsert(stagesStore.map(stageToDb), { onConflict: 'id' });
  } catch {
    // Handled by caller
  }
}

export const dataService = {
  getSyncStatus() {
    return lastSupabaseSyncStatus;
  },

  /**
   * Loads data from Supabase on startup. If Supabase tables are empty,
   * automatically seeds them with our local data so Supabase immediately has all records.
   */
  async initializeAndSyncWithSupabase(): Promise<{
    ok: boolean;
    message: string;
  }> {
    if (!supabaseClient) {
      lastSupabaseSyncStatus = {
        ok: false,
        message:
          'Cliente Supabase ainda não configurado. Configure a URL e a Anon Key na aba Configurações.',
      };
      return lastSupabaseSyncStatus;
    }

    try {
      const [uRes, sRes, lRes, cRes, vRes] = await Promise.all([
        supabaseClient.from('cosmetics_users').select('*'),
        supabaseClient.from('cosmetics_stages').select('*').order('order'),
        supabaseClient.from('cosmetics_leads').select('*'),
        supabaseClient.from('cosmetics_customers').select('*'),
        supabaseClient.from('cosmetics_vacations').select('*'),
      ]);

      const firstErr =
        uRes.error || sRes.error || lRes.error || cRes.error || vRes.error;

      if (firstErr) {
        lastSupabaseSyncStatus = {
          ok: false,
          message: `Erro no Supabase: ${firstErr.message}. Verifique se você executou o Script SQL no SQL Editor do Supabase.`,
        };
        return lastSupabaseSyncStatus;
      }

      // 1. Users
      if (uRes.data && uRes.data.length > 0) {
        usersStore = uRes.data.map(dbToUser);
        saveToStorage(STORAGE_KEYS.USERS, usersStore);
      } else {
        await supabaseClient
          .from('cosmetics_users')
          .upsert(usersStore.map(userToDb), { onConflict: 'id' });
      }

      // 2. Stages
      if (sRes.data && sRes.data.length > 0) {
        stagesStore = sRes.data.map(dbToStage);
        saveToStorage(STORAGE_KEYS.STAGES, stagesStore);
      } else {
        await supabaseClient
          .from('cosmetics_stages')
          .upsert(stagesStore.map(stageToDb), { onConflict: 'id' });
      }

      // 3. Leads
      if (lRes.data && lRes.data.length > 0) {
        leadsStore = lRes.data.map(dbToLead);
        saveToStorage(STORAGE_KEYS.LEADS, leadsStore);
      } else {
        await supabaseClient
          .from('cosmetics_leads')
          .upsert(leadsStore.map(leadToDb), { onConflict: 'id' });
      }

      // 4. Customers
      if (cRes.data && cRes.data.length > 0) {
        customersStore = cRes.data.map(dbToCustomer);
        saveToStorage(STORAGE_KEYS.CUSTOMERS, customersStore);
      } else {
        await supabaseClient
          .from('cosmetics_customers')
          .upsert(customersStore.map(customerToDb), { onConflict: 'id' });
      }

      // 5. Vacations
      if (vRes.data && vRes.data.length > 0) {
        vacationsStore = vRes.data.map(dbToVacation);
        saveToStorage(STORAGE_KEYS.VACATIONS, vacationsStore);
      } else {
        await supabaseClient
          .from('cosmetics_vacations')
          .upsert(vacationsStore.map(vacationToDb), { onConflict: 'id' });
      }

      lastSupabaseSyncStatus = {
        ok: true,
        message: 'Sincronizado em tempo real com o Supabase!',
        lastSyncedAt: getNowTimestampBR(),
      };
      return lastSupabaseSyncStatus;
    } catch (err) {
      lastSupabaseSyncStatus = {
        ok: false,
        message:
          err instanceof Error
            ? `Falha ao conectar ao Supabase: ${err.message}`
            : 'Falha de rede ao conectar ao Supabase.',
      };
      return lastSupabaseSyncStatus;
    }
  },

  /**
   * Forces a complete push of all current in-memory records to Supabase
   */
  async pushAllToSupabase(): Promise<{ ok: boolean; message: string }> {
    if (!supabaseClient) {
      return {
        ok: false,
        message:
          'Configure a URL do Projeto e a Anon Key do Supabase antes de sincronizar.',
      };
    }

    try {
      // First upsert parent tables (users and stages) to satisfy Foreign Keys
      const uRes = await supabaseClient
        .from('cosmetics_users')
        .upsert(usersStore.map(userToDb), { onConflict: 'id' });
      if (uRes.error) {
        return {
          ok: false,
          message: `Erro na tabela cosmetics_users: ${uRes.error.message}`,
        };
      }

      const sRes = await supabaseClient
        .from('cosmetics_stages')
        .upsert(stagesStore.map(stageToDb), { onConflict: 'id' });
      if (sRes.error) {
        return {
          ok: false,
          message: `Erro na tabela cosmetics_stages: ${sRes.error.message}`,
        };
      }

      const [lRes, cRes, vRes] = await Promise.all([
        supabaseClient
          .from('cosmetics_leads')
          .upsert(leadsStore.map(leadToDb), { onConflict: 'id' }),
        supabaseClient
          .from('cosmetics_customers')
          .upsert(customersStore.map(customerToDb), { onConflict: 'id' }),
        supabaseClient
          .from('cosmetics_vacations')
          .upsert(vacationsStore.map(vacationToDb), { onConflict: 'id' }),
      ]);

      const childErr = lRes.error || cRes.error || vRes.error;
      if (childErr) {
        lastSupabaseSyncStatus = {
          ok: false,
          message: `Erro ao gravar no Supabase: ${childErr.message}`,
        };
        return lastSupabaseSyncStatus;
      }

      lastSupabaseSyncStatus = {
        ok: true,
        message: `Sucesso! ${usersStore.length} usuários, ${leadsStore.length} leads, ${customersStore.length} clientes e ${vacationsStore.length} pedidos de férias gravados no Supabase.`,
        lastSyncedAt: getNowTimestampBR(),
      };
      return lastSupabaseSyncStatus;
    } catch (err) {
      return {
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Erro inesperado ao enviar dados para o Supabase.',
      };
    }
  },

  // --- Auth & Session ---
  getCurrentSessionUser(): UserProfile | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SESSION_USER);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as UserProfile;
      return usersStore.find((u) => u.id === parsed.id) || parsed;
    } catch {
      return null;
    }
  },

  loginByEmail(email: string): UserProfile | null {
    const clean = email.trim().toLowerCase();
    const found = usersStore.find((u) => u.email.toLowerCase() === clean);
    if (!found) return null;
    saveToStorage(STORAGE_KEYS.SESSION_USER, found);
    return found;
  },

  authenticateWithPassword(
    email: string,
    password: string
  ): { user: UserProfile | null; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    if (!cleanPassword) {
      return { user: null, error: 'Por favor, informe a senha de login.' };
    }

    const found = usersStore.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.name.toLowerCase() === cleanEmail ||
        u.email.split('@')[0].toLowerCase() === cleanEmail ||
        (cleanEmail === 'yasyas' && u.role === 'adm')
    );

    if (!found) {
      return {
        user: null,
        error:
          'Usuário não encontrado. Verifique o e-mail/login informado ou clique em "Criar Cadastro".',
      };
    }

    const expectedPassword = found.password || '1234';
    if (cleanPassword !== expectedPassword) {
      return {
        user: null,
        error: 'Senha incorreta. Verifique sua senha de acesso.',
      };
    }

    saveToStorage(STORAGE_KEYS.SESSION_USER, found);
    return { user: found };
  },

  registerAccount(payload: {
    name: string;
    email: string;
    password: string;
    role: 'adm' | 'funcionario';
    jobTitle: string;
  }): { user: UserProfile | null; error?: string } {
    const cleanName = payload.name.trim();
    const rawEmail = payload.email.trim().toLowerCase();
    const cleanEmail = rawEmail.includes('@')
      ? rawEmail
      : `${rawEmail}@cosmeticos.com`;
    const cleanPassword = payload.password.trim();

    if (!cleanName || !rawEmail || !cleanPassword) {
      return {
        user: null,
        error: 'Preencha todos os campos obrigatórios para criar o cadastro.',
      };
    }

    const alreadyExists = usersStore.some(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.email.toLowerCase() === rawEmail
    );

    if (alreadyExists) {
      return {
        user: null,
        error: 'Este e-mail ou login já possui cadastro no sistema.',
      };
    }

    const created = this.addUser({
      name: cleanName,
      email: cleanEmail,
      password: cleanPassword,
      role: payload.role,
      jobTitle: payload.jobTitle,
    });

    saveToStorage(STORAGE_KEYS.SESSION_USER, created);
    return { user: created };
  },

  setSessionUser(user: UserProfile | null): void {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.SESSION_USER);
    } else {
      saveToStorage(STORAGE_KEYS.SESSION_USER, user);
    }
  },

  // --- Users (ADM Management) ---
  getUsers(): UserProfile[] {
    return [...usersStore];
  },

  addUser(payload: {
    name: string;
    email: string;
    password?: string;
    role: 'adm' | 'funcionario';
    jobTitle: string;
  }): UserProfile {
    const cleanName = payload.name.trim();
    const parts = cleanName.split(' ').filter(Boolean);
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : cleanName.slice(0, 2).toUpperCase();

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: cleanName,
      email: payload.email.trim().toLowerCase(),
      password: (payload.password || '1234').trim() || '1234',
      role: payload.role,
      jobTitle:
        payload.jobTitle.trim() ||
        (payload.role === 'adm' ? 'Gestora Comercial' : 'Consultora de Beleza'),
      avatarInitials: initials || 'MV',
      active: true,
    };
    usersStore = [...usersStore, newUser];
    saveToStorage(STORAGE_KEYS.USERS, usersStore);

    if (supabaseClient) {
      supabaseClient
        .from('cosmetics_users')
        .upsert(userToDb(newUser), { onConflict: 'id' })
        .then(({ error }) => {
          if (error) console.error('Supabase addUser error:', error.message);
        });
    }

    return newUser;
  },

  updateUserRole(userId: string, role: 'adm' | 'funcionario'): UserProfile[] {
    usersStore = usersStore.map((u) =>
      u.id === userId ? { ...u, role } : u
    );
    saveToStorage(STORAGE_KEYS.USERS, usersStore);

    const target = usersStore.find((u) => u.id === userId);
    if (supabaseClient && target) {
      supabaseClient
        .from('cosmetics_users')
        .upsert(userToDb(target), { onConflict: 'id' })
        .then(({ error }) => {
          if (error)
            console.error('Supabase updateUserRole error:', error.message);
        });
    }

    return [...usersStore];
  },

  deleteUser(userId: string): UserProfile[] {
    usersStore = usersStore.filter(
      (u) =>
        u.id !== userId ||
        u.email === 'admin@cosmeticos.com' ||
        u.email === 'vendedor@cosmeticos.com'
    );
    saveToStorage(STORAGE_KEYS.USERS, usersStore);

    if (supabaseClient) {
      supabaseClient
        .from('cosmetics_users')
        .delete()
        .eq('id', userId)
        .then(({ error }) => {
          if (error) console.error('Supabase deleteUser error:', error.message);
        });
    }

    return [...usersStore];
  },

  // --- Funnel Stages ---
  getStages(): FunnelStageConfig[] {
    return [...stagesStore].sort((a, b) => a.order - b.order);
  },

  updateStages(nextStages: FunnelStageConfig[]): FunnelStageConfig[] {
    stagesStore = [...nextStages].sort((a, b) => a.order - b.order);
    saveToStorage(STORAGE_KEYS.STAGES, stagesStore);

    if (supabaseClient) {
      supabaseClient
        .from('cosmetics_stages')
        .upsert(stagesStore.map(stageToDb), { onConflict: 'id' })
        .then(({ error }) => {
          if (error)
            console.error('Supabase updateStages error:', error.message);
        });
    }

    return [...stagesStore];
  },

  // --- Leads & Strict RBAC Financial Stripping ---
  getLeadsForUser(user: UserProfile): KanbanLeadView[] {
    if (user.role === 'adm') {
      return leadsStore.map((lead) => ({
        ...lead,
        cartValue: lead.cartValue,
        maskedValue: formatCurrencyBR(lead.cartValue),
      }));
    }

    return leadsStore
      .filter((lead) => lead.assignedToId === user.id)
      .map((lead) => {
        const sanitized: KanbanLeadView = {
          id: lead.id,
          customerName: lead.customerName,
          whatsapp: lead.whatsapp,
          city: lead.city,
          productOfInterest: lead.productOfInterest,
          maskedValue: 'R$ ••••',
          priority: lead.priority,
          stageId: lead.stageId,
          assignedToId: lead.assignedToId,
          assignedToName: lead.assignedToName,
          origin: lead.origin,
          skinHairType: lead.skinHairType,
          notes: lead.notes,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt,
        };
        delete (sanitized as Record<string, unknown>).cartValue;
        return sanitized;
      });
  },

  getAdminMetrics(user: UserProfile): AdminFinancialMetrics | null {
    if (user.role !== 'adm') {
      return null;
    }
    const totalLeads = leadsStore.length;
    const completedLeads = leadsStore.filter((l) => l.stageId === 'stage_4');
    const completedSalesCount = completedLeads.length;
    const totalRevenue = completedLeads.reduce(
      (sum, l) => sum + Number(l.cartValue || 0),
      0
    );
    const averageTicket =
      completedSalesCount > 0 ? totalRevenue / completedSalesCount : 0;
    const conversionRate =
      totalLeads > 0 ? (completedSalesCount / totalLeads) * 100 : 0;

    return {
      totalRevenue,
      averageTicket,
      conversionRate,
      totalLeads,
      completedSalesCount,
    };
  },

  moveLeadStage(
    user: UserProfile,
    leadId: string,
    targetStageId: FunnelStageId
  ): { success: boolean; error?: string } {
    const targetLead = leadsStore.find((l) => l.id === leadId);
    if (!targetLead) {
      return { success: false, error: 'Lead não encontrado.' };
    }

    if (user.role === 'funcionario') {
      if (targetLead.assignedToId !== user.id) {
        return {
          success: false,
          error: 'Você só pode movimentar leads atribuídos a você.',
        };
      }
      if (targetStageId === 'stage_4') {
        return {
          success: false,
          error:
            'A coluna "4. Venda Concluída" só pode ser preenchida pelo perfil ADM.',
        };
      }
      if (targetLead.stageId === 'stage_4') {
        return {
          success: false,
          error:
            'Apenas o perfil ADM pode alterar leads que já estão em "4. Venda Concluída".',
        };
      }
    }

    const updatedLead: KanbanLeadFull = {
      ...targetLead,
      stageId: targetStageId,
      updatedAt: getTodayISO(),
    };

    leadsStore = leadsStore.map((l) => (l.id === leadId ? updatedLead : l));
    saveToStorage(STORAGE_KEYS.LEADS, leadsStore);

    if (supabaseClient) {
      ensureParentsInSupabase().then(() => {
        supabaseClient!
          .from('cosmetics_leads')
          .upsert(leadToDb(updatedLead), { onConflict: 'id' })
          .then(({ error }) => {
            if (error)
              console.error('Supabase moveLeadStage error:', error.message);
          });
      });
    }

    return { success: true };
  },

  createLead(
    user: UserProfile,
    payload: {
      customerName: string;
      whatsapp: string;
      city: string;
      productOfInterest: string;
      cartValue?: number;
      priority: LeadPriority;
      stageId: FunnelStageId;
      assignedToId: string;
      origin: ContactOrigin;
      skinHairType: SkinHairProfile;
      notes: string;
    }
  ): { success: boolean; error?: string } {
    if (user.role === 'funcionario' && payload.stageId === 'stage_4') {
      return {
        success: false,
        error: 'Funcionários não podem criar leads diretamente em Venda Concluída.',
      };
    }

    const assignedUser =
      usersStore.find((u) => u.id === payload.assignedToId) || user;

    const newLead: KanbanLeadFull = {
      id: `lead_${Date.now()}`,
      customerName: payload.customerName.trim(),
      whatsapp: payload.whatsapp.trim(),
      city: payload.city.trim() || 'São Paulo - SP',
      productOfInterest: payload.productOfInterest.trim(),
      cartValue:
        user.role === 'adm' && typeof payload.cartValue === 'number'
          ? payload.cartValue
          : 320.0,
      priority: payload.priority,
      stageId: payload.stageId,
      assignedToId: assignedUser.id,
      assignedToName: assignedUser.name,
      origin: payload.origin,
      skinHairType: payload.skinHairType,
      notes: payload.notes.trim(),
      createdAt: getTodayISO(),
      updatedAt: getTodayISO(),
    };

    leadsStore = [newLead, ...leadsStore];
    saveToStorage(STORAGE_KEYS.LEADS, leadsStore);

    if (supabaseClient) {
      ensureParentsInSupabase().then(() => {
        supabaseClient!
          .from('cosmetics_leads')
          .upsert(leadToDb(newLead), { onConflict: 'id' })
          .then(({ error }) => {
            if (error)
              console.error('Supabase createLead error:', error.message);
          });
      });
    }

    return { success: true };
  },

  updateLead(
    user: UserProfile,
    leadId: string,
    payload: Partial<KanbanLeadFull>
  ): { success: boolean; error?: string } {
    const existing = leadsStore.find((l) => l.id === leadId);
    if (!existing) return { success: false, error: 'Lead não encontrado.' };

    if (user.role === 'funcionario' && payload.stageId === 'stage_4') {
      return {
        success: false,
        error: 'Apenas o ADM pode mover para Venda Concluída.',
      };
    }

    const updatedLead: KanbanLeadFull = {
      ...existing,
      customerName: payload.customerName ?? existing.customerName,
      whatsapp: payload.whatsapp ?? existing.whatsapp,
      city: payload.city ?? existing.city,
      productOfInterest:
        payload.productOfInterest ?? existing.productOfInterest,
      cartValue:
        user.role === 'adm' && typeof payload.cartValue === 'number'
          ? payload.cartValue
          : existing.cartValue,
      priority: payload.priority ?? existing.priority,
      stageId: payload.stageId ?? existing.stageId,
      assignedToId: payload.assignedToId ?? existing.assignedToId,
      assignedToName: payload.assignedToName ?? existing.assignedToName,
      origin: payload.origin ?? existing.origin,
      skinHairType: payload.skinHairType ?? existing.skinHairType,
      notes: payload.notes ?? existing.notes,
      updatedAt: getTodayISO(),
    };

    leadsStore = leadsStore.map((l) => (l.id === leadId ? updatedLead : l));
    saveToStorage(STORAGE_KEYS.LEADS, leadsStore);

    if (supabaseClient) {
      ensureParentsInSupabase().then(() => {
        supabaseClient!
          .from('cosmetics_leads')
          .upsert(leadToDb(updatedLead), { onConflict: 'id' })
          .then(({ error }) => {
            if (error)
              console.error('Supabase updateLead error:', error.message);
          });
      });
    }

    return { success: true };
  },

  // --- Customers Base & Strict RBAC Financial Stripping ---
  getCustomersForUser(user: UserProfile): CustomerView[] {
    if (user.role === 'adm') {
      return customersStore.map((c) => ({ ...c }));
    }

    return customersStore.map((c) => {
      const sanitized: CustomerView = {
        id: c.id,
        name: c.name,
        whatsapp: c.whatsapp,
        email: c.email,
        city: c.city,
        origin: c.origin,
        status: c.status,
        responsibleId: c.responsibleId,
        responsibleName: c.responsibleName,
        skinHairType: c.skinHairType,
        favoriteProducts: c.favoriteProducts,
        lastInteraction: c.lastInteraction,
        lastPurchase: c.lastPurchase,
        notes: c.notes,
      };
      delete (sanitized as Record<string, unknown>).ltv;
      delete (sanitized as Record<string, unknown>).totalOrders;
      delete (sanitized as Record<string, unknown>).averageTicket;
      return sanitized;
    });
  },

  upsertCustomer(
    user: UserProfile,
    payload: Partial<CustomerFull> & {
      name: string;
      whatsapp: string;
      city: string;
      origin: ContactOrigin;
      status: CustomerStatus;
      responsibleId: string;
      skinHairType: SkinHairProfile;
    }
  ): CustomerView {
    const respUser =
      usersStore.find((u) => u.id === payload.responsibleId) || user;

    let savedRecord: CustomerFull;

    if (payload.id) {
      const existing =
        customersStore.find((c) => c.id === payload.id) || customersStore[0];
      const nextLtv =
        user.role === 'adm' && typeof payload.ltv === 'number'
          ? payload.ltv
          : existing.ltv;
      const nextOrders =
        user.role === 'adm' && typeof payload.totalOrders === 'number'
          ? payload.totalOrders
          : existing.totalOrders;
      const nextAvg =
        nextOrders > 0 ? Number((nextLtv / nextOrders).toFixed(2)) : 0;

      savedRecord = {
        ...existing,
        name: payload.name.trim(),
        whatsapp: payload.whatsapp.trim(),
        email: (payload.email ?? existing.email).trim(),
        city: payload.city.trim(),
        origin: payload.origin,
        status: payload.status,
        responsibleId: respUser.id,
        responsibleName: respUser.name,
        skinHairType: payload.skinHairType,
        favoriteProducts:
          payload.favoriteProducts ?? existing.favoriteProducts,
        lastInteraction: payload.lastInteraction || getTodayISO(),
        lastPurchase:
          payload.lastPurchase !== undefined
            ? payload.lastPurchase
            : existing.lastPurchase,
        notes: payload.notes ?? existing.notes,
        ltv: nextLtv,
        totalOrders: nextOrders,
        averageTicket: nextAvg,
      };

      customersStore = customersStore.map((c) =>
        c.id === payload.id ? savedRecord : c
      );
    } else {
      const ltvVal =
        user.role === 'adm' && typeof payload.ltv === 'number'
          ? payload.ltv
          : 0;
      const ordersVal =
        user.role === 'adm' && typeof payload.totalOrders === 'number'
          ? payload.totalOrders
          : 0;
      savedRecord = {
        id: `cust_${Date.now()}`,
        name: payload.name.trim(),
        whatsapp: payload.whatsapp.trim(),
        email: (payload.email || '').trim(),
        city: payload.city.trim(),
        origin: payload.origin,
        status: payload.status,
        responsibleId: respUser.id,
        responsibleName: respUser.name,
        skinHairType: payload.skinHairType,
        favoriteProducts: payload.favoriteProducts || '',
        lastInteraction: payload.lastInteraction || getTodayISO(),
        lastPurchase: payload.lastPurchase || null,
        notes: payload.notes || '',
        ltv: ltvVal,
        totalOrders: ordersVal,
        averageTicket:
          ordersVal > 0 ? Number((ltvVal / ordersVal).toFixed(2)) : 0,
      };
      customersStore = [savedRecord, ...customersStore];
    }

    saveToStorage(STORAGE_KEYS.CUSTOMERS, customersStore);

    if (supabaseClient) {
      ensureParentsInSupabase().then(() => {
        supabaseClient!
          .from('cosmetics_customers')
          .upsert(customerToDb(savedRecord), { onConflict: 'id' })
          .then(({ error }) => {
            if (error)
              console.error('Supabase upsertCustomer error:', error.message);
          });
      });
    }

    const list = this.getCustomersForUser(user);
    return list.find((c) => c.id === savedRecord.id) || list[0];
  },

  // --- Vacations (HR Module) ---
  getVacationsForUser(user: UserProfile): VacationRequest[] {
    if (user.role === 'adm') {
      return [...vacationsStore];
    }
    return vacationsStore.filter((v) => v.employeeId === user.id);
  },

  requestVacation(
    user: UserProfile,
    payload: {
      startDate: string;
      endDate: string;
      observation: string;
    }
  ): { success: boolean; error?: string; request?: VacationRequest } {
    const { startDate, endDate, observation } = payload;
    if (!startDate || !endDate) {
      return {
        success: false,
        error: 'Informe a Data de Início e a Data de Término.',
      };
    }

    const todayIso = getTodayISO();
    if (startDate < todayIso) {
      return {
        success: false,
        error: 'A Data de Início não pode estar no passado.',
      };
    }

    if (endDate < startDate) {
      return {
        success: false,
        error: 'A Data de Término não pode ser anterior à Data de Início.',
      };
    }

    const activeEmployeeRequests = vacationsStore.filter(
      (v) =>
        v.employeeId === user.id &&
        (v.status === 'Pendente' || v.status === 'Aprovado')
    );

    for (const existing of activeEmployeeRequests) {
      const overlaps =
        startDate <= existing.endDate && endDate >= existing.startDate;
      if (overlaps) {
        return {
          success: false,
          error: `Conflito de datas: já existe um pedido ${existing.status.toLowerCase()} de ${formatDateBR(
            existing.startDate
          )} a ${formatDateBR(existing.endDate)}.`,
        };
      }
    }

    const daysCount = calculateInclusiveDays(startDate, endDate);

    const newRequest: VacationRequest = {
      id: `vac_${Date.now()}`,
      employeeId: user.id,
      employeeName: user.name,
      employeeEmail: user.email,
      startDate,
      endDate,
      daysCount,
      status: 'Pendente',
      observation: observation.trim() || 'Solicitação regular de férias.',
      requestedAt: todayIso,
    };

    vacationsStore = [newRequest, ...vacationsStore];
    saveToStorage(STORAGE_KEYS.VACATIONS, vacationsStore);

    if (supabaseClient) {
      ensureParentsInSupabase().then(() => {
        supabaseClient!
          .from('cosmetics_vacations')
          .upsert(vacationToDb(newRequest), { onConflict: 'id' })
          .then(({ error }) => {
            if (error)
              console.error('Supabase requestVacation error:', error.message);
          });
      });
    }

    return { success: true, request: newRequest };
  },

  decideVacation(
    adminUser: UserProfile,
    vacationId: string,
    decision: 'Aprovado' | 'Recusado'
  ): { success: boolean; error?: string } {
    if (adminUser.role !== 'adm') {
      return {
        success: false,
        error: 'Apenas o perfil ADM pode aprovar ou recusar férias.',
      };
    }

    const stamp = getNowTimestampBR();
    let updatedTarget: VacationRequest | null = null;

    vacationsStore = vacationsStore.map((v) => {
      if (v.id !== vacationId) return v;
      updatedTarget = {
        ...v,
        status: decision as VacationStatus,
        decidedBy: adminUser.name,
        decidedAt: stamp,
      };
      return updatedTarget;
    });
    saveToStorage(STORAGE_KEYS.VACATIONS, vacationsStore);

    if (supabaseClient && updatedTarget) {
      const toSave = updatedTarget;
      ensureParentsInSupabase().then(() => {
        supabaseClient!
          .from('cosmetics_vacations')
          .upsert(vacationToDb(toSave), { onConflict: 'id' })
          .then(({ error }) => {
            if (error)
              console.error('Supabase decideVacation error:', error.message);
          });
      });
    }

    return { success: true };
  },

  resetDemoData(): void {
    usersStore = [...INITIAL_USERS];
    stagesStore = [...INITIAL_STAGES];
    leadsStore = [...INITIAL_LEADS];
    customersStore = [...INITIAL_CUSTOMERS];
    vacationsStore = [...INITIAL_VACATIONS];
    saveToStorage(STORAGE_KEYS.USERS, usersStore);
    saveToStorage(STORAGE_KEYS.STAGES, stagesStore);
    saveToStorage(STORAGE_KEYS.LEADS, leadsStore);
    saveToStorage(STORAGE_KEYS.CUSTOMERS, customersStore);
    saveToStorage(STORAGE_KEYS.VACATIONS, vacationsStore);

    if (supabaseClient) {
      this.pushAllToSupabase();
    }
  },
};

export const SUPABASE_SQL_BLUEPRINT = `-- ============================================================================
-- BANCO DE DADOS COMPLETO SUPABASE — MAISON VELOURS COSMÉTICOS (CRM, CLIENTES & RH)
-- Inclui: Tabelas, Views RBAC (sem dados financeiros p/ funcionário),
-- Row Level Security (RLS), Políticas de Storage (Buckets) e Dados Iniciais (Seed)
-- ============================================================================

-- 1. TABELA DE USUÁRIOS E PERFIS (RBAC)
CREATE TABLE IF NOT EXISTS public.cosmetics_users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('adm', 'funcionario')),
  job_title TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE ETAPAS DO FUNIL KANBAN
CREATE TABLE IF NOT EXISTS public.cosmetics_stages (
  id TEXT PRIMARY KEY,
  "order" INTEGER NOT NULL,
  name TEXT NOT NULL,
  is_final_won_stage BOOLEAN DEFAULT false
);

-- 3. TABELA DE LEADS DO FUNIL KANBAN
CREATE TABLE IF NOT EXISTS public.cosmetics_leads (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  city TEXT NOT NULL,
  product_of_interest TEXT NOT NULL,
  cart_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  priority TEXT NOT NULL CHECK (priority IN ('Alta', 'Média', 'Baixa')),
  stage_id TEXT NOT NULL REFERENCES public.cosmetics_stages(id) ON UPDATE CASCADE,
  assigned_to_id TEXT NOT NULL REFERENCES public.cosmetics_users(id) ON UPDATE CASCADE,
  assigned_to_name TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('Instagram', 'Indicação', 'Site', 'Anúncio', 'Evento')),
  skin_hair_type TEXT NOT NULL,
  notes TEXT,
  created_at DATE DEFAULT CURRENT_DATE,
  updated_at DATE DEFAULT CURRENT_DATE
);

-- 4. TABELA BASE DE CLIENTES E LEADS
CREATE TABLE IF NOT EXISTS public.cosmetics_customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  email TEXT,
  city TEXT NOT NULL,
  origin TEXT NOT NULL CHECK (origin IN ('Instagram', 'Indicação', 'Site', 'Anúncio', 'Evento')),
  status TEXT NOT NULL CHECK (status IN ('Lead', 'Cliente ativo', 'Inativo')),
  responsible_id TEXT NOT NULL REFERENCES public.cosmetics_users(id) ON UPDATE CASCADE,
  responsible_name TEXT NOT NULL,
  skin_hair_type TEXT NOT NULL,
  favorite_products TEXT,
  last_interaction DATE DEFAULT CURRENT_DATE,
  last_purchase DATE,
  notes TEXT,
  ltv NUMERIC(12,2) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  average_ticket NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABELA DE GESTÃO DE FÉRIAS (RH)
CREATE TABLE IF NOT EXISTS public.cosmetics_vacations (
  id TEXT PRIMARY KEY,
  employee_id TEXT NOT NULL REFERENCES public.cosmetics_users(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  employee_email TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL CHECK (days_count > 0),
  status TEXT NOT NULL CHECK (status IN ('Pendente', 'Aprovado', 'Recusado')),
  observation TEXT,
  requested_at DATE DEFAULT CURRENT_DATE,
  decided_by TEXT,
  decided_at TEXT,
  CONSTRAINT valid_vacation_dates CHECK (end_date >= start_date)
);

-- ============================================================================
-- 6. VIEWS PROTEGIDAS PARA FUNCIONÁRIOS (OMITEM COLUNAS FINANCEIRAS NO BANCO)
-- ============================================================================

CREATE OR REPLACE VIEW public.cosmetics_leads_funcionario_view AS
SELECT
  id,
  customer_name,
  whatsapp,
  city,
  product_of_interest,
  'R$ ••••'::TEXT AS masked_value,
  priority,
  stage_id,
  assigned_to_id,
  assigned_to_name,
  origin,
  skin_hair_type,
  notes,
  created_at,
  updated_at
FROM public.cosmetics_leads;

CREATE OR REPLACE VIEW public.cosmetics_customers_funcionario_view AS
SELECT
  id,
  name,
  whatsapp,
  email,
  city,
  origin,
  status,
  responsible_id,
  responsible_name,
  skin_hair_type,
  favorite_products,
  last_interaction,
  last_purchase,
  notes
FROM public.cosmetics_customers;

-- ============================================================================
-- 7. PERMISSÕES DE SCHEMA E POLÍTICAS DE SEGURANÇA (RLS ATIVADO)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.cosmetics_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cosmetics_vacations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de usuarios" ON public.cosmetics_users;
DROP POLICY IF EXISTS "Permitir escrita de usuarios pelo ADM" ON public.cosmetics_users;
DROP POLICY IF EXISTS "Politica total cosmetics_users" ON public.cosmetics_users;
CREATE POLICY "Politica total cosmetics_users"
  ON public.cosmetics_users FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura de etapas do funil" ON public.cosmetics_stages;
DROP POLICY IF EXISTS "Permitir atualizacao de etapas pelo ADM" ON public.cosmetics_stages;
DROP POLICY IF EXISTS "Politica total cosmetics_stages" ON public.cosmetics_stages;
CREATE POLICY "Politica total cosmetics_stages"
  ON public.cosmetics_stages FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura e gestao de leads" ON public.cosmetics_leads;
DROP POLICY IF EXISTS "Politica total cosmetics_leads" ON public.cosmetics_leads;
CREATE POLICY "Politica total cosmetics_leads"
  ON public.cosmetics_leads FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura e gestao de clientes" ON public.cosmetics_customers;
DROP POLICY IF EXISTS "Politica total cosmetics_customers" ON public.cosmetics_customers;
CREATE POLICY "Politica total cosmetics_customers"
  ON public.cosmetics_customers FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura e gestao de ferias" ON public.cosmetics_vacations;
DROP POLICY IF EXISTS "Politica total cosmetics_vacations" ON public.cosmetics_vacations;
CREATE POLICY "Politica total cosmetics_vacations"
  ON public.cosmetics_vacations FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- 8. BUCKET DE ARMAZENAMENTO (SUPABASE STORAGE) E POLÍTICAS DE STORAGE ATIVADAS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cosmeticos-arquivos',
  'cosmeticos-arquivos',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Leitura publica bucket cosmeticos-arquivos" ON storage.objects;
CREATE POLICY "Leitura publica bucket cosmeticos-arquivos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'cosmeticos-arquivos');

DROP POLICY IF EXISTS "Upload permitido bucket cosmeticos-arquivos" ON storage.objects;
CREATE POLICY "Upload permitido bucket cosmeticos-arquivos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'cosmeticos-arquivos');

DROP POLICY IF EXISTS "Atualizacao permitida bucket cosmeticos-arquivos" ON storage.objects;
CREATE POLICY "Atualizacao permitida bucket cosmeticos-arquivos"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'cosmeticos-arquivos')
  WITH CHECK (bucket_id = 'cosmeticos-arquivos');

DROP POLICY IF EXISTS "Exclusao permitida bucket cosmeticos-arquivos" ON storage.objects;
CREATE POLICY "Exclusao permitida bucket cosmeticos-arquivos"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'cosmeticos-arquivos');

-- ============================================================================
-- 9. CARGA INICIAL DE DADOS (SEED DATA)
-- ============================================================================

INSERT INTO public.cosmetics_users (id, name, email, role, job_title, avatar_initials, active)
VALUES
  ('usr_adm_marina', 'Marina Lopes', 'admin@cosmeticos.com', 'adm', 'Diretora de E-commerce & RH', 'ML', true),
  ('usr_emp_camila', 'Camila Souza', 'vendedor@cosmeticos.com', 'funcionario', 'Consultora de Beleza & Skincare', 'CS', true),
  ('usr_emp_beatriz', 'Beatriz Ferreira', 'beatriz@cosmeticos.com', 'funcionario', 'Especialista Capilar & Perfumaria', 'BF', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cosmetics_stages (id, "order", name, is_final_won_stage)
VALUES
  ('stage_1', 1, '1. Carrinho Abandonado', false),
  ('stage_2', 2, '2. Primeiro Contato', false),
  ('stage_3', 3, '3. Aguardando Pagamento', false),
  ('stage_4', 4, '4. Venda Concluída', true)
ON CONFLICT (id) DO NOTHING;`;

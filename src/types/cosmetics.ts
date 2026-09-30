export type UserRole = 'adm' | 'funcionario';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  jobTitle: string;
  avatarInitials: string;
  active: boolean;
}

export type FunnelStageId = 'stage_1' | 'stage_2' | 'stage_3' | 'stage_4';

export interface FunnelStageConfig {
  id: FunnelStageId;
  order: number;
  name: string;
  isFinalWonStage?: boolean;
}

export type LeadPriority = 'Alta' | 'Média' | 'Baixa';

export type ContactOrigin =
  | 'Instagram'
  | 'Indicação'
  | 'Site'
  | 'Anúncio'
  | 'Evento';

export type CustomerStatus = 'Lead' | 'Cliente ativo' | 'Inativo';

export type SkinHairProfile =
  | 'Pele Mista / Oleosa'
  | 'Pele Seca / Sensível'
  | 'Pele Madura / Linhas Finas'
  | 'Cabelos Cacheados / Nutrição'
  | 'Cabelos Loiros / Pós-Química'
  | 'Cabelos Lisos / Brilho';

/**
 * Full Lead stored in database / visible only to ADM
 */
export interface KanbanLeadFull {
  id: string;
  customerName: string;
  whatsapp: string;
  city: string;
  productOfInterest: string;
  cartValue: number; // Strictly stripped for 'funcionario'
  priority: LeadPriority;
  stageId: FunnelStageId;
  assignedToId: string;
  assignedToName: string;
  origin: ContactOrigin;
  skinHairType: SkinHairProfile;
  notes: string;
  createdAt: string; // YYYY-MM-DD
  updatedAt: string; // YYYY-MM-DD
}

/**
 * Sanitized Lead DTO delivered to either profile.
 * When role === 'funcionario', `cartValue` is undefined (omitted from object).
 */
export interface KanbanLeadView {
  id: string;
  customerName: string;
  whatsapp: string;
  city: string;
  productOfInterest: string;
  cartValue?: number; // Only exists when currentUser.role === 'adm'
  maskedValue: string; // e.g. "R$ ••••" for funcionario
  priority: LeadPriority;
  stageId: FunnelStageId;
  assignedToId: string;
  assignedToName: string;
  origin: ContactOrigin;
  skinHairType: SkinHairProfile;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Full Customer stored in database / visible with financials only to ADM
 */
export interface CustomerFull {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  city: string;
  origin: ContactOrigin;
  status: CustomerStatus;
  responsibleId: string;
  responsibleName: string;
  skinHairType: SkinHairProfile;
  favoriteProducts: string;
  lastInteraction: string; // YYYY-MM-DD
  lastPurchase: string | null; // YYYY-MM-DD or null
  notes: string;
  // Exclusive financial properties (never delivered to 'funcionario' objects)
  ltv: number;
  totalOrders: number;
  averageTicket: number;
}

/**
 * Sanitized Customer DTO delivered to UI components.
 * When role === 'funcionario', `ltv`, `totalOrders`, and `averageTicket` do not exist on the object.
 */
export interface CustomerView {
  id: string;
  name: string;
  whatsapp: string;
  email: string;
  city: string;
  origin: ContactOrigin;
  status: CustomerStatus;
  responsibleId: string;
  responsibleName: string;
  skinHairType: SkinHairProfile;
  favoriteProducts: string;
  lastInteraction: string;
  lastPurchase: string | null;
  notes: string;
  ltv?: number;
  totalOrders?: number;
  averageTicket?: number;
}

export type VacationStatus = 'Pendente' | 'Aprovado' | 'Recusado';

export interface VacationRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  status: VacationStatus;
  observation: string;
  requestedAt: string; // ISO or YYYY-MM-DD
  decidedBy?: string;
  decidedAt?: string; // dd/mm/aaaa às HH:mm
}

export interface AdminFinancialMetrics {
  totalRevenue: number;
  averageTicket: number;
  conversionRate: number;
  totalLeads: number;
  completedSalesCount: number;
}

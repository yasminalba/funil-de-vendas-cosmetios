import React, { useState, useEffect, useCallback } from 'react';
import {
  LogOut,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  UserCheck,
  KeyRound,
  X,
} from 'lucide-react';
import {
  AdminFinancialMetrics,
  ContactOrigin,
  CustomerStatus,
  CustomerView,
  FunnelStageConfig,
  FunnelStageId,
  KanbanLeadView,
  LeadPriority,
  SkinHairProfile,
  UserProfile,
  UserRole,
} from './types/cosmetics';
import { dataService } from './services/dataService';
import { LoginView } from './components/LoginView';
import { KanbanBoard } from './components/KanbanBoard';
import { CustomersModule } from './components/CustomersModule';
import { SettingsModule } from './components/SettingsModule';

type ActiveModuleTab = 'kanban' | 'clientes' | 'configuracoes';

interface ToastState {
  message: string;
  type: 'success' | 'warning';
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() =>
    dataService.getCurrentSessionUser()
  );
  const [activeTab, setActiveTab] = useState<ActiveModuleTab>('kanban');

  // Role-scoped data states fetched from the isolated dataService
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stages, setStages] = useState<FunnelStageConfig[]>([]);
  const [leads, setLeads] = useState<KanbanLeadView[]>([]);
  const [customers, setCustomers] = useState<CustomerView[]>([]);
  const [adminMetrics, setAdminMetrics] =
    useState<AdminFinancialMetrics | null>(null);

  const [toast, setToast] = useState<ToastState | null>(null);

  // Profile Switch Password Modal state
  const [pendingSwitchTarget, setPendingSwitchTarget] =
    useState<UserProfile | null>(null);
  const [switchPasswordInput, setSwitchPasswordInput] = useState('');
  const [switchPasswordError, setSwitchPasswordError] = useState<string | null>(
    null
  );

  const showToast = useCallback(
    (message: string, type: 'success' | 'warning' = 'success') => {
      setToast({ message, type });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 4000);
    },
    []
  );

  // Synchronize all view states through the isolated RBAC dataService
  const refreshDataForUser = useCallback((user: UserProfile | null) => {
    const allUsers = dataService.getUsers();
    const allStages = dataService.getStages();
    setUsers(allUsers);
    setStages(allStages);

    if (!user) {
      setLeads([]);
      setCustomers([]);
      setAdminMetrics(null);
      return;
    }

    // Data service strips financial properties when user.role === 'funcionario'
    setLeads(dataService.getLeadsForUser(user));
    setCustomers(dataService.getCustomersForUser(user));
    setAdminMetrics(dataService.getAdminMetrics(user));
  }, []);

  useEffect(() => {
    refreshDataForUser(currentUser);
    if (
      currentUser &&
      currentUser.role === 'funcionario' &&
      activeTab === 'configuracoes'
    ) {
      setActiveTab('kanban');
    }
  }, [currentUser, activeTab, refreshDataForUser]);

  // Automatically pull/seed Supabase tables on startup
  useEffect(() => {
    let mounted = true;
    dataService.initializeAndSyncWithSupabase().then((res) => {
      if (mounted) {
        refreshDataForUser(currentUser);
        if (res.ok) {
          showToast('Conectado e sincronizado com o banco de dados Supabase!');
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, [currentUser?.id, refreshDataForUser, showToast]);

  // Request profile switch -> opens password modal
  const handleInitiateProfileSwitch = (email: string) => {
    if (currentUser && currentUser.email.toLowerCase() === email.toLowerCase()) {
      return;
    }
    const target = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (!target) return;
    setPendingSwitchTarget(target);
    setSwitchPasswordInput('');
    setSwitchPasswordError(null);
  };

  const handleConfirmProfileSwitch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingSwitchTarget) return;

    const authResult = dataService.authenticateWithPassword(
      pendingSwitchTarget.email,
      switchPasswordInput
    );

    if (!authResult.user) {
      setSwitchPasswordError(
        authResult.error || 'Senha incorreta. Tente novamente (padrão: 1234).'
      );
      return;
    }

    const switched = authResult.user;
    setCurrentUser(switched);
    setPendingSwitchTarget(null);
    setSwitchPasswordInput('');
    setSwitchPasswordError(null);

    if (switched.role === 'funcionario' && activeTab === 'configuracoes') {
      setActiveTab('kanban');
    }
    showToast(
      `Perfil alternado com sucesso para ${switched.name} (${
        switched.role === 'adm' ? 'ADM' : 'Funcionário'
      }).`
    );
  };

  const handleLogout = () => {
    dataService.setSessionUser(null);
    setCurrentUser(null);
    setActiveTab('kanban');
  };

  // --- Kanban Handlers ---
  const handleMoveLead = (leadId: string, targetStageId: FunnelStageId) => {
    if (!currentUser) return;
    const res = dataService.moveLeadStage(currentUser, leadId, targetStageId);
    if (!res.success) {
      showToast(res.error || 'Ação não permitida para o seu perfil.', 'warning');
      return;
    }
    refreshDataForUser(currentUser);
    const targetStage = stages.find((s) => s.id === targetStageId);
    showToast(
      `Cartão movido para "${targetStage?.name || targetStageId}".`
    );
  };

  const handleCreateLead = (payload: {
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
  }) => {
    if (!currentUser) return;
    const res = dataService.createLead(currentUser, payload);
    if (!res.success) {
      showToast(res.error || 'Erro ao criar lead.', 'warning');
      return;
    }
    refreshDataForUser(currentUser);
    showToast(`Novo lead "${payload.customerName}" adicionado ao funil!`);
  };

  const handleUpdateLead = (
    leadId: string,
    payload: {
      customerName: string;
      whatsapp: string;
      city: string;
      productOfInterest: string;
      cartValue?: number;
      priority: LeadPriority;
      stageId: FunnelStageId;
      assignedToId: string;
      assignedToName: string;
      origin: ContactOrigin;
      skinHairType: SkinHairProfile;
      notes: string;
    }
  ) => {
    if (!currentUser) return;
    const res = dataService.updateLead(currentUser, leadId, payload);
    if (!res.success) {
      showToast(res.error || 'Não foi possível atualizar o lead.', 'warning');
      return;
    }
    refreshDataForUser(currentUser);
    showToast(`Lead "${payload.customerName}" atualizado com sucesso.`);
  };

  // --- Customers Handlers ---
  const handleSaveCustomer = (payload: {
    id?: string;
    name: string;
    whatsapp: string;
    email: string;
    city: string;
    origin: ContactOrigin;
    status: CustomerStatus;
    responsibleId: string;
    skinHairType: SkinHairProfile;
    favoriteProducts: string;
    lastInteraction: string;
    lastPurchase: string | null;
    notes: string;
    ltv?: number;
    totalOrders?: number;
  }) => {
    if (!currentUser) return;
    dataService.upsertCustomer(currentUser, payload);
    refreshDataForUser(currentUser);
    showToast(
      payload.id
        ? `Cadastro de "${payload.name}" atualizado!`
        : `Cliente "${payload.name}" adicionada à base de contatos!`
    );
  };

  // --- Settings Handlers (ADM Only) ---
  const handleAddUser = (payload: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    jobTitle: string;
  }) => {
    dataService.addUser(payload);
    refreshDataForUser(currentUser);
    showToast(`Usuário "${payload.name}" cadastrado na equipe!`);
  };

  const handleUpdateUserRole = (userId: string, role: UserRole) => {
    dataService.updateUserRole(userId, role);
    refreshDataForUser(currentUser);
    showToast('Permissão RBAC do usuário atualizada.');
  };

  const handleDeleteUser = (userId: string) => {
    dataService.deleteUser(userId);
    refreshDataForUser(currentUser);
    showToast('Usuário removido da equipe.');
  };

  const handleUpdateStages = (nextStages: FunnelStageConfig[]) => {
    dataService.updateStages(nextStages);
    refreshDataForUser(currentUser);
    showToast('Nomes e ordem das etapas do funil atualizados!');
  };

  const handleResetDemoData = () => {
    dataService.resetDemoData();
    refreshDataForUser(currentUser);
    showToast('Dados de demonstração restaurados para o estado inicial.');
  };

  if (!currentUser) {
    return (
      <LoginView
        onLogin={(loggedUser) => {
          setCurrentUser(loggedUser);
          setActiveTab('kanban');
        }}
      />
    );
  }

  const isAdm = currentUser.role === 'adm';

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2A1822] flex flex-col">
      {/* 3-Zone Top Navigation Bar */}
      <header className="bg-white border-b border-[#E6D7D4] px-4 sm:px-8 py-3.5 sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Zone 1: Single text element Brand Wordmark */}
          <a
            href="#kanban"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('kanban');
            }}
            className="font-serif-display text-2xl font-semibold tracking-tight text-[#4A1936] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] rounded"
          >
            Maison Velours
          </a>

          {/* Zone 2: Clean Text Navigation Links (Role-Protected, without Vacation options) */}
          <nav
            aria-label="Navegação Principal"
            className="flex items-center gap-5 sm:gap-7 text-xs sm:text-sm font-medium overflow-x-auto"
          >
            <button
              type="button"
              onClick={() => setActiveTab('kanban')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                activeTab === 'kanban'
                  ? 'border-[#4A1936] text-[#4A1936] font-semibold'
                  : 'border-transparent text-[#5C434E] hover:text-[#2A1822]'
              }`}
            >
              Funil Kanban
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clientes')}
              className={`py-1 border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                activeTab === 'clientes'
                  ? 'border-[#4A1936] text-[#4A1936] font-semibold'
                  : 'border-transparent text-[#5C434E] hover:text-[#2A1822]'
              }`}
            >
              Clientes ({customers.length})
            </button>

            {isAdm && (
              <button
                type="button"
                onClick={() => setActiveTab('configuracoes')}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                  activeTab === 'configuracoes'
                    ? 'border-[#4A1936] text-[#4A1936] font-semibold'
                    : 'border-transparent text-[#5C434E] hover:text-[#2A1822]'
                }`}
              >
                Configurações
              </button>
            )}
          </nav>

          {/* Zone 3: Password-Protected Profile Switcher + Logout */}
          <div className="flex items-center gap-3">
            <div
              role="group"
              aria-label="Troca de perfil protegida por senha"
              className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF7F5] border border-[#E6D7D4]"
            >
              <button
                type="button"
                onClick={() =>
                  handleInitiateProfileSwitch('admin@cosmeticos.com')
                }
                title="Alternar para Marina Lopes (ADM) — requer senha"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                  isAdm
                    ? 'bg-[#4A1936] text-white'
                    : 'text-[#5C434E] hover:text-[#2A1822]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Marina Lopes (ADM)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleInitiateProfileSwitch('vendedor@cosmeticos.com')
                }
                title="Alternar para Camila Souza (Funcionário) — requer senha"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                  !isAdm
                    ? 'bg-[#9E4763] text-white'
                    : 'text-[#5C434E] hover:text-[#2A1822]'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Camila Souza (Funcionário)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              title="Sair da conta"
              aria-label="Sair da conta"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D5BCC3] text-xs font-medium text-[#5C434E] hover:text-[#2A1822] hover:bg-[#FAF7F5] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Active Session Strip & Toast Confirmation */}
      <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-8 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#E6D7D4] text-xs text-[#5C434E]">
          <div>
            <span>Sessão ativa: </span>
            <strong className="text-[#2A1822]">{currentUser.name}</strong>
            <span aria-hidden="true"> · </span>
            <span>{currentUser.email}</span>
            <span aria-hidden="true"> · </span>
            <strong className="text-[#4A1936]">
              {isAdm
                ? 'Papel: ADM (Acesso Total & Financeiro)'
                : 'Papel: Funcionário (Atendimento s/ Dados Financeiros)'}
            </strong>
          </div>
          <div className="text-[#6E5662]">
            {isAdm
              ? 'Visualizando todos os leads da equipe e indicadores financeiros'
              : 'Objetos sanitizados: propriedades cartValue, ltv e averageTicket removidas na camada de dados'}
          </div>
        </div>

        {toast && (
          <div
            role="status"
            aria-live="polite"
            className={`mt-4 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium ${
              toast.type === 'warning'
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-[#2A1822] border-[#4A1936] text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#E6A4B4] shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-[11px] underline opacity-80 hover:opacity-100"
            >
              Fechar
            </button>
          </div>
        )}
      </div>

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-8 py-6">
        {activeTab === 'kanban' && (
          <KanbanBoard
            currentUser={currentUser}
            stages={stages}
            leads={leads}
            sellers={users}
            adminMetrics={adminMetrics}
            onMoveLead={handleMoveLead}
            onCreateLead={handleCreateLead}
            onUpdateLead={handleUpdateLead}
          />
        )}

        {activeTab === 'clientes' && (
          <CustomersModule
            currentUser={currentUser}
            customers={customers}
            sellers={users}
            onSaveCustomer={handleSaveCustomer}
          />
        )}

        {activeTab === 'configuracoes' && isAdm && (
          <SettingsModule
            users={users}
            stages={stages}
            onAddUser={handleAddUser}
            onUpdateUserRole={handleUpdateUserRole}
            onDeleteUser={handleDeleteUser}
            onUpdateStages={handleUpdateStages}
            onResetDemoData={handleResetDemoData}
            onSupabaseSynced={(msg, ok) => {
              refreshDataForUser(currentUser);
              showToast(msg, ok ? 'success' : 'warning');
            }}
          />
        )}
      </main>

      {/* Password Verification Modal for Profile Switch */}
      {pendingSwitchTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="switch-profile-title"
          className="fixed inset-0 z-50 bg-[#2A1822]/55 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[#E6D7D4] shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#E6D7D4]">
              <div>
                <h2
                  id="switch-profile-title"
                  className="font-serif-display text-2xl font-semibold text-[#2A1822]"
                >
                  Confirmar Troca de Perfil
                </h2>
                <p className="text-xs text-[#6E5662] mt-0.5">
                  Digite a senha de login para entrar como{' '}
                  <strong>{pendingSwitchTarget.name}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingSwitchTarget(null)}
                aria-label="Cancelar troca de perfil"
                className="p-2 rounded-lg text-[#6E5662] hover:text-[#2A1822] hover:bg-[#FAF7F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmProfileSwitch} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#FAF7F5] border border-[#E6D7D4] text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#6E5662]">Usuário destino:</span>
                  <strong className="text-[#2A1822]">
                    {pendingSwitchTarget.name}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E5662]">E-mail:</span>
                  <span className="font-mono-tabular text-[#5C434E]">
                    {pendingSwitchTarget.email}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#6E5662]">Nível RBAC:</span>
                  <span className="font-semibold text-[#4A1936]">
                    {pendingSwitchTarget.role === 'adm'
                      ? 'ADM (Acesso Total)'
                      : 'Funcionário (Restrito)'}
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="switch-password-input"
                  className="block text-xs font-semibold text-[#2A1822] mb-1.5"
                >
                  Senha de Login *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="switch-password-input"
                    type="password"
                    required
                    autoFocus
                    value={switchPasswordInput}
                    onChange={(e) => {
                      setSwitchPasswordInput(e.target.value);
                      setSwitchPasswordError(null);
                    }}
                    placeholder="Digite a senha do perfil (padrão: 1234)"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                  />
                </div>
              </div>

              {switchPasswordError && (
                <p
                  role="alert"
                  className="text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2"
                >
                  {switchPasswordError}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPendingSwitchTarget(null)}
                  className="px-4 py-2 rounded-xl border border-[#D5BCC3] text-xs font-medium text-[#5C434E] hover:text-[#2A1822]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors"
                >
                  Autenticar e Trocar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="mt-12 border-t border-[#E6D7D4] bg-white px-4 sm:px-8 py-4 text-xs text-[#6E5662]">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <span>
            Maison Velours Cosméticos — Funil de Vendas e Base de Clientes
          </span>
          <span>Moeda: BRL (R$) · Datas: dd/mm/aaaa</span>
        </div>
      </footer>
    </div>
  );
}

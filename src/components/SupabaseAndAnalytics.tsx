import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  Copy,
  RefreshCw,
  BarChart3,
  Layers,
  Users,
  ShieldCheck,
  Terminal,
  Shield,
  UserCheck,
  Plus,
  Trash2,
  Settings,
  XCircle,
  TrendingUp,
  Award,
  Edit3,
} from 'lucide-react';
import {
  AccessRole,
  AutomationRule,
  FUNNEL_STAGES,
  Lead,
  SystemSettings,
  UserAccount,
} from '../types/crm';
import {
  crmRepository,
  isSupabaseEnvConfigured,
  SUPABASE_SQL_SCHEMA,
} from '../lib/supabase';

interface SupabaseAndAnalyticsProps {
  mode: 'reports' | 'settings';
  leads: Lead[];
  automations: AutomationRule[];
  settings: SystemSettings;
  users: UserAccount[];
  supabaseTableReady: boolean;
  onUpdateSettings: (nextSettings: SystemSettings) => void;
  onUsersChanged: (nextUsers: UserAccount[], message: string) => void;
  onSyncComplete: (msg: string) => void;
}

export const SupabaseAndAnalytics: React.FC<SupabaseAndAnalyticsProps> = ({
  mode,
  leads,
  automations,
  settings,
  users,
  supabaseTableReady,
  onUpdateSettings,
  onUsersChanged,
  onSyncComplete,
}) => {
  const [copiedSql, setCopiedSql] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // New user form state (Admin User Management)
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newAccessRole, setNewAccessRole] = useState<AccessRole>('funcionario');
  const [newJobRole, setNewJobRole] = useState('Vendedor / SDR');

  // Loss Reason editor state (Admin Loss Reason Configuration)
  const [newLossReason, setNewLossReason] = useState('');
  const [editingReasonIndex, setEditingReasonIndex] = useState<number | null>(
    null
  );
  const [editingReasonValue, setEditingReasonValue] = useState('');

  // System settings state
  const [companyName, setCompanyName] = useState(settings.company_name);
  const [monthlyGoal, setMonthlyGoal] = useState(
    String(settings.monthly_revenue_goal)
  );

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    } catch {
      setCopiedSql(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const result = await crmRepository.syncAllToSupabase();
      onSyncComplete(result.message);
    } finally {
      setSyncing(false);
    }
  };

  // Admin: Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newUsername.trim() || !newPassword.trim())
      return;

    const res = await crmRepository.registerUser({
      full_name: newFullName,
      username: newUsername,
      email:
        newEmail.trim() ||
        `${newUsername.trim().toLowerCase()}@verticecrm.com.br`,
      password: newPassword,
      role: newJobRole,
      access_role: newAccessRole,
      company: settings.company_name,
      autoLogin: false,
    });

    if (res.error) {
      onSyncComplete(res.error);
      return;
    }

    setNewFullName('');
    setNewUsername('');
    setNewEmail('');
    setNewPassword('1234');
    const refreshed = crmRepository.getUsers();
    onUsersChanged(
      refreshed,
      `Usuário "${res.user?.full_name}" cadastrado como ${
        newAccessRole === 'administrador' ? 'Administrador' : 'Funcionário'
      }!`
    );
  };

  // Admin: Remove user
  const handleDeleteUser = async (u: UserAccount) => {
    if (u.username === 'yasyas') return;
    const updated = await crmRepository.deleteUser(u.id);
    onUsersChanged(
      updated,
      `Usuário @${u.username} removido do sistema com sucesso.`
    );
  };

  // Admin: Toggle user RBAC role
  const handleToggleUserRole = async (u: UserAccount) => {
    if (u.username === 'yasyas') return;
    const nextRole: AccessRole =
      u.access_role === 'administrador' ? 'funcionario' : 'administrador';
    const nextDesc =
      nextRole === 'administrador'
        ? 'Gestor / Diretor Comercial'
        : 'Vendedor / SDR';
    const updated = await crmRepository.updateUserAccessRole(
      u.id,
      nextRole,
      nextDesc
    );
    onUsersChanged(
      updated,
      `Permissão de ${u.full_name} alterada para ${
        nextRole === 'administrador' ? 'Administrador' : 'Funcionário'
      }.`
    );
  };

  // Admin: Add Loss Reason
  const handleAddLossReason = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newLossReason.trim();
    if (!clean || settings.loss_reasons.includes(clean)) return;
    const next: SystemSettings = {
      ...settings,
      loss_reasons: [...settings.loss_reasons, clean],
    };
    crmRepository.saveSettings(next);
    onUpdateSettings(next);
    setNewLossReason('');
    onSyncComplete(`Novo motivo de perda "${clean}" adicionado ao sistema!`);
  };

  // Admin: Save edited Loss Reason
  const handleSaveEditedLossReason = (idx: number) => {
    const clean = editingReasonValue.trim();
    if (!clean) return;
    const nextList = settings.loss_reasons.map((item, i) =>
      i === idx ? clean : item
    );
    const next: SystemSettings = {
      ...settings,
      loss_reasons: nextList,
    };
    crmRepository.saveSettings(next);
    onUpdateSettings(next);
    setEditingReasonIndex(null);
    onSyncComplete(`Motivo de perda atualizado para "${clean}"!`);
  };

  // Admin: Delete Loss Reason
  const handleDeleteLossReason = (reason: string) => {
    if (settings.loss_reasons.length <= 1) return;
    const next: SystemSettings = {
      ...settings,
      loss_reasons: settings.loss_reasons.filter((r) => r !== reason),
    };
    crmRepository.saveSettings(next);
    onUpdateSettings(next);
    onSyncComplete(`Motivo de perda "${reason}" removido.`);
  };

  // Admin: Save general company settings
  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    const next: SystemSettings = {
      ...settings,
      company_name: companyName.trim() || 'Vértice Enterprise CRM',
      monthly_revenue_goal: Math.max(1000, Number(monthlyGoal) || 250000),
    };
    crmRepository.saveSettings(next);
    onUpdateSettings(next);
    onSyncComplete('Configurações gerais da empresa atualizadas!');
  };

  // Macro Revenue & Forecast Calculations (Admin Exclusive)
  const totalPipelineValue = leads
    .filter((l) => l.stage !== 'perdido')
    .reduce((acc, l) => acc + l.value, 0);

  const weightedForecast = leads.reduce((acc, l) => {
    const stg = FUNNEL_STAGES.find((s) => s.id === l.stage);
    const prob = stg ? stg.probability / 100 : 0;
    return acc + l.value * prob;
  }, 0);

  const wonDeals = leads.filter((l) => l.stage === 'fechado');
  const wonValue = wonDeals.reduce((acc, l) => acc + l.value, 0);

  const lostDeals = leads.filter((l) => l.stage === 'perdido');
  const lostValue = lostDeals.reduce((acc, l) => acc + l.value, 0);

  const globalConversionRate =
    leads.length > 0 ? Math.round((wonDeals.length / leads.length) * 100) : 0;

  const goalAttainmentPct = Math.min(
    100,
    Math.round((wonValue / (settings.monthly_revenue_goal || 250000)) * 100)
  );

  // Seller Performance Ranking
  const sellerPerformance = users.map((u) => {
    const sellerLeads = leads.filter((l) => l.owner_username === u.username);
    const sellerWon = sellerLeads.filter((l) => l.stage === 'fechado');
    const sellerActive = sellerLeads.filter(
      (l) => l.stage !== 'fechado' && l.stage !== 'perdido'
    );
    const wonSum = sellerWon.reduce((s, l) => s + l.value, 0);
    const activeSum = sellerActive.reduce((s, l) => s + l.value, 0);
    const conv =
      sellerLeads.length > 0
        ? Math.round((sellerWon.length / sellerLeads.length) * 100)
        : 0;
    return {
      user: u,
      totalCount: sellerLeads.length,
      wonCount: sellerWon.length,
      wonSum,
      activeSum,
      conv,
    };
  });

  // Loss Reasons Breakdown
  const lossBreakdown = settings.loss_reasons.map((reason) => {
    const matching = lostDeals.filter(
      (l) => (l.loss_reason || 'Preço') === reason
    );
    const sum = matching.reduce((s, l) => s + l.value, 0);
    return { reason, count: matching.length, value: sum };
  });

  if (mode === 'reports') {
    return (
      <div className="space-y-6">
        {/* Exclusive Admin Security Header */}
        <div className="bg-[#0F172A] text-white rounded-lg p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-mono-num font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>VISÃO EXCLUSIVA DO ADMINISTRADOR (GESTOR / DIRETOR)</span>
            </div>
            <h2 className="font-display text-xl font-bold">
              Relatórios Gerenciais, Faturamento Total & Previsão de Vendas (Forecast)
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Consolidado macro de todos os vendedores, canais de entrada, taxas de
              conversão gerais e análise de perdas da empresa.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 min-w-[240px]">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Meta Mensal da Empresa</span>
              <span className="font-mono-num text-emerald-400 font-bold">
                {goalAttainmentPct}% atingido
              </span>
            </div>
            <div className="font-mono-num text-lg font-bold text-white mt-1">
              R$ {wonValue.toLocaleString('pt-BR')}{' '}
              <span className="text-xs text-slate-400 font-normal">
                / R$ {settings.monthly_revenue_goal.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-sm overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${Math.max(5, goalAttainmentPct)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Macro Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <span className="text-xs font-semibold text-slate-500 block">
              Faturamento Total Fechado (Ganho)
            </span>
            <span className="font-mono-num text-2xl font-extrabold text-emerald-700 mt-1.5 block">
              R$ {wonValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[11px] font-mono-num text-slate-500 mt-1 block">
              {wonDeals.length} contratos assinados na empresa
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <span className="text-xs font-semibold text-slate-500 block">
              Previsão de Vendas (Forecast Ponderado)
            </span>
            <span className="font-mono-num text-2xl font-extrabold text-blue-700 mt-1.5 block">
              R$ {Math.round(weightedForecast).toLocaleString('pt-BR')}
            </span>
            <span className="text-[11px] font-mono-num text-slate-500 mt-1 block">
              Pipeline bruto: R$ {totalPipelineValue.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <span className="text-xs font-semibold text-slate-500 block">
              Taxa de Conversão Geral
            </span>
            <span className="font-mono-num text-2xl font-extrabold text-slate-900 mt-1.5 block">
              {globalConversionRate}%
            </span>
            <span className="text-[11px] font-mono-num text-emerald-700 mt-1 block">
              Sob {leads.length} oportunidades totais
            </span>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <span className="text-xs font-semibold text-slate-500 block">
              Negócios Perdidos (Total Empresa)
            </span>
            <span className="font-mono-num text-2xl font-extrabold text-rose-700 mt-1.5 block">
              R$ {lostValue.toLocaleString('pt-BR')}
            </span>
            <span className="text-[11px] font-mono-num text-slate-500 mt-1 block">
              {lostDeals.length} oportunidade(s) perdida(s)
            </span>
          </div>
        </div>

        {/* Seller Ranking Table + Stage Funnel Retention */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Seller Performance Ranking */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>Desempenho Comercial por Vendedor / SDR</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Comparativo de faturamento, carteira em aberto e conversão individual
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-mono-num text-[11px] uppercase text-slate-500">
                    <th className="py-2.5 px-3">Membro / Perfil RBAC</th>
                    <th className="py-2.5 px-3">Leads</th>
                    <th className="py-2.5 px-3">Em Aberto</th>
                    <th className="py-2.5 px-3">Faturamento Ganho</th>
                    <th className="py-2.5 px-3 text-right">Conversão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sellerPerformance.map((sp) => (
                    <tr key={sp.user.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {sp.user.full_name}
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono-num text-[10px] ${
                              sp.user.access_role === 'administrador'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {sp.user.access_role === 'administrador'
                              ? 'Admin'
                              : 'Funcionário'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {sp.user.role} (@{sp.user.username})
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono-num font-semibold">
                        {sp.totalCount}
                      </td>
                      <td className="py-3 px-3 font-mono-num text-slate-700">
                        R$ {sp.activeSum.toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 font-mono-num font-bold text-emerald-700">
                        R$ {sp.wonSum.toLocaleString('pt-BR')} ({sp.wonCount})
                      </td>
                      <td className="py-3 px-3 text-right font-mono-num font-bold text-slate-900">
                        {sp.conv}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stage Retention & Loss Reasons Breakdown */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3.5">
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Volume Financeiro por Etapa</span>
              </h3>

              <div className="space-y-2.5">
                {FUNNEL_STAGES.map((stg) => {
                  const stageLeads = leads.filter((l) => l.stage === stg.id);
                  const stageSum = stageLeads.reduce(
                    (acc, l) => acc + l.value,
                    0
                  );
                  const pct =
                    totalPipelineValue > 0
                      ? Math.min(
                          100,
                          Math.round((stageSum / totalPipelineValue) * 100)
                        )
                      : 0;
                  return (
                    <div key={stg.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">
                          {stg.shortLabel}{' '}
                          <span className="text-slate-400 font-mono-num">
                            ({stageLeads.length})
                          </span>
                        </span>
                        <span className="font-mono-num font-bold text-slate-900">
                          R$ {stageSum.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-sm overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.max(4, pct)}%`,
                            backgroundColor: stg.accentColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loss Reasons Report */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-3">
              <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Auditoria de Motivos de Perda</span>
              </h3>
              <div className="divide-y divide-slate-100">
                {lossBreakdown.map((item) => (
                  <div
                    key={item.reason}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">
                      {item.reason}
                    </span>
                    <span className="font-mono-num text-slate-600">
                      <strong>{item.count}</strong> negócio(s) • R${' '}
                      {item.value.toLocaleString('pt-BR')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // MODE === 'settings' (Exclusive Admin Settings, Users RBAC, Loss Reasons & Supabase)
  return (
    <div className="space-y-6">
      {/* Admin Settings Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-[#0F172A] text-emerald-400 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-bold text-slate-900">
                Configurações do Sistema, Gestão de Usuários RBAC & Motivos de Perda
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono-num text-[11px] font-bold">
                ACESSO EXCLUSIVO ADMINISTRADOR
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Cadastre ou remova vendedores/gestores, altere permissões de acesso,
              personalize os motivos de perda e sincronize o banco Supabase.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleManualSync}
          disabled={syncing}
          className="px-4 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>
            {syncing
              ? 'Sincronizando...'
              : 'Sincronizar Tudo com Supabase'}
          </span>
        </button>
      </div>

      {/* Grid: User RBAC Management (Left 7 cols) + Loss Reasons & General Config (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: User Management (Cadastrar / Remover / Alterar Perfil RBAC) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Gestão de Usuários e Níveis de Acesso (RBAC)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Adicione novos membros na equipe comercial, alterne entre Administrador e
              Funcionário ou remova acessos.
            </p>
          </div>

          {/* Create User Form */}
          <form
            onSubmit={handleCreateUser}
            className="p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-3"
          >
            <span className="text-xs font-bold text-slate-800 block">
              Cadastrar Novo Usuário na Equipe
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newFullName}
                onChange={(e) => setNewFullName(e.target.value)}
                placeholder="Nome Completo *"
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
                required
              />
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Login (ex: pedro.sdr) *"
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono-num"
                required
              />
              <input
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Senha *"
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono-num"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={newAccessRole}
                onChange={(e) => {
                  const val = e.target.value as AccessRole;
                  setNewAccessRole(val);
                  setNewJobRole(
                    val === 'administrador'
                      ? 'Gestor / Diretor Comercial'
                      : 'Vendedor / SDR'
                  );
                }}
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-semibold text-slate-900"
              >
                <option value="funcionario">
                  Perfil Funcionário (Vendedor/SDR)
                </option>
                <option value="administrador">
                  Perfil Administrador (Gestor/Diretor)
                </option>
              </select>

              <input
                type="text"
                value={newJobRole}
                onChange={(e) => setNewJobRole(e.target.value)}
                placeholder="Cargo (ex: Closer B2B)"
                className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              />

              <button
                type="submit"
                className="px-4 py-2 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Usuário</span>
              </button>
            </div>
          </form>

          {/* Users Table */}
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-3.5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      {u.full_name}
                    </span>
                    <span className="font-mono-num text-[11px] text-slate-500">
                      @{u.username}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-mono-num text-[10px] font-bold flex items-center gap-1 ${
                        u.access_role === 'administrador'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-blue-50 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {u.access_role === 'administrador' ? (
                        <>
                          <Shield className="w-2.5 h-2.5" />
                          ADMINISTRADOR
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-2.5 h-2.5" />
                          FUNCIONÁRIO (RESTRITO)
                        </>
                      )}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {u.role} • {u.email} • Senha:{' '}
                    <code className="font-mono-num">{u.password_hash}</code>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {u.username !== 'yasyas' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleUserRole(u)}
                        className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
                      >
                        Alternar para{' '}
                        {u.access_role === 'administrador'
                          ? 'Funcionário'
                          : 'Admin'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u)}
                        className="p-1.5 rounded-md border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remover usuário"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-[11px] font-mono-num text-emerald-700 font-semibold px-2 py-1 rounded bg-emerald-50">
                      Conta Diretora Principal
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Loss Reasons Editor & System Parameters */}
        <div className="lg:col-span-5 space-y-6">
          {/* Loss Reasons Editor */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Editar Motivos de Perda</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personalize as opções exibidas quando um negócio é marcado como Perdido
              </p>
            </div>

            <form onSubmit={handleAddLossReason} className="flex gap-2">
              <input
                type="text"
                value={newLossReason}
                onChange={(e) => setNewLossReason(e.target.value)}
                placeholder="Novo motivo (ex: Sem Orçamento Agora)"
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar</span>
              </button>
            </form>

            <div className="space-y-2">
              {settings.loss_reasons.map((reason, idx) => (
                <div
                  key={reason}
                  className="p-2.5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                >
                  {editingReasonIndex === idx ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editingReasonValue}
                        onChange={(e) => setEditingReasonValue(e.target.value)}
                        className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-300 rounded"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEditedLossReason(idx)}
                        className="px-2.5 py-1 rounded bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-semibold text-slate-800">
                        {reason}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReasonIndex(idx);
                            setEditingReasonValue(reason);
                          }}
                          className="p-1.5 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer"
                          title="Editar motivo"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {settings.loss_reasons.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteLossReason(reason)}
                            className="p-1.5 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Remover motivo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* General System Parameters */}
          <form
            onSubmit={handleSaveCompanySettings}
            className="bg-white border border-slate-200 rounded-lg p-6 space-y-4"
          >
            <h3 className="font-display text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Parâmetros Globais & Metas da Empresa</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nome da Operação Comercial
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meta Mensal de Faturamento Global (R$)
              </label>
              <input
                type="number"
                min="1000"
                step="5000"
                value={monthlyGoal}
                onChange={(e) => setMonthlyGoal(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono-num font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 px-4 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold transition cursor-pointer"
            >
              Salvar Configurações do Sistema
            </button>
          </form>
        </div>
      </div>

      {/* Ready-to-run Supabase SQL Schema Viewer */}
      <div className="bg-[#0F172A] text-white rounded-lg border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="font-display text-sm font-bold text-white">
                Script SQL Pronto para o Supabase SQL Editor (RBAC + 5 Módulos)
              </h3>
              <p className="text-[11px] text-slate-400">
                Status:{' '}
                {isSupabaseEnvConfigured && supabaseTableReady
                  ? 'Conectado e Sincronizado'
                  : 'Pronto para Execução'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySql}
            className="px-3.5 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
          >
            {copiedSql ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>SQL Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Script SQL</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-5 text-xs font-mono-num text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
          {SUPABASE_SQL_SCHEMA}
        </pre>
      </div>
    </div>
  );
};

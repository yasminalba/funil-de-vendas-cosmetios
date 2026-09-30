import React, { useState } from 'react';
import {
  Users,
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import {
  FunnelStageConfig,
  UserProfile,
  UserRole,
} from '../types/cosmetics';
import { dataService } from '../services/dataService';

interface SettingsModuleProps {
  users: UserProfile[];
  stages: FunnelStageConfig[];
  onAddUser: (payload: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    jobTitle: string;
  }) => void;
  onUpdateUserRole: (userId: string, role: UserRole) => void;
  onDeleteUser: (userId: string) => void;
  onUpdateStages: (nextStages: FunnelStageConfig[]) => void;
  onResetDemoData: () => void;
  onSupabaseSynced: (message: string, ok: boolean) => void;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  users,
  stages,
  onAddUser,
  onUpdateUserRole,
  onDeleteUser,
  onUpdateStages,
  onResetDemoData,
  onSupabaseSynced,
}) => {
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('1234');
  const [newRole, setNewRole] = useState<UserRole>('funcionario');
  const [newJobTitle, setNewJobTitle] = useState('Consultora de Beleza');

  const [draftStages, setDraftStages] = useState<FunnelStageConfig[]>(stages);
  const [syncing, setSyncing] = useState(false);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;
    onAddUser({
      name: newName,
      email: newEmail,
      password: newPassword.trim() || '1234',
      role: newRole,
      jobTitle: newJobTitle,
    });
    setNewName('');
    setNewEmail('');
    setNewPassword('1234');
    setNewJobTitle('Consultora de Beleza');
  };

  const handleStageNameChange = (id: string, name: string) => {
    setDraftStages((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name } : s))
    );
  };

  const handleMoveStageOrder = (index: number, direction: 'up' | 'down') => {
    const next = [...draftStages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;

    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;

    const reordered = next.map((st, idx) => ({
      ...st,
      order: idx + 1,
    }));
    setDraftStages(reordered);
    onUpdateStages(reordered);
  };

  const handleSaveStageNames = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateStages(draftStages);
  };

  const handleForcePushToSupabase = async () => {
    setSyncing(true);
    const res = await dataService.pushAllToSupabase();
    setSyncing(false);
    onSupabaseSynced(res.message, res.ok);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-semibold text-[#2A1822]">
            Configurações do Sistema (Exclusivo ADM)
          </h2>
          <p className="text-xs text-[#6E5662]">
            Gerencie usuários, senhas e permissões RBAC, e personalize os nomes e a ordem das etapas do funil Kanban.
          </p>
        </div>

        <button
          type="button"
          disabled={syncing}
          onClick={handleForcePushToSupabase}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A1936] hover:bg-[#381229] disabled:opacity-60 text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`}
          />
          {syncing ? 'Sincronizando...' : 'Sincronizar Dados'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MODULE 1: MANAGE USERS & RBAC */}
        <section className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#E6D7D4] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6D7D4]">
            <Users className="w-4 h-4 text-[#4A1936]" />
            <h3 className="font-serif-display text-xl font-semibold text-[#2A1822]">
              Gestão de Usuários e Perfis de Acesso
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F5] border-b border-[#E6D7D4] text-xs font-semibold text-[#5C434E]">
                  <th className="py-3 px-3">Nome & Cargo</th>
                  <th className="py-3 px-3">E-mail de Login</th>
                  <th className="py-3 px-3">Papel RBAC</th>
                  <th className="py-3 px-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EAE8] text-xs">
                {users.map((u) => {
                  const isProtected =
                    u.email === 'admin@cosmeticos.com' ||
                    u.email === 'vendedor@cosmeticos.com';
                  return (
                    <tr key={u.id} className="hover:bg-[#FAF7F5]">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#2A1822]">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-[#6E5662]">
                          {u.jobTitle}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono-tabular text-[#5C434E]">
                        {u.email}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          aria-label={`Alterar papel de ${u.name}`}
                          value={u.role}
                          disabled={isProtected}
                          onChange={(e) =>
                            onUpdateUserRole(u.id, e.target.value as UserRole)
                          }
                          className="px-2.5 py-1.5 rounded-lg bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-semibold text-[#2A1822] disabled:opacity-70"
                        >
                          <option value="adm">ADM (Acesso Total)</option>
                          <option value="funcionario">
                            Funcionário (Restrito)
                          </option>
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {isProtected ? (
                          <span className="text-[11px] text-[#6E5662]">
                            Padrão
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onDeleteUser(u.id)}
                            title="Remover usuário"
                            aria-label={`Remover usuário ${u.name}`}
                            className="p-1.5 rounded-lg text-[#B91C1C] hover:bg-[#FEF2F2]"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <form
            onSubmit={handleCreateUser}
            className="pt-4 border-t border-[#E6D7D4] space-y-3"
          >
            <h4 className="text-xs font-semibold text-[#2A1822]">
              Adicionar Novo Membro da Equipe
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nome completo"
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
              />
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="E-mail corporativo"
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
              />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Senha de acesso"
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newJobTitle}
                onChange={(e) => setNewJobTitle(e.target.value)}
                placeholder="Cargo (ex.: Consultora Skincare)"
                className="px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
              >
                <option value="funcionario">Papel: Funcionário</option>
                <option value="adm">Papel: ADM</option>
              </select>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Usuário
              </button>
            </div>
          </form>
        </section>

        {/* MODULE 2: MANAGE FUNNEL STAGES (NAMES & ORDER) */}
        <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E6D7D4] space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E6D7D4]">
            <Layers className="w-4 h-4 text-[#9E4763]" />
            <h3 className="font-serif-display text-xl font-semibold text-[#2A1822]">
              Etapas do Funil Kanban (Nomes e Ordem)
            </h3>
          </div>

          <form onSubmit={handleSaveStageNames} className="space-y-3">
            {draftStages.map((st, idx) => (
              <div
                key={st.id}
                className="p-3 rounded-xl bg-[#FAF7F5] border border-[#E6D7D4] flex items-center gap-2"
              >
                <span className="font-mono-tabular text-xs font-semibold text-[#4A1936] w-6">
                  #{idx + 1}
                </span>
                <input
                  type="text"
                  value={st.name}
                  onChange={(e) =>
                    handleStageNameChange(st.id, e.target.value)
                  }
                  aria-label={`Nome da etapa ${idx + 1}`}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#D5BCC3] text-xs font-medium text-[#2A1822]"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveStageOrder(idx, 'up')}
                    title="Subir etapa"
                    aria-label={`Subir etapa ${st.name}`}
                    className="p-1.5 rounded-lg border border-[#D5BCC3] text-[#5C434E] hover:bg-white disabled:opacity-35"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === draftStages.length - 1}
                    onClick={() => handleMoveStageOrder(idx, 'down')}
                    title="Descer etapa"
                    aria-label={`Descer etapa ${st.name}`}
                    className="p-1.5 rounded-lg border border-[#D5BCC3] text-[#5C434E] hover:bg-white disabled:opacity-35"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onResetDemoData}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D5BCC3] text-xs font-medium text-[#5C434E] hover:text-[#2A1822] hover:bg-[#FAF7F5]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Restaurar Dados Padrão
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors"
              >
                Salvar Nomes das Etapas
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Database,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
  Building2,
  Briefcase,
  Shield,
  UserCheck,
} from 'lucide-react';
import { crmRepository, isSupabaseEnvConfigured } from '../lib/supabase';
import { AccessRole, UserAccount } from '../types/crm';

interface AuthScreenProps {
  onAuthenticated: (user: UserAccount) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('yasyas');
  const [password, setPassword] = useState('1234');

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAccessRole, setRegAccessRole] = useState<AccessRole>('funcionario');
  const [regRole, setRegRole] = useState('Vendedor / SDR');
  const [regCompany, setRegCompany] = useState('Vértice Enterprise');
  const [regPassword, setRegPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessBanner(null);

    if (!username.trim() || !password.trim()) {
      setErrorMsg('Preencha o login e a senha para acessar o sistema.');
      return;
    }

    setLoading(true);
    try {
      const result = await crmRepository.authenticate(username, password);
      if (!result.user) {
        setErrorMsg(result.error || 'Não foi possível autenticar.');
      } else {
        onAuthenticated(result.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessBanner(null);

    if (
      !regFullName.trim() ||
      !regUsername.trim() ||
      !regEmail.trim() ||
      !regPassword.trim()
    ) {
      setErrorMsg('Preencha todos os campos obrigatórios para criar sua conta.');
      return;
    }

    if (regPassword.trim().length < 4) {
      setErrorMsg('A senha deve possuir pelo menos 4 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const result = await crmRepository.registerUser({
        username: regUsername,
        password: regPassword,
        full_name: regFullName,
        email: regEmail,
        role: regRole,
        access_role: regAccessRole,
        company: regCompany || 'Vértice Comercial',
      });

      if (!result.user) {
        setErrorMsg(result.error || 'Erro ao criar cadastro.');
      } else {
        onAuthenticated(result.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const fillPresetCredential = (
    uname: string,
    pass: string,
    label: string
  ) => {
    setMode('login');
    setUsername(uname);
    setPassword(pass);
    setErrorMsg(null);
    setSuccessBanner(`Perfil selecionado: ${label} (${uname} / ${pass})`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col lg:flex-row">
      {/* Left Column: RBAC Security & 5-Module Commercial Architecture */}
      <div className="lg:w-[54%] bg-[#0F172A] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800">
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #334155 1px, transparent 1px), linear-gradient(to bottom, #334155 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-950 font-display font-extrabold text-xl shadow-sm">
                V
              </div>
              <div>
                <span className="font-display font-bold text-lg tracking-tight text-white block leading-none">
                  VÉRTICE CRM
                </span>
                <span className="text-xs text-slate-400 font-mono-num">
                  RBAC SECURITY & KANBAN FUNNEL SYSTEM
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 text-xs font-mono-num text-emerald-400">
              <Database className="w-3.5 h-3.5" />
              <span>
                {isSupabaseEnvConfigured
                  ? 'Supabase PostgreSQL Ativo'
                  : 'Supabase Ready + Persistência RBAC'}
              </span>
            </div>
          </div>

          <div className="mt-10 lg:mt-14 max-w-xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Controle Estrito de Acesso por Nível de Usuário (RBAC)</span>
            </div>
            <h1 className="font-display text-3xl lg:text-4xl font-bold tracking-tight text-white leading-[1.15]">
              Funil de Vendas Kanban com governança para Gestores e Vendedores.
            </h1>
            <p className="mt-3.5 text-slate-300 text-sm sm:text-base leading-relaxed">
              Dossiê completo de 5 módulos por cliente com separação rigorosa de
              permissões entre o <strong>Perfil Administrador (Diretor/Gestor)</strong> e
              o <strong>Perfil Funcionário (Vendedor/SDR)</strong>.
            </p>
          </div>

          {/* RBAC Comparison Matrix Card */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
            <div className="bg-slate-900/90 border border-emerald-500/40 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono-num text-[11px] font-bold flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  PERFIL ADMINISTRADOR
                </span>
                <span className="text-[11px] font-mono-num text-slate-400">
                  Gestor / Diretor
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <li>• Visão irrestrita de todos os leads de todos os vendedores</li>
                <li>• Dashboards de faturamento total, conversão e Forecast</li>
                <li>• Gestão de usuários, configurações e motivos de perda</li>
              </ul>
            </div>

            <div className="bg-slate-900/90 border border-blue-500/40 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono-num text-[11px] font-bold flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  PERFIL FUNCIONÁRIO
                </span>
                <span className="text-[11px] font-mono-num text-slate-400">
                  Vendedor / SDR
                </span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <li>• Vê e edita apenas seus próprios leads ou a Fila Sem Dono</li>
                <li>• Faturamento total da empresa e outros vendedores ocultos</li>
                <li>• Bloqueio de segurança em relatórios macro e configurações</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer Quick RBAC Credential Switcher */}
        <div className="relative z-10 mt-8 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            <span>Selecione uma credencial para testar cada nível de acesso (senha: 1234):</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                fillPresetCredential(
                  'yasyas',
                  '1234',
                  'Administrador (Gestora Yasmin Alba)'
                )
              }
              className="px-3 py-1.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono-num font-semibold transition cursor-pointer"
            >
              Admin: yasyas / 1234
            </button>
            <button
              type="button"
              onClick={() =>
                fillPresetCredential(
                  'lucas.mendes',
                  '1234',
                  'Funcionário Vendedor (Lucas Mendes)'
                )
              }
              className="px-3 py-1.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/40 text-blue-300 text-xs font-mono-num font-semibold transition cursor-pointer"
            >
              Vendedor: lucas.mendes / 1234
            </button>
            <button
              type="button"
              onClick={() =>
                fillPresetCredential(
                  'marina.sdr',
                  '1234',
                  'Funcionária SDR (Marina Costa)'
                )
              }
              className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono-num font-semibold transition cursor-pointer"
            >
              SDR: marina.sdr / 1234
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Login & Registration Form */}
      <div className="lg:w-[46%] flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-lg shadow-xs p-7 sm:p-8">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200 mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              Entrar na Conta
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
                setSuccessBanner(null);
              }}
              className={`py-2.5 px-3 rounded-md text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-2xs border border-slate-200/80'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Criar Cadastro
            </button>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {successBanner && (
            <div className="mb-5 p-3.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Acessar Funil de Vendas
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Entre como Administrador ou Vendedor/SDR para visualizar seu ambiente.
                </p>
              </div>

              {/* Quick RBAC Profile Selector */}
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[11px] font-semibold text-slate-700 block">
                  Preenchimento Rápido de Perfil (RBAC):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      fillPresetCredential(
                        'yasyas',
                        '1234',
                        'Administrador (yasyas)'
                      )
                    }
                    className={`px-2.5 py-2 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      username === 'yasyas'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Admin (yasyas)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      fillPresetCredential(
                        'lucas.mendes',
                        '1234',
                        'Funcionário Vendedor (lucas.mendes)'
                      )
                    }
                    className={`px-2.5 py-2 rounded-md border text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      username === 'lucas.mendes'
                        ? 'bg-blue-50 border-blue-300 text-blue-900'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Vendedor (Lucas)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Login ou E-mail
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: yasyas ou lucas.mendes"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Senha de Acesso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono-num"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer disabled:opacity-60"
              >
                <span>{loading ? 'Autenticando...' : 'Entrar no Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-500">
                  Deseja cadastrar um novo membro na equipe?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className="font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 cursor-pointer"
                  >
                    Criar novo cadastro
                  </button>
                </p>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Criar Novo Cadastro
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Defina o perfil de segurança (RBAC) e salve diretamente no Supabase.
                </p>
              </div>

              {/* RBAC Profile Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Perfil de Acesso (RBAC) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRegAccessRole('funcionario');
                      setRegRole('Vendedor / SDR');
                    }}
                    className={`p-2.5 rounded-md border text-left transition cursor-pointer ${
                      regAccessRole === 'funcionario'
                        ? 'bg-blue-50 border-blue-400 text-blue-950'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                      Funcionário
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Vendedor / SDR (Visão restrita)
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRegAccessRole('administrador');
                      setRegRole('Gestor / Diretor Comercial');
                    }}
                    className={`p-2.5 rounded-md border text-left transition cursor-pointer ${
                      regAccessRole === 'administrador'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                        : 'bg-white border-slate-300 text-slate-600'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      Administrador
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      Gestor / Diretor (Visão total)
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    placeholder="Ex: Gabriel Silveira"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Login de Usuário *
                  </label>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Ex: gabriel.sdr"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-mono-num"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Senha *
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Mín. 4 dígitos"
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900 font-mono-num"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  E-mail Corporativo *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="voce@empresa.com.br"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cargo / Função
                  </label>
                  <div className="relative">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regRole}
                      onChange={(e) => setRegRole(e.target.value)}
                      placeholder="Vendedor / SDR"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Empresa
                  </label>
                  <div className="relative">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="Nome da Empresa"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition shadow-2xs cursor-pointer disabled:opacity-60 mt-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {loading ? 'Criando Conta...' : 'Concluir Cadastro e Acessar'}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

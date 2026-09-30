import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Lock,
  Mail,
  KeyRound,
  User,
  UserPlus,
  Briefcase,
} from 'lucide-react';
import { UserProfile, UserRole } from '../types/cosmetics';
import { dataService } from '../services/dataService';

interface LoginViewProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const users = dataService.getUsers();
  const adminUser =
    users.find((u) => u.email === 'admin@cosmeticos.com') || users[0];
  const sellerUser =
    users.find((u) => u.email === 'vendedor@cosmeticos.com') || users[1];

  // Login State
  const [emailInput, setEmailInput] = useState('admin@cosmeticos.com');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Register ("Criar Cadastro") State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('funcionario');
  const [regJobTitle, setRegJobTitle] = useState(
    'Consultora de Beleza & Skincare'
  );

  const handleSelectProfile = (email: string) => {
    setErrorMsg(null);
    setEmailInput(email);
    const pwdField = document.getElementById('login-password');
    if (pwdField) pwdField.focus();
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = dataService.authenticateWithPassword(emailInput, passwordInput);
    if (!res.user) {
      setErrorMsg(
        res.error ||
          'Credenciais inválidas. Verifique o e-mail e a senha (padrão: 1234).'
      );
      return;
    }
    onLogin(res.user);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (regPassword.trim().length < 3) {
      setErrorMsg('A senha deve ter pelo menos 3 caracteres.');
      return;
    }

    if (regPassword.trim() !== regConfirmPassword.trim()) {
      setErrorMsg('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    const res = dataService.registerAccount({
      name: regName,
      email: regEmail,
      password: regPassword,
      role: regRole,
      jobTitle: regJobTitle,
    });

    if (!res.user) {
      setErrorMsg(res.error || 'Não foi possível criar o cadastro.');
      return;
    }

    onLogin(res.user);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2A1822] flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-6 lg:px-12 py-5 border-b border-[#E6D7D4] bg-white/80 backdrop-blur-xs flex items-center justify-between">
        <span className="font-serif-display text-2xl font-semibold tracking-tight text-[#4A1936]">
          Maison Velours Cosméticos
        </span>
        <span className="text-xs text-[#6E5662]">
          Portal Comercial & Base de Clientes
        </span>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-10 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Editorial Column */}
        <div className="lg:col-span-6 space-y-6">
          <p className="text-xs font-medium tracking-widest uppercase text-[#9E4763]">
            E-commerce de Beleza & Alta Perfumaria
          </p>
          <h1
            className="font-serif-display text-4xl sm:text-5xl font-semibold text-[#2A1822] leading-[1.12]"
            style={{ textWrap: 'balance' }}
          >
            Gestão de funil de vendas e relacionamento com clientes em um só lugar.
          </h1>
          <p className="text-base text-[#5C434E] leading-relaxed max-w-xl">
            Ambiente com controle de acesso por nível de usuário (RBAC). Dados financeiros
            e LTV são isolados na camada de serviço conforme a credencial autenticada.
          </p>

          <div className="pt-2 border-t border-[#E6D7D4] space-y-3 text-sm text-[#5C434E]">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-[#4A1936]">Visão ADM:</span>
              <span>
                Métricas financeiras em tempo real, Kanban completo, LTV de clientes
                e configurações de equipe e etapas.
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-[#9E4763]">Visão Funcionário:</span>
              <span>
                Foco no atendimento consultivo dos próprios leads (valores mascarados na
                origem) e base de contatos.
              </span>
            </div>
          </div>
        </div>

        {/* Right Authentication Card (Login & Criar Cadastro) */}
        <div className="lg:col-span-6">
          <div className="bg-white rounded-2xl border border-[#E6D7D4] p-6 sm:p-8 shadow-xs space-y-6">
            {/* Mode Switcher: Entrar vs Criar Cadastro */}
            <div
              role="tablist"
              aria-label="Alternar entre Login e Criar Cadastro"
              className="grid grid-cols-2 gap-1.5 p-1.5 rounded-xl bg-[#FAF7F5] border border-[#E6D7D4]"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'login'}
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                  mode === 'login'
                    ? 'bg-[#4A1936] text-white shadow-2xs'
                    : 'text-[#5C434E] hover:text-[#2A1822]'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Entrar (Login)
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mode === 'register'}
                onClick={() => {
                  setMode('register');
                  setErrorMsg(null);
                }}
                className={`py-2.5 px-4 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                  mode === 'register'
                    ? 'bg-[#4A1936] text-white shadow-2xs'
                    : 'text-[#5C434E] hover:text-[#2A1822]'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Criar Cadastro
              </button>
            </div>

            {mode === 'login' ? (
              <>
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#2A1822]">
                    Autenticação do Sistema
                  </h2>
                  <p className="text-xs text-[#6E5662] mt-1">
                    Selecione um perfil abaixo ou digite seu e-mail e senha (senha padrão: <strong>1234</strong>):
                  </p>
                </div>

                {/* Two Profile Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ADM Selector */}
                  <button
                    type="button"
                    onClick={() => handleSelectProfile('admin@cosmeticos.com')}
                    className={`text-left p-4 rounded-xl border transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                      emailInput === 'admin@cosmeticos.com'
                        ? 'border-[#4A1936] bg-[#F3EAE8]'
                        : 'border-[#D5BCC3] bg-[#FAF7F5] hover:bg-[#F3EAE8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[#4A1936] flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#4A1936]" />
                        Perfil ADM
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#6E5662] group-hover:text-[#4A1936] transition-transform" />
                    </div>
                    <div className="font-semibold text-sm text-[#2A1822]">
                      {adminUser?.name || 'Marina Lopes'}
                    </div>
                    <div className="font-mono-tabular text-xs text-[#6E5662] mt-0.5 truncate">
                      admin@cosmeticos.com
                    </div>
                    <p className="text-xs text-[#5C434E] mt-2.5 pt-2.5 border-t border-[#E6D7D4]">
                      Acesso total a faturamento, ticket médio, LTV e configurações.
                    </p>
                  </button>

                  {/* Employee Selector */}
                  <button
                    type="button"
                    onClick={() =>
                      handleSelectProfile('vendedor@cosmeticos.com')
                    }
                    className={`text-left p-4 rounded-xl border transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E4763] ${
                      emailInput === 'vendedor@cosmeticos.com'
                        ? 'border-[#9E4763] bg-[#F3EAE8]'
                        : 'border-[#D5BCC3] bg-[#FAF7F5] hover:bg-[#F3EAE8]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-[#9E4763] flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-[#9E4763]" />
                        Perfil Funcionário
                      </span>
                      <ArrowRight className="w-4 h-4 text-[#6E5662] group-hover:text-[#9E4763] transition-transform" />
                    </div>
                    <div className="font-semibold text-sm text-[#2A1822]">
                      {sellerUser?.name || 'Camila Souza'}
                    </div>
                    <div className="font-mono-tabular text-xs text-[#6E5662] mt-0.5 truncate">
                      vendedor@cosmeticos.com
                    </div>
                    <p className="text-xs text-[#5C434E] mt-2.5 pt-2.5 border-t border-[#E6D7D4]">
                      Atendimento de leads próprios (R$ ••••) e clientes sem dados financeiros.
                    </p>
                  </button>
                </div>

                {/* Login Form with Email & Password */}
                <form
                  onSubmit={handleLoginSubmit}
                  className="pt-5 border-t border-[#E6D7D4] space-y-4"
                >
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-xs font-semibold text-[#2A1822] mb-1.5"
                    >
                      E-mail ou Login
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-email"
                        type="text"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="admin@cosmeticos.com ou vendedor@cosmeticos.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-sm text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-[#2A1822] mb-1.5"
                    >
                      Senha de Login *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="login-password"
                        type="password"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Digite sua senha (padrão: 1234)"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-sm text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <p
                      role="alert"
                      className="text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2"
                    >
                      {errorMsg}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('register');
                        setErrorMsg(null);
                      }}
                      className="text-xs font-semibold text-[#9E4763] hover:text-[#4A1936] underline"
                    >
                      Não tem conta? Criar Cadastro
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A1936]"
                    >
                      Entrar no Sistema
                    </button>
                  </div>
                </form>
              </>
            ) : (
              /* CRIAR CADASTRO FORM */
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h2 className="font-serif-display text-2xl font-semibold text-[#2A1822]">
                    Criar Novo Cadastro
                  </h2>
                  <p className="text-xs text-[#6E5662] mt-1">
                    Cadastre sua conta para acessar o sistema e gravar automaticamente no Supabase:
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="reg-name"
                    className="block text-xs font-semibold text-[#2A1822] mb-1"
                  >
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="reg-name"
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex.: Yasmin Alba"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-semibold text-[#2A1822] mb-1"
                    >
                      E-mail ou Login *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-email"
                        type="text"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="yasmin@cosmeticos.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-job"
                      className="block text-xs font-semibold text-[#2A1822] mb-1"
                    >
                      Cargo / Área
                    </label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-job"
                        type="text"
                        value={regJobTitle}
                        onChange={(e) => setRegJobTitle(e.target.value)}
                        placeholder="Ex.: Consultora de Beleza"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                      />
                    </div>
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1.5">
                    Nível de Acesso (Perfil RBAC) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setRegRole('funcionario');
                        if (regJobTitle === 'Diretora de E-commerce') {
                          setRegJobTitle('Consultora de Beleza & Skincare');
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        regRole === 'funcionario'
                          ? 'border-[#9E4763] bg-[#F3EAE8]'
                          : 'border-[#D5BCC3] bg-[#FAF7F5]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#9E4763]">
                        <UserCheck className="w-4 h-4" />
                        Funcionário (Vendedor)
                      </div>
                      <p className="text-[11px] text-[#5C434E] mt-1">
                        Acesso aos próprios leads e clientes (sem dados financeiros).
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setRegRole('adm');
                        if (
                          regJobTitle === 'Consultora de Beleza & Skincare'
                        ) {
                          setRegJobTitle('Diretora de E-commerce');
                        }
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        regRole === 'adm'
                          ? 'border-[#4A1936] bg-[#F3EAE8]'
                          : 'border-[#D5BCC3] bg-[#FAF7F5]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-[#4A1936]">
                        <ShieldCheck className="w-4 h-4" />
                        ADM (Gestor / Diretor)
                      </div>
                      <p className="text-[11px] text-[#5C434E] mt-1">
                        Visão total de faturamento, LTV, todos os leads e configurações.
                      </p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-semibold text-[#2A1822] mb-1"
                    >
                      Criar Senha *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-password"
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Digite uma senha"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm-password"
                      className="block text-xs font-semibold text-[#2A1822] mb-1"
                    >
                      Confirmar Senha *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        id="reg-confirm-password"
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Repita a senha"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                      />
                    </div>
                  </div>
                </div>

                {errorMsg && (
                  <p
                    role="alert"
                    className="text-xs font-medium text-[#B91C1C] bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2"
                  >
                    {errorMsg}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                    }}
                    className="text-xs font-semibold text-[#5C434E] hover:text-[#2A1822]"
                  >
                    Já tenho cadastro (Voltar ao Login)
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A1936]"
                  >
                    <UserPlus className="w-4 h-4" />
                    Criar Cadastro e Entrar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="px-6 lg:px-12 py-4 border-t border-[#E6D7D4] text-xs text-[#6E5662] flex flex-wrap items-center justify-between gap-2">
        <span>Maison Velours Cosméticos — Sistema Comercial de E-commerce</span>
        <span>Moeda: BRL (R$) · Datas: dd/mm/aaaa</span>
      </footer>
    </div>
  );
};

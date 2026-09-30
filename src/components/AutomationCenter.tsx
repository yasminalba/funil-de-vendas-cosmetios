import React, { useState } from 'react';
import {
  Zap,
  Play,
  Plus,
  CheckCircle2,
  ArrowRight,
  Clock,
  Sparkles,
  MessageSquare,
  Mail,
  FileText,
  Webhook,
  Activity,
  Radio,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ActivityLog,
  AutomationRule,
  FUNNEL_STAGES,
  FunnelStageId,
} from '../types/crm';

interface AutomationCenterProps {
  automations: AutomationRule[];
  activities: ActivityLog[];
  autoPilotGlobal: boolean;
  onToggleGlobalAutoPilot: () => void;
  onToggleRule: (ruleId: string) => Promise<void>;
  onCreateRule: (rule: AutomationRule) => Promise<void>;
  onRunAutomationEngine: () => Promise<void>;
  onSimulateInboundLead: () => Promise<void>;
}

export const AutomationCenter: React.FC<AutomationCenterProps> = ({
  automations,
  activities,
  autoPilotGlobal,
  onToggleGlobalAutoPilot,
  onToggleRule,
  onCreateRule,
  onRunAutomationEngine,
  onSimulateInboundLead,
}) => {
  const [showNewRuleForm, setShowNewRuleForm] = useState(false);
  const [runningEngine, setRunningEngine] = useState(false);

  // New rule state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerStage, setTriggerStage] = useState<FunnelStageId>('prospeccao');
  const [targetStage, setTargetStage] = useState<FunnelStageId>('qualificado');
  const [minScore, setMinScore] = useState('75');
  const [minValue, setMinValue] = useState('10000');
  const [requireProposalViewed, setRequireProposalViewed] = useState(false);
  const [actionChannel, setActionChannel] = useState<
    'WhatsApp' | 'E-mail' | 'Webhook CRM' | 'Proposta PDF'
  >('WhatsApp');
  const [messageTemplate, setMessageTemplate] = useState(
    'Olá {{nome}}, notamos forte aderência da {{empresa}} e preparamos uma condição especial para avançarmos!'
  );

  const handleRunEngine = async () => {
    setRunningEngine(true);
    try {
      await onRunAutomationEngine();
    } finally {
      setTimeout(() => setRunningEngine(false), 350);
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newRule: AutomationRule = {
      id: `auto-${Date.now()}`,
      name: name.trim(),
      description:
        description.trim() ||
        'Regra automatizada de avanço de etapa baseada em Lead Score e valor.',
      trigger_stage: triggerStage,
      target_stage: targetStage,
      min_score: Math.min(99, Math.max(10, Number(minScore) || 70)),
      min_value: Math.max(0, Number(minValue) || 0),
      require_proposal_viewed: requireProposalViewed,
      action_channel: actionChannel,
      message_template: messageTemplate.trim(),
      is_active: true,
      executions_count: 0,
      last_triggered_at: null,
    };

    await onCreateRule(newRule);
    setShowNewRuleForm(false);
    setName('');
    setDescription('');
  };

  const getStageLabel = (id: FunnelStageId) =>
    FUNNEL_STAGES.find((s) => s.id === id)?.shortLabel || id;

  const getChannelIcon = (channel: AutomationRule['action_channel']) => {
    switch (channel) {
      case 'WhatsApp':
        return <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />;
      case 'E-mail':
        return <Mail className="w-3.5 h-3.5 text-blue-600" />;
      case 'Proposta PDF':
        return <FileText className="w-3.5 h-3.5 text-violet-600" />;
      default:
        return <Webhook className="w-3.5 h-3.5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Automation Command Bar */}
      <div className="bg-[#0F172A] text-white rounded-lg p-6 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-mono-num font-semibold mb-3">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>
              PILOTO AUTOMÁTICO DE CONVERSÃO:{' '}
              {autoPilotGlobal ? 'ATIVO EM TEMPO REAL' : 'MODO MANUAL'}
            </span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
            Motor de Qualificação & Fechamento Automatizado
          </h2>
          <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
            O motor analisa o Lead Score (0–100), o valor da oportunidade, a leitura de
            proposta e avança os leads elegíveis de etapa automaticamente, gravando cada
            conversão no Supabase.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleGlobalAutoPilot}
            className={`px-3.5 py-2.5 rounded-md border text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
              autoPilotGlobal
                ? 'bg-slate-800 border-emerald-500/50 text-emerald-300 hover:bg-slate-700'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              Auto-Pilot: {autoPilotGlobal ? 'Ligado' : 'Pausado'}
            </span>
          </button>

          <button
            type="button"
            onClick={onSimulateInboundLead}
            className="px-3.5 py-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Simular Captura de Lead</span>
          </button>

          <button
            type="button"
            onClick={handleRunEngine}
            disabled={runningEngine}
            className="px-4 py-2.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-sm cursor-pointer disabled:opacity-60"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>
              {runningEngine
                ? 'Processando Funil...'
                : 'Executar Automações Agora'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Active Rules (Left 7 cols) + Real-time Execution Feed (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Automation Rules List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900">
                Regras de Conversão do Funil ({automations.length})
              </h3>
              <p className="text-xs text-slate-500">
                Gatilhos condicionais que movem oportunidades automaticamente entre colunas
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewRuleForm(!showNewRuleForm)}
              className="px-3 py-2 rounded-md bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Regra</span>
            </button>
          </div>

          {showNewRuleForm && (
            <form
              onSubmit={handleAddRule}
              className="bg-white border border-slate-300 rounded-lg p-5 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="font-display text-sm font-bold text-slate-900">
                  Configurar Nova Regra Automatizada
                </h4>
                <button
                  type="button"
                  onClick={() => setShowNewRuleForm(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  Fechar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome da Automação *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Fechamento Express Enterprise"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Canal de Disparo
                  </label>
                  <select
                    value={actionChannel}
                    onChange={(e) =>
                      setActionChannel(
                        e.target.value as AutomationRule['action_channel']
                      )
                    }
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:border-slate-900"
                  >
                    <option value="WhatsApp">WhatsApp Comercial</option>
                    <option value="Proposta PDF">Gerador de Proposta PDF</option>
                    <option value="E-mail">Sequência de E-mail</option>
                    <option value="Webhook CRM">Webhook Contrato / ERP</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Quando na Etapa
                  </label>
                  <select
                    value={triggerStage}
                    onChange={(e) =>
                      setTriggerStage(e.target.value as FunnelStageId)
                    }
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-md"
                  >
                    {FUNNEL_STAGES.filter((s) => s.id !== 'fechado').map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mover Para
                  </label>
                  <select
                    value={targetStage}
                    onChange={(e) =>
                      setTargetStage(e.target.value as FunnelStageId)
                    }
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-md font-semibold text-emerald-700"
                  >
                    {FUNNEL_STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.shortLabel}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Score Mínimo (0-100)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="99"
                    value={minScore}
                    onChange={(e) => setMinScore(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono-num"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valor Mín. (R$)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={minValue}
                    onChange={(e) => setMinValue(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs bg-white border border-slate-300 rounded-md font-mono-num"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensagem / Template Automático (variáveis: {'{{nome}}'}, {'{{empresa}}'}, {'{{valor}}'})
                </label>
                <textarea
                  rows={2}
                  value={messageTemplate}
                  onChange={(e) => setMessageTemplate(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-md"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireProposalViewed}
                    onChange={(e) => setRequireProposalViewed(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>Exigir que a proposta comercial tenha sido visualizada</span>
                </label>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
                >
                  Salvar Regra no Supabase
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {automations.map((rule) => (
              <div
                key={rule.id}
                className={`bg-white rounded-lg border p-5 transition ${
                  rule.is_active
                    ? 'border-slate-200 shadow-2xs'
                    : 'border-slate-200/70 opacity-65 bg-slate-50'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono-num font-semibold border ${
                          rule.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {rule.is_active ? 'REGRA ATIVA' : 'PAUSADA'}
                      </span>
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                        {getStageLabel(rule.trigger_stage)}
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-emerald-700">
                          {getStageLabel(rule.target_stage)}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                        {getChannelIcon(rule.action_channel)}
                        <span>{rule.action_channel}</span>
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-slate-900 text-sm pt-1">
                      {rule.name}
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {rule.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleRule(rule.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition shrink-0 cursor-pointer ${
                      rule.is_active
                        ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                    }`}
                  >
                    {rule.is_active ? 'Pausar' : 'Ativar'}
                  </button>
                </div>

                {/* Rule Criteria & Telemetry */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-2 text-slate-600 font-mono-num">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      Score &ge; {rule.min_score}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                      Ticket &ge; R$ {rule.min_value.toLocaleString('pt-BR')}
                    </span>
                    {rule.require_proposal_viewed && (
                      <span className="px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                        Requer Proposta Lida
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-slate-500 font-mono-num">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      {rule.executions_count} conversões
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Live Automation & Conversion Log */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-base font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>Log de Conversões & Disparos</span>
              </h3>
              <p className="text-xs text-slate-500">
                Auditoria em tempo real gravada em <code className="font-mono-num">crm_activities</code>
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[620px] overflow-y-auto">
            {activities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Nenhuma atividade registrada ainda.
              </div>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="p-4 hover:bg-slate-50/70 transition">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono-num text-[10px] font-bold uppercase ${
                        act.type === 'venda_fechada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : act.type === 'automacao'
                          ? 'bg-blue-50 text-blue-700'
                          : act.type === 'supabase_sync'
                          ? 'bg-violet-50 text-violet-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {act.type.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] font-mono-num text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(act.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">{act.title}</p>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {act.description}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1">
                    Oportunidade: <span className="text-slate-700">{act.lead_name}</span>
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

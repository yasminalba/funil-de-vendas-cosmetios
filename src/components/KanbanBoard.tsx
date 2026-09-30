import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ArrowRight,
  ArrowLeft,
  Lock,
  ShoppingBag,
  Phone,
  X,
} from 'lucide-react';
import {
  AdminFinancialMetrics,
  ContactOrigin,
  FunnelStageConfig,
  FunnelStageId,
  KanbanLeadView,
  LeadPriority,
  SkinHairProfile,
  UserProfile,
} from '../types/cosmetics';
import { formatCurrencyBR, formatDateBR } from '../services/dataService';

interface KanbanBoardProps {
  currentUser: UserProfile;
  stages: FunnelStageConfig[];
  leads: KanbanLeadView[];
  sellers: UserProfile[];
  adminMetrics: AdminFinancialMetrics | null;
  onMoveLead: (leadId: string, targetStageId: FunnelStageId) => void;
  onCreateLead: (payload: {
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
  }) => void;
  onUpdateLead: (
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
  ) => void;
}

const PRIORITY_STYLES: Record<
  LeadPriority,
  { borderLeft: string; textClass: string; label: string }
> = {
  Alta: {
    borderLeft: 'border-l-4 border-l-[#9E2A4A]',
    textClass: 'text-[#9E2A4A] font-semibold',
    label: 'Prioridade Alta',
  },
  Média: {
    borderLeft: 'border-l-4 border-l-[#B45309]',
    textClass: 'text-[#B45309] font-semibold',
    label: 'Prioridade Média',
  },
  Baixa: {
    borderLeft: 'border-l-4 border-l-[#5C6B73]',
    textClass: 'text-[#5C6B73] font-medium',
    label: 'Prioridade Baixa',
  },
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  currentUser,
  stages,
  leads,
  sellers,
  adminMetrics,
  onMoveLead,
  onCreateLead,
  onUpdateLead,
}) => {
  const isAdm = currentUser.role === 'adm';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<LeadPriority | 'Todas'>(
    'Todas'
  );
  const [sellerFilter, setSellerFilter] = useState<string>('Todos');

  // Drag state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<FunnelStageId | null>(
    null
  );

  // Modal state for creating or editing a lead
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<KanbanLeadView | null>(null);

  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [city, setCity] = useState('São Paulo - SP');
  const [productOfInterest, setProductOfInterest] = useState('');
  const [cartValue, setCartValue] = useState<number>(389.9);
  const [priority, setPriority] = useState<LeadPriority>('Alta');
  const [stageId, setStageId] = useState<FunnelStageId>('stage_1');
  const [assignedToId, setAssignedToId] = useState<string>(currentUser.id);
  const [origin, setOrigin] = useState<ContactOrigin>('Instagram');
  const [skinHairType, setSkinHairType] = useState<SkinHairProfile>(
    'Pele Seca / Sensível'
  );
  const [notes, setNotes] = useState('');

  const openNewLeadModal = () => {
    setEditingLead(null);
    setCustomerName('');
    setWhatsapp('');
    setCity('São Paulo - SP');
    setProductOfInterest('Sérum Facial Rosa Mosqueta + Vitamina C 30ml');
    setCartValue(389.9);
    setPriority('Alta');
    setStageId('stage_1');
    setAssignedToId(
      isAdm
        ? sellers.find((s) => s.role === 'funcionario')?.id || currentUser.id
        : currentUser.id
    );
    setOrigin('Instagram');
    setSkinHairType('Pele Seca / Sensível');
    setNotes('');
    setModalOpen(true);
  };

  const openEditLeadModal = (lead: KanbanLeadView) => {
    setEditingLead(lead);
    setCustomerName(lead.customerName);
    setWhatsapp(lead.whatsapp);
    setCity(lead.city);
    setProductOfInterest(lead.productOfInterest);
    setCartValue(typeof lead.cartValue === 'number' ? lead.cartValue : 0);
    setPriority(lead.priority);
    setStageId(lead.stageId);
    setAssignedToId(lead.assignedToId);
    setOrigin(lead.origin);
    setSkinHairType(lead.skinHairType);
    setNotes(lead.notes);
    setModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !productOfInterest.trim()) return;

    const assignedSeller =
      sellers.find((s) => s.id === assignedToId) || currentUser;

    if (editingLead) {
      onUpdateLead(editingLead.id, {
        customerName,
        whatsapp,
        city,
        productOfInterest,
        cartValue: isAdm ? Number(cartValue) : undefined,
        priority,
        stageId,
        assignedToId: assignedSeller.id,
        assignedToName: assignedSeller.name,
        origin,
        skinHairType,
        notes,
      });
    } else {
      onCreateLead({
        customerName,
        whatsapp,
        city,
        productOfInterest,
        cartValue: isAdm ? Number(cartValue) : undefined,
        priority,
        stageId,
        assignedToId: assignedSeller.id,
        origin,
        skinHairType,
        notes,
      });
    }
    setModalOpen(false);
  };

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.customerName.toLowerCase().includes(q) ||
        l.productOfInterest.toLowerCase().includes(q) ||
        l.whatsapp.toLowerCase().includes(q);
      const matchesPriority =
        priorityFilter === 'Todas' || l.priority === priorityFilter;
      const matchesSeller =
        !isAdm || sellerFilter === 'Todos' || l.assignedToId === sellerFilter;
      return matchesSearch && matchesPriority && matchesSeller;
    });
  }, [leads, searchQuery, priorityFilter, sellerFilter, isAdm]);

  return (
    <div className="space-y-6">
      {/* SECTION 1: ADM EXCLUSIVE FINANCIAL METRICS */}
      {isAdm && adminMetrics && (
        <section
          aria-label="Métricas Financeiras do Funil"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        >
          <div className="bg-white rounded-2xl p-5 border border-[#E6D7D4]">
            <p className="text-xs font-medium text-[#6E5662]">
              Faturamento Total (Vendas Concluídas)
            </p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#4A1936] mt-1.5">
              {formatCurrencyBR(adminMetrics.totalRevenue)}
            </p>
            <p className="text-xs text-[#6E5662] mt-1">
              Soma de {adminMetrics.completedSalesCount} pedido(s) na etapa 4
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E6D7D4]">
            <p className="text-xs font-medium text-[#6E5662]">Ticket Médio</p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#2A1822] mt-1.5">
              {formatCurrencyBR(adminMetrics.averageTicket)}
            </p>
            <p className="text-xs text-[#6E5662] mt-1">
              Valor médio por venda concluída
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E6D7D4]">
            <p className="text-xs font-medium text-[#6E5662]">
              Taxa de Conversão do Funil
            </p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#9E4763] mt-1.5">
              {adminMetrics.conversionRate.toFixed(1).replace('.', ',')}%
            </p>
            <p className="text-xs text-[#6E5662] mt-1">
              {adminMetrics.completedSalesCount} concluída(s) ÷{' '}
              {adminMetrics.totalLeads} leads totais
            </p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-[#E6D7D4]">
            <p className="text-xs font-medium text-[#6E5662]">Total de Leads</p>
            <p className="font-mono-tabular text-2xl font-semibold text-[#2A1822] mt-1.5">
              {adminMetrics.totalLeads}
            </p>
            <p className="text-xs text-[#6E5662] mt-1">
              Oportunidades monitoradas no e-commerce
            </p>
          </div>
        </section>
      )}

      {/* SECTION 2: KANBAN TOOLBAR & FILTERS */}
      <section className="bg-white rounded-2xl p-4 border border-[#E6D7D4] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-xs min-w-[210px]">
            <Search className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar cliente ou cosmético..."
              aria-label="Buscar cliente ou cosmético no Kanban"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
            />
          </div>

          {/* Priority segmented filter */}
          <div
            role="group"
            aria-label="Filtrar por prioridade"
            className="flex items-center gap-1 p-1 rounded-xl bg-[#FAF7F5] border border-[#E6D7D4]"
          >
            {(['Todas', 'Alta', 'Média', 'Baixa'] as const).map((prio) => (
              <button
                key={prio}
                type="button"
                onClick={() => setPriorityFilter(prio)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                  priorityFilter === prio
                    ? 'bg-[#4A1936] text-white'
                    : 'text-[#5C434E] hover:text-[#2A1822]'
                }`}
              >
                {prio}
              </button>
            ))}
          </div>

          {/* Seller filter for ADM */}
          {isAdm && (
            <select
              aria-label="Filtrar por consultora responsável"
              value={sellerFilter}
              onChange={(e) => setSellerFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-medium text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
            >
              <option value="Todos">Consultora: Todas</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isAdm && (
            <span className="text-xs text-[#6E5662]">
              Exibindo apenas seus leads ({currentUser.name}) · Valores ocultos
            </span>
          )}
          <button
            type="button"
            onClick={openNewLeadModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A1936]"
          >
            <Plus className="w-4 h-4" />
            Novo Lead no Funil
          </button>
        </div>
      </section>

      {/* SECTION 3: 4-COLUMN KANBAN PIPELINE */}
      <section
        aria-label="Quadro Kanban do Funil de Vendas"
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start"
      >
        {stages.map((stage, stageIndex) => {
          const columnLeads = filteredLeads.filter(
            (l) => l.stageId === stage.id
          );
          const columnSum = isAdm
            ? columnLeads.reduce((acc, l) => acc + Number(l.cartValue || 0), 0)
            : null;
          const isFinalStageLockedForEmployee =
            !isAdm && stage.id === 'stage_4';

          return (
            <div
              key={stage.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStageId(stage.id);
              }}
              onDragLeave={() => setDragOverStageId(null)}
              onDrop={() => {
                setDragOverStageId(null);
                if (!draggedLeadId) return;
                onMoveLead(draggedLeadId, stage.id);
                setDraggedLeadId(null);
              }}
              className={`rounded-2xl p-4 border transition-colors min-h-[480px] flex flex-col ${
                dragOverStageId === stage.id
                  ? 'bg-[#F3EAE8] border-[#9E4763]'
                  : 'bg-[#F3EAE8]/65 border-[#E6D7D4]'
              }`}
            >
              {/* Column Header */}
              <div className="pb-3 mb-3 border-b border-[#E6D7D4]">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-serif-display text-lg font-semibold text-[#2A1822] flex items-center gap-1.5 truncate">
                    <span>{stage.name}</span>
                    {isFinalStageLockedForEmployee && (
                      <Lock
                        className="w-3.5 h-3.5 text-[#9E4763] shrink-0"
                        title="Somente o ADM pode mover para Venda Concluída"
                      />
                    )}
                  </h3>
                  <span className="font-mono-tabular text-xs font-semibold text-[#4A1936] shrink-0">
                    {columnLeads.length}{' '}
                    {columnLeads.length === 1 ? 'lead' : 'leads'}
                  </span>
                </div>

                {/* Column Financial Sum: strictly rendered ONLY for ADM */}
                {isAdm && columnSum !== null ? (
                  <div className="mt-1 flex items-center justify-between text-xs text-[#5C434E]">
                    <span>Volume da etapa</span>
                    <span className="font-mono-tabular font-semibold text-[#4A1936]">
                      {formatCurrencyBR(columnSum)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center justify-between text-xs text-[#6E5662]">
                    <span>
                      {isFinalStageLockedForEmployee
                        ? 'Exclusivo validação ADM'
                        : 'Etapa de atendimento'}
                    </span>
                    <span className="font-mono-tabular">Atendimento</span>
                  </div>
                )}
              </div>

              {/* Cards Stack */}
              <div className="space-y-3 flex-1">
                {columnLeads.length === 0 ? (
                  <div className="h-44 rounded-xl border border-dashed border-[#D5BCC3] flex flex-col items-center justify-center text-center p-4 text-[#6E5662]">
                    <p className="text-xs font-medium">
                      Nenhum lead nesta etapa
                    </p>
                    <p className="text-[11px] mt-1">
                      {isFinalStageLockedForEmployee
                        ? 'Vendas concluídas são confirmadas pela gestão.'
                        : 'Arraste um cartão ou use os botões de avanço.'}
                    </p>
                  </div>
                ) : (
                  columnLeads.map((lead) => {
                    const prioStyle = PRIORITY_STYLES[lead.priority];
                    const prevStage =
                      stageIndex > 0 ? stages[stageIndex - 1] : null;
                    const nextStage =
                      stageIndex < stages.length - 1
                        ? stages[stageIndex + 1]
                        : null;
                    const canEmployeeMoveNext =
                      nextStage &&
                      (isAdm ||
                        (nextStage.id !== 'stage_4' &&
                          lead.stageId !== 'stage_4'));
                    const canEmployeeMovePrev =
                      prevStage && (isAdm || lead.stageId !== 'stage_4');

                    return (
                      <article
                        key={lead.id}
                        draggable={isAdm || lead.stageId !== 'stage_4'}
                        onDragStart={() => setDraggedLeadId(lead.id)}
                        onClick={() => openEditLeadModal(lead)}
                        className={`bg-white rounded-xl p-4 border border-[#E6D7D4] hover:border-[#B85D79] transition-all cursor-pointer ${prioStyle.borderLeft}`}
                      >
                        {/* Kicker line: Priority + Origin (unboxed clean metadata) */}
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className={prioStyle.textClass}>
                            {prioStyle.label}
                          </span>
                          <span className="text-[#6E5662]">{lead.origin}</span>
                        </div>

                        {/* Customer Name */}
                        <h4 className="text-sm font-semibold text-[#2A1822] mt-1.5">
                          {lead.customerName}
                        </h4>

                        {/* Product of Interest */}
                        <div className="mt-2 flex items-start gap-1.5 text-xs text-[#5C434E]">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#9E4763] shrink-0 mt-0.5" />
                          <span className="line-clamp-2 leading-relaxed">
                            {lead.productOfInterest}
                          </span>
                        </div>

                        {/* Cart Value (Real for ADM, Masked R$ •••• for Funcionário) */}
                        <div className="mt-3 pt-2.5 border-t border-[#F3EAE8] flex items-center justify-between">
                          <div>
                            <span className="text-[11px] text-[#6E5662] block">
                              Valor do carrinho
                            </span>
                            <span className="font-mono-tabular text-sm font-semibold text-[#4A1936]">
                              {isAdm && typeof lead.cartValue === 'number'
                                ? formatCurrencyBR(lead.cartValue)
                                : lead.maskedValue}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] text-[#6E5662] block">
                              Consultora
                            </span>
                            <span className="text-xs font-medium text-[#2A1822]">
                              {lead.assignedToName.split(' ')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Contact & Stage Controls */}
                        <div className="mt-3 pt-2 border-t border-[#F3EAE8] flex items-center justify-between gap-2">
                          <span className="text-[11px] text-[#6E5662] font-mono-tabular flex items-center gap-1 truncate">
                            <Phone className="w-3 h-3 text-[#9E4763] shrink-0" />
                            {lead.whatsapp} · {formatDateBR(lead.updatedAt)}
                          </span>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {prevStage && (
                              <button
                                type="button"
                                disabled={!canEmployeeMovePrev}
                                onClick={() =>
                                  onMoveLead(lead.id, prevStage.id)
                                }
                                title={`Voltar para ${prevStage.name}`}
                                aria-label={`Voltar ${lead.customerName} para ${prevStage.name}`}
                                className="p-1.5 rounded-lg border border-[#E6D7D4] text-[#5C434E] hover:text-[#2A1822] hover:bg-[#FAF7F5] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {nextStage && (
                              <button
                                type="button"
                                onClick={() =>
                                  onMoveLead(lead.id, nextStage.id)
                                }
                                title={
                                  !isAdm && nextStage.id === 'stage_4'
                                    ? 'Somente ADM pode concluir a venda'
                                    : `Avançar para ${nextStage.name}`
                                }
                                aria-label={`Avançar ${lead.customerName} para ${nextStage.name}`}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                                  !canEmployeeMoveNext
                                    ? 'bg-[#FAF7F5] text-[#6E5662] border border-[#E6D7D4]'
                                    : 'bg-[#4A1936] text-white hover:bg-[#381229]'
                                }`}
                              >
                                {!isAdm && nextStage.id === 'stage_4' ? (
                                  <>
                                    <Lock className="w-3 h-3" />
                                    ADM
                                  </>
                                ) : (
                                  <>
                                    Avançar
                                    <ArrowRight className="w-3 h-3" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* MODAL: CREATE OR EDIT LEAD */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-modal-title"
          className="fixed inset-0 z-50 bg-[#2A1822]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[#E6D7D4] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6D7D4]">
              <div>
                <h2
                  id="lead-modal-title"
                  className="font-serif-display text-2xl font-semibold text-[#2A1822]"
                >
                  {editingLead
                    ? 'Detalhes do Lead no Funil'
                    : 'Novo Lead de Cosméticos'}
                </h2>
                <p className="text-xs text-[#6E5662]">
                  {isAdm
                    ? 'Edite dados de atendimento, etapa e valor do carrinho.'
                    : 'Atualize o atendimento consultivo da cliente.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="p-2 rounded-lg text-[#6E5662] hover:text-[#2A1822] hover:bg-[#FAF7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Nome da Cliente *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ex.: Mariana Alencar"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="(11) 99999-0000"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                  Produto de Interesse (Carrinho) *
                </label>
                <input
                  type="text"
                  required
                  value={productOfInterest}
                  onChange={(e) => setProductOfInterest(e.target.value)}
                  placeholder="Ex.: Kit Sérum Rosa Mosqueta + Hidratante Ameixa"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {isAdm ? (
                  <div>
                    <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                      Valor do Carrinho (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={cartValue}
                      onChange={(e) => setCartValue(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-mono-tabular text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5662] mb-1">
                      Valor do Carrinho
                    </label>
                    <div className="px-3.5 py-2 rounded-xl bg-[#F3EAE8] border border-[#E6D7D4] text-xs font-mono-tabular text-[#6E5662]">
                      R$ •••• (Restrito ADM)
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as LeadPriority)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Etapa do Funil
                  </label>
                  <select
                    value={stageId}
                    onChange={(e) =>
                      setStageId(e.target.value as FunnelStageId)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
                  >
                    {stages.map((st) => (
                      <option
                        key={st.id}
                        value={st.id}
                        disabled={!isAdm && st.id === 'stage_4'}
                      >
                        {st.name} {!isAdm && st.id === 'stage_4' ? '(Só ADM)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Cidade
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Origem
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value as ContactOrigin)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Indicação">Indicação</option>
                    <option value="Site">Site</option>
                    <option value="Anúncio">Anúncio</option>
                    <option value="Evento">Evento</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Consultora Responsável
                  </label>
                  <select
                    value={assignedToId}
                    disabled={!isAdm}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] disabled:opacity-60"
                  >
                    {sellers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                  Observações de Atendimento
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Dúvidas sobre ativos cosméticos, fragrância ou forma de pagamento..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6D7D4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5BCC3] text-xs font-medium text-[#5C434E] hover:text-[#2A1822]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors"
                >
                  {editingLead ? 'Salvar Alterações' : 'Adicionar ao Funil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

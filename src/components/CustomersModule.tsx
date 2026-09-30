import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  RotateCcw,
  X,
  Phone,
  MapPin,
  User,
} from 'lucide-react';
import {
  ContactOrigin,
  CustomerStatus,
  CustomerView,
  SkinHairProfile,
  UserProfile,
} from '../types/cosmetics';
import {
  calculateDaysSince,
  formatCurrencyBR,
  formatDateBR,
  getTodayISO,
} from '../services/dataService';

interface CustomersModuleProps {
  currentUser: UserProfile;
  customers: CustomerView[];
  sellers: UserProfile[];
  onSaveCustomer: (payload: {
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
  }) => void;
}

const SKIN_HAIR_OPTIONS: SkinHairProfile[] = [
  'Pele Mista / Oleosa',
  'Pele Seca / Sensível',
  'Pele Madura / Linhas Finas',
  'Cabelos Cacheados / Nutrição',
  'Cabelos Loiros / Pós-Química',
  'Cabelos Lisos / Brilho',
];

export const CustomersModule: React.FC<CustomersModuleProps> = ({
  currentUser,
  customers,
  sellers,
  onSaveCustomer,
}) => {
  const isAdm = currentUser.role === 'adm';

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | 'Todos'>(
    'Todos'
  );
  const [originFilter, setOriginFilter] = useState<ContactOrigin | 'Todas'>(
    'Todas'
  );
  const [cityFilter, setCityFilter] = useState<string>('Todas');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('Todos');
  const [skinHairFilter, setSkinHairFilter] = useState<
    SkinHairProfile | 'Todos'
  >('Todos');
  const [purchasePeriodFilter, setPurchasePeriodFilter] = useState<
    'todos' | '30d' | '90d' | 'sem_compras'
  >('todos');
  const [inactiveDaysFilter, setInactiveDaysFilter] = useState<
    'todos' | '30' | '60' | '90'
  >('todos');

  // Modal state for creating / editing customer
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerView | null>(
    null
  );

  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('São Paulo - SP');
  const [origin, setOrigin] = useState<ContactOrigin>('Instagram');
  const [status, setStatus] = useState<CustomerStatus>('Cliente ativo');
  const [responsibleId, setResponsibleId] = useState(currentUser.id);
  const [skinHairType, setSkinHairType] = useState<SkinHairProfile>(
    'Pele Seca / Sensível'
  );
  const [favoriteProducts, setFavoriteProducts] = useState('');
  const [lastInteraction, setLastInteraction] = useState(getTodayISO());
  const [lastPurchase, setLastPurchase] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [ltv, setLtv] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);

  // Dynamic list of cities
  const availableCities = useMemo(() => {
    const set = new Set<string>();
    customers.forEach((c) => {
      if (c.city) set.add(c.city);
    });
    return Array.from(set).sort();
  }, [customers]);

  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('Todos');
    setOriginFilter('Todas');
    setCityFilter('Todas');
    setResponsibleFilter('Todos');
    setSkinHairFilter('Todos');
    setPurchasePeriodFilter('todos');
    setInactiveDaysFilter('todos');
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.whatsapp.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        (c.favoriteProducts || '').toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'Todos' || c.status === statusFilter;
      const matchesOrigin =
        originFilter === 'Todas' || c.origin === originFilter;
      const matchesCity = cityFilter === 'Todas' || c.city === cityFilter;
      const matchesResponsible =
        responsibleFilter === 'Todos' || c.responsibleId === responsibleFilter;
      const matchesSkinHair =
        skinHairFilter === 'Todos' || c.skinHairType === skinHairFilter;

      // Purchase period filter
      let matchesPurchasePeriod = true;
      if (purchasePeriodFilter === 'sem_compras') {
        matchesPurchasePeriod = !c.lastPurchase;
      } else if (purchasePeriodFilter === '30d') {
        matchesPurchasePeriod =
          Boolean(c.lastPurchase) && calculateDaysSince(c.lastPurchase) <= 30;
      } else if (purchasePeriodFilter === '90d') {
        matchesPurchasePeriod =
          Boolean(c.lastPurchase) && calculateDaysSince(c.lastPurchase) <= 90;
      }

      // "Inativos há +X dias" filter (checks days since last interaction or last purchase)
      let matchesInactiveDays = true;
      if (inactiveDaysFilter !== 'todos') {
        const threshold = Number(inactiveDaysFilter);
        const daysSinceInteraction = calculateDaysSince(c.lastInteraction);
        const daysSinceBuy = c.lastPurchase
          ? calculateDaysSince(c.lastPurchase)
          : 999;
        matchesInactiveDays =
          daysSinceInteraction >= threshold || daysSinceBuy >= threshold;
      }

      return (
        matchesQuery &&
        matchesStatus &&
        matchesOrigin &&
        matchesCity &&
        matchesResponsible &&
        matchesSkinHair &&
        matchesPurchasePeriod &&
        matchesInactiveDays
      );
    });
  }, [
    customers,
    searchQuery,
    statusFilter,
    originFilter,
    cityFilter,
    responsibleFilter,
    skinHairFilter,
    purchasePeriodFilter,
    inactiveDaysFilter,
  ]);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setWhatsapp('');
    setEmail('');
    setCity('São Paulo - SP');
    setOrigin('Instagram');
    setStatus('Lead');
    setResponsibleId(currentUser.id);
    setSkinHairType('Pele Seca / Sensível');
    setFavoriteProducts('');
    setLastInteraction(getTodayISO());
    setLastPurchase('');
    setNotes('');
    setLtv(0);
    setTotalOrders(0);
    setModalOpen(true);
  };

  const openEditModal = (c: CustomerView) => {
    setEditingCustomer(c);
    setName(c.name);
    setWhatsapp(c.whatsapp);
    setEmail(c.email || '');
    setCity(c.city);
    setOrigin(c.origin);
    setStatus(c.status);
    setResponsibleId(c.responsibleId);
    setSkinHairType(c.skinHairType);
    setFavoriteProducts(c.favoriteProducts || '');
    setLastInteraction(c.lastInteraction || getTodayISO());
    setLastPurchase(c.lastPurchase || '');
    setNotes(c.notes || '');
    setLtv(isAdm && typeof c.ltv === 'number' ? c.ltv : 0);
    setTotalOrders(
      isAdm && typeof c.totalOrders === 'number' ? c.totalOrders : 0
    );
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) return;

    onSaveCustomer({
      id: editingCustomer?.id,
      name,
      whatsapp,
      email,
      city,
      origin,
      status,
      responsibleId,
      skinHairType,
      favoriteProducts,
      lastInteraction,
      lastPurchase: lastPurchase.trim() ? lastPurchase.trim() : null,
      notes,
      ltv: isAdm ? Number(ltv) : undefined,
      totalOrders: isAdm ? Number(totalOrders) : undefined,
    });
    setModalOpen(false);
  };

  const getStatusTextStyle = (st: CustomerStatus) => {
    switch (st) {
      case 'Cliente ativo':
        return 'text-[#15803D] font-semibold';
      case 'Lead':
        return 'text-[#9E4763] font-semibold';
      case 'Inativo':
      default:
        return 'text-[#B45309] font-medium';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Action */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-serif-display text-2xl font-semibold text-[#2A1822]">
            Base de Clientes e Leads de Cosméticos
          </h2>
          <p className="text-xs text-[#6E5662]">
            {isAdm
              ? 'Visão completa com histórico de relacionamento, perfil de pele/cabelo, LTV, pedidos e ticket médio.'
              : 'Visão de relacionamento e perfil dermatológico/capilar (dados financeiros restritos à gestão).'}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A1936]"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Cliente / Lead
        </button>
      </div>

      {/* Comprehensive Filter Bar */}
      <section
        aria-label="Filtros da Base de Clientes"
        className="bg-white rounded-2xl p-5 border border-[#E6D7D4] space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#6E5662] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar nome, WhatsApp ou produto..."
              aria-label="Buscar na base de clientes"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
            />
          </div>

          {/* Status */}
          <select
            aria-label="Filtrar por status do contato"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
          >
            <option value="Todos">Status: Todos</option>
            <option value="Lead">Status: Lead</option>
            <option value="Cliente ativo">Status: Cliente ativo</option>
            <option value="Inativo">Status: Inativo</option>
          </select>

          {/* Origin */}
          <select
            aria-label="Filtrar por origem"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
          >
            <option value="Todas">Origem: Todas</option>
            <option value="Instagram">Origem: Instagram</option>
            <option value="Indicação">Origem: Indicação</option>
            <option value="Site">Origem: Site</option>
            <option value="Anúncio">Origem: Anúncio</option>
            <option value="Evento">Origem: Evento</option>
          </select>

          {/* City */}
          <select
            aria-label="Filtrar por cidade"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
          >
            <option value="Todas">Cidade: Todas</option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Responsible */}
          <select
            aria-label="Filtrar por consultora responsável"
            value={responsibleFilter}
            onChange={(e) => setResponsibleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
          >
            <option value="Todos">Responsável: Todas</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Skin / Hair Type */}
          <select
            aria-label="Filtrar por tipo de pele ou cabelo"
            value={skinHairFilter}
            onChange={(e) => setSkinHairFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
          >
            <option value="Todos">Tipo de Pele/Cabelo: Todos</option>
            {SKIN_HAIR_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>

          {/* Last Purchase Period */}
          <select
            aria-label="Filtrar por período da última compra"
            value={purchasePeriodFilter}
            onChange={(e) => setPurchasePeriodFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
          >
            <option value="todos">Última Compra: Qualquer período</option>
            <option value="30d">Compraram nos últimos 30 dias</option>
            <option value="90d">Compraram nos últimos 90 dias</option>
            <option value="sem_compras">Ainda sem compras (Leads)</option>
          </select>

          {/* Inactive Days Filter */}
          <div className="flex items-center gap-2">
            <select
              aria-label="Filtrar por tempo de inatividade"
              value={inactiveDaysFilter}
              onChange={(e) => setInactiveDaysFilter(e.target.value as any)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
            >
              <option value="todos">Inatividade: Todos</option>
              <option value="30">Inativos há +30 dias</option>
              <option value="60">Inativos há +60 dias</option>
              <option value="90">Inativos há +90 dias</option>
            </select>

            <button
              type="button"
              onClick={resetFilters}
              title="Limpar todos os filtros"
              aria-label="Limpar todos os filtros"
              className="p-2 rounded-xl border border-[#D5BCC3] text-[#6E5662] hover:text-[#2A1822] hover:bg-[#FAF7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Customers Table */}
      <section className="bg-white rounded-2xl border border-[#E6D7D4] overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="font-serif-display text-xl font-semibold text-[#2A1822]">
              Nenhuma cliente encontrada para os filtros selecionados
            </p>
            <p className="text-xs text-[#6E5662] max-w-md mx-auto">
              Ajuste os filtros de cidade, tipo de pele/cabelo ou tempo de inatividade, ou cadastre um novo contato.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-semibold text-[#4A1936] hover:bg-[#F3EAE8]"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto kanban-scroll">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F5] border-b border-[#E6D7D4] text-xs font-semibold text-[#5C434E]">
                  <th className="py-3.5 px-4">Cliente & Pele/Cabelo</th>
                  <th className="py-3.5 px-4">WhatsApp</th>
                  <th className="py-3.5 px-4">Cidade</th>
                  <th className="py-3.5 px-4">Origem</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Responsável</th>
                  <th className="py-3.5 px-4">Última Interação</th>
                  <th className="py-3.5 px-4">Última Compra</th>
                  {isAdm && (
                    <>
                      <th className="py-3.5 px-4 text-right">
                        Total Gasto (LTV)
                      </th>
                      <th className="py-3.5 px-4 text-right">Nº Pedidos</th>
                      <th className="py-3.5 px-4 text-right">Ticket Médio</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EAE8] text-xs">
                {filteredCustomers.map((c) => {
                  const inactiveDays = calculateDaysSince(c.lastInteraction);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openEditModal(c)}
                      className="hover:bg-[#FAF7F5] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2A1822]">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-[#6E5662] mt-0.5">
                          {c.skinHairType}
                          {c.favoriteProducts ? ` · ${c.favoriteProducts}` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-[#2A1822] whitespace-nowrap">
                        {c.whatsapp}
                      </td>
                      <td className="py-3.5 px-4 text-[#5C434E] whitespace-nowrap">
                        {c.city}
                      </td>
                      <td className="py-3.5 px-4 text-[#5C434E]">{c.origin}</td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={getStatusTextStyle(c.status)}>
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#2A1822] whitespace-nowrap">
                        {c.responsibleName}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-[#5C434E] whitespace-nowrap">
                        {formatDateBR(c.lastInteraction)}
                        {inactiveDays >= 30 && (
                          <span className="block text-[10px] text-[#B45309]">
                            há {inactiveDays} dias
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-[#5C434E] whitespace-nowrap">
                        {c.lastPurchase
                          ? formatDateBR(c.lastPurchase)
                          : 'Sem compras'}
                      </td>
                      {isAdm && (
                        <>
                          <td className="py-3.5 px-4 text-right font-mono-tabular font-semibold text-[#4A1936] whitespace-nowrap">
                            {formatCurrencyBR(c.ltv ?? 0)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-tabular text-[#2A1822]">
                            {c.totalOrders ?? 0}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono-tabular text-[#5C434E] whitespace-nowrap">
                            {formatCurrencyBR(c.averageTicket ?? 0)}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Customer Create / Edit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="customer-modal-title"
          className="fixed inset-0 z-50 bg-[#2A1822]/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 border border-[#E6D7D4] shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6D7D4]">
              <div>
                <h3
                  id="customer-modal-title"
                  className="font-serif-display text-2xl font-semibold text-[#2A1822]"
                >
                  {editingCustomer
                    ? `Ficha da Cliente: ${editingCustomer.name}`
                    : 'Novo Cadastro de Cliente / Lead'}
                </h3>
                <p className="text-xs text-[#6E5662]">
                  {isAdm
                    ? 'Dados cadastrais, perfil de pele/cabelo e histórico financeiro LTV.'
                    : 'Dados de contato e perfil cosmético da cliente.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fechar modal"
                className="p-2 rounded-lg text-[#6E5662] hover:text-[#2A1822] hover:bg-[#FAF7F5]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Nome Completo *
                  </label>
                  <div className="relative">
                    <User className="w-3.5 h-3.5 text-[#6E5662] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    WhatsApp *
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-[#6E5662] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(11) 99999-0000"
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Cidade / UF *
                  </label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#6E5662] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                    />
                  </div>
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
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as CustomerStatus)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                  >
                    <option value="Lead">Lead</option>
                    <option value="Cliente ativo">Cliente ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Tipo de Pele / Cabelo
                  </label>
                  <select
                    value={skinHairType}
                    onChange={(e) =>
                      setSkinHairType(e.target.value as SkinHairProfile)
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                  >
                    {SKIN_HAIR_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Consultora Responsável
                  </label>
                  <select
                    value={responsibleId}
                    disabled={!isAdm}
                    onChange={(e) => setResponsibleId(e.target.value)}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Última Interação
                  </label>
                  <input
                    type="date"
                    value={lastInteraction}
                    onChange={(e) => setLastInteraction(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-mono-tabular text-[#2A1822]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Última Compra (opcional)
                  </label>
                  <input
                    type="date"
                    value={lastPurchase}
                    onChange={(e) => setLastPurchase(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-mono-tabular text-[#2A1822]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                    Cosméticos Favoritos
                  </label>
                  <input
                    type="text"
                    value={favoriteProducts}
                    onChange={(e) => setFavoriteProducts(e.target.value)}
                    placeholder="Ex.: Sérum Rosa Mosqueta"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                  />
                </div>
              </div>

              {/* Financial inputs strictly rendered ONLY for ADM */}
              {isAdm && (
                <div className="p-4 rounded-xl bg-[#FAF7F5] border border-[#E6D7D4] grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#4A1936] mb-1">
                      Total Gasto — LTV (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={ltv}
                      onChange={(e) => setLtv(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#D5BCC3] text-xs font-mono-tabular text-[#2A1822]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#4A1936] mb-1">
                      Número de Pedidos
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={totalOrders}
                      onChange={(e) => setTotalOrders(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#D5BCC3] text-xs font-mono-tabular text-[#2A1822]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6E5662] mb-1">
                      Ticket Médio Calculado
                    </label>
                    <div className="px-3 py-2 rounded-lg bg-[#F3EAE8] text-xs font-mono-tabular font-semibold text-[#4A1936]">
                      {formatCurrencyBR(
                        totalOrders > 0 ? ltv / totalOrders : 0
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#2A1822] mb-1">
                  Notas & Recomendações Dermatológicas/Capilares
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822]"
                />
              </div>

              <div className="pt-3 border-t border-[#E6D7D4] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5BCC3] text-xs font-medium text-[#5C434E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold"
                >
                  Salvar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

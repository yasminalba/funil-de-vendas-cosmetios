import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Check,
  X,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  UserProfile,
  VacationRequest,
  VacationStatus,
} from '../types/cosmetics';
import {
  calculateInclusiveDays,
  formatDateBR,
  getTodayISO,
} from '../services/dataService';

interface VacationsModuleProps {
  currentUser: UserProfile;
  vacations: VacationRequest[];
  onRequestVacation: (payload: {
    startDate: string;
    endDate: string;
    observation: string;
  }) => { success: boolean; error?: string };
  onDecideVacation: (
    vacationId: string,
    decision: 'Aprovado' | 'Recusado'
  ) => void;
}

export const VacationsModule: React.FC<VacationsModuleProps> = ({
  currentUser,
  vacations,
  onRequestVacation,
  onDecideVacation,
}) => {
  const isAdm = currentUser.role === 'adm';

  // ADM filter by status
  const [statusFilter, setStatusFilter] = useState<VacationStatus | 'Todos'>(
    'Todos'
  );

  // Employee form state
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [observation, setObservation] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const days = calculateInclusiveDays(startDate, endDate);
    return days > 0 ? days : 0;
  }, [startDate, endDate]);

  // Live client-side validation preview for employee form
  const liveFormError = useMemo(() => {
    if (!startDate && !endDate) return null;
    const today = getTodayISO();
    if (startDate && startDate < today) {
      return 'A Data de Início não pode estar no passado.';
    }
    if (startDate && endDate && endDate < startDate) {
      return 'A Data de Término não pode ser anterior à Data de Início.';
    }
    if (startDate && endDate) {
      const myActive = vacations.filter(
        (v) =>
          v.employeeId === currentUser.id &&
          (v.status === 'Pendente' || v.status === 'Aprovado')
      );
      for (const req of myActive) {
        if (startDate <= req.endDate && endDate >= req.startDate) {
          return `Sobreposição detectada com pedido ${req.status.toLowerCase()} (${formatDateBR(
            req.startDate
          )} a ${formatDateBR(req.endDate)}).`;
        }
      }
    }
    return null;
  }, [startDate, endDate, vacations, currentUser.id]);

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (liveFormError) {
      setValidationError(liveFormError);
      return;
    }

    const result = onRequestVacation({
      startDate,
      endDate,
      observation,
    });

    if (!result.success) {
      setValidationError(
        result.error || 'Não foi possível registrar o pedido de férias.'
      );
      return;
    }

    setStartDate('');
    setEndDate('');
    setObservation('');
  };

  const filteredVacations = useMemo(() => {
    return vacations.filter(
      (v) => statusFilter === 'Todos' || v.status === statusFilter
    );
  }, [vacations, statusFilter]);

  const renderStatusIndicator = (status: VacationStatus) => {
    if (status === 'Aprovado') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#15803D]">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Aprovado
        </span>
      );
    }
    if (status === 'Recusado') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B91C1C]">
          <XCircle className="w-3.5 h-3.5" />
          Recusado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#B45309]">
        <Clock className="w-3.5 h-3.5" />
        Pendente
      </span>
    );
  };

  // ==========================================================================
  // VIEW 1: ADMINISTRATOR VACATION MANAGEMENT
  // ==========================================================================
  if (isAdm) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-display text-2xl font-semibold text-[#2A1822]">
              Gestão de Férias — Recursos Humanos (ADM)
            </h2>
            <p className="text-xs text-[#6E5662]">
              Aprove ou recuse solicitações da equipe comercial. Toda decisão registra responsável e horário.
            </p>
          </div>

          {/* Status Filter */}
          <div
            role="group"
            aria-label="Filtrar pedidos de férias por status"
            className="flex items-center gap-1 p-1 rounded-xl bg-white border border-[#E6D7D4]"
          >
            {(['Todos', 'Pendente', 'Aprovado', 'Recusado'] as const).map(
              (st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936] ${
                    statusFilter === st
                      ? 'bg-[#4A1936] text-white'
                      : 'text-[#5C434E] hover:text-[#2A1822]'
                  }`}
                >
                  {st}
                </button>
              )
            )}
          </div>
        </div>

        <section className="bg-white rounded-2xl border border-[#E6D7D4] overflow-hidden">
          {filteredVacations.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <p className="font-serif-display text-xl font-semibold text-[#2A1822]">
                Nenhum pedido de férias com status "{statusFilter}"
              </p>
              <p className="text-xs text-[#6E5662]">
                Selecione outro filtro acima para visualizar o histórico completo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto kanban-scroll">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF7F5] border-b border-[#E6D7D4] text-xs font-semibold text-[#5C434E]">
                    <th className="py-3.5 px-4">Funcionário</th>
                    <th className="py-3.5 px-4">Data de Início</th>
                    <th className="py-3.5 px-4">Data de Término</th>
                    <th className="py-3.5 px-4">Quantidade de Dias</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Decisão / Auditoria</th>
                    <th className="py-3.5 px-4 text-right">Ações do Gestor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3EAE8] text-xs">
                  {filteredVacations.map((vac) => (
                    <tr
                      key={vac.id}
                      className="hover:bg-[#FAF7F5] transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#2A1822]">
                          {vac.employeeName}
                        </div>
                        <div className="text-[11px] text-[#6E5662] mt-0.5">
                          {vac.observation}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-[#2A1822] whitespace-nowrap">
                        {formatDateBR(vac.startDate)}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-[#2A1822] whitespace-nowrap">
                        {formatDateBR(vac.endDate)}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#4A1936] whitespace-nowrap">
                        {vac.daysCount} {vac.daysCount === 1 ? 'dia' : 'dias'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderStatusIndicator(vac.status)}
                      </td>
                      <td className="py-3.5 px-4 text-[#5C434E]">
                        {vac.decidedBy && vac.decidedAt ? (
                          <div>
                            <span className="font-medium text-[#2A1822]">
                              Por {vac.decidedBy}
                            </span>
                            <span className="block font-mono-tabular text-[11px] text-[#6E5662]">
                              em {vac.decidedAt}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[#6E5662]">
                            Aguardando análise do ADM
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onDecideVacation(vac.id, 'Aprovado')
                            }
                            disabled={vac.status === 'Aprovado'}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#15803D] hover:bg-[#166534] disabled:opacity-35 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#15803D]"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Aprovar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              onDecideVacation(vac.id, 'Recusado')
                            }
                            disabled={vac.status === 'Recusado'}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-35 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B91C1C]"
                          >
                            <X className="w-3.5 h-3.5" />
                            Recusar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    );
  }

  // ==========================================================================
  // VIEW 2: EMPLOYEE "MINHAS FÉRIAS"
  // ==========================================================================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Column: Request Form */}
      <section className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E6D7D4] space-y-5">
        <div>
          <h2 className="font-serif-display text-2xl font-semibold text-[#2A1822]">
            Solicitar Período de Férias
          </h2>
          <p className="text-xs text-[#6E5662] mt-1">
            Preencha as datas desejadas. O pedido será enviado para validação da gestão (ADM).
          </p>
        </div>

        <form onSubmit={handleEmployeeSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="vac-start"
                className="block text-xs font-semibold text-[#2A1822] mb-1.5"
              >
                Data de Início *
              </label>
              <input
                id="vac-start"
                type="date"
                required
                min={getTodayISO()}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setValidationError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-mono-tabular text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
              />
            </div>

            <div>
              <label
                htmlFor="vac-end"
                className="block text-xs font-semibold text-[#2A1822] mb-1.5"
              >
                Data de Término *
              </label>
              <input
                id="vac-end"
                type="date"
                required
                min={startDate || getTodayISO()}
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setValidationError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs font-mono-tabular text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
              />
            </div>
          </div>

          {/* Automatic Days Counter */}
          <div className="p-4 rounded-xl bg-[#FAF7F5] border border-[#E6D7D4] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#5C434E]">
              <Calendar className="w-4 h-4 text-[#9E4763]" />
              <span>Quantidade calculada automaticamente:</span>
            </div>
            <span className="font-mono-tabular text-base font-semibold text-[#4A1936]">
              {calculatedDays > 0
                ? `${calculatedDays} ${calculatedDays === 1 ? 'dia' : 'dias'}`
                : '—'}
            </span>
          </div>

          <div>
            <label
              htmlFor="vac-obs"
              className="block text-xs font-semibold text-[#2A1822] mb-1.5"
            >
              Observação (opcional)
            </label>
            <textarea
              id="vac-obs"
              rows={2}
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Ex.: Férias programadas do 2º semestre..."
              className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F5] border border-[#D5BCC3] text-xs text-[#2A1822] focus:bg-white focus:border-[#4A1936] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1936]"
            />
          </div>

          {(validationError || liveFormError) && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FECACA] text-xs text-[#B91C1C] flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{validationError || liveFormError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-[#4A1936] hover:bg-[#381229] text-white text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4A1936]"
          >
            Solicitar Férias
          </button>
        </form>
      </section>

      {/* Right Column: Employee's Own Vacation History */}
      <section className="lg:col-span-7 bg-white rounded-2xl p-6 border border-[#E6D7D4] space-y-4">
        <div>
          <h2 className="font-serif-display text-2xl font-semibold text-[#2A1822]">
            Meu Histórico de Férias ({currentUser.name})
          </h2>
          <p className="text-xs text-[#6E5662] mt-1">
            Acompanhe o status das suas solicitações enviadas ao RH.
          </p>
        </div>

        {vacations.length === 0 ? (
          <div className="p-10 text-center border border-dashed border-[#D5BCC3] rounded-xl text-xs text-[#6E5662]">
            Você ainda não possui solicitações de férias registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF7F5] border-b border-[#E6D7D4] text-xs font-semibold text-[#5C434E]">
                  <th className="py-3 px-4">Período Solicitado</th>
                  <th className="py-3 px-4">Dias</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Observação & Retorno ADM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3EAE8] text-xs">
                {vacations.map((vac) => (
                  <tr key={vac.id} className="hover:bg-[#FAF7F5]">
                    <td className="py-3.5 px-4 font-mono-tabular text-[#2A1822] whitespace-nowrap">
                      {formatDateBR(vac.startDate)} até{' '}
                      {formatDateBR(vac.endDate)}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular font-semibold text-[#4A1936] whitespace-nowrap">
                      {vac.daysCount} {vac.daysCount === 1 ? 'dia' : 'dias'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {renderStatusIndicator(vac.status)}
                    </td>
                    <td className="py-3.5 px-4 text-[#5C434E]">
                      <div>{vac.observation}</div>
                      {vac.decidedBy && vac.decidedAt && (
                        <div className="text-[11px] text-[#6E5662] font-mono-tabular mt-0.5">
                          Decidido por {vac.decidedBy} em {vac.decidedAt}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

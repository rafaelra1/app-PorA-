
import React, { useState } from 'react';
import { Trip } from '../types';
import { Card } from '../components/ui/Base';
import { BRAZILIAN_HOLIDAYS } from '../constants';

interface CalendarViewProps {
  trips: Trip[];
  onViewTrip: (id: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ trips, onViewTrip }) => {
  const [currentDate, setCurrentDate] = useState(new Date()); // Start at current month
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'year'>('month');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'planning' | 'completed'>('all');

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    // Handle DD/MM/YYYY
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    // Handle YYYY-MM-DD (ISO)
    if (dateStr.includes('-')) {
      const [year, month, day] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    // Fallback
    return new Date(dateStr);
  };

  const isDateInRange = (date: Date, startStr: string, endStr: string) => {
    const start = parseDate(startStr);
    const end = parseDate(endStr);
    // Remove time components
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return d >= s && d <= e;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  const firstDay = getFirstDayOfMonth(year, month);

  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-2">
        <div>
          <h2 className="text-2xl font-extrabold text-text-main">Agenda PorAí</h2>
          <p className="text-text-muted text-sm">Organize suas jornadas no tempo de Brasília.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Selector */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl shadow-soft border border-gray-100">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'month' ? 'bg-text-main text-white' : 'text-text-muted hover:bg-gray-50'}`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'week' ? 'bg-text-main text-white' : 'text-text-muted hover:bg-gray-50'}`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'year' ? 'bg-text-main text-white' : 'text-text-muted hover:bg-gray-50'}`}
            >
              Ano
            </button>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-white border border-gray-100 text-xs font-bold text-text-main shadow-soft focus:ring-2 focus:ring-primary cursor-pointer"
          >
            <option value="all">Todas</option>
            <option value="confirmed">Confirmadas</option>
            <option value="planning">Planejando</option>
            <option value="completed">Concluídas</option>
          </select>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-soft border border-gray-100">
          <button onClick={prevMonth} className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light text-text-muted transition-colors">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="font-bold text-text-main min-w-[120px] text-center">{months[month]} {year}</span>
          <button onClick={nextMonth} className="size-10 flex items-center justify-center rounded-xl hover:bg-background-light text-text-muted transition-colors">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-4 py-2 rounded-xl bg-white border border-gray-100 text-xs font-bold text-text-main shadow-soft hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">today</span>
            Hoje
          </button>
        </div>
      </div>

      <Card className="p-6 overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
          {daysOfWeek.map(d => (
            <div key={d} className="bg-white p-4 text-center text-[10px] font-extrabold text-text-muted uppercase tracking-widest border-b border-gray-50">
              {d}
            </div>
          ))}
          {days.map((day, idx) => (
            <div key={idx} className={`bg-white min-h-[120px] p-2 flex flex-col gap-1 transition-colors hover:bg-gray-50/50 ${!day ? 'bg-gray-50/30' : ''}`}>
              {day && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold p-1 rounded-md w-fit ${day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear()
                      ? 'bg-text-main text-white' : 'text-text-muted'
                      }`}>
                      {day.getDate()}
                    </span>
                    {(() => {
                      const holiday = BRAZILIAN_HOLIDAYS.find(h => {
                        const [hY, hM, hD] = h.date.split('-').map(Number);
                        return hD === day.getDate() && hM === (day.getMonth() + 1) && hY === day.getFullYear();
                      });
                      if (holiday) {
                        return (
                          <div
                            className={`size-2 rounded-full ${holiday.type === 'nacional' ? 'bg-green-500' : 'bg-yellow-500'}`}
                            title={holiday.name}
                          ></div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    {trips.filter(trip => statusFilter === 'all' || trip.status === statusFilter).map(trip => {
                      if (day && isDateInRange(day, trip.startDate, trip.endDate)) {
                        const isStart = parseDate(trip.startDate).getDate() === day.getDate() && parseDate(trip.startDate).getMonth() === day.getMonth();
                        return (
                          <div
                            key={trip.id}
                            onClick={() => onViewTrip(trip.id)}
                            className={`px-2 py-1 rounded-[6px] text-[10px] font-bold cursor-pointer transition-all truncate hover:brightness-95 active:scale-95 ${trip.status === 'confirmed' ? 'bg-green-100 text-green-700' : trip.status === 'planning' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                              }`}
                          >
                            {isStart && <span className="material-symbols-outlined text-[10px] mr-1 align-middle">flight_takeoff</span>}
                            {trip.title}
                          </div>
                        );
                      }
                      return null;
                    })}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Statistics and Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Trip Counter */}
        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-primary hover:shadow-lg transition-all cursor-pointer" onClick={() => setStatusFilter('all')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary-dark">
                <span className="material-symbols-outlined">luggage</span>
              </div>
              <h4 className="font-bold text-text-main">Total de Viagens</h4>
            </div>
            <span className="text-2xl font-extrabold text-primary-dark">{trips.length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {statusFilter !== 'all' && <span className="text-primary font-bold">Clique para ver todas • </span>}
            Gerencie todas as suas aventuras em um só lugar.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-green-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => setStatusFilter('confirmed')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <span className="material-symbols-outlined">done_all</span>
              </div>
              <h4 className="font-bold text-text-main">Confirmadas</h4>
            </div>
            <span className="text-2xl font-extrabold text-green-600">{trips.filter(t => t.status === 'confirmed').length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {statusFilter === 'confirmed' && <span className="text-green-600 font-bold">Filtro ativo • </span>}
            Viagens com reservas validadas.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-blue-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => setStatusFilter('planning')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <span className="material-symbols-outlined">edit_calendar</span>
              </div>
              <h4 className="font-bold text-text-main">Planejando</h4>
            </div>
            <span className="text-2xl font-extrabold text-blue-600">{trips.filter(t => t.status === 'planning').length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {statusFilter === 'planning' && <span className="text-blue-600 font-bold">Filtro ativo • </span>}
            Viagens em fase de planejamento.
          </p>
        </Card>

        <Card className="p-5 flex flex-col gap-4 border-l-4 border-l-indigo-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => setStatusFilter('completed')}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <span className="material-symbols-outlined">check_circle</span>
              </div>
              <h4 className="font-bold text-text-main">Concluídas</h4>
            </div>
            <span className="text-2xl font-extrabold text-indigo-600">{trips.filter(t => t.status === 'completed').length}</span>
          </div>
          <p className="text-xs text-text-muted leading-relaxed">
            {statusFilter === 'completed' && <span className="text-indigo-600 font-bold">Filtro ativo • </span>}
            Memórias de viagens realizadas.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default CalendarView;

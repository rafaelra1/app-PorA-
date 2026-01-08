import React, { useState } from 'react';
import { CalendarEvent } from '../../types';
import { exportToICS, addToGoogleCalendar } from '../../lib/icsExporter';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, events }) => {
  const [exportType, setExportType] = useState<'all' | 'upcoming' | 'past'>('upcoming');
  const [selectedFormat, setSelectedFormat] = useState<'ics' | 'google'>('ics');

  const filterEventsByType = (): CalendarEvent[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (exportType) {
      case 'upcoming':
        return events.filter(event => {
          const eventDate = parseEventDate(event.startDate);
          return eventDate >= today;
        });
      case 'past':
        return events.filter(event => {
          const eventDate = parseEventDate(event.startDate);
          return eventDate < today;
        });
      case 'all':
      default:
        return events;
    }
  };

  const parseEventDate = (dateStr: string): Date => {
    if (dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/').map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(dateStr);
  };

  const handleExport = () => {
    const filteredEvents = filterEventsByType();

    if (filteredEvents.length === 0) {
      alert('Nenhum evento para exportar com os filtros selecionados.');
      return;
    }

    if (selectedFormat === 'ics') {
      // Export to .ics file
      const filename = `porai-calendar-${exportType}.ics`;
      exportToICS(filteredEvents, filename);

      alert(`${filteredEvents.length} evento(s) exportado(s) com sucesso!\n\nVocê pode importar o arquivo .ics em qualquer aplicativo de calendário (Google Calendar, Apple Calendar, Outlook, etc.)`);
      onClose();
    } else if (selectedFormat === 'google') {
      // Open Google Calendar for each event (limited to first 5 to avoid popup blocks)
      const eventsToAdd = filteredEvents.slice(0, 5);

      if (filteredEvents.length > 5) {
        alert(`Você será redirecionado para adicionar os primeiros 5 eventos ao Google Calendar.\n\nPara adicionar todos os ${filteredEvents.length} eventos, use a exportação em formato .ics.`);
      }

      eventsToAdd.forEach((event, index) => {
        setTimeout(() => {
          addToGoogleCalendar(event);
        }, index * 500); // Delay to avoid popup blocker
      });

      onClose();
    }
  };

  if (!isOpen) return null;

  const filteredCount = filterEventsByType().length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="border-b border-gray-100 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
              <span className="material-symbols-outlined">file_download</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">Exportar Calendário</h2>
              <p className="text-sm text-text-muted">Sincronize com outros aplicativos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full hover:bg-background-light flex items-center justify-center text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Type */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-3">
              Período
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'upcoming', label: 'Próximos', icon: 'upcoming' },
                { value: 'all', label: 'Todos', icon: 'calendar_month' },
                { value: 'past', label: 'Passados', icon: 'history' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setExportType(type.value as any)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    exportType === type.value
                      ? 'border-primary bg-primary-light text-primary-dark'
                      : 'border-gray-200 hover:border-gray-300 text-text-muted'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">{type.icon}</span>
                  <span className="text-xs font-bold">{type.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-2">
              {filteredCount} evento(s) será(ão) exportado(s)
            </p>
          </div>

          {/* Export Format */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-3">
              Formato de Exportação
            </label>
            <div className="space-y-3">
              {/* iCalendar (.ics) */}
              <button
                onClick={() => setSelectedFormat('ics')}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFormat === 'ics'
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                  <span className="material-symbols-outlined">event</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-main">Arquivo .ics (Recomendado)</p>
                  <p className="text-xs text-text-muted mt-1">
                    Compatível com Google Calendar, Apple Calendar, Outlook e outros.
                    Melhor para exportar múltiplos eventos.
                  </p>
                </div>
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                  selectedFormat === 'ics' ? 'border-primary' : 'border-gray-300'
                }`}>
                  {selectedFormat === 'ics' && (
                    <div className="size-3 rounded-full bg-primary" />
                  )}
                </div>
              </button>

              {/* Google Calendar Direct */}
              <button
                onClick={() => setSelectedFormat('google')}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  selectedFormat === 'google'
                    ? 'border-primary bg-primary-light'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="size-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                  <span className="material-symbols-outlined">event_available</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-text-main">Google Calendar Direto</p>
                  <p className="text-xs text-text-muted mt-1">
                    Abre o Google Calendar para adicionar eventos (máximo 5 de cada vez).
                    Requer conta Google.
                  </p>
                </div>
                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${
                  selectedFormat === 'google' ? 'border-primary' : 'border-gray-300'
                }`}>
                  {selectedFormat === 'google' && (
                    <div className="size-3 rounded-full bg-primary" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex gap-3">
              <span className="material-symbols-outlined text-blue-600 shrink-0">info</span>
              <div>
                <p className="text-sm font-bold text-blue-900 mb-1">Como usar</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  {selectedFormat === 'ics' ? (
                    <>
                      <li>• Clique em "Exportar" para baixar o arquivo .ics</li>
                      <li>• Abra o arquivo ou importe-o no seu calendário favorito</li>
                      <li>• Todos os eventos serão adicionados automaticamente</li>
                    </>
                  ) : (
                    <>
                      <li>• Permita pop-ups no seu navegador</li>
                      <li>• Cada evento abrirá em uma nova aba do Google Calendar</li>
                      <li>• Revise e clique em "Salvar" para adicionar</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 p-6 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-text-main font-bold hover:bg-background-light transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            disabled={filteredCount === 0}
            className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">file_download</span>
            Exportar {filteredCount > 0 && `(${filteredCount})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;

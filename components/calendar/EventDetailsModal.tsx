import React from 'react';
import { CalendarEvent, Trip } from '../../types';
import { useCalendar } from '../../contexts/CalendarContext';
import { exportSingleEventToICS, addToGoogleCalendar } from '../../lib/icsExporter';

interface EventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  trip?: Trip;
  onEdit?: () => void;
  onViewTrip?: (tripId: string) => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  trip,
  onEdit,
  onViewTrip,
}) => {
  const { deleteEvent, toggleEventComplete } = useCalendar();

  if (!isOpen || !event) return null;

  const getEventTypeIcon = (type: string): string => {
    const icons: Record<string, string> = {
      trip: 'luggage',
      flight: 'flight',
      train: 'train',
      bus: 'directions_bus',
      ferry: 'directions_boat',
      transfer: 'transfer_within_a_station',
      accommodation: 'hotel',
      meal: 'restaurant',
      restaurant: 'restaurant',
      sightseeing: 'tour',
      culture: 'museum',
      attraction: 'attractions',
      nature: 'nature',
      shopping: 'shopping_bag',
      nightlife: 'nightlife',
      activity: 'event',
      task: 'task',
      reminder: 'notifications',
      other: 'more_horiz',
    };
    return icons[type] || 'event';
  };

  const getEventTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      trip: 'bg-blue-100 text-blue-700',
      flight: 'bg-violet-100 text-violet-700',
      train: 'bg-purple-100 text-purple-700',
      accommodation: 'bg-emerald-100 text-emerald-700',
      meal: 'bg-orange-100 text-orange-700',
      restaurant: 'bg-amber-100 text-amber-700',
      sightseeing: 'bg-yellow-100 text-yellow-700',
      culture: 'bg-pink-100 text-pink-700',
      nature: 'bg-green-100 text-green-700',
      shopping: 'bg-cyan-100 text-cyan-700',
      task: 'bg-gray-100 text-gray-700',
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const formatDateTime = (date: string, time?: string): string => {
    const [day, month, year] = date.includes('/')
      ? date.split('/').map(Number)
      : date.split('-').reverse().map(Number);

    const dateObj = new Date(year, month - 1, day);
    const dateStr = dateObj.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (time) {
      return `${dateStr} às ${time}`;
    }
    return dateStr;
  };

  const handleDelete = async () => {
    if (window.confirm(`Tem certeza que deseja excluir o evento "${event.title}"?`)) {
      try {
        await deleteEvent(event.id);
        onClose();
      } catch (error) {
        alert('Erro ao excluir evento.');
      }
    }
  };

  const handleToggleComplete = async () => {
    try {
      await toggleEventComplete(event.id);
    } catch (error) {
      alert('Erro ao atualizar status.');
    }
  };

  const handleExportToICS = () => {
    exportSingleEventToICS(event);
  };

  const handleAddToGoogle = () => {
    addToGoogleCalendar(event);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative">
          {trip && trip.coverImage && (
            <div
              className="h-32 bg-cover bg-center rounded-t-2xl"
              style={{ backgroundImage: `url(${trip.coverImage})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 rounded-t-2xl" />
            </div>
          )}
          <div className={`${trip?.coverImage ? 'absolute bottom-0 left-0 right-0' : ''} p-6 flex items-start justify-between`}>
            <div className="flex items-start gap-4">
              <div className={`size-12 rounded-xl ${getEventTypeColor(event.type)} flex items-center justify-center shrink-0 ${trip?.coverImage ? 'shadow-lg' : ''}`}>
                <span className="material-symbols-outlined text-2xl">
                  {getEventTypeIcon(event.type)}
                </span>
              </div>
              <div className={trip?.coverImage ? 'text-white' : ''}>
                <h2 className="text-2xl font-bold">{event.title}</h2>
                {event.location && (
                  <p className={`text-sm mt-1 flex items-center gap-1 ${trip?.coverImage ? 'text-white/90' : 'text-text-muted'}`}>
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    {event.location}
                    {event.locationDetail && ` - ${event.locationDetail}`}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`size-8 rounded-full flex items-center justify-center transition-colors ${
                trip?.coverImage
                  ? 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm'
                  : 'hover:bg-background-light text-text-muted'
              }`}
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Date and Time */}
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-primary-dark">schedule</span>
            <div>
              <p className="text-sm font-bold text-text-main">
                {event.allDay ? 'Dia Inteiro' : 'Data e Horário'}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {formatDateTime(event.startDate, event.startTime)}
              </p>
              {event.endTime && !event.allDay && (
                <p className="text-sm text-text-muted">
                  até {formatDateTime(event.endDate || event.startDate, event.endTime)}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-dark">description</span>
              <div>
                <p className="text-sm font-bold text-text-main">Descrição</p>
                <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
          )}

          {/* Trip Association */}
          {trip && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-dark">luggage</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-text-main mb-2">Viagem</p>
                <button
                  onClick={() => onViewTrip?.(trip.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-background-light transition-all"
                >
                  <div
                    className="w-12 h-12 rounded-lg bg-cover bg-center"
                    style={{ backgroundImage: `url(${trip.coverImage})` }}
                  />
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold text-text-main">
                      {trip.title || trip.destination}
                    </p>
                    <p className="text-xs text-text-muted">
                      {trip.startDate} - {trip.endDate}
                    </p>
                  </div>
                  <span className="material-symbols-outlined text-text-muted">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Reminder */}
          {event.reminder && event.reminder > 0 && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-dark">notifications_active</span>
              <div>
                <p className="text-sm font-bold text-text-main">Lembrete</p>
                <p className="text-sm text-text-muted mt-1">
                  {event.reminder < 60
                    ? `${event.reminder} minutos antes`
                    : event.reminder < 1440
                    ? `${Math.floor(event.reminder / 60)} hora(s) antes`
                    : `${Math.floor(event.reminder / 1440)} dia(s) antes`}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary-dark">note</span>
              <div>
                <p className="text-sm font-bold text-text-main">Observações</p>
                <p className="text-sm text-text-muted mt-1 whitespace-pre-wrap">
                  {event.notes}
                </p>
              </div>
            </div>
          )}

          {/* Status */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-background-light">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-dark">
                {event.completed ? 'check_circle' : 'radio_button_unchecked'}
              </span>
              <div>
                <p className="text-sm font-bold text-text-main">Status</p>
                <p className="text-xs text-text-muted">
                  {event.completed ? 'Evento concluído' : 'Evento pendente'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggleComplete}
              className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                event.completed
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {event.completed ? 'Marcar como Pendente' : 'Marcar como Concluído'}
            </button>
          </div>

          {/* Export Options */}
          <div className="border-t border-gray-100 pt-6">
            <p className="text-sm font-bold text-text-main mb-3">Exportar Evento</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExportToICS}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-background-light transition-all"
              >
                <span className="material-symbols-outlined text-blue-600">file_download</span>
                <span className="text-xs font-bold text-text-main">Baixar .ics</span>
              </button>
              <button
                onClick={handleAddToGoogle}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:bg-background-light transition-all"
              >
                <span className="material-symbols-outlined text-red-600">event_available</span>
                <span className="text-xs font-bold text-text-main">Google Calendar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 p-6 flex items-center gap-3">
          <button
            onClick={handleDelete}
            className="px-6 py-3 rounded-xl border border-red-200 text-red-600 font-bold hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            Excluir
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              Editar Evento
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsModal;

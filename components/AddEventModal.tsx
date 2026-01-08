import React, { useState, useEffect } from 'react';
import { CalendarEventType, Trip } from '../types';
import { useCalendar } from '../contexts/CalendarContext';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // DD/MM/YYYY
  initialTime?: string; // HH:mm
  trips: Trip[];
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  initialTime,
  trips,
}) => {
  const { addEvent } = useCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(initialDate || '');
  const [startTime, setStartTime] = useState(initialTime || '09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [type, setType] = useState<CalendarEventType>('activity');
  const [tripId, setTripId] = useState<string>('');
  const [location, setLocation] = useState('');
  const [reminder, setReminder] = useState<number>(30);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setDescription('');
      setDate(initialDate || formatDateToDDMMYYYY(new Date()));
      setStartTime(initialTime || '09:00');
      setEndTime('10:00');
      setAllDay(false);
      setType('activity');
      setTripId('');
      setLocation('');
      setReminder(30);
    }
  }, [isOpen, initialDate, initialTime]);

  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !date) {
      return;
    }

    setIsSubmitting(true);

    try {
      await addEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: date,
        startTime: allDay ? undefined : startTime,
        endTime: allDay ? undefined : endTime,
        allDay,
        type,
        tripId: tripId || undefined,
        location: location.trim() || undefined,
        reminder,
        completed: false,
      });

      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Erro ao adicionar evento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const eventTypeOptions: { value: CalendarEventType; label: string; icon: string }[] = [
    { value: 'activity', label: 'Atividade', icon: 'event' },
    { value: 'flight', label: 'Voo', icon: 'flight' },
    { value: 'train', label: 'Trem', icon: 'train' },
    { value: 'bus', label: 'Ônibus', icon: 'directions_bus' },
    { value: 'accommodation', label: 'Hospedagem', icon: 'hotel' },
    { value: 'meal', label: 'Refeição', icon: 'restaurant' },
    { value: 'sightseeing', label: 'Passeio', icon: 'tour' },
    { value: 'culture', label: 'Cultura', icon: 'museum' },
    { value: 'nature', label: 'Natureza', icon: 'nature' },
    { value: 'shopping', label: 'Compras', icon: 'shopping_bag' },
    { value: 'task', label: 'Tarefa', icon: 'task' },
    { value: 'reminder', label: 'Lembrete', icon: 'notifications' },
    { value: 'other', label: 'Outro', icon: 'more_horiz' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary-light flex items-center justify-center text-primary-dark">
              <span className="material-symbols-outlined">add_circle</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-main">Adicionar Evento</h2>
              <p className="text-sm text-text-muted">Crie um novo evento no calendário</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full hover:bg-background-light flex items-center justify-center text-text-muted transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Visita ao Louvre"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main placeholder-text-muted"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Descrição
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione detalhes sobre o evento..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main placeholder-text-muted resize-none"
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">
                Data *
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                placeholder="DD/MM/AAAA"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main"
              />
            </div>

            {!allDay && (
              <>
                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">
                    Início
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-main mb-2">
                    Fim
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main"
                  />
                </div>
              </>
            )}
          </div>

          {/* All Day Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="allDay"
              checked={allDay}
              onChange={(e) => setAllDay(e.target.checked)}
              className="size-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            />
            <label htmlFor="allDay" className="text-sm font-medium text-text-main cursor-pointer">
              Dia inteiro
            </label>
          </div>

          {/* Event Type */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Tipo de Evento *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {eventTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    type === option.value
                      ? 'border-primary bg-primary-light text-primary-dark'
                      : 'border-gray-200 hover:border-gray-300 text-text-muted'
                  }`}
                >
                  <span className="material-symbols-outlined text-xl">
                    {option.icon}
                  </span>
                  <span className="text-xs font-bold">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Trip Association */}
          {trips.length > 0 && (
            <div>
              <label className="block text-sm font-bold text-text-main mb-2">
                Viagem Associada
              </label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main cursor-pointer"
              >
                <option value="">Nenhuma viagem</option>
                {trips.map((trip) => (
                  <option key={trip.id} value={trip.id}>
                    {trip.title || trip.destination} ({trip.startDate})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Localização
            </label>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-text-muted">location_on</span>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Paris, França"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main placeholder-text-muted"
              />
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Lembrete
            </label>
            <select
              value={reminder}
              onChange={(e) => setReminder(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent text-text-main cursor-pointer"
            >
              <option value={0}>Sem lembrete</option>
              <option value={15}>15 minutos antes</option>
              <option value={30}>30 minutos antes</option>
              <option value={60}>1 hora antes</option>
              <option value={120}>2 horas antes</option>
              <option value={1440}>1 dia antes</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 text-text-main font-bold hover:bg-background-light transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !date}
              className="flex-1 px-6 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin material-symbols-outlined text-base">
                    progress_activity
                  </span>
                  Salvando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">check</span>
                  Adicionar Evento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;

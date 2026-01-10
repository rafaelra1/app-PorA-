import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarEventType, Trip } from '../types';
import { useCalendar } from '../contexts/CalendarContext';
import { eventSchema } from '../lib/validations/schemas';
import { useToast } from '../contexts/ToastContext';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { Button } from './ui/Base';
import { useAutosaveDraft } from '../hooks/useAutosaveDraft';
import { useState } from 'react';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  initialTime?: string;
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
  const { showToast } = useToast();

  const formatDateToDDMMYYYY = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      date: initialDate || formatDateToDDMMYYYY(new Date()),
      startTime: initialTime || '09:00',
      endTime: '10:00',
      allDay: false,
      type: 'activity' as CalendarEventType,
      tripId: '',
      location: '',
      reminder: 30,
    }
  });

  const formData = watch();
  const allDay = watch('allDay');

  // Autosave Integration
  const { saveDraft, clearDraft, loadDraft, hasDraft, lastSaved } = useAutosaveDraft({
    key: 'new_event',
    onRestore: (data: any) => {
      reset(data);
      showToast("Rascunho de evento restaurado!", "info");
    }
  });

  // Debounced Save
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (formData.title || formData.description) {
        saveDraft(formData);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [formData, isOpen, saveDraft]);

  // Restore Prompt
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  useEffect(() => {
    if (isOpen && hasDraft && !formData.title) {
      setShowRestorePrompt(true);
    }
  }, [isOpen, hasDraft, formData.title]);

  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        date: initialDate || formatDateToDDMMYYYY(new Date()),
        startTime: initialTime || '09:00',
        endTime: '10:00',
        allDay: false,
        type: 'activity',
        tripId: '',
        location: '',
        reminder: 30,
      });
    }
  }, [isOpen, initialDate, initialTime, reset]);

  const onSubmit = async (data: any) => {
    try {
      await addEvent({
        ...data,
        completed: false,
        tripId: data.tripId || undefined,
        startTime: data.allDay ? undefined : data.startTime,
        endTime: data.allDay ? undefined : data.endTime,
      });
      showToast("Evento adicionado!", "success");
      clearDraft();
      onClose();
    } catch (error) {
      console.error('Error adding event:', error);
      showToast("Erro ao adicionar evento.", "error");
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
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 relative z-10">
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {isSubmitting && "Adicionando evento..."}
        </div>

        {showRestorePrompt && (
          <div className="bg-indigo-50 px-6 py-2 border-b border-indigo-100 flex items-center justify-between animate-in slide-in-from-top duration-300">
            <span className="text-[10px] font-bold text-indigo-900">Restaurar rascunho anterior?</span>
            <div className="flex gap-2">
              <button
                onClick={() => { loadDraft(); setShowRestorePrompt(false); }}
                className="text-[10px] font-extrabold uppercase bg-white px-2 py-1 rounded-lg text-indigo-600 shadow-sm"
              >
                Sim
              </button>
              <button
                onClick={() => { clearDraft(); setShowRestorePrompt(false); }}
                className="text-[10px] font-extrabold uppercase text-indigo-400"
              >
                Não
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between rounded-t-2xl z-20">
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
            aria-label="Fechar"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 space-y-6"
          aria-busy={isSubmitting}
        >
          {/* Title */}
          <Controller
            name="title"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Título"
                placeholder="Ex: Visita ao Louvre"
                required
                error={errors.title?.message as string}
                fullWidth
              />
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                {...field}
                label="Descrição"
                placeholder="Adicione detalhes sobre o evento..."
                rows={3}
                fullWidth
              />
            )}
          />

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Data"
                  placeholder="DD/MM/AAAA"
                  required
                  error={errors.date?.message as string}
                  fullWidth
                />
              )}
            />

            {!allDay && (
              <>
                <Controller
                  name="startTime"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Início"
                      type="time"
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="endTime"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      label="Fim"
                      type="time"
                      error={errors.endTime?.message as string}
                      fullWidth
                    />
                  )}
                />
              </>
            )}
          </div>

          {/* All Day Toggle */}
          <Controller
            name="allDay"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allDay"
                  checked={field.value}
                  onChange={field.onChange}
                  className="size-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="allDay" className="text-sm font-medium text-text-main cursor-pointer">
                  Dia inteiro
                </label>
              </div>
            )}
          />

          {/* Event Type */}
          <div>
            <label className="block text-sm font-bold text-text-main mb-2">
              Tipo de Evento *
            </label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {eventTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${field.value === option.value
                        ? 'border-primary bg-primary-light text-primary-dark'
                        : 'border-gray-200 hover:border-gray-300 text-text-muted'
                        }`}
                      aria-pressed={field.value === option.value}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {option.icon}
                      </span>
                      <span className="text-xs font-bold">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            />
          </div>

          {/* Trip Association */}
          {trips.length > 0 && (
            <Controller
              name="tripId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Viagem Associada"
                  options={[
                    { value: '', label: 'Nenhuma viagem' },
                    ...trips.map(trip => ({
                      value: trip.id,
                      label: `${trip.title || trip.destination} (${trip.startDate})`
                    }))
                  ]}
                  fullWidth
                />
              )}
            />
          )}

          {/* Location */}
          <Controller
            name="location"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Localização"
                placeholder="Ex: Paris, França"
                leftIcon={<span className="material-symbols-outlined text-text-muted">location_on</span>}
                fullWidth
              />
            )}
          />

          {/* Reminder */}
          <Controller
            name="reminder"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Lembrete"
                value={String(field.value)}
                onChange={(e) => field.onChange(Number(e.target.value))}
                options={[
                  { value: '0', label: 'Sem lembrete' },
                  { value: '15', label: '15 minutos antes' },
                  { value: '30', label: '30 minutos antes' },
                  { value: '60', label: '1 hora antes' },
                  { value: '120', label: '2 horas antes' },
                  { value: '1440', label: '1 dia antes' },
                ]}
                fullWidth
              />
            )}
          />

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
            <div className="flex-1 flex items-center gap-2">
              {lastSaved && (
                <div className="flex items-center gap-1 text-green-600 animate-in fade-in duration-500">
                  <span className="material-symbols-outlined text-xs">cloud_done</span>
                  <span className="text-[8px] font-bold uppercase">Rascunho salvo</span>
                </div>
              )}
            </div>
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              type="button"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              type="submit"
              disabled={isSubmitting}
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
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddEventModal;

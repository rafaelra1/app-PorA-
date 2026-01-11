import * as React from 'react';
import { useState, useCallback } from 'react';
import { TravelPeriod, TripViabilityAnalysis, ViabilityLevel } from '../../types';
import { getGeminiService } from '../../services/geminiService';
import { CitySearchInput, CitySearchResult } from '../ui/CitySearchInput';
import { useLoadScript } from '@react-google-maps/api';

const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear + 1, currentYear + 2];

interface ImagineTripsWidgetProps {
  onCreateTrip?: (destination: string) => void;
}

const ImagineTripsWidget: React.FC<ImagineTripsWidgetProps> = ({ onCreateTrip }) => {
  // Load Google Maps Script for Places Autocomplete
  const { isLoaded: mapsLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES
  });

  const [destination, setDestination] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [periodType, setPeriodType] = useState<'exact' | 'estimated'>('estimated');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState(currentYear);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripViabilityAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Handle city selection from autocomplete
  const handleCitySelect = useCallback((city: CitySearchResult) => {
    setDestination(city.formattedAddress || `${city.name}, ${city.country}`);
    setDestinationCountry(city.country);
    setError(null);
  }, []);

  const handleAnalyze = async () => {
    if (!destination.trim()) {
      setError('Por favor, informe um destino');
      return;
    }

    // Validate dates for exact period
    if (periodType === 'exact' && (!startDate || !endDate)) {
      setError('Por favor, informe as datas de ida e volta');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const geminiService = getGeminiService();

      const period: TravelPeriod = periodType === 'exact'
        ? { type: 'exact', startDate, endDate }
        : { type: 'estimated', month, year };

      console.log('Calling analyzeDestinationViability with:', { destination, period });

      const analysis = await geminiService.analyzeDestinationViability(destination, period);

      console.log('Analysis result:', analysis);

      if (analysis) {
        setResult(analysis);
      } else {
        setError('Não foi possível analisar o destino. Verifique o console para mais detalhes.');
      }
    } catch (err) {
      console.error('Error analyzing destination:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro ao analisar destino: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getViabilityConfig = (viability: ViabilityLevel) => {
    switch (viability) {
      case 'recommended':
        return {
          label: 'Recomendado',
          bgColor: 'bg-green-100',
          textColor: 'text-green-700',
          borderColor: 'border-green-500',
          icon: 'thumb_up',
        };
      case 'acceptable':
        return {
          label: 'Aceitável',
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-700',
          borderColor: 'border-amber-500',
          icon: 'thumbs_up_down',
        };
      case 'not_recommended':
        return {
          label: 'Não Recomendado',
          bgColor: 'bg-red-100',
          textColor: 'text-red-700',
          borderColor: 'border-red-500',
          icon: 'thumb_down',
        };
    }
  };

  const handleClear = () => {
    setResult(null);
    setDestination('');
    setDestinationCountry('');
    setError(null);
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-soft">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="material-symbols-outlined text-lg text-primary-dark">auto_awesome</span>
        <h3 className="font-bold text-text-main">Imaginar Viagens com IA</h3>
      </div>

      {!result ? (
        <>
          {/* Input Section */}
          <div className="space-y-4">
            {/* Destination Input with Autocomplete */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Para onde você quer ir?
              </label>
              {mapsLoaded ? (
                <CitySearchInput
                  onSelect={handleCitySelect}
                  value={destination}
                  onChange={setDestination}
                  placeholder="Busque por uma cidade..."
                />
              ) : (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-text-muted text-lg">
                    flight_takeoff
                  </span>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="Carregando autocomplete..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
                    disabled
                  />
                </div>
              )}
              {destinationCountry && (
                <div className="mt-1.5 flex items-center gap-1 text-xs text-text-muted">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  {destination}
                </div>
              )}
            </div>

            {/* Period Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-text-muted mb-1.5">
                Quando pretende viajar?
              </label>
              <div className="flex gap-2 mb-3">
                <button
                  onClick={() => setPeriodType('estimated')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    periodType === 'estimated'
                      ? 'bg-primary text-white'
                      : 'bg-background-light text-text-muted hover:bg-gray-200'
                  }`}
                >
                  Mês aproximado
                </button>
                <button
                  onClick={() => setPeriodType('exact')}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    periodType === 'exact'
                      ? 'bg-primary text-white'
                      : 'bg-background-light text-text-muted hover:bg-gray-200'
                  }`}
                >
                  Datas exatas
                </button>
              </div>

              {/* Period Inputs */}
              {periodType === 'estimated' ? (
                <div className="flex gap-2">
                  <select
                    value={month}
                    onChange={(e) => setMonth(e.target.value)}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-white"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-24 py-2.5 px-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm bg-white"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs text-text-muted mb-1">Ida</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-text-muted mb-1">Volta</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <span className="material-symbols-outlined text-base">error</span>
                {error}
              </div>
            )}

            {/* Analyze Button */}
            <button
              onClick={handleAnalyze}
              disabled={loading || !destination.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-sm hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Analisando...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">auto_awesome</span>
                  Analisar com IA
                </>
              )}
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Result Section */}
          <div className="space-y-4">
            {/* Viability Badge */}
            {(() => {
              const config = getViabilityConfig(result.viability);
              return (
                <div className={`flex items-center gap-3 p-4 rounded-xl ${config.bgColor} border-l-4 ${config.borderColor}`}>
                  <span className={`material-symbols-outlined text-2xl ${config.textColor}`}>
                    {config.icon}
                  </span>
                  <div>
                    <div className={`font-bold ${config.textColor}`}>{config.label}</div>
                    <div className="text-sm text-text-main mt-0.5">{result.summary}</div>
                  </div>
                </div>
              );
            })()}

            {/* Climate Info */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
              <span className="material-symbols-outlined text-blue-500">thermostat</span>
              <div>
                <div className="font-medium text-text-main text-sm">{result.climate.avgTemp}</div>
                <div className="text-xs text-text-muted">{result.climate.description}</div>
              </div>
            </div>

            {/* Pros and Cons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Pros */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-green-600 font-medium text-sm">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Prós
                </div>
                <ul className="space-y-1.5">
                  {result.pros.map((pro, i) => (
                    <li key={i} className="text-xs text-text-main flex items-start gap-1.5">
                      <span className="text-green-500 mt-0.5">+</span>
                      {pro}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Cons */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-red-600 font-medium text-sm">
                  <span className="material-symbols-outlined text-base">cancel</span>
                  Contras
                </div>
                <ul className="space-y-1.5">
                  {result.cons.map((con, i) => (
                    <li key={i} className="text-xs text-text-main flex items-start gap-1.5">
                      <span className="text-red-500 mt-0.5">-</span>
                      {con}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Events */}
            {result.events.length > 0 && (
              <div className="p-3 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-purple-600 font-medium text-sm mb-2">
                  <span className="material-symbols-outlined text-base">celebration</span>
                  Eventos no período
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {result.events.map((event, i) => (
                    <span key={i} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                      {event}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {result.tips.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-1.5 text-amber-600 font-medium text-sm mb-2">
                  <span className="material-symbols-outlined text-base">lightbulb</span>
                  Dicas
                </div>
                <ul className="space-y-1">
                  {result.tips.map((tip, i) => (
                    <li key={i} className="text-xs text-text-main flex items-start gap-1.5">
                      <span className="text-amber-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleClear}
                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-text-muted font-medium text-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">refresh</span>
                Nova análise
              </button>
              {result.viability !== 'not_recommended' && onCreateTrip && (
                <button
                  onClick={() => onCreateTrip(destination)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-secondary text-text-main font-bold text-sm hover:bg-secondary-dark transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">add</span>
                  Criar viagem
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ImagineTripsWidget;

import { useState } from 'react';
import { Search, ArrowRightLeft, Calendar, Users, CalendarRange, Loader2, Bookmark, BookmarkCheck, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useAmadeusAPI } from '../hooks/useAmadeusAPI';
import { AirportInput } from './AirportInput';
import type { AirportEntry } from '../data/airports';

const MIN_DATE = new Date().toISOString().slice(0, 10);

export function SearchForm() {
  const {
    searchParams, setSearchParams, isSearching,
    savedRoutes, addSavedRoute, removeSavedRoute,
    addToast,
  } = useAppStore();
  const { searchFlights, searchCalendarFlights } = useAmadeusAPI();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [compareMode, setCompareMode] = useState(false);

  // Track display labels for origin/destination
  const [originEntry, setOriginEntry] = useState<AirportEntry | null>(null);
  const [destEntry, setDestEntry] = useState<AirportEntry | null>(null);

  const currentRouteId = `${searchParams.origin}-${searchParams.destination}`;
  const isAlreadySaved = savedRoutes.some(r => r.id === currentRouteId);
  const canSave = searchParams.origin.length >= 3 && searchParams.destination.length >= 3
    && searchParams.origin !== searchParams.destination;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const origin = searchParams.origin.trim().toUpperCase();
    const dest = searchParams.destination.trim().toUpperCase();

    if (!origin || origin.length < 3) errs.origin = 'Selecione a origem';
    if (!dest || dest.length < 3) errs.destination = 'Selecione o destino';
    if (origin === dest && origin.length >= 3) errs.destination = 'Destino deve ser diferente da origem';
    if (!searchParams.departureDate) errs.departureDate = 'Selecione a data de ida';
    if (searchParams.returnDate && searchParams.returnDate < searchParams.departureDate)
      errs.returnDate = 'Data de volta deve ser após a ida';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSearch = async () => {
    if (!validate()) return;
    const params = {
      ...searchParams,
      origin: searchParams.origin.toUpperCase(),
      destination: searchParams.destination.toUpperCase(),
    };
    if (compareMode) {
      await Promise.all([searchFlights(params), searchCalendarFlights(params)]);
    } else {
      await searchFlights(params);
    }
  };

  const swap = () => {
    setSearchParams({
      origin: searchParams.destination,
      destination: searchParams.origin,
    });
    setOriginEntry(destEntry);
    setDestEntry(originEntry);
  };

  const handleSaveRoute = () => {
    if (!canSave) return;
    const originCity = originEntry?.city || searchParams.origin;
    const destCity = destEntry?.city || searchParams.destination;
    addSavedRoute({
      id: currentRouteId,
      origin: searchParams.origin,
      destination: searchParams.destination,
      label: `${searchParams.origin} → ${searchParams.destination}`,
      originLabel: originCity,
      destinationLabel: destCity,
    });
    addToast({ type: 'success', message: `Rota ${searchParams.origin} → ${searchParams.destination} salva!` });
  };

  const applyRoute = (route: typeof savedRoutes[0]) => {
    setSearchParams({ origin: route.origin, destination: route.destination });
    setOriginEntry(null);
    setDestEntry(null);
    setErrors({});
  };

  return (
    <div className="glass-card overflow-hidden">
      {/* Saved routes chips */}
      {savedRoutes.length > 0 && (
        <div className="px-5 pt-4 flex items-center gap-2 flex-wrap border-b border-white/8 pb-3">
          <span className="text-xs text-white/30 font-medium uppercase tracking-wider shrink-0">Rotas salvas</span>
          {savedRoutes.map(route => {
            const isActive = route.origin === searchParams.origin && route.destination === searchParams.destination;
            return (
              <div
                key={route.id}
                className={`group flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-300'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white hover:border-white/20'
                }`}
                onClick={() => applyRoute(route)}
                title={route.originLabel && route.destinationLabel
                  ? `${route.originLabel} → ${route.destinationLabel}`
                  : route.label}
              >
                <span className="font-mono font-bold">{route.origin}</span>
                <ArrowRight size={10} className="opacity-50" />
                <span className="font-mono font-bold">{route.destination}</span>
                {(route.originLabel || route.destinationLabel) && (
                  <span className="text-white/30 hidden sm:inline">
                    · {route.originLabel?.split(' ')[0]}
                  </span>
                )}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    removeSavedRoute(route.id);
                  }}
                  className="ml-0.5 p-0.5 rounded-lg opacity-0 group-hover:opacity-70 hover:!opacity-100 transition-all hover:text-red-400"
                  title="Remover rota salva"
                >
                  <X size={11} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Origin */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
              Origem
            </label>
            <AirportInput
              value={searchParams.origin}
              onChange={(iata, entry) => {
                setSearchParams({ origin: iata });
                setOriginEntry(entry || null);
                setErrors(prev => ({ ...prev, origin: '' }));
              }}
              placeholder="Rio de Janeiro, GRU..."
              error={!!errors.origin}
            />
            {errors.origin && <p className="mt-1 text-xs text-red-400">{errors.origin}</p>}
          </div>

          {/* Swap */}
          <div className="flex items-end pb-1 lg:pb-0 lg:items-center justify-center">
            <button
              onClick={swap}
              className="p-2 rounded-xl bg-white/8 hover:bg-white/15 text-white/60 hover:text-white transition-all"
              title="Trocar origem/destino"
            >
              <ArrowRightLeft size={18} />
            </button>
          </div>

          {/* Destination */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider">
              Destino
            </label>
            <AirportInput
              value={searchParams.destination}
              onChange={(iata, entry) => {
                setSearchParams({ destination: iata });
                setDestEntry(entry || null);
                setErrors(prev => ({ ...prev, destination: '' }));
              }}
              placeholder="São Paulo, GIG..."
              error={!!errors.destination}
            />
            {errors.destination && <p className="mt-1 text-xs text-red-400">{errors.destination}</p>}
          </div>

          {/* Departure date */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
              <Calendar size={11} />
              Data de Ida
            </label>
            <input
              type="date"
              value={searchParams.departureDate}
              min={MIN_DATE}
              onChange={e => {
                setSearchParams({ departureDate: e.target.value });
                setErrors(prev => ({ ...prev, departureDate: '' }));
              }}
              className={`input-dark w-full ${errors.departureDate ? 'border-red-500/60' : ''}`}
            />
            {errors.departureDate && <p className="mt-1 text-xs text-red-400">{errors.departureDate}</p>}
          </div>

          {/* Return date */}
          <div className="flex-1 min-w-0">
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
              <Calendar size={11} />
              Volta (opcional)
            </label>
            <input
              type="date"
              value={searchParams.returnDate || ''}
              min={searchParams.departureDate || MIN_DATE}
              onChange={e => {
                setSearchParams({ returnDate: e.target.value });
                setErrors(prev => ({ ...prev, returnDate: '' }));
              }}
              className={`input-dark w-full ${errors.returnDate ? 'border-red-500/60' : ''}`}
            />
            {errors.returnDate && <p className="mt-1 text-xs text-red-400">{errors.returnDate}</p>}
          </div>

          {/* Passengers */}
          <div className="w-32">
            <label className="block text-xs text-white/50 mb-1.5 font-medium uppercase tracking-wider flex items-center gap-1">
              <Users size={11} />
              Passageiros
            </label>
            <select
              value={searchParams.passengers}
              onChange={e => setSearchParams({ passengers: parseInt(e.target.value) })}
              className="input-dark w-full"
            >
              {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'adulto' : 'adultos'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
          <div className="flex items-center gap-3">
            {/* Compare toggle */}
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setCompareMode(!compareMode)}
                className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${compareMode ? 'bg-indigo-600' : 'bg-white/15'}`}
              >
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${compareMode ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-white/60 flex items-center gap-1.5">
                <CalendarRange size={14} />
                Comparar ±3 dias
              </span>
            </label>

            {/* Save route button */}
            {canSave && (
              <button
                onClick={isAlreadySaved ? () => removeSavedRoute(currentRouteId) : handleSaveRoute}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  isAlreadySaved
                    ? 'bg-indigo-600/20 text-indigo-300 hover:bg-red-600/15 hover:text-red-400'
                    : 'bg-white/6 text-white/50 hover:bg-white/10 hover:text-white border border-white/10'
                }`}
                title={isAlreadySaved ? 'Remover dos salvos' : 'Salvar esta rota'}
              >
                {isAlreadySaved
                  ? <><BookmarkCheck size={13} /> Rota salva</>
                  : <><Bookmark size={13} /> Salvar rota</>
                }
              </button>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isSearching ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Buscando...
              </>
            ) : (
              <>
                <Search size={16} />
                Buscar Voos
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

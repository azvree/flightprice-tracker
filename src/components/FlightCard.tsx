import { Plane, Clock, Users, Bell, ChevronRight, Award } from 'lucide-react';
import type { Flight } from '../types';
import { formatTime, formatDuration, formatBRL } from '../utils/formatters';
import { useMonitor } from '../hooks/useMonitor';
import { useAppStore } from '../store/useAppStore';

interface FlightCardProps {
  flight: Flight;
  isCheapest?: boolean;
}

const AIRLINE_COLORS: Record<string, string> = {
  LA: 'text-red-400',
  G3: 'text-orange-400',
  AD: 'text-blue-400',
};

const AIRLINE_BG: Record<string, string> = {
  LA: 'bg-red-500/15',
  G3: 'bg-orange-500/15',
  AD: 'bg-blue-500/15',
};

export function FlightCard({ flight, isCheapest = false }: FlightCardProps) {
  const { addRoute } = useMonitor();
  const { searchParams, setActiveTab, monitoredRoutes } = useAppStore();
  const isMonitored = monitoredRoutes.some(r => r.id === `${flight.origin}-${flight.destination}-${searchParams.departureDate}`);

  const handleMonitor = () => {
    addRoute(flight, searchParams.departureDate, searchParams.passengers);
    setActiveTab('monitor');
  };

  const airlineColor = AIRLINE_COLORS[flight.airline] || 'text-violet-400';
  const airlineBg = AIRLINE_BG[flight.airline] || 'bg-violet-500/15';

  return (
    <div
      className={`glass-card p-4 transition-all hover:scale-[1.01] ${
        isCheapest ? 'ring-1 ring-emerald-500/50 shadow-emerald-500/10 shadow-lg' : ''
      }`}
    >
      {isCheapest && (
        <div className="flex items-center gap-1.5 mb-3 text-xs font-semibold text-emerald-400">
          <Award size={13} />
          Menor preço
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Airline */}
        <div className="flex items-center gap-3 sm:w-36 shrink-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${airlineBg} ${airlineColor}`}>
            {flight.airline}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{flight.airlineName}</p>
            <p className="text-xs text-white/40">{flight.flightNo}</p>
          </div>
        </div>

        {/* Route timeline */}
        <div className="flex-1 flex items-center gap-4">
          <div className="text-center">
            <p className="text-xl font-bold text-white">{formatTime(flight.departureAt)}</p>
            <p className="text-sm font-semibold text-white/50">{flight.origin}</p>
          </div>

          <div className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="flex items-center gap-1 text-xs text-white/40">
              <Clock size={11} />
              {formatDuration(flight.duration)}
            </div>
            <div className="w-full flex items-center gap-1">
              <div className="flex-1 border-t border-dashed border-white/15" />
              <Plane size={14} className="text-white/30 -rotate-0" />
              <div className="flex-1 border-t border-dashed border-white/15" />
            </div>
            {flight.stops > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-medium">
                {flight.stops} {flight.stops === 1 ? 'escala' : 'escalas'}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                Direto
              </span>
            )}
          </div>

          <div className="text-center">
            <p className="text-xl font-bold text-white">{formatTime(flight.arrivalAt)}</p>
            <p className="text-sm font-semibold text-white/50">{flight.destination}</p>
          </div>
        </div>

        {/* Price & action */}
        <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 sm:w-44 shrink-0">
          <div className="text-right">
            <p className={`text-2xl font-bold ${isCheapest ? 'text-emerald-400' : 'text-white'}`}>
              {formatBRL(flight.price)}
            </p>
            {searchParams.passengers > 1 && (
              <p className="text-xs text-white/40 flex items-center gap-1 justify-end">
                <Users size={11} />
                {formatBRL(flight.pricePerPerson)}/pessoa
              </p>
            )}
            <p className="text-xs text-white/30 mt-0.5">
              {flight.seatsAvailable} {flight.seatsAvailable === 1 ? 'assento' : 'assentos'}
            </p>
          </div>

          <button
            onClick={handleMonitor}
            disabled={isMonitored}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              isMonitored
                ? 'bg-indigo-600/30 text-indigo-300 cursor-default'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20 active:scale-95'
            }`}
          >
            <Bell size={12} />
            {isMonitored ? 'Monitorando' : 'Monitorar rota'}
            {!isMonitored && <ChevronRight size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FlightCardSkeleton() {
  return (
    <div className="glass-card p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 sm:w-36">
          <div className="w-10 h-10 rounded-xl bg-white/8" />
          <div className="space-y-1.5">
            <div className="h-3.5 w-24 rounded bg-white/8" />
            <div className="h-3 w-16 rounded bg-white/8" />
          </div>
        </div>
        <div className="flex-1">
          <div className="h-8 rounded bg-white/8" />
        </div>
        <div className="sm:w-44 space-y-2">
          <div className="h-6 w-28 rounded bg-white/8" />
          <div className="h-7 w-32 rounded bg-white/8" />
        </div>
      </div>
    </div>
  );
}

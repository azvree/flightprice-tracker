import { useAppStore } from '../store/useAppStore';
import { formatBRL, formatShortDate } from '../utils/formatters';
import { Loader2 } from 'lucide-react';

export function PriceCalendar() {
  const { calendarFlights, isLoadingCalendar, searchParams, setSearchParams } = useAppStore();

  const dates = Object.keys(calendarFlights).sort();
  if (dates.length === 0 && !isLoadingCalendar) return null;

  const prices = dates.map(date => {
    const flights = calendarFlights[date];
    if (!flights || flights.length === 0) return null;
    return Math.min(...flights.map(f => f.price));
  });

  const validPrices = prices.filter(p => p !== null) as number[];
  const minPrice = validPrices.length ? Math.min(...validPrices) : 0;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white/70">Calendário de Preços</h3>
        {isLoadingCalendar && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Loader2 size={12} className="animate-spin" />
            Carregando...
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dates.map((date, i) => {
          const price = prices[i];
          const isSelected = date === searchParams.departureDate;
          const isCheapest = price !== null && price === minPrice;

          return (
            <button
              key={date}
              onClick={() => setSearchParams({ departureDate: date })}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                  : isCheapest
                  ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              <span className="text-xs font-medium">{formatShortDate(date)}</span>
              {price !== null ? (
                <span className="text-xs font-bold leading-tight">
                  {formatBRL(price).replace('R$\u00a0', 'R$')}
                </span>
              ) : isLoadingCalendar ? (
                <div className="h-3 w-10 rounded bg-white/10 animate-pulse" />
              ) : (
                <span className="text-xs opacity-40">—</span>
              )}
              {isCheapest && !isSelected && (
                <span className="text-[10px] text-emerald-400 font-semibold">Menor</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Bell, ArrowUpDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatBRL, formatTime, formatDuration } from '../utils/formatters';
import { useMonitor } from '../hooks/useMonitor';
import type { Flight } from '../types';

const AIRLINE_COLORS: Record<string, string> = {
  LA: '#ef4444',
  G3: '#f97316',
  AD: '#3b82f6',
};

const CustomBarTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-white font-semibold">{payload[0].payload.name}</p>
      <p className="text-indigo-300 font-bold mt-1">{formatBRL(payload[0].value)}</p>
    </div>
  );
};

export function ComparisonTable() {
  const { flights, searchParams, setActiveTab } = useAppStore();
  const { addRoute } = useMonitor();
  const [sortAsc, setSortAsc] = useState(true);

  if (flights.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-white/30">
        <p className="text-sm">Faça uma busca para ver a comparação entre companhias.</p>
      </div>
    );
  }

  // Group by airline
  const byAirline: Record<string, Flight[]> = {};
  flights.forEach(f => {
    if (!byAirline[f.airline]) byAirline[f.airline] = [];
    byAirline[f.airline].push(f);
  });

  const barData = Object.entries(byAirline).map(([code, flights]) => ({
    name: flights[0].airlineName,
    code,
    price: Math.min(...flights.map(f => f.price)),
  }));

  const sorted = [...flights].sort((a, b) =>
    sortAsc ? a.price - b.price : b.price - a.price
  );

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-white/70 mb-4">Menor preço por companhia</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`}
                width={55}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="price" radius={[6, 6, 0, 0]}>
                {barData.map((entry) => (
                  <Cell
                    key={entry.code}
                    fill={AIRLINE_COLORS[entry.code] || '#6366f1'}
                    fillOpacity={0.8}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-white/70">Todos os Voos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {['Companhia', 'Voo', 'Partida', 'Chegada', 'Duração', 'Escalas'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-medium whitespace-nowrap">{h}</th>
                ))}
                <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">
                  <button
                    onClick={() => setSortAsc(!sortAsc)}
                    className="flex items-center gap-1 hover:text-white/70 transition-colors"
                  >
                    Preço <ArrowUpDown size={11} />
                  </button>
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sorted.map((flight, i) => (
                <tr
                  key={flight.id}
                  className={`border-b border-white/5 hover:bg-white/3 transition-colors ${i === 0 && sortAsc ? 'bg-emerald-500/5' : ''}`}
                >
                  <td className="px-4 py-3">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded-lg"
                      style={{
                        color: AIRLINE_COLORS[flight.airline] || '#6366f1',
                        background: (AIRLINE_COLORS[flight.airline] || '#6366f1') + '20',
                      }}
                    >
                      {flight.airlineName}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/70 font-mono text-xs">{flight.flightNo}</td>
                  <td className="px-4 py-3 text-white font-semibold">{formatTime(flight.departureAt)}</td>
                  <td className="px-4 py-3 text-white font-semibold">{formatTime(flight.arrivalAt)}</td>
                  <td className="px-4 py-3 text-white/50">{formatDuration(flight.duration)}</td>
                  <td className="px-4 py-3">
                    {flight.stops === 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">Direto</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{flight.stops}x</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">{formatBRL(flight.price)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        addRoute(flight, searchParams.departureDate, searchParams.passengers);
                        setActiveTab('monitor');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      <Bell size={11} />
                      Monitorar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

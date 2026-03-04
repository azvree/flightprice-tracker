import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts';
import type { MonitoredRoute } from '../types';
import { formatBRL } from '../utils/formatters';
import { format, parseISO } from 'date-fns';

interface PriceChartProps {
  route: MonitoredRoute;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-white/50 mb-1">{label}</p>
      <p className="text-indigo-300 font-bold">{formatBRL(payload[0].value)}</p>
      {payload[0].payload.airline && (
        <p className="text-white/40 mt-0.5">{payload[0].payload.airline} {payload[0].payload.flightNo}</p>
      )}
    </div>
  );
};

export function PriceChart({ route }: PriceChartProps) {
  const data = route.history.map(point => ({
    time: (() => {
      try { return format(parseISO(point.timestamp), 'dd/MM HH:mm'); } catch { return point.timestamp; }
    })(),
    price: point.price,
    airline: point.airline,
    flightNo: point.flightNo,
    timestamp: point.timestamp,
  }));

  const prices = route.history.map(p => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;
  const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;

  const yMin = Math.floor(minPrice * 0.95 / 10) * 10;
  const yMax = Math.ceil(maxPrice * 1.05 / 10) * 10;

  const gradientId = `gradient-${route.id.replace(/[^a-zA-Z0-9]/g, '')}`;

  return (
    <div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[yMin, yMax]}
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `R$${(v / 1000).toFixed(1)}k`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            {route.alertActive && route.alertPrice > 0 && (
              <ReferenceLine
                y={route.alertPrice}
                stroke="#a78bfa"
                strokeDasharray="6 3"
                strokeWidth={1.5}
                label={{ value: 'Alerta', fill: '#a78bfa', fontSize: 10, position: 'insideTopRight' }}
              />
            )}
            <Area
              type="monotone"
              dataKey="price"
              stroke="#6366f1"
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: '#6366f1', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/8">
        {[
          { label: 'Mínimo', value: formatBRL(minPrice), color: 'text-emerald-400' },
          { label: 'Máximo', value: formatBRL(maxPrice), color: 'text-red-400' },
          { label: 'Média', value: formatBRL(avgPrice), color: 'text-white' },
          { label: 'Pontos', value: prices.length.toString(), color: 'text-indigo-400' },
        ].map(stat => (
          <div key={stat.label} className="text-center">
            <p className="text-xs text-white/40 mb-1">{stat.label}</p>
            <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

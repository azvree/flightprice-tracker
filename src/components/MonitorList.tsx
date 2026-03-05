import { useState } from 'react';
import {
  RefreshCw,
  Trash2,
  Bell,
  BellOff,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  Timer,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useMonitor } from '../hooks/useMonitor';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { PriceChart } from './PriceChart';
import { formatBRL, formatDateTime, formatDate, calcVariationPct, formatVariation, formatCountdown } from '../utils/formatters';
import { exportJSON, exportCSV } from '../utils/storage';
import type { MonitoredRoute } from '../types';

function RouteCard({ route }: { route: MonitoredRoute }) {
  const { setAlertPrice, toggleAlert, toggleAutoRefresh } = useAppStore();
  const { refreshRoute, removeRoute } = useMonitor();
  const { countdowns, resetCountdown, intervalSeconds } = useAutoRefresh();
  const [expanded, setExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [alertInput, setAlertInput] = useState(route.alertPrice > 0 ? route.alertPrice.toString() : '');

  const variation = calcVariationPct(route.currentPrice, route.lastPrice);
  const alertTriggered = route.alertActive && route.alertPrice > 0 && route.currentPrice <= route.alertPrice;
  const countdown = countdowns[route.id] ?? intervalSeconds;

  // Find the history point that achieved the minimum price
  const minPoint = route.history.length > 0
    ? route.history.reduce((best, p) => p.price < best.price ? p : best, route.history[0])
    : null;

  // Decolar deep-link for this route
  const decolaUrl = `https://www.decolar.com/shop/flights/results/one-way/${route.origin}/${route.destination}/${route.departureDate}/1/0/0`;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRoute(route.id);
    resetCountdown(route.id);
    setRefreshing(false);
  };

  const handleAlertSave = () => {
    const val = parseFloat(alertInput.replace(',', '.'));
    if (!isNaN(val) && val > 0) {
      setAlertPrice(route.id, val);
    }
  };

  return (
    <div className={`glass-card overflow-hidden transition-all ${alertTriggered ? 'ring-1 ring-emerald-500/60 shadow-emerald-500/10 shadow-lg' : ''}`}>
      {alertTriggered && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 border-b border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <Bell size={13} className="animate-pulse" />
          Alerta ativado! Preço abaixo do seu objetivo
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white">{route.label}</h3>
              {route.airlineName && (
                <span className="text-xs text-white/40 bg-white/5 px-2 py-0.5 rounded-full">
                  {route.airlineName} · {route.flightNo}
                </span>
              )}
            </div>
            <p className="text-xs text-white/30 mt-1 flex items-center gap-1">
              <Clock size={10} />
              Atualizado: {formatDateTime(route.lastUpdated)}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-white">{formatBRL(route.currentPrice)}</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {variation > 0.5 ? (
                <TrendingUp size={13} className="text-red-400" />
              ) : variation < -0.5 ? (
                <TrendingDown size={13} className="text-emerald-400" />
              ) : (
                <Minus size={13} className="text-white/30" />
              )}
              <span
                className={`text-xs font-semibold ${
                  variation > 0.5 ? 'text-red-400' : variation < -0.5 ? 'text-emerald-400' : 'text-white/30'
                }`}
              >
                {Math.abs(variation) > 0.1 ? formatVariation(variation) : 'Sem variação'}
              </span>
            </div>
          </div>
        </div>

        {/* Min/Max */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-white/8">
          <div>
            <p className="text-xs text-white/30">Mínimo histórico</p>
            <p className="text-sm font-semibold text-emerald-400">{formatBRL(route.minPrice)}</p>
            {minPoint && (minPoint.airline || minPoint.flightNo) && (
              <p className="text-[11px] text-white/30 mt-0.5">
                {[minPoint.airline, minPoint.flightNo].filter(Boolean).join(' · ')}
              </p>
            )}
            {minPoint && (
              <p className="text-[11px] text-white/20 mt-0.5">{formatDateTime(minPoint.timestamp)}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-white/30">Máximo histórico</p>
            <p className="text-sm font-semibold text-red-400">{formatBRL(route.maxPrice)}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-white/30 flex items-center gap-1 justify-end">
              <Timer size={10} />
              Próxima atualização
              {intervalSeconds >= 3600 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-semibold ml-1">
                  2×/dia
                </span>
              )}
            </p>
            <p className={`text-sm font-semibold ${route.autoRefreshEnabled ? 'text-indigo-400' : 'text-white/20'}`}>
              {route.autoRefreshEnabled ? formatCountdown(countdown) : 'Desativado'}
            </p>
          </div>
        </div>

        {/* Alert config */}
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/8">
          <div className="flex-1 flex items-center gap-2">
            <input
              type="number"
              value={alertInput}
              onChange={e => setAlertInput(e.target.value)}
              onBlur={handleAlertSave}
              placeholder="Preço-alvo (R$)"
              className="input-dark flex-1 text-sm py-1.5"
            />
            <button
              onClick={() => toggleAlert(route.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                route.alertActive
                  ? 'bg-indigo-600/30 text-indigo-300 hover:bg-red-600/20 hover:text-red-300'
                  : 'bg-white/8 text-white/50 hover:bg-indigo-600/20 hover:text-indigo-300'
              }`}
            >
              {route.alertActive ? <Bell size={12} /> : <BellOff size={12} />}
              {route.alertActive ? 'Alerta ativo' : 'Ativar alerta'}
            </button>
          </div>
          <button
            onClick={() => toggleAutoRefresh(route.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              route.autoRefreshEnabled ? 'text-indigo-400 bg-indigo-600/15' : 'text-white/20 bg-white/5'
            }`}
            title={route.autoRefreshEnabled ? 'Desativar auto-refresh' : 'Ativar auto-refresh'}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/8">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Atualizar agora
          </button>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 text-xs font-medium transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'Ocultar' : 'Ver gráfico'}
          </button>
          <a
            href={decolaUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-medium transition-colors"
            title={`Buscar ${route.origin} → ${route.destination} em ${formatDate(route.departureDate)} no Decolar`}
          >
            <ExternalLink size={13} />
            Comprar
          </a>
          <button
            onClick={() => removeRoute(route.id)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition-colors"
          >
            <Trash2 size={13} />
            Remover
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/8 pt-4">
          <PriceChart route={route} />
        </div>
      )}
    </div>
  );
}

export function MonitorList() {
  const { monitoredRoutes } = useAppStore();

  if (monitoredRoutes.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Bell size={40} className="text-white/10 mx-auto mb-3" />
        <p className="text-white/40 font-medium">Nenhuma rota monitorada</p>
        <p className="text-white/20 text-sm mt-1">Busque voos e clique em "Monitorar rota" para começar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export buttons */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => exportJSON(monitoredRoutes)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/12 text-white/60 hover:text-white text-xs font-medium transition-colors"
        >
          <Download size={13} />
          Exportar JSON
        </button>
        <button
          onClick={() => exportCSV(monitoredRoutes)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/12 text-white/60 hover:text-white text-xs font-medium transition-colors"
        >
          <Download size={13} />
          Exportar CSV
        </button>
      </div>

      {monitoredRoutes.map(route => (
        <RouteCard key={route.id} route={route} />
      ))}
    </div>
  );
}

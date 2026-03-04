import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMonitor } from './useMonitor';

const INTERVAL_BY_PROVIDER = {
  demo:    30 * 60,       // 30 minutos
  amadeus: 30 * 60,       // 30 minutos
  serpapi: 12 * 60 * 60,  // 12 horas (2x por dia — economiza as 100 buscas/mês)
} as const;

export function useAutoRefresh() {
  const monitoredRoutes = useAppStore(s => s.monitoredRoutes);
  const activeProvider  = useAppStore(s => s.activeProvider);
  const { refreshRoute } = useMonitor();
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const refreshingRef = useRef<Set<string>>(new Set());

  const intervalSeconds = INTERVAL_BY_PROVIDER[activeProvider];

  // Initialize countdown for newly added routes
  useEffect(() => {
    const newCountdowns: Record<string, number> = {};
    monitoredRoutes.forEach(route => {
      if (!(route.id in countdowns)) {
        newCountdowns[route.id] = intervalSeconds;
      }
    });
    if (Object.keys(newCountdowns).length > 0) {
      setCountdowns(prev => ({ ...prev, ...newCountdowns }));
    }
  }, [monitoredRoutes.map(r => r.id).join(',')]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const next = { ...prev };
        monitoredRoutes.forEach(route => {
          if (!route.autoRefreshEnabled) {
            next[route.id] = intervalSeconds;
            return;
          }

          const current = next[route.id] ?? intervalSeconds;
          if (current <= 1) {
            if (!refreshingRef.current.has(route.id)) {
              refreshingRef.current.add(route.id);
              refreshRoute(route.id).finally(() => {
                refreshingRef.current.delete(route.id);
              });
            }
            next[route.id] = intervalSeconds;
          } else {
            next[route.id] = current - 1;
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [monitoredRoutes, refreshRoute, intervalSeconds]);

  const resetCountdown = (routeId: string) => {
    setCountdowns(prev => ({ ...prev, [routeId]: intervalSeconds }));
  };

  return { countdowns, resetCountdown, intervalSeconds };
}

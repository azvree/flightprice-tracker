import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useMonitor } from './useMonitor';

const REFRESH_INTERVAL_SECONDS = 30 * 60; // 30 minutes

export function useAutoRefresh() {
  const monitoredRoutes = useAppStore(s => s.monitoredRoutes);
  const { refreshRoute } = useMonitor();
  const [countdowns, setCountdowns] = useState<Record<string, number>>({});
  const refreshingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Initialize countdowns for all routes
    const newCountdowns: Record<string, number> = {};
    monitoredRoutes.forEach(route => {
      if (!(route.id in countdowns)) {
        newCountdowns[route.id] = REFRESH_INTERVAL_SECONDS;
      } else {
        newCountdowns[route.id] = countdowns[route.id];
      }
    });
    setCountdowns(prev => ({ ...prev, ...newCountdowns }));
  }, [monitoredRoutes.map(r => r.id).join(',')]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdowns(prev => {
        const next = { ...prev };
        monitoredRoutes.forEach(route => {
          if (!route.autoRefreshEnabled) {
            next[route.id] = REFRESH_INTERVAL_SECONDS;
            return;
          }

          const current = next[route.id] ?? REFRESH_INTERVAL_SECONDS;
          if (current <= 1) {
            // Trigger refresh
            if (!refreshingRef.current.has(route.id)) {
              refreshingRef.current.add(route.id);
              refreshRoute(route.id).finally(() => {
                refreshingRef.current.delete(route.id);
              });
            }
            next[route.id] = REFRESH_INTERVAL_SECONDS;
          } else {
            next[route.id] = current - 1;
          }
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [monitoredRoutes, refreshRoute]);

  const resetCountdown = (routeId: string) => {
    setCountdowns(prev => ({ ...prev, [routeId]: REFRESH_INTERVAL_SECONDS }));
  };

  return { countdowns, resetCountdown };
}

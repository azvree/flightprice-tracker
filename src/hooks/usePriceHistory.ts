import { useCallback } from 'react';
import { saveHistory, loadHistory, clearHistory } from '../utils/storage';
import type { PricePoint } from '../types';

const MAX_POINTS = 500;

export function usePriceHistory() {
  const getHistory = useCallback((routeId: string): PricePoint[] => {
    return loadHistory(routeId);
  }, []);

  const addPoint = useCallback((routeId: string, point: PricePoint) => {
    const history = loadHistory(routeId);
    const updated = [...history, point].slice(-MAX_POINTS);
    saveHistory(routeId, updated);
    return updated;
  }, []);

  const clearRouteHistory = useCallback((routeId: string) => {
    clearHistory(routeId);
  }, []);

  return { getHistory, addPoint, clearRouteHistory };
}

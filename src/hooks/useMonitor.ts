import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAmadeusAPI } from './useAmadeusAPI';
import type { Flight, MonitoredRoute } from '../types';
import { generateDemoHistory } from '../utils/demoData';
import { saveHistory } from '../utils/storage';

function buildRouteId(origin: string, destination: string, departureDate: string): string {
  return `${origin}-${destination}-${departureDate}`;
}

export function useMonitor() {
  const { addMonitoredRoute, removeMonitoredRoute, updateRoutePrice, monitoredRoutes, addToast, isDemoMode } =
    useAppStore();
  const { fetchRoutePrice } = useAmadeusAPI();

  const addRoute = useCallback(
    (flight: Flight, departureDate: string, passengers: number) => {
      const id = buildRouteId(flight.origin, flight.destination, departureDate);

      if (monitoredRoutes.find(r => r.id === id)) {
        addToast({ type: 'warning', message: 'Essa rota já está sendo monitorada.' });
        return;
      }

      // Pre-populate demo history
      let history: MonitoredRoute['history'] = [];
      if (isDemoMode) {
        const basePrice = Math.round(flight.price * 0.9);
        history = generateDemoHistory(flight.origin, flight.destination, basePrice, 10);
      }

      const route: MonitoredRoute = {
        id,
        origin: flight.origin,
        destination: flight.destination,
        label: `${flight.origin} → ${flight.destination}`,
        alertPrice: 0,
        alertActive: false,
        currentPrice: flight.price,
        minPrice: Math.min(flight.price, ...history.map(h => h.price)),
        maxPrice: Math.max(flight.price, ...history.map(h => h.price)),
        lastPrice: flight.price,
        history: [
          ...history,
          {
            timestamp: new Date().toISOString(),
            price: flight.price,
            airline: flight.airline,
            flightNo: flight.flightNo,
          },
        ],
        lastUpdated: new Date().toISOString(),
        autoRefreshEnabled: true,
        airline: flight.airline,
        airlineName: flight.airlineName,
        flightNo: flight.flightNo,
        departureDate,
        passengers,
      };

      // Save history separately
      saveHistory(id, route.history);
      addMonitoredRoute(route);
      addToast({ type: 'success', message: `Rota ${route.label} adicionada ao monitoramento.` });
    },
    [monitoredRoutes, addMonitoredRoute, addToast, isDemoMode]
  );

  const refreshRoute = useCallback(
    async (routeId: string) => {
      const route = monitoredRoutes.find(r => r.id === routeId);
      if (!route) return;

      const result = await fetchRoutePrice(
        route.origin,
        route.destination,
        route.departureDate,
        route.passengers
      );

      if (!result) {
        addToast({ type: 'error', message: `Erro ao atualizar ${route.label}.` });
        return;
      }

      updateRoutePrice(routeId, result.price, result.airline, result.flightNo);

      // Save updated history
      const updatedRoute = useAppStore.getState().monitoredRoutes.find(r => r.id === routeId);
      if (updatedRoute) {
        saveHistory(routeId, updatedRoute.history);
      }

      // Check alert
      const { alertActive, alertPrice } = route;
      if (alertActive && alertPrice > 0 && result.price <= alertPrice) {
        addToast({
          type: 'success',
          message: `Alerta! ${route.label} chegou a R$ ${result.price.toFixed(2).replace('.', ',')}`,
        });
      }

      addToast({ type: 'info', message: `${route.label} atualizado com sucesso.` });
    },
    [monitoredRoutes, fetchRoutePrice, updateRoutePrice, addToast]
  );

  const removeRoute = useCallback(
    (routeId: string) => {
      removeMonitoredRoute(routeId);
      addToast({ type: 'info', message: 'Rota removida do monitoramento.' });
    },
    [removeMonitoredRoute, addToast]
  );

  return { addRoute, refreshRoute, removeRoute };
}

import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useAmadeusAPI } from './useAmadeusAPI';
import type { Flight, MonitoredRoute, SearchParams } from '../types';
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

  const monitorRoute = useCallback(
    async (params: SearchParams): Promise<boolean> => {
      const id = buildRouteId(params.origin, params.destination, params.departureDate);

      if (monitoredRoutes.find(r => r.id === id)) {
        addToast({ type: 'warning', message: 'Essa rota já está sendo monitorada.' });
        return false;
      }

      const result = await fetchRoutePrice(
        params.origin,
        params.destination,
        params.departureDate,
        params.passengers
      );

      if (!result) {
        addToast({ type: 'error', message: 'Nenhum voo encontrado para monitorar nessa rota/data.' });
        return false;
      }

      let history: MonitoredRoute['history'] = [];
      if (isDemoMode) {
        history = generateDemoHistory(params.origin, params.destination, Math.round(result.price * 0.9), 10);
      }

      const route: MonitoredRoute = {
        id,
        origin: params.origin,
        destination: params.destination,
        label: `${params.origin} → ${params.destination}`,
        alertPrice: 0,
        alertActive: false,
        currentPrice: result.price,
        minPrice: Math.min(result.price, ...history.map(h => h.price)),
        maxPrice: Math.max(result.price, ...history.map(h => h.price)),
        lastPrice: result.price,
        history: [
          ...history,
          { timestamp: new Date().toISOString(), price: result.price, airline: result.airline, flightNo: result.flightNo },
        ],
        lastUpdated: new Date().toISOString(),
        autoRefreshEnabled: true,
        airline: result.airline,
        airlineName: result.airline,
        flightNo: result.flightNo,
        departureDate: params.departureDate,
        passengers: params.passengers,
      };

      saveHistory(id, route.history);
      addMonitoredRoute(route);
      addToast({ type: 'success', message: `Monitorando ${route.label} — menor preço: ${result.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` });
      return true;
    },
    [monitoredRoutes, fetchRoutePrice, addMonitoredRoute, addToast, isDemoMode]
  );

  const removeRoute = useCallback(
    (routeId: string) => {
      removeMonitoredRoute(routeId);
      addToast({ type: 'info', message: 'Rota removida do monitoramento.' });
    },
    [removeMonitoredRoute, addToast]
  );

  return { addRoute, refreshRoute, removeRoute, monitorRoute };
}

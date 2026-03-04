import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { searchFlightsAPI } from '../utils/amadeus';
import { generateDemoFlights, simulateDelay } from '../utils/demoData';
import type { SearchParams } from '../types';

export function useAmadeusAPI() {
  const {
    isDemoMode,
    credentials,
    setFlights,
    setSearching,
    addToast,
    setLoadingCalendar,
  } = useAppStore();

  const searchFlights = useCallback(async (params: SearchParams) => {
    setSearching(true);
    setFlights([]);
    try {
      let flights;
      if (isDemoMode) {
        await simulateDelay();
        flights = generateDemoFlights(params);
      } else {
        if (!credentials?.clientId || !credentials?.clientSecret) {
          throw new Error('Credenciais da Amadeus não configuradas. Abra as configurações.');
        }
        flights = await searchFlightsAPI(credentials, params);
      }

      if (flights.length === 0) {
        addToast({ type: 'warning', message: 'Nenhum voo encontrado para essa rota/data.' });
      } else {
        addToast({ type: 'success', message: `${flights.length} voo(s) encontrado(s).` });
      }

      setFlights(flights);
      return flights;
    } catch (err: any) {
      const msg = err?.message || 'Erro ao buscar voos. Tente novamente.';
      addToast({ type: 'error', message: msg });
      return [];
    } finally {
      setSearching(false);
    }
  }, [isDemoMode, credentials, setFlights, setSearching, addToast]);

  const searchCalendarFlights = useCallback(async (params: SearchParams) => {
    setLoadingCalendar(true);
    try {
      const baseDate = new Date(params.departureDate);
      const dates: string[] = [];
      for (let offset = -3; offset <= 3; offset++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + offset);
        dates.push(d.toISOString().slice(0, 10));
      }

      const results: Record<string, any[]> = {};

      await Promise.all(
        dates.map(async (date) => {
          try {
            let flights;
            if (isDemoMode) {
              await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
              const variation = (Math.random() * 0.4 - 0.2);
              flights = generateDemoFlights({ ...params, departureDate: date }, variation);
            } else {
              if (!credentials?.clientId) throw new Error('No credentials');
              flights = await searchFlightsAPI(credentials, { ...params, departureDate: date });
            }
            results[date] = flights;
          } catch {
            results[date] = [];
          }
        })
      );

      useAppStore.getState().setCalendarFlights(results);
    } catch (err: any) {
      addToast({ type: 'error', message: 'Erro ao carregar calendário de preços.' });
    } finally {
      setLoadingCalendar(false);
    }
  }, [isDemoMode, credentials, setLoadingCalendar, addToast]);

  const fetchRoutePrice = useCallback(async (
    origin: string,
    destination: string,
    departureDate: string,
    passengers: number
  ): Promise<{ price: number; airline?: string; flightNo?: string } | null> => {
    try {
      const params: SearchParams = { origin, destination, departureDate, passengers };
      let flights;
      if (isDemoMode) {
        await simulateDelay();
        flights = generateDemoFlights(params);
      } else {
        if (!credentials?.clientId) return null;
        flights = await searchFlightsAPI(credentials, params);
      }

      if (flights.length === 0) return null;
      const cheapest = flights.sort((a, b) => a.price - b.price)[0];
      return {
        price: cheapest.price,
        airline: cheapest.airline,
        flightNo: cheapest.flightNo,
      };
    } catch {
      return null;
    }
  }, [isDemoMode, credentials]);

  return { searchFlights, searchCalendarFlights, fetchRoutePrice };
}

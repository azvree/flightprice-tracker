import { useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { searchFlightsAPI } from '../utils/amadeus';
import { searchFlightsSerpapi } from '../utils/serpapi';
import { generateDemoFlights, simulateDelay } from '../utils/demoData';
import type { Flight, SearchParams } from '../types';

export function useAmadeusAPI() {
  const {
    activeProvider,
    credentials,
    serpapiCredentials,
    setFlights,
    setSearching,
    addToast,
    setLoadingCalendar,
  } = useAppStore();

  // Central search dispatcher — routes to correct provider
  const doSearch = useCallback(async (params: SearchParams): Promise<Flight[]> => {
    if (activeProvider === 'demo') {
      await simulateDelay();
      return generateDemoFlights(params);
    }
    if (activeProvider === 'serpapi') {
      if (!serpapiCredentials?.apiKey) {
        throw new Error('Chave da Serpapi não configurada. Abra as configurações.');
      }
      return searchFlightsSerpapi(serpapiCredentials, params);
    }
    // amadeus
    if (!credentials?.clientId || !credentials?.clientSecret) {
      throw new Error('Credenciais da Amadeus não configuradas. Abra as configurações.');
    }
    return searchFlightsAPI(credentials, params);
  }, [activeProvider, credentials, serpapiCredentials]);

  const searchFlights = useCallback(async (params: SearchParams) => {
    setSearching(true);
    setFlights([]);
    try {
      const flights = await doSearch(params);

      if (flights.length === 0) {
        addToast({ type: 'warning', message: 'Nenhum voo encontrado para essa rota/data.' });
      } else {
        addToast({ type: 'success', message: `${flights.length} voo(s) encontrado(s).` });
      }

      setFlights(flights);
      return flights;
    } catch (err: any) {
      addToast({ type: 'error', message: err?.message || 'Erro ao buscar voos. Tente novamente.' });
      return [];
    } finally {
      setSearching(false);
    }
  }, [doSearch, setFlights, setSearching, addToast]);

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

      const results: Record<string, Flight[]> = {};

      await Promise.all(
        dates.map(async (date) => {
          try {
            const flights = await doSearch({ ...params, departureDate: date });
            results[date] = flights;
          } catch {
            results[date] = [];
          }
        })
      );

      useAppStore.getState().setCalendarFlights(results);
    } catch {
      addToast({ type: 'error', message: 'Erro ao carregar calendário de preços.' });
    } finally {
      setLoadingCalendar(false);
    }
  }, [doSearch, setLoadingCalendar, addToast]);

  const fetchRoutePrice = useCallback(async (
    origin: string,
    destination: string,
    departureDate: string,
    passengers: number,
    returnDate?: string,
  ): Promise<{ price: number; airline?: string; flightNo?: string } | null> => {
    try {
      const params: SearchParams = { origin, destination, departureDate, passengers, returnDate };
      const flights = await doSearch(params);
      if (flights.length === 0) return null;
      const cheapest = flights.sort((a, b) => a.price - b.price)[0];
      return { price: cheapest.price, airline: cheapest.airline, flightNo: cheapest.flightNo };
    } catch {
      return null;
    }
  }, [doSearch]);

  return { searchFlights, searchCalendarFlights, fetchRoutePrice };
}

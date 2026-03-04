import { create } from 'zustand';
import type { Flight, MonitoredRoute, Toast, AppTab, SearchParams, AmadeusCredentials, SavedRoute } from '../types';
import {
  loadCredentials,
  loadDemoMode,
  loadRoutes,
  saveCredentials,
  saveDemoMode,
  saveRoutes,
  saveFavoriteRoutes,
  loadFavoriteRoutes,
} from '../utils/storage';

interface AppState {
  // Settings
  credentials: AmadeusCredentials | null;
  isDemoMode: boolean;

  // Search
  searchParams: SearchParams;
  flights: Flight[];
  isSearching: boolean;
  calendarFlights: Record<string, Flight[]>; // date -> flights
  isLoadingCalendar: boolean;

  // UI
  activeTab: AppTab;
  showSettings: boolean;
  toasts: Toast[];

  // Monitor
  monitoredRoutes: MonitoredRoute[];

  // Saved routes (quick-fill)
  savedRoutes: SavedRoute[];
  addSavedRoute: (route: SavedRoute) => void;
  removeSavedRoute: (id: string) => void;

  // Actions - Settings
  setCredentials: (creds: AmadeusCredentials) => void;
  setDemoMode: (demo: boolean) => void;
  setShowSettings: (show: boolean) => void;

  // Actions - Search
  setSearchParams: (params: Partial<SearchParams>) => void;
  setFlights: (flights: Flight[]) => void;
  setSearching: (loading: boolean) => void;
  setCalendarFlights: (data: Record<string, Flight[]>) => void;
  setLoadingCalendar: (loading: boolean) => void;

  // Actions - UI
  setActiveTab: (tab: AppTab) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;

  // Actions - Monitor
  addMonitoredRoute: (route: MonitoredRoute) => void;
  removeMonitoredRoute: (id: string) => void;
  updateRoutePrice: (id: string, price: number, airline?: string, flightNo?: string) => void;
  setAlertPrice: (id: string, price: number) => void;
  toggleAlert: (id: string) => void;
  toggleAutoRefresh: (id: string) => void;
}

const defaultSearchParams: SearchParams = {
  origin: '',
  destination: '',
  departureDate: '',
  returnDate: '',
  passengers: 1,
};

export const useAppStore = create<AppState>((set, _get) => ({
  // Initial state - hydrated from localStorage
  credentials: loadCredentials(),
  isDemoMode: loadDemoMode(),
  searchParams: defaultSearchParams,
  flights: [],
  isSearching: false,
  calendarFlights: {},
  isLoadingCalendar: false,
  activeTab: 'search',
  showSettings: false,
  toasts: [],
  monitoredRoutes: loadRoutes(),
  savedRoutes: loadFavoriteRoutes(),

  // Settings
  setCredentials: (creds) => {
    saveCredentials(creds);
    set({ credentials: creds });
  },
  setDemoMode: (demo) => {
    saveDemoMode(demo);
    set({ isDemoMode: demo });
  },
  setShowSettings: (show) => set({ showSettings: show }),

  // Search
  setSearchParams: (params) =>
    set(state => ({ searchParams: { ...state.searchParams, ...params } })),
  setFlights: (flights) => set({ flights }),
  setSearching: (loading) => set({ isSearching: loading }),
  setCalendarFlights: (data) => set({ calendarFlights: data }),
  setLoadingCalendar: (loading) => set({ isLoadingCalendar: loading }),

  // UI
  setActiveTab: (tab) => set({ activeTab: tab }),
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
  },
  removeToast: (id) =>
    set(state => ({ toasts: state.toasts.filter(t => t.id !== id) })),

  // Monitor
  addMonitoredRoute: (route) => {
    set(state => {
      const existing = state.monitoredRoutes.find(r => r.id === route.id);
      if (existing) return state;
      const updated = [...state.monitoredRoutes, route];
      saveRoutes(updated);
      return { monitoredRoutes: updated };
    });
  },
  removeMonitoredRoute: (id) => {
    set(state => {
      const updated = state.monitoredRoutes.filter(r => r.id !== id);
      saveRoutes(updated);
      return { monitoredRoutes: updated };
    });
  },
  updateRoutePrice: (id, price, airline, flightNo) => {
    set(state => {
      const updated = state.monitoredRoutes.map(route => {
        if (route.id !== id) return route;

        const newPoint = {
          timestamp: new Date().toISOString(),
          price,
          airline,
          flightNo,
        };

        const newHistory = [...route.history, newPoint].slice(-500);

        return {
          ...route,
          lastPrice: route.currentPrice,
          currentPrice: price,
          minPrice: Math.min(route.minPrice, price),
          maxPrice: Math.max(route.maxPrice, price),
          history: newHistory,
          lastUpdated: new Date().toISOString(),
          airline: airline || route.airline,
          flightNo: flightNo || route.flightNo,
        };
      });
      saveRoutes(updated);
      return { monitoredRoutes: updated };
    });
  },
  setAlertPrice: (id, alertPrice) => {
    set(state => {
      const updated = state.monitoredRoutes.map(r =>
        r.id === id ? { ...r, alertPrice } : r
      );
      saveRoutes(updated);
      return { monitoredRoutes: updated };
    });
  },
  toggleAlert: (id) => {
    set(state => {
      const updated = state.monitoredRoutes.map(r =>
        r.id === id ? { ...r, alertActive: !r.alertActive } : r
      );
      saveRoutes(updated);
      return { monitoredRoutes: updated };
    });
  },
  toggleAutoRefresh: (id) => {
    set(state => {
      const updated = state.monitoredRoutes.map(r =>
        r.id === id ? { ...r, autoRefreshEnabled: !r.autoRefreshEnabled } : r
      );
      saveRoutes(updated);
      return { monitoredRoutes: updated };
    });
  },

  addSavedRoute: (route) => {
    set(state => {
      if (state.savedRoutes.find(r => r.id === route.id)) return state;
      const updated = [...state.savedRoutes, route];
      saveFavoriteRoutes(updated);
      return { savedRoutes: updated };
    });
  },
  removeSavedRoute: (id) => {
    set(state => {
      const updated = state.savedRoutes.filter(r => r.id !== id);
      saveFavoriteRoutes(updated);
      return { savedRoutes: updated };
    });
  },
}));

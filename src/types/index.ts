export interface Flight {
  id: string;
  airline: string;
  airlineName: string;
  flightNo: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  duration: string;
  stops: number;
  price: number;
  pricePerPerson: number;
  currency: string;
  seatsAvailable: number;
}

export interface PricePoint {
  timestamp: string;
  price: number;
  airline?: string;
  flightNo?: string;
}

export interface MonitoredRoute {
  id: string;
  origin: string;
  destination: string;
  label: string;
  alertPrice: number;
  alertActive: boolean;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  lastPrice: number;
  history: PricePoint[];
  lastUpdated: string;
  autoRefreshEnabled: boolean;
  airline?: string;
  airlineName?: string;
  flightNo?: string;
  departureDate: string;
  passengers: number;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  passengers: number;
}

export interface AmadeusCredentials {
  clientId: string;
  clientSecret: string;
  accessToken?: string;
  tokenExpiry?: number;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export type AppTab = 'search' | 'monitor' | 'compare';

export interface SavedRoute {
  id: string;
  origin: string;
  destination: string;
  label: string;
  originLabel?: string;
  destinationLabel?: string;
}

export interface CalendarDay {
  date: string;
  lowestPrice: number | null;
  flights: Flight[];
}

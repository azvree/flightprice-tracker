import type { Flight, SearchParams } from '../types';

const BASE_URL = 'https://serpapi.com/search';

export interface SerpapiCredentials {
  apiKey: string;
}

export async function searchFlightsSerpapi(
  credentials: SerpapiCredentials,
  params: SearchParams
): Promise<Flight[]> {
  const query = new URLSearchParams({
    engine: 'google_flights',
    api_key: credentials.apiKey,
    departure_id: params.origin,
    arrival_id: params.destination,
    outbound_date: params.departureDate,
    adults: String(params.passengers),
    currency: 'BRL',
    hl: 'pt',
    type: params.returnDate ? '1' : '2', // 1=round trip, 2=one way
  });

  if (params.returnDate) {
    query.set('return_date', params.returnDate);
  }

  const response = await fetch(`${BASE_URL}?${query.toString()}`);

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error || `Erro na busca: ${response.status}`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  const allFlights = [
    ...(data.best_flights || []),
    ...(data.other_flights || []),
  ];

  return parseSerpapiFlights(allFlights, params);
}

function parseSerpapiFlights(raw: any[], params: SearchParams): Flight[] {
  const results: Flight[] = [];

  for (const offer of raw) {
    if (!offer.flights?.length) continue;

    const firstSeg = offer.flights[0];
    const lastSeg = offer.flights[offer.flights.length - 1];
    const stops = offer.flights.length - 1;
    const price = offer.price ?? 0;

    // Convert duration in minutes to ISO 8601-ish string PT#H#M
    const totalMin: number = offer.total_duration ?? firstSeg.duration ?? 0;
    const durationStr = minutesToDuration(totalMin);

    // airline code: try to extract 2-letter IATA from flight_number
    const flightNo: string = firstSeg.flight_number || '';
    const airlineCode = flightNo.slice(0, 2).toUpperCase();
    const airlineName: string = firstSeg.airline || airlineCode;

    results.push({
      id: `sp-${flightNo}-${firstSeg.departure_airport?.time || Date.now()}`,
      airline: airlineCode,
      airlineName,
      flightNo,
      origin: firstSeg.departure_airport?.id || params.origin,
      destination: lastSeg.arrival_airport?.id || params.destination,
      departureAt: isoFromGoogleTime(firstSeg.departure_airport?.time, params.departureDate),
      arrivalAt: isoFromGoogleTime(lastSeg.arrival_airport?.time, params.departureDate),
      duration: durationStr,
      stops,
      price,
      pricePerPerson: Math.round(price / params.passengers),
      currency: 'BRL',
      seatsAvailable: 9, // Serpapi doesn't provide seat count
    });
  }

  return results.sort((a, b) => a.price - b.price);
}

// "2025-03-10 14:30" → full ISO string
function isoFromGoogleTime(timeStr: string | undefined, dateHint: string): string {
  if (!timeStr) return dateHint + 'T00:00:00';
  // timeStr format: "2025-03-10 14:30"
  if (timeStr.includes(' ')) {
    return timeStr.replace(' ', 'T') + ':00';
  }
  return dateHint + 'T' + timeStr + ':00';
}

// 90 minutes → "PT1H30M"
function minutesToDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `PT${m}M`;
  if (m === 0) return `PT${h}H`;
  return `PT${h}H${m}M`;
}

export async function validateSerpapiKey(apiKey: string): Promise<void> {
  // Make a minimal request to validate the key
  const query = new URLSearchParams({
    engine: 'google_flights',
    api_key: apiKey,
    departure_id: 'GRU',
    arrival_id: 'GIG',
    outbound_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    type: '2',
    currency: 'BRL',
    hl: 'pt',
  });

  const response = await fetch(`${BASE_URL}?${query.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (data.error) {
    throw new Error(data.error);
  }
  if (!response.ok) {
    throw new Error(`Chave inválida ou erro de conexão (${response.status})`);
  }
}

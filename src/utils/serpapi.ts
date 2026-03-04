import type { Flight, SearchParams } from '../types';

const BASE_URL = '/api/serpapi';

// City group codes → all airports (for parallel searches)
const CITY_AIRPORTS: Record<string, string[]> = {
  RIO: ['GIG', 'SDU'],
  SAO: ['GRU', 'CGH', 'VCP'],
  BHZ: ['CNF', 'PLU'],
};
const expandAirports = (code: string): string[] => CITY_AIRPORTS[code] ?? [code];

export interface SerpapiCredentials {
  apiKey: string;
}

export async function searchFlightsSerpapi(
  credentials: SerpapiCredentials,
  params: SearchParams
): Promise<Flight[]> {
  const origins = expandAirports(params.origin);
  const destinations = expandAirports(params.destination);

  // Run all origin×destination combinations in parallel
  const pairs: [string, string][] = [];
  for (const o of origins) {
    for (const d of destinations) {
      pairs.push([o, d]);
    }
  }

  const results = await Promise.all(
    pairs.map(([dep, arr]) => fetchOnePair(credentials, params, dep, arr))
  );

  // Merge, deduplicate by id, sort by price
  const seen = new Set<string>();
  const merged: Flight[] = [];
  for (const batch of results) {
    for (const f of batch) {
      if (!seen.has(f.id)) {
        seen.add(f.id);
        merged.push(f);
      }
    }
  }
  return merged.sort((a, b) => a.price - b.price);
}

async function fetchOnePair(
  credentials: SerpapiCredentials,
  params: SearchParams,
  departure_id: string,
  arrival_id: string
): Promise<Flight[]> {
  const query = new URLSearchParams({
    engine: 'google_flights',
    api_key: credentials.apiKey,
    departure_id,
    arrival_id,
    outbound_date: params.departureDate,
    adults: String(params.passengers),
    currency: 'BRL',
    hl: 'pt',
    gl: 'br',
    type: params.returnDate ? '1' : '2',
  });

  if (params.returnDate) {
    query.set('return_date', params.returnDate);
  }

  const response = await fetch(`${BASE_URL}?${query.toString()}`);
  const data = await response.json().catch(() => ({}));

  if (data.error) {
    const msg: string = data.error;
    if (msg.toLowerCase().includes('invalid api key') || msg.toLowerCase().includes('api_key')) {
      throw new Error('Chave inválida. Verifique se copiou corretamente do dashboard da Serpapi.');
    }
    // No results for this pair — just return empty, other pairs may have results
    return [];
  }

  if (!response.ok) {
    return [];
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

    const totalMin: number = offer.total_duration ?? firstSeg.duration ?? 0;
    const durationStr = minutesToDuration(totalMin);

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
      seatsAvailable: 9,
    });
  }

  return results.sort((a, b) => a.price - b.price);
}

// "2025-03-10 14:30" → full ISO string
function isoFromGoogleTime(timeStr: string | undefined, dateHint: string): string {
  if (!timeStr) return dateHint + 'T00:00:00';
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

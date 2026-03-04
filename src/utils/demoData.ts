import type { Flight, SearchParams } from '../types';

const AIRLINES = [
  { code: 'LA', name: 'LATAM Airlines' },
  { code: 'G3', name: 'GOL Linhas Aéreas' },
  { code: 'AD', name: 'Azul Linhas Aéreas' },
];

const BASE_PRICES: Record<string, number> = {
  'GIG-GRU': 280,
  'GRU-GIG': 280,
  'GIG-SSA': 480,
  'SSA-GIG': 480,
  'GIG-BSB': 420,
  'BSB-GIG': 420,
  'GRU-FOR': 560,
  'FOR-GRU': 560,
  'GRU-MCZ': 540,
  'MCZ-GRU': 540,
  'GRU-REC': 520,
  'REC-GRU': 520,
  'GRU-SSA': 380,
  'SSA-GRU': 380,
  'GRU-BSB': 310,
  'BSB-GRU': 310,
  DEFAULT: 650,
};

function getBasePrice(origin: string, destination: string): number {
  return BASE_PRICES[`${origin}-${destination}`] || BASE_PRICES.DEFAULT;
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


export function generateDemoFlights(params: SearchParams, variation: number = 0): Flight[] {
  const basePrice = getBasePrice(params.origin, params.destination);
  const flights: Flight[] = [];

  const depTimes = [
    { h: 6, m: 0 },
    { h: 8, m: 30 },
    { h: 10, m: 15 },
    { h: 13, m: 45 },
    { h: 16, m: 20 },
    { h: 19, m: 0 },
    { h: 21, m: 30 },
  ];

  AIRLINES.forEach((airline, ai) => {
    const numFlights = randomBetween(2, 3);

    for (let i = 0; i < numFlights; i++) {
      const timeSlot = depTimes[(ai * 3 + i) % depTimes.length];
      const priceMult = 1 + (Math.random() * 0.3 - 0.05) + variation * 0.15;
      const price = Math.round(basePrice * priceMult * params.passengers);
      const durationHours = randomBetween(1, 4);
      const durationMinutes = randomBetween(0, 55);
      const stops = Math.random() < 0.3 ? 1 : 0;

      const depDate = params.departureDate + `T${String(timeSlot.h).padStart(2, '0')}:${String(timeSlot.m).padStart(2, '0')}:00`;
      const arrDate = new Date(depDate);
      arrDate.setHours(arrDate.getHours() + durationHours + (stops ? 2 : 0));
      arrDate.setMinutes(arrDate.getMinutes() + durationMinutes);

      const flightNo = `${airline.code}${randomBetween(1000, 9999)}`;

      flights.push({
        id: `demo-${airline.code}-${i}-${Date.now()}`,
        airline: airline.code,
        airlineName: airline.name,
        flightNo,
        origin: params.origin,
        destination: params.destination,
        departureAt: depDate,
        arrivalAt: arrDate.toISOString(),
        duration: `PT${durationHours + (stops ? 2 : 0)}H${durationMinutes}M`,
        stops,
        price,
        pricePerPerson: Math.round(price / params.passengers),
        currency: 'BRL',
        seatsAvailable: randomBetween(2, 9),
      });
    }
  });

  return flights.sort((a, b) => a.price - b.price);
}

export function generateDemoHistory(
  _origin: string,
  _destination: string,
  basePrice: number,
  points: number = 10
): Array<{ timestamp: string; price: number; airline: string; flightNo: string }> {
  const airlines = AIRLINES;
  const history = [];
  const now = Date.now();
  const intervalMs = (24 * 60 * 60 * 1000) / points;

  for (let i = points; i >= 1; i--) {
    const ts = new Date(now - i * intervalMs);
    const variation = (Math.random() * 0.3 - 0.15);
    const price = Math.round(basePrice * (1 + variation));
    const airline = airlines[Math.floor(Math.random() * airlines.length)];

    history.push({
      timestamp: ts.toISOString(),
      price,
      airline: airline.code,
      flightNo: `${airline.code}${randomBetween(1000, 9999)}`,
    });
  }

  return history;
}

export async function simulateDelay(): Promise<void> {
  const ms = randomBetween(800, 1500);
  return new Promise(resolve => setTimeout(resolve, ms));
}

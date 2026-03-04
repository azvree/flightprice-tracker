import type { AmadeusCredentials, Flight, SearchParams } from '../types';

const BASE_URL = 'https://test.api.amadeus.com';

export async function getAccessToken(
  credentials: AmadeusCredentials
): Promise<{ accessToken: string; tokenExpiry: number }> {
  const params = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: credentials.clientId,
    client_secret: credentials.clientSecret,
  });

  const response = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error_description || `Erro de autenticação: ${response.status}`
    );
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    tokenExpiry: Date.now() + (data.expires_in - 60) * 1000,
  };
}

export async function ensureValidToken(
  credentials: AmadeusCredentials
): Promise<AmadeusCredentials> {
  if (credentials.accessToken && credentials.tokenExpiry && Date.now() < credentials.tokenExpiry) {
    return credentials;
  }
  const { accessToken, tokenExpiry } = await getAccessToken(credentials);
  return { ...credentials, accessToken, tokenExpiry };
}

export async function searchFlightsAPI(
  credentials: AmadeusCredentials,
  params: SearchParams
): Promise<Flight[]> {
  const validCreds = await ensureValidToken(credentials);

  const query = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: params.destination,
    departureDate: params.departureDate,
    adults: String(params.passengers),
    currencyCode: 'BRL',
    max: '20',
  });

  if (params.returnDate) {
    query.set('returnDate', params.returnDate);
  }

  const response = await fetch(
    `${BASE_URL}/v2/shopping/flight-offers?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${validCreds.accessToken}` },
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.errors?.[0]?.detail || `Erro na busca: ${response.status}`
    );
  }

  const data = await response.json();
  return parseFlightOffers(data, params.passengers);
}

function parseFlightOffers(raw: any, passengers: number): Flight[] {
  if (!raw?.data) return [];

  const carriers: Record<string, string> = raw.dictionaries?.carriers || {};

  return raw.data.map((offer: any): Flight => {
    const itinerary = offer.itineraries[0];
    const firstSeg = itinerary.segments[0];
    const lastSeg = itinerary.segments[itinerary.segments.length - 1];
    const price = parseFloat(offer.price.grandTotal);

    return {
      id: offer.id,
      airline: firstSeg.carrierCode,
      airlineName: carriers[firstSeg.carrierCode] || firstSeg.carrierCode,
      flightNo: `${firstSeg.carrierCode}${firstSeg.number}`,
      origin: firstSeg.departure.iataCode,
      destination: lastSeg.arrival.iataCode,
      departureAt: firstSeg.departure.at,
      arrivalAt: lastSeg.arrival.at,
      duration: itinerary.duration,
      stops: itinerary.segments.length - 1,
      price,
      pricePerPerson: price / passengers,
      currency: 'BRL',
      seatsAvailable: offer.numberOfBookableSeats || 9,
    };
  });
}

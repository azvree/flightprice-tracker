export interface AirportEntry {
  iata: string;
  name: string;
  city: string;
  state: string;
  isCity?: boolean;        // true = "todos os aeroportos de X"
  cityCode?: string;       // the city IATA code this airport belongs to
  airports?: string[];     // list of individual IATAs for a city entry
}

// City groups — shown as "Todos os aeroportos de ..."
const CITY_GROUPS: AirportEntry[] = [
  {
    iata: 'RIO',
    name: 'Todos os aeroportos',
    city: 'Rio de Janeiro',
    state: 'RJ',
    isCity: true,
    airports: ['GIG', 'SDU'],
  },
  {
    iata: 'SAO',
    name: 'Todos os aeroportos',
    city: 'São Paulo',
    state: 'SP',
    isCity: true,
    airports: ['GRU', 'CGH', 'VCP'],
  },
  {
    iata: 'BHZ',
    name: 'Todos os aeroportos',
    city: 'Belo Horizonte',
    state: 'MG',
    isCity: true,
    airports: ['CNF', 'PLU'],
  },
];

// Individual airports
const INDIVIDUAL_AIRPORTS: AirportEntry[] = [
  // Rio de Janeiro
  { iata: 'GIG', name: 'Aeroporto Int. Galeão – Antonio Carlos Jobim', city: 'Rio de Janeiro', state: 'RJ', cityCode: 'RIO' },
  { iata: 'SDU', name: 'Aeroporto Santos Dumont', city: 'Rio de Janeiro', state: 'RJ', cityCode: 'RIO' },

  // São Paulo
  { iata: 'GRU', name: 'Aeroporto Int. de Guarulhos – Gov. André Franco Montoro', city: 'São Paulo', state: 'SP', cityCode: 'SAO' },
  { iata: 'CGH', name: 'Aeroporto de Congonhas', city: 'São Paulo', state: 'SP', cityCode: 'SAO' },
  { iata: 'VCP', name: 'Aeroporto Int. de Viracopos', city: 'Campinas', state: 'SP', cityCode: 'SAO' },

  // Belo Horizonte
  { iata: 'CNF', name: 'Aeroporto Int. de Confins – Tancredo Neves', city: 'Belo Horizonte', state: 'MG', cityCode: 'BHZ' },
  { iata: 'PLU', name: 'Aeroporto da Pampulha – Carlos Drummond de Andrade', city: 'Belo Horizonte', state: 'MG', cityCode: 'BHZ' },

  // Nordeste
  { iata: 'SSA', name: 'Aeroporto Int. Dep. Luís Eduardo Magalhães', city: 'Salvador', state: 'BA' },
  { iata: 'REC', name: 'Aeroporto Int. do Recife – Guararapes', city: 'Recife', state: 'PE' },
  { iata: 'FOR', name: 'Aeroporto Int. Pinto Martins', city: 'Fortaleza', state: 'CE' },
  { iata: 'NAT', name: 'Aeroporto Int. São Gonçalo do Amarante', city: 'Natal', state: 'RN' },
  { iata: 'MCZ', name: 'Aeroporto Int. Zumbi dos Palmares', city: 'Maceió', state: 'AL' },
  { iata: 'JPA', name: 'Aeroporto Int. Castro Pinto', city: 'João Pessoa', state: 'PB' },
  { iata: 'THE', name: 'Aeroporto Int. Senador Petrônio Portella', city: 'Teresina', state: 'PI' },
  { iata: 'SLZ', name: 'Aeroporto Int. Marechal Cunha Machado', city: 'São Luís', state: 'MA' },
  { iata: 'AJU', name: 'Aeroporto Int. Santa Maria', city: 'Aracaju', state: 'SE' },
  { iata: 'IMP', name: 'Aeroporto Int. Prefeito Renato Moreira', city: 'Imperatriz', state: 'MA' },
  { iata: 'CGB', name: 'Aeroporto Int. Marechal Rondon', city: 'Cuiabá', state: 'MT' },

  // Centro-Oeste / Brasília
  { iata: 'BSB', name: 'Aeroporto Int. Presidente Juscelino Kubitschek', city: 'Brasília', state: 'DF' },
  { iata: 'GYN', name: 'Aeroporto de Santa Genoveva', city: 'Goiânia', state: 'GO' },
  { iata: 'CGR', name: 'Aeroporto Int. de Campo Grande', city: 'Campo Grande', state: 'MS' },

  // Sul
  { iata: 'POA', name: 'Aeroporto Int. Salgado Filho', city: 'Porto Alegre', state: 'RS' },
  { iata: 'CWB', name: 'Aeroporto Int. Afonso Pena', city: 'Curitiba', state: 'PR' },
  { iata: 'FLN', name: 'Aeroporto Int. Hercílio Luz', city: 'Florianópolis', state: 'SC' },
  { iata: 'LDB', name: 'Aeroporto de Londrina – Gov. José Richa', city: 'Londrina', state: 'PR' },
  { iata: 'JOI', name: 'Aeroporto Lauro Carneiro de Loyola', city: 'Joinville', state: 'SC' },

  // Norte / Amazônia
  { iata: 'MAO', name: 'Aeroporto Int. Eduardo Gomes', city: 'Manaus', state: 'AM' },
  { iata: 'BEL', name: 'Aeroporto Int. Val-de-Cans', city: 'Belém', state: 'PA' },
  { iata: 'PVH', name: 'Aeroporto Int. Governador Jorge Teixeira', city: 'Porto Velho', state: 'RO' },
  { iata: 'MCP', name: 'Aeroporto Int. de Macapá', city: 'Macapá', state: 'AP' },
  { iata: 'BVB', name: 'Aeroporto Int. Atlas Brasil Cantanhede', city: 'Boa Vista', state: 'RR' },
  { iata: 'RBR', name: 'Aeroporto Int. Plácido de Castro', city: 'Rio Branco', state: 'AC' },
  { iata: 'STM', name: 'Aeroporto de Santarém – Maestro Wilson Fonseca', city: 'Santarém', state: 'PA' },

  // Sudeste (outros)
  { iata: 'VIX', name: 'Aeroporto Eurico de Aguiar Salles', city: 'Vitória', state: 'ES' },
  { iata: 'UDI', name: 'Aeroporto Coronel Aviador César Bombonato', city: 'Uberlândia', state: 'MG' },
  { iata: 'PMW', name: 'Aeroporto de Palmas', city: 'Palmas', state: 'TO' },

  // Internacionais frequentes
  { iata: 'EZE', name: 'Aeroporto Int. Ministro Pistarini', city: 'Buenos Aires', state: 'Argentina' },
  { iata: 'AEP', name: 'Aeroporto Jorge Newbery', city: 'Buenos Aires', state: 'Argentina' },
  { iata: 'SCL', name: 'Aeroporto Int. Arturo Merino Benítez', city: 'Santiago', state: 'Chile' },
  { iata: 'BOG', name: 'Aeroporto El Dorado', city: 'Bogotá', state: 'Colômbia' },
  { iata: 'LIM', name: 'Aeroporto Int. Jorge Chávez', city: 'Lima', state: 'Peru' },
  { iata: 'MVD', name: 'Aeroporto Int. de Carrasco', city: 'Montevidéu', state: 'Uruguai' },
  { iata: 'MIA', name: 'Aeroporto Int. de Miami', city: 'Miami', state: 'EUA' },
  { iata: 'JFK', name: 'Aeroporto Int. John F. Kennedy', city: 'Nova York', state: 'EUA' },
  { iata: 'LHR', name: 'Aeroporto de Heathrow', city: 'Londres', state: 'Reino Unido' },
  { iata: 'CDG', name: 'Aeroporto Charles de Gaulle', city: 'Paris', state: 'França' },
  { iata: 'LIS', name: 'Aeroporto Humberto Delgado', city: 'Lisboa', state: 'Portugal' },
  { iata: 'MAD', name: 'Aeroporto Adolfo Suárez Madrid-Barajas', city: 'Madrid', state: 'Espanha' },
  { iata: 'FRA', name: 'Aeroporto de Frankfurt', city: 'Frankfurt', state: 'Alemanha' },
  { iata: 'ORD', name: 'Aeroporto O\'Hare', city: 'Chicago', state: 'EUA' },
  { iata: 'LAX', name: 'Aeroporto Int. de Los Angeles', city: 'Los Angeles', state: 'EUA' },
  { iata: 'DXB', name: 'Aeroporto Int. de Dubai', city: 'Dubai', state: 'EAU' },
];

// All entries: individual first, then city groups
export const ALL_AIRPORTS: AirportEntry[] = [...INDIVIDUAL_AIRPORTS, ...CITY_GROUPS];

// Normalize text for search (remove accents, lowercase)
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function searchAirports(query: string, limit = 8): AirportEntry[] {
  if (!query || query.trim().length < 2) return [];

  const q = normalize(query.trim());

  const scored: Array<{ entry: AirportEntry; score: number }> = [];

  for (const entry of ALL_AIRPORTS) {
    const iata = entry.iata.toLowerCase();
    const name = normalize(entry.name);
    const city = normalize(entry.city);
    const state = normalize(entry.state);

    let score = 0;

    // Exact IATA match
    if (iata === q) { score = 100; }
    // IATA starts with query
    else if (iata.startsWith(q)) { score = 80; }
    // City starts with query
    else if (city.startsWith(q)) { score = 70; }
    // City contains query
    else if (city.includes(q)) { score = 50; }
    // Airport name contains query
    else if (name.includes(q)) { score = 40; }
    // State matches
    else if (state === q) { score = 30; }
    // Airport name starts with query
    else if (name.startsWith(q)) { score = 35; }

    // Boost city groups slightly so they appear near individual airports of same city
    if (score > 0 && entry.isCity) score -= 5;

    if (score > 0) scored.push({ entry, score });
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.entry);
}

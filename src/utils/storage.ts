import type { AmadeusCredentials, MonitoredRoute, PricePoint } from '../types';

const KEYS = {
  credentials: 'fpt_credentials',
  routes: 'fpt_routes',
  demoMode: 'fpt_demo_mode',
  history: (id: string) => `fpt_history_${id}`,
} as const;

const MAX_HISTORY_POINTS = 500;

export function saveCredentials(creds: AmadeusCredentials): void {
  localStorage.setItem(KEYS.credentials, JSON.stringify(creds));
}

export function loadCredentials(): AmadeusCredentials | null {
  try {
    const raw = localStorage.getItem(KEYS.credentials);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveDemoMode(isDemo: boolean): void {
  localStorage.setItem(KEYS.demoMode, JSON.stringify(isDemo));
}

export function loadDemoMode(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.demoMode);
    return raw !== null ? JSON.parse(raw) : true; // default to demo mode
  } catch {
    return true;
  }
}

export function saveRoutes(routes: MonitoredRoute[]): void {
  // Save routes without history (history stored separately)
  const withoutHistory = routes.map(r => ({ ...r, history: [] }));
  localStorage.setItem(KEYS.routes, JSON.stringify(withoutHistory));
}

export function loadRoutes(): MonitoredRoute[] {
  try {
    const raw = localStorage.getItem(KEYS.routes);
    if (!raw) return [];
    const routes: MonitoredRoute[] = JSON.parse(raw);
    // Re-attach history
    return routes.map(r => ({
      ...r,
      history: loadHistory(r.id),
    }));
  } catch {
    return [];
  }
}

export function saveHistory(routeId: string, history: PricePoint[]): void {
  const trimmed = history.slice(-MAX_HISTORY_POINTS);
  localStorage.setItem(KEYS.history(routeId), JSON.stringify(trimmed));
}

export function loadHistory(routeId: string): PricePoint[] {
  try {
    const raw = localStorage.getItem(KEYS.history(routeId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearHistory(routeId: string): void {
  localStorage.removeItem(KEYS.history(routeId));
}

export function exportJSON(routes: MonitoredRoute[]): void {
  const data = {
    exportedAt: new Date().toISOString(),
    routes: routes.map(r => ({
      ...r,
      history: loadHistory(r.id),
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  downloadFile(blob, `flightprice-export-${formatFilenameDate()}.json`);
}

export function exportCSV(routes: MonitoredRoute[]): void {
  const lines: string[] = [
    'Rota,Data,Hora,Preco,Companhia,Voo',
  ];

  routes.forEach(route => {
    const history = loadHistory(route.id);
    history.forEach(point => {
      const dt = new Date(point.timestamp);
      const date = dt.toLocaleDateString('pt-BR');
      const time = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      lines.push(
        [
          `"${route.label}"`,
          date,
          time,
          point.price.toFixed(2).replace('.', ','),
          `"${point.airline || ''}"`,
          `"${point.flightNo || ''}"`,
        ].join(',')
      );
    });
  });

  const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadFile(blob, `flightprice-export-${formatFilenameDate()}.csv`);
}

function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatFilenameDate(): string {
  return new Date().toISOString().slice(0, 10);
}

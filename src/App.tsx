import { Settings, Plane, Bell, BarChart2, Search, Wifi, WifiOff } from 'lucide-react';
import { useAppStore } from './store/useAppStore';
import { SearchForm } from './components/SearchForm';
import { FlightCard, FlightCardSkeleton } from './components/FlightCard';
import { MonitorList } from './components/MonitorList';
import { ComparisonTable } from './components/ComparisonTable';
import { PriceCalendar } from './components/PriceCalendar';
import { Toast } from './components/Toast';
import { SettingsModal } from './components/SettingsModal';
import type { AppTab } from './types';

const TABS: { id: AppTab; label: string; icon: typeof Search }[] = [
  { id: 'search', label: 'Busca', icon: Search },
  { id: 'monitor', label: 'Monitoramento', icon: Bell },
  { id: 'compare', label: 'Comparação', icon: BarChart2 },
];

export default function App() {
  const {
    activeTab,
    setActiveTab,
    showSettings,
    setShowSettings,
    isDemoMode,
    flights,
    isSearching,
    monitoredRoutes,
  } = useAppStore();

  const alertCount = monitoredRoutes.filter(
    r => r.alertActive && r.alertPrice > 0 && r.currentPrice <= r.alertPrice
  ).length;

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}>
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-white/8" style={{ background: 'rgba(15, 12, 41, 0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Plane size={16} className="text-white" />
            </div>
            <span className="font-bold text-white hidden sm:block">FlightPrice</span>
            <span className="font-bold text-white/30 hidden sm:block">Tracker</span>
          </div>

          {/* Tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-white/50 hover:text-white hover:bg-white/8'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:block">{tab.label}</span>
                  {tab.id === 'monitor' && alertCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {alertCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 shrink-0">
            {isDemoMode ? (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                <WifiOff size={11} />
                Demo
              </span>
            ) : (
              <span className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                <Wifi size={11} />
                API Real
              </span>
            )}
            <button
              onClick={() => setShowSettings(true)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/8 transition-all"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        {activeTab === 'search' && (
          <>
            <SearchForm />
            <PriceCalendar />

            {isSearching && (
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => <FlightCardSkeleton key={i} />)}
              </div>
            )}

            {!isSearching && flights.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm text-white/40 px-1">
                  {flights.length} {flights.length === 1 ? 'voo encontrado' : 'voos encontrados'}
                  {' · '}ordenados por preço
                </p>
                {flights.map((flight, i) => (
                  <FlightCard key={flight.id} flight={flight} isCheapest={i === 0} />
                ))}
              </div>
            )}

            {!isSearching && flights.length === 0 && (
              <div className="glass-card p-12 text-center">
                <Plane size={48} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.08)' }} />
                <p className="font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Busque voos acima para ver os resultados
                </p>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.15)' }}>
                  {isDemoMode
                    ? 'Modo Demo ativo — dados simulados de companhias brasileiras'
                    : 'Conectado à Amadeus API'}
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'monitor' && <MonitorList />}

        {activeTab === 'compare' && (
          <>
            {flights.length === 0 && (
              <div className="glass-card p-4 flex items-center gap-2 text-sm text-white/50">
                <Search size={15} />
                Faça uma busca na aba{' '}
                <button
                  onClick={() => setActiveTab('search')}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Busca
                </button>{' '}
                para comparar companhias aéreas.
              </div>
            )}
            <ComparisonTable />
          </>
        )}
      </main>

      {showSettings && <SettingsModal />}
      <Toast />
    </div>
  );
}

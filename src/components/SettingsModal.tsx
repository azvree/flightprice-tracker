import { useState } from 'react';
import { X, Key, Wifi, WifiOff, CheckCircle, Loader2, ExternalLink } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAccessToken } from '../utils/amadeus';
import type { ApiProvider } from '../types';

type Tab = ApiProvider;

const PROVIDER_LABELS: Record<Tab, string> = {
  demo: 'Demo',
  amadeus: 'Amadeus',
  serpapi: 'Serpapi',
};

export function SettingsModal() {
  const {
    credentials, serpapiCredentials,
    activeProvider,
    setCredentials, setSerpapiCredentials, setActiveProvider,
    setShowSettings, addToast,
  } = useAppStore();

  const [tab, setTab] = useState<Tab>(activeProvider);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  // Amadeus fields
  const [clientId, setClientId] = useState(credentials?.clientId || '');
  const [clientSecret, setClientSecret] = useState(credentials?.clientSecret || '');

  // Serpapi fields
  const [apiKey, setApiKey] = useState(serpapiCredentials?.apiKey || '');

  const handleActivateDemo = () => {
    setActiveProvider('demo');
    addToast({ type: 'info', message: 'Modo Demo ativado com dados simulados.' });
    setShowSettings(false);
  };

  const handleSaveAmadeus = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Preencha o Client ID e o Client Secret.');
      return;
    }
    setTesting(true);
    setError('');
    try {
      const { accessToken, tokenExpiry } = await getAccessToken({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      });
      setCredentials({ clientId: clientId.trim(), clientSecret: clientSecret.trim(), accessToken, tokenExpiry });
      setActiveProvider('amadeus');
      addToast({ type: 'success', message: 'Amadeus conectada com sucesso!' });
      setShowSettings(false);
    } catch (err: any) {
      setError(err?.message || 'Erro ao conectar com a Amadeus API.');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveSerpapi = () => {
    if (!apiKey.trim()) {
      setError('Informe a API Key da Serpapi.');
      return;
    }
    setSerpapiCredentials({ apiKey: apiKey.trim() });
    setActiveProvider('serpapi');
    addToast({ type: 'success', message: 'Chave salva! Será validada na primeira busca.' });
    setShowSettings(false);
  };

  const activeBadge = (provider: ApiProvider) =>
    activeProvider === provider ? (
      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 ml-1">
        ativo
      </span>
    ) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-indigo-400" />
            <h2 className="text-base font-semibold text-white">Configurações da API</h2>
          </div>
          <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white/80 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Provider tabs */}
        <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.05)' }}>
          {(['demo', 'amadeus', 'serpapi'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                tab === t ? 'bg-indigo-600 text-white shadow-sm' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {PROVIDER_LABELS[t]}
              {activeBadge(t)}
            </button>
          ))}
        </div>

        {/* Current status */}
        <div className="flex items-center gap-2 mb-5 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {activeProvider === 'demo' ? (
            <><WifiOff size={13} className="text-amber-400" /><span className="text-xs text-white/50">Modo Demo ativo</span></>
          ) : activeProvider === 'amadeus' ? (
            <><Wifi size={13} className="text-emerald-400" /><span className="text-xs text-white/50">Amadeus API ativa</span></>
          ) : (
            <><Wifi size={13} className="text-emerald-400" /><span className="text-xs text-white/50">Serpapi (Google Flights) ativa</span></>
          )}
        </div>

        {/* Demo tab */}
        {tab === 'demo' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-white/8 text-sm text-white/50 space-y-2">
              <p className="text-white/70 font-medium">Dados simulados — sem necessidade de conta</p>
              <p>Dados realistas de LATAM, GOL e Azul com variação aleatória de preços (±15%). Ideal para explorar o app.</p>
            </div>
            <button
              onClick={handleActivateDemo}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors"
            >
              Usar Modo Demo
            </button>
          </div>
        )}

        {/* Amadeus tab */}
        {tab === 'amadeus' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-white/8 text-xs text-white/40 space-y-1.5">
              <p>Crie sua conta gratuita em:</p>
              <a
                href="https://developers.amadeus.com/register"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                developers.amadeus.com/register <ExternalLink size={10} />
              </a>
              <p>Após criar o app no dashboard, copie o Client ID e Client Secret.</p>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Client ID</label>
              <input type="text" value={clientId} onChange={e => { setClientId(e.target.value); setError(''); }}
                placeholder="Ex: aBcDeFgH1234..." className="input-dark w-full" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Client Secret</label>
              <input type="password" value={clientSecret} onChange={e => { setClientSecret(e.target.value); setError(''); }}
                placeholder="••••••••••••" className="input-dark w-full" />
            </div>
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>}
            <button onClick={handleSaveAmadeus} disabled={testing}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors disabled:opacity-50">
              {testing ? <><Loader2 size={15} className="animate-spin" /> Testando...</> : <><CheckCircle size={15} /> Salvar e Validar</>}
            </button>
          </div>
        )}

        {/* Serpapi tab */}
        {tab === 'serpapi' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-white/8 text-xs text-white/40 space-y-1.5">
              <p>Crie sua conta gratuita em:</p>
              <a
                href="https://serpapi.com/users/sign_up"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                serpapi.com/users/sign_up <ExternalLink size={10} />
              </a>
              <p>Após logar, copie a API Key no seu dashboard.</p>
              <div className="flex items-center gap-1.5 mt-1 pt-2 border-t border-white/8">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-semibold">100 buscas/mês grátis</span>
                <span>· dados do Google Flights</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">API Key</label>
              <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); setError(''); }}
                placeholder="••••••••••••••••••••••••••••••••••••••••••••••••••••"
                className="input-dark w-full font-mono text-xs" />
            </div>
            {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">{error}</div>}
            <button onClick={handleSaveSerpapi}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors">
              <CheckCircle size={15} /> Salvar Chave
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

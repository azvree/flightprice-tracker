import { useState } from 'react';
import { X, Key, Wifi, WifiOff, CheckCircle, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { getAccessToken } from '../utils/amadeus';

export function SettingsModal() {
  const { credentials, isDemoMode, setCredentials, setDemoMode, setShowSettings, addToast } =
    useAppStore();

  const [clientId, setClientId] = useState(credentials?.clientId || '');
  const [clientSecret, setClientSecret] = useState(credentials?.clientSecret || '');
  const [testing, setTesting] = useState(false);
  const [testError, setTestError] = useState('');

  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setTestError('Preencha o Client ID e o Client Secret.');
      return;
    }
    setTesting(true);
    setTestError('');
    try {
      const { accessToken, tokenExpiry } = await getAccessToken({
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
      });
      setCredentials({ clientId: clientId.trim(), clientSecret: clientSecret.trim(), accessToken, tokenExpiry });
      setDemoMode(false);
      addToast({ type: 'success', message: 'Credenciais salvas e conexão validada!' });
      setShowSettings(false);
    } catch (err: any) {
      setTestError(err?.message || 'Erro ao conectar com a Amadeus API.');
    } finally {
      setTesting(false);
    }
  };

  const handleDemo = () => {
    setDemoMode(true);
    addToast({ type: 'info', message: 'Modo Demo ativado com dados simulados.' });
    setShowSettings(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass-card w-full max-w-md p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Key size={20} className="text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Configurações da API</h2>
          </div>
          <button
            onClick={() => setShowSettings(false)}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode badge */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-white/50">Modo atual:</span>
          {isDemoMode ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <WifiOff size={12} />
              Demo
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Wifi size={12} />
              API Real
            </span>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Client ID</label>
            <input
              type="text"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              placeholder="Seu Amadeus Client ID"
              className="input-dark w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Client Secret</label>
            <input
              type="password"
              value={clientSecret}
              onChange={e => setClientSecret(e.target.value)}
              placeholder="Seu Amadeus Client Secret"
              className="input-dark w-full"
            />
          </div>
        </div>

        {testError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            {testError}
          </div>
        )}

        <div className="text-xs text-white/30 mb-6">
          Obtenha credenciais gratuitas em{' '}
          <span className="text-indigo-400">developers.amadeus.com</span>
          {' '}(API de teste)
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={testing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                Salvar e Validar
              </>
            )}
          </button>
          <button
            onClick={handleDemo}
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/8 hover:bg-white/12 text-white/80 font-medium text-sm transition-colors border border-white/10"
          >
            Usar Modo Demo
          </button>
        </div>
      </div>
    </div>
  );
}

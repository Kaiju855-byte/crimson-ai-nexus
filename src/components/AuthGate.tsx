import { useState } from 'react'
import { Shield, AlertCircle, Loader2, Lock, Key, ExternalLink, CheckCircle2 } from 'lucide-react'
import { useDerivConnection } from '../services/derivStream'

export default function AuthGate() {
  const { connectionState, connect } = useDerivConnection()
  const [appId, setAppId] = useState('')
  const [apiToken, setApiToken] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!appId.trim() || !apiToken.trim()) return
    try { await connect(appId.trim(), apiToken.trim()) } catch { /* handled by state */ }
  }

  return (
    <div className="min-h-screen bg-omw-bg flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl md:text-5xl text-omw-gold tracking-wide mb-2">Old Money Wealth</h1>
          <p className="font-mono text-omw-text-muted text-sm tracking-widest">OMW • VOLATILITY INDEX DIGIT TRADER</p>
        </div>

        <div className="bg-omw-card border border-omw-border rounded-lg overflow-hidden">
          <div className="bg-omw-gold/10 border-b border-omw-gold/30 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-omw-gold/20 rounded-lg"><Shield className="w-6 h-6 text-omw-gold" /></div>
              <div>
                <h2 className="text-lg font-semibold text-omw-gold">Authentication Gateway</h2>
                <p className="text-sm text-omw-text-muted">Connect to Deriv API to begin trading</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-omw-text-muted mb-2">Deriv App ID</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-omw-text-muted" />
                <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="Enter your App ID"
                  className="w-full bg-omw-bg border border-omw-border rounded-lg py-3 pl-11 pr-4 text-omw-text font-mono focus:outline-none focus:ring-2 focus:ring-omw-gold" disabled={connectionState.isLoading} />
              </div>
              <p className="mt-2 text-xs text-omw-text-muted">Get an App ID from <a href="https://app.deriv.com/account/api-apps" target="_blank" rel="noopener noreferrer" className="text-omw-gold hover:underline inline-flex items-center gap-1">Deriv API Dashboard <ExternalLink className="w-3 h-3" /></a></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-omw-text-muted mb-2">API Token</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-omw-text-muted" />
                <input type="password" value={apiToken} onChange={(e) => setApiToken(e.target.value)} placeholder="Enter your API Token"
                  className="w-full bg-omw-bg border border-omw-border rounded-lg py-3 pl-11 pr-4 text-omw-text font-mono focus:outline-none focus:ring-2 focus:ring-omw-gold" disabled={connectionState.isLoading} />
              </div>
            </div>

            {connectionState.error && (
              <div className="bg-omw-error border border-red-600 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div><p className="text-sm text-red-200 font-medium">Connection Failed</p><p className="text-sm text-red-300 mt-1">{connectionState.error}</p></div>
              </div>
            )}

            <button type="submit" disabled={connectionState.isLoading || !appId.trim() || !apiToken.trim()}
              className="w-full bg-omw-gold hover:bg-omw-gold-dark disabled:bg-omw-gold/50 text-omw-bg font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
              {connectionState.isLoading ? (<><Loader2 className="w-5 h-5 animate-spin" /><span>Connecting...</span></>) : (<><Shield className="w-5 h-5" /><span>Connect to Deriv</span></>)}
            </button>
          </form>

          <div className="border-t border-omw-border p-6 bg-omw-bg/50">
            <h3 className="text-sm font-semibold text-omw-text-muted mb-4 flex items-center gap-2"><Key className="w-4 h-4" />Token Creation Guide</h3>
            <div className="space-y-4">
              <div className="bg-omw-card rounded-lg p-4 border border-omw-border">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5" />
                  <div><p className="text-sm font-medium text-omw-text">Demo Environment</p><p className="text-xs text-omw-text-muted mt-1">Switch to demo account, create a token with <span className="text-omw-gold">Read</span> and <span className="text-omw-gold">Trade</span> permissions.</p></div>
                </div>
              </div>
              <div className="bg-omw-card rounded-lg p-4 border border-omw-border">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-400 mt-0.5" />
                  <div><p className="text-sm font-medium text-omw-text">Live Environment</p><p className="text-xs text-omw-text-muted mt-1">Log in to real account, create a token with <span className="text-omw-gold">Read</span> and <span className="text-omw-gold">Trade</span> permissions.</p></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

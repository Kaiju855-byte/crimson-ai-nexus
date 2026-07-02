import { useState } from 'react'
import { Layers, DollarSign, Play, ChevronUp, ChevronDown } from 'lucide-react'
import { useDerivConnection } from '../services/derivStream'

export default function G1DualTrade() {
  const { connectionState } = useDerivConnection()
  const [mode, setMode] = useState<'manual' | 'automated'>('manual')
  const [overStake, setOverStake] = useState(1)
  const [underStake, setUnderStake] = useState(1)
  const [overBarrier, setOverBarrier] = useState(4)
  const [underBarrier, setUnderBarrier] = useState(6)

  return (
    <div className="bg-omw-card rounded-lg border border-omw-border overflow-hidden">
      <div className="bg-omw-bg/50 border-b border-omw-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-omw-gold/20 rounded-lg"><Layers className="w-5 h-5 text-omw-gold" /></div>
          <div><h3 className="text-lg font-semibold text-omw-text">G1 Dual-Trade</h3><p className="text-xs text-omw-text-muted">Multi-leg Over + Under execution</p></div>
        </div>
        <button onClick={() => setMode(mode === 'manual' ? 'automated' : 'manual')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${mode === 'automated' ? 'bg-omw-gold text-omw-bg' : 'bg-omw-bg text-omw-text-muted border border-omw-border'}`}>{mode === 'automated' ? 'AUTOMATED' : 'MANUAL'}</button>
      </div>

      <div className="p-4">
        <div className="grid md:grid-cols-2 gap-6">
          {[
            { label: 'Over', stake: overStake, setStake: setOverStake, barrier: overBarrier, setBarrier: setOverBarrier, digits: [0, 1, 2, 3, 4], color: 'green', icon: ChevronUp },
            { label: 'Under', stake: underStake, setStake: setUnderStake, barrier: underBarrier, setBarrier: setUnderBarrier, digits: [5, 6, 7, 8, 9], color: 'red', icon: ChevronDown },
          ].map(leg => (
            <div key={leg.label} className="bg-omw-bg rounded-lg border border-omw-border p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className={`p-1.5 bg-${leg.color}-500/20 rounded`}><leg.icon className={`w-4 h-4 text-${leg.color}-400`} /></div>
                <h4 className="font-semibold text-omw-text">{leg.label} Leg</h4>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-omw-text-muted block mb-1">{leg.label} Stake</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-omw-text-muted" />
                    <input type="number" value={leg.stake} onChange={(e) => leg.setStake(parseFloat(e.target.value) || 0)} className="w-full bg-omw-card border border-omw-border rounded-lg py-2 pl-9 pr-3 text-omw-text font-mono text-sm focus:outline-none focus:ring-2 focus:ring-omw-gold" min="0.35" step="0.1" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-omw-text-muted block mb-2">Barrier Digit</label>
                  <div className="grid grid-cols-5 gap-2">
                    {leg.digits.map(d => (
                      <button key={d} onClick={() => leg.setBarrier(d)} className={`py-2 rounded-lg font-mono text-lg font-bold transition-all ${leg.barrier === d ? `bg-${leg.color}-600 text-white` : 'bg-omw-card border border-omw-border text-omw-text hover:border-omw-gold'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 p-4 bg-omw-bg rounded-lg border border-omw-border grid grid-cols-4 gap-4 text-center">
          <div><p className="text-xs text-omw-text-muted">Total Stake</p><p className="font-mono text-xl font-bold text-omw-text">${(overStake + underStake).toFixed(2)}</p></div>
          <div><p className="text-xs text-omw-text-muted">Over Barrier</p><p className="font-mono text-xl font-bold text-green-400">{overBarrier}</p></div>
          <div><p className="text-xs text-omw-text-muted">Under Barrier</p><p className="font-mono text-xl font-bold text-red-400">{underBarrier}</p></div>
          <div><p className="text-xs text-omw-text-muted">Max Potential</p><p className="font-mono text-xl font-bold text-omw-gold">${((overStake + underStake) * 1.8).toFixed(2)}</p></div>
        </div>

        <button className="mt-4 w-full bg-omw-gold hover:bg-omw-gold-dark text-omw-bg font-bold py-4 px-6 rounded-lg transition-all flex items-center justify-center gap-3">
          <Play className="w-5 h-5" /><span>EXECUTE DUAL-TRADE</span>
        </button>
        {connectionState.environment === 'live' && <p className="mt-3 text-center text-xs text-omw-text-muted flex items-center justify-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Live Environment — Real funds will be used</p>}
      </div>
    </div>
  )
}

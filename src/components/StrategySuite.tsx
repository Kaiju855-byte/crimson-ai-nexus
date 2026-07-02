import { useState, useEffect, useMemo } from 'react'
import { TrendingUp, Target, Shuffle, Grid3X3 } from 'lucide-react'
import { useDerivConnection } from '../services/derivStream'
import TripleTradePopup from './TripleTradePopup'
import G1DualTrade from './G1DualTrade'
import OrbStrategy from './OrbStrategy'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

export default function StrategySuite() {
  const { connectionState, currentTick, subscribeToTicks } = useDerivConnection()
  const [selected, setSelected] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])
  const [riseFallMode, setRiseFallMode] = useState<'manual' | 'auto'>('manual')
  const [evenOddMode, setEvenOddMode] = useState<'manual' | 'auto'>('manual')

  useEffect(() => { if (connectionState.authenticated) subscribeToTicks('R_100') }, [connectionState.authenticated, subscribeToTicks])
  useEffect(() => { if (currentTick) setHistory(prev => [Math.floor(currentTick.quote) % 10, ...prev].slice(0, 100)) }, [currentTick])

  const stats = useMemo(() => {
    const s: Record<number, { count: number; percentage: number }> = {}
    DIGITS.forEach(d => { const c = history.filter(x => x === d).length; s[d] = { count: c, percentage: history.length > 0 ? (c / history.length) * 100 : 0 } })
    return s
  }, [history])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[
          { title: 'Rise / Fall', desc: 'Directional breakout', icon: TrendingUp, mode: riseFallMode, setMode: setRiseFallMode },
          { title: 'Even / Odd', desc: 'Statistical matching', icon: Shuffle, mode: evenOddMode, setMode: setEvenOddMode },
        ].map(s => (
          <div key={s.title} className="bg-omw-card rounded-lg border border-omw-border overflow-hidden">
            <div className="bg-omw-bg/50 border-b border-omw-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-omw-gold/20 rounded-lg"><s.icon className="w-5 h-5 text-omw-gold" /></div>
                <div><h3 className="text-lg font-semibold text-omw-text">{s.title}</h3><p className="text-xs text-omw-text-muted">{s.desc}</p></div>
              </div>
              <button onClick={() => s.setMode(s.mode === 'manual' ? 'auto' : 'manual')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${s.mode === 'auto' ? 'bg-omw-gold text-omw-bg' : 'bg-omw-bg text-omw-text-muted border border-omw-border'}`}>{s.mode === 'auto' ? 'AUTOMATED' : 'MANUAL'}</button>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {s.title === 'Rise / Fall' ? (
                  <>
                    <button className="bg-green-600 hover:bg-green-500 text-white font-semibold py-3 px-4 rounded-lg">Rise</button>
                    <button className="bg-red-600 hover:bg-red-500 text-white font-semibold py-3 px-4 rounded-lg">Fall</button>
                  </>
                ) : (
                  <>
                    <button className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2"><Target className="w-5 h-5" />Even</button>
                    <button className="bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2"><Target className="w-5 h-5" />Odd</button>
                  </>
                )}
              </div>
              {s.title === 'Even / Odd' && <div className="bg-omw-bg rounded-lg p-3 border border-omw-border"><span className="text-xs text-omw-text-muted">Last 10:</span> <span className="font-mono text-omw-text">{history.slice(0, 10).join(' ')}</span></div>}
            </div>
          </div>
        ))}

        <div className="bg-omw-card rounded-lg border border-omw-border overflow-hidden">
          <div className="bg-omw-bg/50 border-b border-omw-border p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-omw-gold/20 rounded-lg"><Grid3X3 className="w-5 h-5 text-omw-gold" /></div>
              <div><h3 className="text-lg font-semibold text-omw-text">Matches / Differs</h3><p className="text-xs text-omw-text-muted">Digit frequency grid</p></div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-5 gap-2">
              {DIGITS.map(d => (
                <button key={d} onClick={() => setSelected(d)} className="bg-omw-bg hover:bg-omw-card border border-omw-border hover:border-omw-gold/50 rounded-lg p-3 transition-all group">
                  <div className="text-center">
                    <span className="font-mono text-2xl font-bold text-omw-text group-hover:text-omw-gold">{d}</span>
                    <div className="mt-1"><span className="font-mono text-xs text-omw-text-muted">{stats[d].percentage.toFixed(0)}%</span></div>
                    <div className="mt-1 h-1 bg-omw-border rounded-full overflow-hidden"><div className="h-full bg-omw-gold transition-all" style={{ width: `${stats[d].percentage}%` }} /></div>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-omw-bg rounded-lg p-3 border border-omw-border">
                <div className="text-xs text-omw-text-muted mb-1">Matches Quick</div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded">1x</button>
                  <button className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold py-2 rounded">5x</button>
                </div>
              </div>
              <div className="bg-omw-bg rounded-lg p-3 border border-omw-border">
                <div className="text-xs text-omw-text-muted mb-1">Differs Quick</div>
                <div className="flex gap-2">
                  <button className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-2 rounded">5x</button>
                  <button className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold py-2 rounded">15x</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <G1DualTrade />
        <OrbStrategy />
      </div>

      {selected !== null && <TripleTradePopup digit={selected} onClose={() => setSelected(null)} digitStats={stats} />}
    </div>
  )
}

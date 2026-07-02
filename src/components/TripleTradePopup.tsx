import { useState } from 'react'
import { X, DollarSign, ChevronUp, ChevronDown } from 'lucide-react'

interface Props { digit: number; onClose: () => void; digitStats: Record<number, { count: number; percentage: number }> }

export default function TripleTradePopup({ digit, onClose, digitStats }: Props) {
  const [stake, setStake] = useState(1)

  const calcProb = (pred: (d: number) => boolean) => {
    let count = 0, total = 0
    Object.entries(digitStats).forEach(([d, s]) => { if (pred(parseInt(d))) count += s.count; total += s.count })
    return total > 0 ? (count / total) * 100 : 50
  }

  const overProb = calcProb(d => d > digit)
  const underProb = calcProb(d => d < digit)

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 fade-in">
      <div className="bg-omw-card border border-omw-border rounded-lg w-full max-w-md overflow-hidden">
        <div className="bg-omw-bg/50 border-b border-omw-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-omw-gold/20 rounded-lg flex items-center justify-center"><span className="font-mono text-2xl font-bold text-omw-gold">{digit}</span></div>
            <div><h3 className="text-lg font-semibold text-omw-text">Triple Trade Target</h3><p className="text-xs text-omw-text-muted">Barrier: {digit}</p></div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-omw-bg rounded-lg text-omw-text-muted hover:text-omw-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[{ label: 'Over', prob: overProb, range: `${digit + 1}-9`, color: 'green', icon: ChevronUp }, { label: 'Under', prob: underProb, range: `0-${digit - 1}`, color: 'red', icon: ChevronDown }].map(d => (
              <div key={d.label} className={`bg-${d.color}-600/20 border border-${d.color}-600/30 rounded-lg p-4 text-center`}>
                <div className="flex items-center justify-center gap-2 mb-2"><d.icon className={`w-5 h-5 text-${d.color}-400`} /><span className={`font-semibold text-${d.color}-400`}>{d.label} {digit}</span></div>
                <div className="text-3xl font-mono font-bold text-omw-text">{d.prob.toFixed(1)}%</div>
                <p className="text-xs text-omw-text-muted mt-1">Digits {d.range}</p>
              </div>
            ))}
          </div>

          <div>
            <label className="text-xs text-omw-text-muted block mb-2">Base Stake</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-omw-text-muted" />
              <input type="number" value={stake} onChange={(e) => setStake(parseFloat(e.target.value) || 0)} className="w-full bg-omw-bg border border-omw-border rounded-lg py-3 pl-10 pr-4 text-omw-text font-mono text-lg focus:outline-none focus:ring-2 focus:ring-omw-gold" min="0.35" step="0.1" />
            </div>
          </div>

          {['Over', 'Under'].map(dir => (
            <div key={dir}>
              <p className="text-sm text-omw-text-muted mb-3">{dir} Multi-Contract</p>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(m => (
                  <button key={m} className={`bg-${dir === 'Over' ? 'green' : 'red'}-600 hover:bg-${dir === 'Over' ? 'green' : 'red'}-500 text-white font-semibold py-3 rounded-lg`}>
                    <div className="text-lg">{m}x</div>
                    <div className="text-xs opacity-80">${(stake * m).toFixed(2)}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

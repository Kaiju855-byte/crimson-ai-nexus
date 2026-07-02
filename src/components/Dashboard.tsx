import { useMemo } from 'react'
import { TrendingUp, TrendingDown, Activity, Wallet, Clock, BarChart3, Zap, CircleDot } from 'lucide-react'
import { useDerivConnection } from '../services/derivStream'

export default function Dashboard() {
  const { connectionState, accountInfo, currentTick, performanceMetrics, tradeLogs } = useDerivConnection()

  const envLabel = useMemo(() => {
    if (connectionState.environment === 'live') return { text: 'LIVE', cls: 'text-green-400' }
    if (connectionState.environment === 'demo') return { text: 'DEMO', cls: 'text-amber-400' }
    return { text: 'DISCONNECTED', cls: 'text-gray-400' }
  }, [connectionState.environment])

  const fmtBal = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
  const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  return (
    <header className="bg-omw-card border-b border-omw-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="font-serif text-2xl text-omw-gold tracking-wide">Old Money Wealth</h1>
              <p className="font-mono text-xs text-omw-text-muted tracking-widest">OMW • VOLATILITY INDEX DIGIT TRADER</p>
            </div>
            <div className="flex items-center gap-2">
              <CircleDot className={`w-2 h-2 ${connectionState.environment === 'live' ? 'bg-green-500' : connectionState.environment === 'demo' ? 'bg-amber-500' : 'bg-gray-500'} ${connectionState.authenticated ? 'animate-pulse' : ''}`} />
              <span className={`font-mono text-xs font-semibold ${envLabel.cls}`}>{envLabel.text}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {currentTick && <div className="flex items-center gap-2 bg-omw-bg px-3 py-1.5 rounded-lg border border-omw-border"><Activity className="w-4 h-4 text-omw-gold" /><span className="font-mono text-sm text-omw-text tabular-nums">{currentTick.quote.toFixed(2)}</span></div>}
            {accountInfo && <div className="flex items-center gap-2 bg-omw-bg px-4 py-1.5 rounded-lg border border-omw-border"><Wallet className="w-4 h-4 text-omw-gold" /><span className="font-mono text-lg font-semibold text-omw-text tabular-nums">{fmtBal(accountInfo.balance)}</span></div>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            { icon: BarChart3, label: 'Total Trades', value: performanceMetrics.totalTrades.toString() },
            { icon: performanceMetrics.netPnL >= 0 ? TrendingUp : TrendingDown, label: 'Net P&L', value: `${performanceMetrics.netPnL >= 0 ? '+' : ''}${fmtBal(Math.abs(performanceMetrics.netPnL))}`, cls: performanceMetrics.netPnL >= 0 ? 'text-green-400' : 'text-red-400' },
            { icon: TrendingUp, label: 'Win Rate', value: `${performanceMetrics.winRate.toFixed(1)}%`, cls: performanceMetrics.winRate >= 50 ? 'text-green-400' : 'text-omw-text' },
            { icon: TrendingUp, label: 'Wins', value: performanceMetrics.wins.toString(), cls: 'text-green-400' },
            { icon: TrendingDown, label: 'Losses', value: performanceMetrics.losses.toString(), cls: 'text-red-400' },
            { icon: Zap, label: 'Avg Win/Loss', value: `${fmtBal(performanceMetrics.avgWin)} / ${fmtBal(performanceMetrics.avgLoss)}` },
          ].map((m, i) => (
            <div key={i} className="bg-omw-bg rounded-lg border border-omw-border p-4">
              <div className="flex items-center gap-2 mb-2"><m.icon className="w-4 h-4 text-omw-text-muted" /><span className="text-xs text-omw-text-muted">{m.label}</span></div>
              <p className={`font-mono text-xl font-bold tabular-nums ${m.cls || 'text-omw-text'}`}>{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {tradeLogs.length > 0 && (
        <div className="container mx-auto px-4 pb-4">
          <div className="bg-omw-bg rounded-lg border border-omw-border p-4">
            <div className="flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-omw-gold" /><h3 className="text-sm font-semibold text-omw-text-muted">Recent Trades</h3></div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-omw-border">{['Time', 'Strategy', 'Type', 'Stake', 'Result', 'Profit'].map(h => <th key={h} className="text-left text-xs text-omw-text-muted font-mono py-2 px-2">{h}</th>)}</tr></thead>
                <tbody>
                  {tradeLogs.slice(0, 10).map(log => (
                    <tr key={log.id} className="border-b border-omw-border/50 hover:bg-omw-card/50">
                      <td className="font-mono text-xs text-omw-text-muted py-2 px-2 tabular-nums">{fmtTime(log.timestamp)}</td>
                      <td className="font-mono text-xs text-omw-text py-2 px-2">{log.strategy}</td>
                      <td className="font-mono text-xs text-omw-text py-2 px-2">{log.type}</td>
                      <td className="font-mono text-xs text-omw-text py-2 px-2 tabular-nums">{fmtBal(log.stake)}</td>
                      <td className="py-2 px-2"><span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${log.result === 'win' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{log.result.toUpperCase()}</span></td>
                      <td className={`font-mono text-xs py-2 px-2 tabular-nums font-semibold ${log.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{log.profit >= 0 ? '+' : ''}{fmtBal(log.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

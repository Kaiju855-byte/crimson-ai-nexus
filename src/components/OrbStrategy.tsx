import { useState, useEffect, useMemo } from 'react'
import { Clock, Target, AlertTriangle, Play, Pause, RefreshCw, ChevronUp, ChevronDown, Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useDerivConnection } from '../services/derivStream'
import type { OrbZone } from '../types'

const EST_OFFSET_HOURS = -5

function getESTHourMinute(): { hour: number; minute: number } {
  const now = new Date()
  const est = new Date(now.getTime() + EST_OFFSET_HOURS * 60 * 60 * 1000)
  return { hour: est.getHours(), minute: est.getMinutes() }
}

function formatEST(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
  return `${h}:${minute.toString().padStart(2, '0')} ${period} EST`
}

export default function OrbStrategy() {
  const { subscribeToTicks } = useDerivConnection()
  const [enabled, setEnabled] = useState(false)
  const [orbZone, setOrbZone] = useState<OrbZone | null>(null)
  const [price, setPrice] = useState<number | null>(null)
  const [status, setStatus] = useState('Waiting for market open')
  const [ticks, setTicks] = useState<{ time: number; price: number }[]>([])
  const [lastChk, setLastChk] = useState('')

  const candle = useMemo(() => {
    const est = getESTHourMinute()
    return { isORB: est.hour === 8 && est.minute <= 15, isTrigger: est.hour === 9 && est.minute >= 30, time: formatEST(est.hour, est.minute) }
  }, [lastChk])

  useEffect(() => {
    const int = setInterval(() => {
      const p = Math.random() * 10 + 95
      setPrice(p)
      setTicks(prev => [...prev, { time: Date.now() / 1000, price: p }].slice(-1000))
    }, 1000)
    return () => clearInterval(int)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const int = setInterval(() => {
      setLastChk(new Date().toISOString())
      const est = getESTHourMinute()

      if (candle.isORB && ticks.length > 0) {
        const windowTicks = ticks.filter(t => {
          const te = new Date((t.time + EST_OFFSET_HOURS * 3600) * 1000)
          return te.getHours() === 8 && te.getMinutes() <= 15
        })
        if (windowTicks.length > 0) {
          const high = Math.max(...windowTicks.map(t => t.price))
          const low = Math.min(...windowTicks.map(t => t.price))
          setOrbZone({ high, low, highTime: Date.now(), lowTime: Date.now(), breakout: null, breakoutTime: null })
          setStatus(`ORB Zone: High ${high.toFixed(2)} | Low ${low.toFixed(2)}`)
        }
      }

      if (candle.isTrigger && orbZone) {
        if (price && price > orbZone.high) {
          setOrbZone(prev => prev ? { ...prev, breakout: 'bullish', breakoutTime: Date.now() } : null)
          setStatus('BULLISH BREAKOUT - Waiting for pullback')
        } else if (price && price < orbZone.low) {
          setOrbZone(prev => prev ? { ...prev, breakout: 'bearish', breakoutTime: Date.now() } : null)
          setStatus('BEARISH BREAKOUT - Waiting for pullback')
        } else setStatus('CONSOLIDATION - Within ORB boundaries')
      }
    }, 1000)
    return () => clearInterval(int)
  }, [enabled, candle, ticks, price, orbZone])

  const risk = useMemo(() => orbZone ? { sl: (orbZone.high - orbZone.low) > 20 ? 20 : 10, tp: 40, vol: (orbZone.high - orbZone.low) > 20 } : null, [orbZone])

  return (
    <div className="bg-omw-card rounded-lg border border-omw-border overflow-hidden">
      <div className="bg-omw-bg/50 border-b border-omw-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-omw-gold/20 rounded-lg"><Clock className="w-5 h-5 text-omw-gold" /></div>
          <div><h3 className="text-lg font-semibold text-omw-text">8:00 AM ORB Strategy</h3><p className="text-xs text-omw-text-muted">Opening Range Breakout | 15-min processor</p></div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setOrbZone(null); setTicks([]); setStatus('Reset complete') }} className="p-2 hover:bg-omw-bg rounded-lg text-omw-text-muted hover:text-omw-text"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => { setEnabled(!enabled); if (!enabled) { subscribeToTicks('R_100'); setStatus('ORB Active') } else setStatus('Paused') }} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${enabled ? 'bg-omw-error hover:bg-red-800 text-white' : 'bg-omw-gold hover:bg-omw-gold-dark text-omw-bg'}`}>
            {enabled ? <><Pause className="w-4 h-4" />Pause</> : <><Play className="w-4 h-4" />Start</>}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Clock, label: 'Current EST', value: candle.time },
            { icon: Activity, label: 'Price', value: price?.toFixed(2) || '---', cls: 'text-omw-gold' },
            { icon: ChevronUp, label: 'Zone High', value: orbZone?.high.toFixed(2) || '---', cls: 'text-green-400' },
            { icon: ChevronDown, label: 'Zone Low', value: orbZone?.low.toFixed(2) || '---', cls: 'text-red-400' },
          ].map((m, i) => (
            <div key={i} className="bg-omw-bg rounded-lg p-4 border border-omw-border text-center">
              <div className="flex items-center justify-center gap-2 mb-2"><m.icon className="w-4 h-4 text-omw-text-muted" /><span className="text-xs text-omw-text-muted">{m.label}</span></div>
              <p className={`font-mono text-lg font-bold tabular-nums ${m.cls || 'text-omw-text'}`}>{m.value}</p>
            </div>
          ))}
        </div>

        {orbZone && (
          <div className="bg-omw-bg rounded-lg p-6 border border-omw-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-omw-text flex items-center gap-2"><Target className="w-4 h-4 text-omw-gold" />Road Map Zone</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-2 ${orbZone.breakout === 'bullish' ? 'bg-green-500/20 text-green-400' : orbZone.breakout === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-omw-gold/20 text-omw-gold'}`}>
                {orbZone.breakout === 'bullish' && <TrendingUp className="w-3 h-3" />}
                {orbZone.breakout === 'bearish' && <TrendingDown className="w-3 h-3" />}
                {!orbZone.breakout && <Minus className="w-3 h-3" />}
                {orbZone.breakout?.toUpperCase() || 'NEUTRAL'}
              </span>
            </div>
            <div className="relative h-20 bg-omw-card rounded-lg overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-6 bg-green-500/20 border-b border-green-500/40 flex items-center px-3"><span className="text-xs font-mono text-green-400">HIGH: {orbZone.high.toFixed(2)}</span></div>
              <div className="absolute inset-x-0 bottom-0 h-6 bg-red-500/20 border-t border-red-500/40 flex items-center px-3"><span className="text-xs font-mono text-red-400">LOW: {orbZone.low.toFixed(2)}</span></div>
              {price && <div className="absolute left-2 w-2 h-2 bg-omw-gold rounded-full" style={{ top: `${Math.max(0, Math.min(100, ((orbZone.high - price) / (orbZone.high - orbZone.low)) * 100))}%`, transform: 'translateY(-50%)' }} />}
            </div>
          </div>
        )}

        {risk && (
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Stop Loss', value: `${risk.sl} pts`, cls: 'text-red-400' },
              { label: 'Take Profit', value: `${risk.tp} pts`, cls: 'text-green-400' },
              { label: 'Risk:Reward', value: risk.vol ? '1:2' : '1:4', cls: 'text-omw-gold' },
              { label: 'Volatility', value: risk.vol ? 'HIGH' : 'NORMAL', cls: risk.vol ? 'text-orange-400' : 'text-omw-text' },
            ].map((m, i) => (
              <div key={i} className="bg-omw-bg rounded-lg p-4 border border-omw-border">
                <p className="text-xs text-omw-text-muted mb-1">{m.label}</p>
                <p className={`font-mono text-xl font-bold ${m.cls}`}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        <div className={`p-4 rounded-lg border ${status.includes('BREAKOUT') ? 'bg-omw-gold/10 border-omw-gold' : 'bg-omw-bg border-omw-border'}`}>
          <div className="flex items-center gap-3">
            {status.includes('BREAKOUT') ? <AlertTriangle className="w-5 h-5 text-omw-gold" /> : <Activity className="w-5 h-5 text-omw-text-muted" />}
            <p className={`font-semibold ${status.includes('BREAKOUT') ? 'text-omw-gold' : 'text-omw-text'}`}>{status}</p>
          </div>
        </div>

        <div className="bg-omw-bg rounded-lg p-4 border border-omw-border">
          <h4 className="text-xs font-semibold text-omw-text-muted mb-3">ORB Rules</h4>
          <ul className="space-y-2 text-xs text-omw-text">
            {['8:00-8:15 AM EST: Record candle high/low', '9:30 AM EST: Check breakout direction', 'Wait for pullback retest before entry', '10 pts SL / 40 pts TP (2:1 reward)'].map((r, i) => (
              <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-omw-gold rounded-full mt-1.5 flex-shrink-0" /><span>{r}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

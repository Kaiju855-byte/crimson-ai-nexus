import React, { createContext, useContext, useCallback, useRef, useState } from 'react'
import type { ConnectionStatus, AccountInfo, Scopes, Tick, TradeLog, PerformanceMetrics } from '../types'

const DERIV_WS_URL = 'wss://ws.derivws.com/websockets/v3'

interface DerivConnectionContextType {
  connectionState: ConnectionStatus
  accountInfo: AccountInfo | null
  scopes: Scopes | null
  currentTick: Tick | null
  performanceMetrics: PerformanceMetrics
  tradeLogs: TradeLog[]
  connect: (appId: string, apiToken: string) => Promise<void>
  disconnect: () => void
  sendRequest: (request: Record<string, unknown>) => Promise<Record<string, unknown>>
  subscribeToTicks: (symbol: string) => void
  logTrade: (log: Omit<TradeLog, 'id' | 'timestamp'>) => void
}

const DerivConnectionContext = createContext<DerivConnectionContextType | null>(null)

export function useDerivConnection() {
  const context = useContext(DerivConnectionContext)
  if (!context) throw new Error('useDerivConnection must be used within DerivConnectionProvider')
  return context
}

const DEFAULT_METRICS: PerformanceMetrics = {
  totalTrades: 0, wins: 0, losses: 0, winRate: 0,
  totalProfit: 0, totalLoss: 0, netPnL: 0, avgWin: 0, avgLoss: 0,
}

interface AuthorizeResponse {
  authorize?: {
    loginid: string
    email: string
    balance: number
    currency: string
    is_virtual: boolean
    landing_company_name: string
    scope: string[]
    account_list?: Array<{ is_virtual: boolean; loginid: string }>
  }
  error?: { message: string }
}

interface TickData { epoch: number; quote: number; symbol: string }
interface ContractData { contract_id: string; transaction_id: string; profit: number; entry_tick: number; exit_tick: number; is_sold: boolean; strategy?: string }

export function DerivConnectionProvider({ children }: { children: React.ReactNode }) {
  const wsRef = useRef<WebSocket | null>(null)
  const requestIdRef = useRef(0)
  const pendingRequests = useRef<Map<number, { resolve: (v: unknown) => void; reject: (r: unknown) => void }>>(new Map())
  const tickSubs = useRef<Map<string, string>>(new Map())

  const [connectionState, setConnectionState] = useState<ConnectionStatus>({
    connected: false, authenticated: false, environment: null, isLoading: false, error: null,
  })
  const [accountInfo, setAccountInfo] = useState<AccountInfo | null>(null)
  const [scopes, setScopes] = useState<Scopes | null>(null)
  const [currentTick, setCurrentTick] = useState<Tick | null>(null)
  const [tradeLogs, setTradeLogs] = useState<TradeLog[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>(DEFAULT_METRICS)

  const getNextId = useCallback(() => { requestIdRef.current += 1; return requestIdRef.current }, [])

  const sendRequest = useCallback((request: Record<string, unknown>): Promise<Record<string, unknown>> => {
    return new Promise((resolve, reject) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }
      const reqId = getNextId()
      pendingRequests.current.set(reqId, { resolve: (v) => resolve(v as Record<string, unknown>), reject })
      wsRef.current.send(JSON.stringify({ ...request, req_id: reqId }))
    })
  }, [getNextId])

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as Record<string, unknown>
      const reqId = data.req_id as number | undefined

      if (reqId !== undefined && pendingRequests.current.has(reqId)) {
        const { resolve, reject } = pendingRequests.current.get(reqId)!
        pendingRequests.current.delete(reqId)
        if (data.error) reject(new Error((data.error as { message: string }).message || 'Error'))
        else resolve(data)
        return
      }

      if (data.msg_type === 'tick') {
        const tick = data.tick as TickData
        setCurrentTick({ epoch: tick.epoch, quote: tick.quote, symbol: tick.symbol })
      }

      if (data.msg_type === 'balance') {
        const bal = data.balance as { balance: number }
        setAccountInfo(prev => prev ? { ...prev, balance: bal.balance } : null)
      }

      if (data.msg_type === 'contract_update' || data.msg_type === 'proposal_open_contract') {
        const contract = (data.contract_update || data.proposal_open_contract) as ContractData
        if (contract?.is_sold) {
          logTrade({
            strategy: contract.strategy || 'unknown',
            type: 'Contract',
            stake: Math.abs(contract.profit),
            result: contract.profit >= 0 ? 'win' : 'loss',
            profit: contract.profit,
          })
        }
      }
    } catch { /* ignore parse errors */ }
  }, [])

  const connect = useCallback(async (appId: string, apiToken: string) => {
    setConnectionState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const ws = new WebSocket(`${DERIV_WS_URL}?app_id=${appId}`)
      await new Promise<void>((res, rej) => {
        ws.onopen = () => res()
        ws.onerror = () => rej(new Error('WebSocket connection failed'))
        setTimeout(() => rej(new Error('Connection timeout')), 10000)
      })

      wsRef.current = ws
      ws.onmessage = handleMessage
      ws.onerror = () => setConnectionState(prev => ({ ...prev, error: 'WebSocket error — check App ID and network' }))
      ws.onclose = () => setConnectionState({ connected: false, authenticated: false, environment: null, isLoading: false, error: null })

      setConnectionState(prev => ({ ...prev, connected: true }))

      const authRes = await sendRequest({ authorize: apiToken }) as AuthorizeResponse
      if (!authRes.authorize) throw new Error('Authorization failed')

      const auth = authRes.authorize
      const isVirtual = auth.is_virtual === true || (auth.account_list?.some(a => a.is_virtual && a.loginid === auth.loginid) ?? false)

      const userScopes: Scopes = { read: false, trade: false, trading_information: false, admin: false, payment: false }
      ;(auth.scope || []).forEach((s: string) => {
        if (s === 'read') userScopes.read = true
        if (s === 'trade') userScopes.trade = true
      })

      if (!userScopes.read || !userScopes.trade) {
        ws.close()
        throw new Error('Token must have both Read and Trade permissions')
      }

      setConnectionState({ connected: true, authenticated: true, environment: isVirtual ? 'demo' : 'live', isLoading: false, error: null })
      setAccountInfo({ loginid: auth.loginid, email: auth.email, balance: auth.balance, currency: auth.currency, is_virtual: isVirtual, landing_company: auth.landing_company_name })
      setScopes(userScopes)
      await sendRequest({ balance: 1, subscribe: 1 })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      setConnectionState({ connected: false, authenticated: false, environment: null, isLoading: false, error: msg })
      throw err
    }
  }, [handleMessage, sendRequest])

  const disconnect = useCallback(() => {
    if (wsRef.current) wsRef.current.close()
    setConnectionState({ connected: false, authenticated: false, environment: null, isLoading: false, error: null })
    setAccountInfo(null)
    setScopes(null)
  }, [])

  const subscribeToTicks = useCallback(async (symbol: string) => {
    if (!wsRef.current || !connectionState.authenticated) return
    try {
      const res = await sendRequest({ ticks: symbol, subscribe: 1 }) as { subscription?: { id: string } }
      if (res.subscription?.id) tickSubs.current.set(symbol, res.subscription.id)
    } catch { /* ignore */ }
  }, [connectionState.authenticated, sendRequest])

  const logTrade = useCallback((log: Omit<TradeLog, 'id' | 'timestamp'>) => {
    const newLog: TradeLog = { ...log, id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`, timestamp: Date.now() }
    setTradeLogs(prev => [newLog, ...prev])
    setPerformanceMetrics(prev => {
      const isWin = log.result === 'win'
      const newWins = prev.wins + (isWin ? 1 : 0)
      const newLosses = prev.losses + (!isWin ? 1 : 0)
      const newTotal = prev.totalTrades + 1
      const newProfit = prev.totalProfit + (isWin ? log.profit : 0)
      const newLoss = prev.totalLoss + (!isWin ? Math.abs(log.profit) : 0)
      return { totalTrades: newTotal, wins: newWins, losses: newLosses, winRate: newTotal > 0 ? (newWins / newTotal) * 100 : 0, totalProfit: newProfit, totalLoss: newLoss, netPnL: newProfit - newLoss, avgWin: newWins > 0 ? newProfit / newWins : 0, avgLoss: newLosses > 0 ? newLoss / newLosses : 0 }
    })
  }, [])

  return (
    <DerivConnectionContext.Provider value={{ connectionState, accountInfo, scopes, currentTick, performanceMetrics, tradeLogs, connect, disconnect, sendRequest, subscribeToTicks, logTrade }}>
      {children}
    </DerivConnectionContext.Provider>
  )
}

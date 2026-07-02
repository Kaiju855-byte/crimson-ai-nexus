export interface ConnectionStatus {
  connected: boolean
  authenticated: boolean
  environment: 'demo' | 'live' | null
  isLoading: boolean
  error: string | null
}

export interface AccountInfo {
  loginid: string
  email: string
  balance: number
  currency: string
  is_virtual: boolean
  landing_company: string
}

export interface Scopes {
  read: boolean
  trade: boolean
  trading_information: boolean
  admin: boolean
  payment: boolean
}

export interface Tick {
  epoch: number
  quote: number
  symbol: string
}

export interface TradeLog {
  id: string
  timestamp: number
  strategy: string
  type: string
  stake: number
  result: 'win' | 'loss' | 'pending'
  profit: number
}

export interface PerformanceMetrics {
  totalTrades: number
  wins: number
  losses: number
  winRate: number
  totalProfit: number
  totalLoss: number
  netPnL: number
  avgWin: number
  avgLoss: number
}

export interface OrbZone {
  high: number
  low: number
  highTime: number
  lowTime: number
  breakout: 'bullish' | 'bearish' | 'neutral' | null
  breakoutTime: number | null
}

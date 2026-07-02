import AuthGate from './components/AuthGate'
import Dashboard from './components/Dashboard'
import StrategySuite from './components/StrategySuite'
import { DerivConnectionProvider, useDerivConnection } from './services/derivStream'

function AppContent() {
  const { connectionState } = useDerivConnection()
  if (!connectionState.authenticated) return <AuthGate />
  return (
    <div className="min-h-screen bg-omw-bg">
      <Dashboard />
      <main className="container mx-auto px-4 py-6"><StrategySuite /></main>
    </div>
  )
}

export default function App() {
  return (
    <DerivConnectionProvider>
      <AppContent />
    </DerivConnectionProvider>
  )
}

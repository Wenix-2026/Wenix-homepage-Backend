import { AuthProvider, useAuth } from './context/AuthContext'
import { AuthPage }             from './components/auth/AuthPage'
import { CalendarDashboard }    from './components/calendar/CalendarDashboard'

function AppInner() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-6 h-6 border-2 border-teal border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-body text-white/30 tracking-widest uppercase">Načítám…</span>
        </div>
      </div>
    )
  }

  return session ? <CalendarDashboard /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}

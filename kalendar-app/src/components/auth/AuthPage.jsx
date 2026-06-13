import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { AlertCircle } from 'lucide-react'

export function AuthPage() {
  const [mode, setMode]       = useState('login') // 'login' | 'signup'
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [name, setName]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        setSuccess('Zkontroluj e-mail a potvrď registraci.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        // AuthContext se postará o redirect
      }
    } catch (err) {
      // Zachytíme zprávu z PostgreSQL triggeru i z Supabase Auth
      const msg = err?.message || 'Neznámá chyba. Zkus to znovu.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const isWenixDomainError =
    error?.toLowerCase().includes('@wenix.cz') ||
    error?.toLowerCase().includes('registrace povolena')

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-teal/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <span className="font-display text-4xl tracking-widest text-white uppercase">Wenix</span>
          <p className="font-body text-xs text-white/30 mt-1 tracking-widest uppercase">
            Team Calendar
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-white/6 rounded-xl p-8 shadow-2xl">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-white/5 rounded-xl mb-8">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null) }}
                className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all duration-150 ${
                  mode === m
                    ? 'bg-white text-black'
                    : 'text-white/40 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Přihlásit se' : 'Registrace'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {mode === 'signup' && (
              <Input
                label="Celé jméno"
                type="text"
                placeholder="Jan Novák"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            )}

            <Input
              label="E-mail"
              type="email"
              placeholder="jan@wenix.cz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Heslo"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPass(e.target.value)}
              required
              minLength={6}
            />

            {/* Error box */}
            {error && (
              <div className={`flex gap-3 p-3.5 rounded-xl border text-sm font-body ${
                isWenixDomainError
                  ? 'bg-red-500/8 border-red-500/30 text-red-300'
                  : 'bg-red-500/8 border-red-500/20 text-red-400'
              }`}>
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success box */}
            {success && (
              <div className="flex gap-3 p-3.5 rounded-xl border border-teal/30 bg-teal/8 text-sm text-teal font-body">
                {success}
              </div>
            )}

            <Button type="submit" loading={loading} size="lg" className="mt-2 w-full">
              {mode === 'login' ? 'Přihlásit se' : 'Vytvořit účet'}
            </Button>
          </form>

          {mode === 'signup' && (
            <p className="mt-5 text-center text-xs text-white/25 font-body leading-relaxed">
              Registrace je povolena pouze<br />pro e-maily s doménou{' '}
              <span className="text-teal/70">@wenix.cz</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

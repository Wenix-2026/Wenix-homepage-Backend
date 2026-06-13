import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Moon, Sun, LogOut } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const VIEWS = [
    { key: 'month', label: 'Měsíc', short: 'M' },
    { key: 'week',  label: 'Týden', short: 'T' },
    { key: 'day',   label: 'Den',   short: 'D' },
]

export function TopBar({ cal, onNewEvent }) {
    const { profile } = useAuth()
    const [isDark, setIsDark] = useState(true)

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme')
        const isDarkTheme = savedTheme === null ? true : savedTheme === 'dark'
        setIsDark(isDarkTheme)

        const root = document.documentElement
        if (isDarkTheme) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }, [])

    async function handleLogout() {
        await supabase.auth.signOut()
    }

    function toggleTheme() {
        const root = document.documentElement
        const newIsDark = !isDark

        setIsDark(newIsDark)
        localStorage.setItem('theme', newIsDark ? 'dark' : 'light')

        if (newIsDark) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
    }

    function handleDateChange(e) {
        if (e.target.value && typeof cal.setDate === 'function') {
            const selectedDate = new Date(e.target.value)
            cal.setDate(selectedDate)
        }
    }

    return (
        <header className="flex items-center justify-between gap-1 px-2 sm:px-6 py-2.5 border-b border-black/10 dark:border-white/6 flex-shrink-0 bg-white dark:bg-transparent transition-colors w-full overflow-hidden">

            {/* LEVÁ STRANA: Šipky s kompaktním Date Pickerem */}
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                <span className="font-display text-xl sm:text-2xl tracking-widest text-black dark:text-white uppercase hidden md:block">
                    Wenix
                </span>

                <div className="flex items-center bg-black/5 dark:bg-white/5 rounded-xl p-0.5">
                    <button onClick={cal.prev} className="p-1 sm:p-1.5 rounded-lg text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
                        <ChevronLeft size={14} />
                    </button>
                    <button onClick={cal.goToday} className="px-1.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-body font-medium text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors capitalize">
                        Dnes
                    </button>
                    <button onClick={cal.next} className="p-1 sm:p-1.5 rounded-lg text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors">
                        <ChevronRight size={14} />
                    </button>
                </div>

                <div className="relative flex items-center bg-black/5 dark:bg-white/5 rounded-xl hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <input
                        type="date"
                        onChange={handleDateChange}
                        value={cal.date ? cal.date.toISOString().split('T')[0] : ''}
                        className="bg-transparent text-black/70 dark:text-white/70 text-[10px] sm:text-xs font-body border-none rounded-xl px-1 py-1 focus:outline-none dark:[color-scheme:dark] max-w-[95px] sm:max-w-none cursor-pointer"
                    />
                </div>
            </div>

            {/* PRAVÁ STRANA: View switcher, Nová událost, Profil + Logout (Zabírá zbytek místa v jedné lajně) */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-auto">

                {/* Přepínač pohledů */}
                <div className="flex items-center p-0.5 bg-black/5 dark:bg-white/5 rounded-xl">
                    {VIEWS.map(({ key, label, short }) => (
                        <button
                            key={key}
                            onClick={() => cal.setView(key)}
                            className={`px-1.5 sm:px-3 py-1 rounded-lg text-[10px] sm:text-xs font-body font-medium transition-all duration-150 ${
                                cal.view === key
                                    ? 'bg-white text-black shadow-sm dark:bg-white dark:text-black font-semibold'
                                    : 'text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white'
                            }`}
                        >
                            <span className="hidden sm:inline">{label}</span>
                            <span className="sm:hidden">{short}</span>
                        </button>
                    ))}
                </div>

                {/* DarkMode přepínač — Na mobilu schovaný, ať uvolní místo pro logout */}
                <button
                    onClick={toggleTheme}
                    className="p-1.5 rounded-xl text-black/50 dark:text-white/40 hover:text-teal dark:hover:text-teal hover:bg-black/5 dark:hover:bg-white/6 transition-colors hidden sm:block"
                >
                    {isDark ? <Sun size={14} /> : <Moon size={14} />}
                </button>

                {/* Tlačítko Nová událost */}
                <Button onClick={onNewEvent} size="sm" className="gap-0.5 px-2 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold flex-shrink-0">
                    <Plus size={14} />
                    <span className="hidden sm:inline">Nová událost</span>
                </Button>

                {/* User avatar + logout (Vždy pohromadě) */}
                <div className="flex items-center gap-1 flex-shrink-0">
                    <Avatar
                        name={profile?.full_name || profile?.email || ''}
                        src={profile?.avatar_url}
                        size="sm"
                        className="scale-90 sm:scale-100"
                    />
                    <button
                        onClick={handleLogout}
                        className="p-1.5 rounded-xl text-black/40 dark:text-white/30 hover:text-red-500 dark:hover:text-red-400 hover:bg-black/5 dark:hover:bg-white/6 transition-colors border border-transparent"
                        title="Odhlásit se"
                    >
                        <LogOut size={14} />
                    </button>
                </div>
            </div>

        </header>
    )
}
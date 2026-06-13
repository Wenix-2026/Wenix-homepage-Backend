import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Moon, Sun, LogOut, Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'

const VIEWS = [
    { key: 'month', label: 'Měsíc' },
    { key: 'week',  label: 'Týden' },
    { key: 'day',   label: 'Den' },
]

export function TopBar({ cal, onNewEvent }) {
    const { profile } = useAuth()
    const [isDark, setIsDark] = useState(true)

    // 1. Ošetření Dark Mode při načtení
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

    // 2. Čistá funkce pro přepínání témat
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

    // 3. Obsluha Date Pickeru
    function handleDateChange(e) {
        if (e.target.value && typeof cal.setDate === 'function') {
            const selectedDate = new Date(e.target.value)
            cal.setDate(selectedDate)
        }
    }

    return (
        <header className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4 px-3 sm:px-6 py-3 sm:py-4 border-b border-black/10 dark:border-white/6 flex-shrink-0 bg-white dark:bg-transparent transition-colors w-full">
            {/* Brand */}
            <span className="font-display text-2xl tracking-widest text-black dark:text-white uppercase mr-2 hidden sm:block">
        Wenix
      </span>

            {/* Navigace a Date Picker */}
            <div className="flex items-center gap-2">
                <button
                    onClick={cal.prev}
                    className="p-2 rounded-lg text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/6 transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>
                <button
                    onClick={cal.goToday}
                    className="px-3 py-1.5 rounded-lg text-xs font-body text-black/60 dark:text-white/50 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/6 transition-colors capitalize"
                >
                    Dnes
                </button>

                {/* Nativní Date Picker zformátovaný do našeho UI */}
                <div className="relative flex items-center bg-black/5 dark:bg-white/5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                    <input
                        type="date"
                        onChange={handleDateChange}
                        value={cal.date ? cal.date.toISOString().split('T')[0] : ''}
                        className="bg-transparent text-black/70 dark:text-white/70 text-xs font-body border-none rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal cursor-pointer dark:[color-scheme:dark]"
                    />
                </div>

                <button
                    onClick={cal.next}
                    className="p-2 rounded-lg text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/6 transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Název období */}
            <h1 className="font-display text-xl sm:text-2xl tracking-wide text-black dark:text-white uppercase flex-1 capitalize text-center sm:text-left">
                {cal.title()}
            </h1>

            {/* View switcher */}
            <div className="hidden sm:flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
                {VIEWS.map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => cal.setView(key)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-body font-medium transition-all duration-150 ${
                            cal.view === key
                                ? 'bg-white text-black shadow-sm dark:bg-white dark:text-black'
                                : 'text-black/50 dark:text-white/40 hover:text-black dark:hover:text-white'
                        }`}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Dark/Light mode přepínač */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-black/50 dark:text-white/40 hover:text-teal dark:hover:text-teal hover:bg-black/5 dark:hover:bg-white/6 transition-colors"
                title={isDark ? "Přepnout na světlý motiv" : "Přepnout na tmavý motiv"}
            >
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Nová událost */}
            <Button onClick={onNewEvent} size="sm" className="gap-1.5 ml-2">
                <Plus size={14} />
                <span className="hidden sm:inline">Nová událost</span>
                <span className="sm:hidden">+</span>
            </Button>

            {/* User avatar + logout */}
            <div className="flex items-center gap-2 ml-1">
                <Avatar
                    name={profile?.full_name || profile?.email || ''}
                    src={profile?.avatar_url}
                    size="sm"
                />
                <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-black/40 dark:text-white/30 hover:text-red-500 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/6 transition-colors"
                    title="Odhlásit se"
                >
                    <LogOut size={14} />
                </button>
            </div>
        </header>
    )
}
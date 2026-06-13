import { useState } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays,
  isSameMonth, isSameDay, format
} from 'date-fns'
import { cs } from 'date-fns/locale'

export function useCalendar() {
  const [view, setView]       = useState('month') // 'month' | 'week' | 'day'
  const [current, setCurrent] = useState(new Date())

  // ── Navigace ──────────────────────────────────────────────
  function prev() {
    if (view === 'month') setCurrent((d) => subMonths(d, 1))
    if (view === 'week')  setCurrent((d) => subWeeks(d, 1))
    if (view === 'day')   setCurrent((d) => subDays(d, 1))
  }

  function next() {
    if (view === 'month') setCurrent((d) => addMonths(d, 1))
    if (view === 'week')  setCurrent((d) => addWeeks(d, 1))
    if (view === 'day')   setCurrent((d) => addDays(d, 1))
  }

  function goToday() { setCurrent(new Date()) }

  // ── Vypočítané hodnoty ────────────────────────────────────
  const monthDays = (() => {
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 })
    const end   = endOfWeek(endOfMonth(current),     { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  })()

  const weekDays = (() => {
    const start = startOfWeek(current, { weekStartsOn: 1 })
    const end   = endOfWeek(current,   { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  })()

  function title() {
    if (view === 'month') return format(current, 'LLLL yyyy', { locale: cs })
    if (view === 'week')  {
      const s = startOfWeek(current, { weekStartsOn: 1 })
      const e = endOfWeek(current,   { weekStartsOn: 1 })
      return `${format(s, 'd. MMM', { locale: cs })} – ${format(e, 'd. MMM yyyy', { locale: cs })}`
    }
    return format(current, 'EEEE, d. MMMM yyyy', { locale: cs })
  }

  function isCurrentMonth(day) { return isSameMonth(day, current) }
  function isToday(day)        { return isSameDay(day, new Date()) }

  return {
    view,
    setView,
    date: current,         // Správná proměnná pro aktuální datum
    setDate: setCurrent,   // Správná funkce pro změnu data
    prev,
    next,
    goToday,
    title,
    monthDays,
    weekDays,
    isCurrentMonth,
    isToday
  }

}

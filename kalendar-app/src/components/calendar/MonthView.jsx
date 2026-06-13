import { isSameDay, format } from 'date-fns'
import { EventCard } from '../events/EventCard'
import clsx from 'clsx'
import { useState } from 'react'

const DAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function MonthView({ cal, events, onDayClick, onEventClick }) {
    // Stav pro uložení dne, na který uživatel kliknul (výchozí je dnešek)
    const [activeMobileDay, setActiveMobileDay] = useState(new Date())

    function eventsForDay(day) {
        return events.filter((e) => isSameDay(new Date(e.start_time), day))
    }

    const activeDayEvents = eventsForDay(activeMobileDay)

    return (
        <div className="flex flex-col flex-1 overflow-hidden select-none bg-surface-900">
            {/* Hlavička dnů */}
            <div className="grid grid-cols-7 border-b border-black/10 dark:border-white/6 flex-shrink-0">
                {DAY_LABELS.map((d) => (
                    <div key={d} className="py-2 text-center text-[10px] sm:text-xs font-body font-medium text-black/40 dark:text-white/30 uppercase tracking-widest">
                        {d}
                    </div>
                ))}
            </div>

            {/* Hlavní mřížka — Přidáno auto-rows na mobilu a omezení flex-grow */}
            <div className="grid grid-cols-7 auto-rows-[45px] sm:auto-rows-auto sm:flex-1 overflow-y-auto overflow-x-hidden bg-white/[0.01] flex-shrink-0">
                {cal.monthDays.map((day, i) => {
                    const dayEvents    = eventsForDay(day)
                    const isToday      = cal.isToday(day)
                    const isThisMonth  = cal.isCurrentMonth(day)
                    const isWeekend    = [5, 6].includes(i % 7) // So, Ne
                    const isActive     = isSameDay(day, activeMobileDay)

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => {
                                setActiveMobileDay(day)
                                onDayClick(day)
                            }}
                            className={clsx(
                                'min-h-[45px] sm:min-h-[100px] lg:min-h-[120px] p-1 sm:p-1.5 border-b border-r border-black/5 dark:border-white/4 cursor-pointer transition-colors group flex flex-col justify-between',
                                !isThisMonth && 'opacity-30',
                                isWeekend   && 'bg-black/[0.02] dark:bg-white/[0.01]',
                                isActive    && 'bg-teal/10 dark:bg-teal/10', // Zvýraznění vybraného dne
                                'hover:bg-black/5 dark:hover:bg-white/[0.03]'
                            )}
                        >
                            {/* Číslo dne — Vycentrováno na mobilu pro čistší vzhled */}
                            <div className="flex justify-center sm:justify-end w-full">
                                <span
                                    className={clsx(
                                        'w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-body rounded-full transition-colors',
                                        isToday
                                            ? 'bg-teal text-white font-semibold shadow-sm'
                                            : isActive
                                                ? 'border border-teal text-teal font-medium'
                                                : 'text-black/60 dark:text-white/50 group-hover:text-black dark:group-hover:text-white/80'
                                    )}
                                >
                                  {format(day, 'd')}
                                </span>
                            </div>

                            {/* Události v buňce */}
                            <div className="flex flex-col gap-0.5 sm:gap-1 w-full">
                                {/* Desktop zobrazení: Celé karty */}
                                {dayEvents.slice(0, 3).map((ev) => (
                                    <div key={ev.id} className="hidden sm:block">
                                        <EventCard event={ev} onClick={onEventClick} />
                                    </div>
                                ))}

                                {/* Mobilní zobrazení: Jedna minimalistická svítící tečka na střed */}
                                {dayEvents.length > 0 && (
                                    <div className="flex sm:hidden justify-center pb-0.5">
                                        <div className="w-1 h-1 rounded-full bg-teal shadow-[0_0_4px_#14968C]" />
                                    </div>
                                )}

                                {/* Ukazatel dalších událostí na desktopu */}
                                {dayEvents.length > 3 && (
                                    <span className="hidden sm:block text-[9px] sm:text-[10px] text-black/40 dark:text-white/30 font-body px-1 sm:px-2 text-right sm:text-left mt-1 sm:mt-0">
                                        +{dayEvents.length - 3} další
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Mobilní spodní lišta (Agenda pro vybraný den) — Automaticky se natáhne přes celé zbývající prázdné místo */}
            <div className="sm:hidden border-t border-black/10 dark:border-white/10 bg-white/3 dark:bg-surface-card p-4 flex flex-col flex-1 h-full overflow-y-auto">
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <span className="text-[11px] font-bold font-body tracking-widest text-black/40 dark:text-white/40 uppercase">
                        Agenda — {format(activeMobileDay, 'd. M. yyyy')}
                    </span>
                </div>

                <div className="flex flex-col gap-2 flex-grow">
                    {activeDayEvents.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center min-h-[100px]">
                            <span className="text-xs text-black/30 dark:text-white/30 italic font-body">
                                Žádné události
                            </span>
                        </div>
                    ) : (
                        activeDayEvents.map((ev) => (
                            <div
                                key={ev.id}
                                onClick={() => onEventClick(ev)}
                                className="flex items-center gap-3 p-3 bg-black/5 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 rounded-xl active:scale-[0.99] transition-transform"
                            >
                                <div className="w-1 h-6 bg-teal rounded-full" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-semibold text-black dark:text-white truncate font-body">
                                        {ev.title}
                                    </div>
                                    <div className="text-[10px] text-black/40 dark:text-white/40 font-body mt-0.5">
                                        {format(new Date(ev.start_time), 'HH:mm')} — {format(new Date(ev.end_time), 'HH:mm')}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
import { isSameDay, format } from 'date-fns'
import { EventCard } from '../events/EventCard'
import clsx from 'clsx'

const DAY_LABELS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne']

export function MonthView({ cal, events, onDayClick, onEventClick }) {
    function eventsForDay(day) {
        return events.filter((e) => isSameDay(new Date(e.start_time), day))
    }

    return (
        <div className="flex flex-col flex-1 overflow-hidden select-none">
            {/* Hlavička dnů */}
            <div className="grid grid-cols-7 border-b border-black/10 dark:border-white/6 flex-shrink-0">
                {DAY_LABELS.map((d) => (
                    <div key={d} className="py-2 text-center text-[10px] sm:text-xs font-body font-medium text-black/40 dark:text-white/30 uppercase tracking-widest">
                        {d}
                    </div>
                ))}
            </div>

            {/* Hlavní mřížka */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto overflow-x-hidden">
                {cal.monthDays.map((day, i) => {
                    const dayEvents    = eventsForDay(day)
                    const isToday      = cal.isToday(day)
                    const isThisMonth  = cal.isCurrentMonth(day)
                    const isWeekend    = [5, 6].includes(i % 7) // So, Ne

                    return (
                        <div
                            key={day.toISOString()}
                            onClick={() => onDayClick(day)}
                            className={clsx(
                                'min-h-[70px] sm:min-h-[100px] lg:min-h-[120px] p-1 sm:p-1.5 border-b border-r border-black/5 dark:border-white/4 cursor-pointer transition-colors group',
                                !isThisMonth && 'opacity-30',
                                isWeekend   && 'bg-black/[0.02] dark:bg-white/[0.01]',
                                'hover:bg-black/5 dark:hover:bg-white/[0.03]'
                            )}
                        >
                            {/* Číslo dne */}
                            <div className="flex justify-end mb-0.5 sm:mb-1">
                <span
                    className={clsx(
                        'w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-[10px] sm:text-xs font-body rounded-full transition-colors',
                        isToday
                            ? 'bg-teal text-white font-semibold shadow-sm'
                            : 'text-black/60 dark:text-white/50 group-hover:text-black dark:group-hover:text-white/80'
                    )}
                >
                  {format(day, 'd')}
                </span>
                            </div>

                            {/* Události v buňce */}
                            <div className="flex flex-col gap-0.5 sm:gap-1">
                                {/* Desktop zobrazení: Celé karty */}
                                {dayEvents.slice(0, 3).map((ev) => (
                                    <div key={ev.id} className="hidden sm:block">
                                        <EventCard event={ev} onClick={onEventClick} />
                                    </div>
                                ))}

                                {/* Mobilní zobrazení: Minimalistické tečky */}
                                <div className="flex sm:hidden flex-wrap gap-1 px-1 mt-1 justify-end">
                                    {dayEvents.slice(0, 3).map((ev) => (
                                        <div key={ev.id} className="w-1.5 h-1.5 rounded-full bg-teal" />
                                    ))}
                                </div>

                                {/* Ukazatel dalších událostí */}
                                {dayEvents.length > 3 && (
                                    <span className="text-[9px] sm:text-[10px] text-black/40 dark:text-white/30 font-body px-1 sm:px-2 text-right sm:text-left mt-1 sm:mt-0">
                    <span className="hidden sm:inline">+{dayEvents.length - 3} další</span>
                    <span className="sm:hidden">+{dayEvents.length - 3}</span>
                  </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
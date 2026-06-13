import { isSameDay, format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { EventCard } from '../events/EventCard'
import clsx from 'clsx'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 60

export function WeekView({ cal, events, onEventClick, onSlotClick }) {
  function eventsForDay(day) {
    return events.filter((e) => isSameDay(new Date(e.start_time), day))
  }

  return (
      <div className="flex flex-col flex-1 overflow-hidden select-none">
        {/* Hlavička dnů v týdnu */}
        <div className="flex border-b border-black/10 dark:border-white/6 flex-shrink-0 ml-12 sm:ml-16">
          {cal.weekDays.map((day) => {
            const isToday = cal.isToday(day)
            return (
                <div
                    key={day.toISOString()}
                    className="flex-1 py-3 border-r border-black/5 dark:border-white/4 last:border-r-0 flex flex-col items-center justify-center gap-1"
                >
              <span className="text-[10px] sm:text-xs font-body font-medium text-black/40 dark:text-white/30 uppercase tracking-widest">
                {format(day, 'EEEEEE', { locale: cs })}
              </span>
                  <span
                      className={clsx(
                          'w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-sm sm:text-base font-body rounded-full transition-colors',
                          isToday
                              ? 'bg-teal text-white font-semibold shadow-sm'
                              : 'text-black dark:text-white'
                      )}
                  >
                {format(day, 'd')}
              </span>
                </div>
            )
          })}
        </div>

        {/* Mřížka (Hodiny a Dny) */}
        <div className="flex flex-1 overflow-y-auto">
          {/* Časová osa vlevo */}
          <div className="w-12 sm:w-16 flex-shrink-0 border-r border-black/10 dark:border-white/6 bg-white dark:bg-surface-900 z-10">
            <div style={{ height: SLOT_HEIGHT * 24 }} className="relative">
              {HOURS.map((h) => (
                  <div
                      key={h}
                      style={{ height: SLOT_HEIGHT }}
                      className="relative flex items-start pt-1 pr-2 justify-end border-b border-black/5 dark:border-white/4"
                  >
                <span className="text-[10px] sm:text-xs font-body text-black/40 dark:text-white/30">
                  {h}:00
                </span>
                  </div>
              ))}
            </div>
          </div>

          {/* Sloupce jednotlivých dnů */}
          <div className="flex flex-1 relative bg-white dark:bg-surface-900">
            {cal.weekDays.map((day) => (
                <div
                    key={day.toISOString()}
                    className="flex-1 border-r border-black/5 dark:border-white/4 last:border-r-0 relative"
                >
                  {/* Klikací sloty pro každou hodinu */}
                  {HOURS.map((h) => (
                      <div
                          key={h}
                          onClick={() => onSlotClick && onSlotClick(day, h)}
                          style={{ height: SLOT_HEIGHT }}
                          className="border-b border-black/5 dark:border-white/4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors"
                      />
                  ))}

                  {/* Vykreslení událostí */}
                  {eventsForDay(day).map((ev) => {
                    const st = new Date(ev.start_time)
                    const en = new Date(ev.end_time)

                    const startMins = st.getHours() * 60 + st.getMinutes()
                    const endMins   = en.getHours() * 60 + en.getMinutes()

                    const topPx = (startMins / 60) * SLOT_HEIGHT
                    const heightPx = ((endMins - startMins) / 60) * SLOT_HEIGHT

                    return (
                        <div
                            key={ev.id}
                            className="absolute left-1 right-1 sm:left-2 sm:right-2 z-20"
                            style={{ top: topPx, height: Math.max(heightPx, 20) }}
                        >
                          <EventCard
                              event={ev}
                              onClick={onEventClick}
                              isCompact={heightPx < 50}
                          />
                        </div>
                    )
                  })}
                </div>
            ))}
          </div>
        </div>
      </div>
  )
}
import { isSameDay, format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { EventCard } from '../events/EventCard'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const SLOT_HEIGHT = 80 // Větší výška slotu pro denní pohled

export function DayView({ cal, events, onEventClick, onSlotClick }) {
  const dayEvents = events.filter((e) => isSameDay(new Date(e.start_time), cal.date))

  return (
      <div className="flex flex-col flex-1 overflow-hidden select-none bg-white dark:bg-surface-900">
        {/* Hlavička dne */}
        <div className="py-4 border-b border-black/10 dark:border-white/6 flex flex-col items-center justify-center flex-shrink-0">
        <span className="text-[10px] sm:text-xs font-body font-medium text-black/40 dark:text-white/30 uppercase tracking-widest">
          {format(cal.date, 'EEEEEE', { locale: cs })}
        </span>
          <span className="text-xl sm:text-2xl font-body text-black dark:text-white mt-1">
          {format(cal.date, 'd. MMMM yyyy', { locale: cs })}
        </span>
        </div>

        {/* Mřížka dne */}
        <div className="flex flex-1 overflow-y-auto">
          <div className="w-12 sm:w-16 flex-shrink-0 border-r border-black/10 dark:border-white/6">
            <div style={{ height: SLOT_HEIGHT * 24 }}>
              {HOURS.map((h) => (
                  <div
                      key={h}
                      style={{ height: SLOT_HEIGHT }}
                      className="flex items-start pt-1 pr-2 justify-end border-b border-black/5 dark:border-white/4"
                  >
                <span className="text-[10px] sm:text-xs font-body text-black/40 dark:text-white/30">
                  {h}:00
                </span>
                  </div>
              ))}
            </div>
          </div>

          <div className="flex-1 relative">
            {/* Klikací mřížka */}
            {HOURS.map((h) => (
                <div
                    key={h}
                    onClick={() => onSlotClick && onSlotClick(cal.date, h)}
                    style={{ height: SLOT_HEIGHT }}
                    className="border-b border-black/5 dark:border-white/4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/[0.03] transition-colors"
                />
            ))}

            {/* Události */}
            {dayEvents.map((ev) => {
              const st = new Date(ev.start_time)
              const en = new Date(ev.end_time)

              const startMins = st.getHours() * 60 + st.getMinutes()
              const endMins   = en.getHours() * 60 + en.getMinutes()

              const topPx = (startMins / 60) * SLOT_HEIGHT
              const heightPx = ((endMins - startMins) / 60) * SLOT_HEIGHT

              return (
                  <div
                      key={ev.id}
                      className="absolute left-2 right-4 sm:right-8 z-20"
                      style={{ top: topPx, height: Math.max(heightPx, 30) }}
                  >
                    <EventCard event={ev} onClick={onEventClick} />
                  </div>
              )
            })}
          </div>
        </div>
      </div>
  )
}
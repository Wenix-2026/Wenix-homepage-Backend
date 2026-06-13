import { format } from 'date-fns'
import clsx from 'clsx'

export function EventCard({ event, onClick, isCompact = false }) {
  const st = new Date(event.start_time)
  const en = new Date(event.end_time)

  const bgColor = 'bg-teal/20 dark:bg-teal/10'
  const borderColor = 'border-teal/50'

  return (
      <div
          onClick={(e) => {
            e.stopPropagation()
            onClick && onClick(event)
          }}
          className={clsx(
              'w-full h-full rounded-md border-l-2 cursor-pointer transition-all hover:brightness-110 overflow-hidden flex flex-col',
              bgColor,
              borderColor,
              isCompact ? 'p-1' : 'p-1 sm:p-2'
          )}
      >
        <div className={clsx(
            'font-body font-medium truncate text-teal-dark dark:text-teal',
            isCompact ? 'text-[10px]' : 'text-[10px] sm:text-xs'
        )}>
          {event.title}
        </div>

        {!isCompact && (
            <div className="text-[9px] sm:text-[10px] font-body text-black/60 dark:text-white/50 truncate mt-0.5">
              {format(st, 'HH:mm')} - {format(en, 'HH:mm')}
            </div>
        )}

        {/* Vykreslení tagů (skryté v kompaktním zobrazení) */}
        {!isCompact && event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {event.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 text-black/70 dark:text-white/70 rounded text-[8px] font-medium tracking-wide">
              #{tag}
            </span>
              ))}
            </div>
        )}
      </div>
  )
}
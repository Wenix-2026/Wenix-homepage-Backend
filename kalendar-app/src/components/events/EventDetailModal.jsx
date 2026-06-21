import { format } from 'date-fns'
import { cs } from 'date-fns/locale'
import { Clock, MapPin, Bell, Pencil } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Avatar } from '../ui/Avatar'
import { useAuth } from '../../context/AuthContext'

const REMINDER_LABELS = { 0: '—', 5: '5 min', 15: '15 min', 30: '30 min', 60: '1 hod', 1440: '1 den' }

export function EventDetailModal({ open, onClose, event, onEdit }) {
  const { session } = useAuth()
  if (!event) return null

  const isOwner  = session?.user?.id === event.created_by
  console.log('[DetailModal] session.user.id:', session?.user?.id, '| event.created_by:', event.created_by, '| isOwner:', isOwner)
  const start    = new Date(event.start_time)
  const end      = new Date(event.end_time)
  const assignees = event.event_assignees?.map((ea) => ea.profiles) || []

  return (
    <Modal open={open} onClose={onClose} title={event.title} size="md">
      <div className="flex flex-col gap-5">
        {/* Čas */}
        <div className="flex items-start gap-3 text-sm font-body text-white/70">
          <Clock size={14} className="mt-0.5 text-white/30 flex-shrink-0" />
          <div>
            <div>{format(start, 'EEEE, d. MMMM yyyy', { locale: cs })}</div>
            <div className="text-white/40 text-xs">
              {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
            </div>
          </div>
        </div>

        {/* Popis */}
        {event.description && (
          <p className="text-sm font-body text-white/60 leading-relaxed">
            {event.description}
          </p>
        )}

        {/* Odkaz */}
        {event.location_link && (
          <div className="flex items-center gap-3">
            <MapPin size={14} className="text-white/30 flex-shrink-0" />
            <a
              href={event.location_link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-body text-teal hover:underline truncate"
            >
              Připojit se ke schůzce
            </a>
          </div>
        )}

        {/* Upozornění */}
        <div className="flex items-center gap-3">
          <Bell size={14} className="text-white/30 flex-shrink-0" />
          <span className="text-sm font-body text-white/50">
            {REMINDER_LABELS[event.reminder_minutes] ?? `${event.reminder_minutes} min`} před
          </span>
        </div>

        {/* Assignees */}
        {assignees.length > 0 && (
          <div>
            <div className="text-xs font-body text-white/30 uppercase tracking-widest mb-2">
              Účastníci
            </div>
            <div className="flex flex-col gap-2">
              {assignees.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <Avatar name={p.full_name || p.email} src={p.avatar_url} size="sm" />
                  <div>
                    <div className="text-sm font-body text-white/80">{p.full_name || '—'}</div>
                    <div className="text-xs font-body text-white/30">{p.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vytvořil */}
        {event.profiles && (
          <div className="pt-4 border-t border-white/6">
            <div className="text-xs font-body text-white/20">
              Vytvořil(a): {event.profiles.full_name || event.profiles.email}
            </div>
          </div>
        )}

        {/* Edit button (jen pro vlastníka) */}
        {isOwner && (
          <div className="flex justify-end pt-1">
            <Button variant="secondary" size="sm" onClick={() => onEdit(event)}>
              <Pencil size={12} />
              Upravit
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

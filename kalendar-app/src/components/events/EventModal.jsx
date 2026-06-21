import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Modal } from '../ui/Modal'
import { Input, Textarea } from '../ui/Input'
import { Button } from '../ui/Button'
import { MultiSelect } from '../ui/MultiSelect'
import { useProfiles } from '../../hooks/useProfiles'
import { useAuth } from '../../context/AuthContext'

const REMINDER_OPTIONS = [
  { value: 0,    label: 'Bez upozornění' },
  { value: 5,    label: '5 minut před' },
  { value: 15,   label: '15 minut před' },
  { value: 30,   label: '30 minut před' },
  { value: 60,   label: '1 hodinu před' },
  { value: 1440, label: '1 den před' },
]

// Ochrana před pádem: Pokud přijde nesmyslné datum, vrátí se prázdný řetězec
function toLocalInput(isoOrDate) {
  if (!isoOrDate) return ''
  const d = new Date(isoOrDate)
  if (isNaN(d.getTime())) return ''
  return format(d, "yyyy-MM-dd'T'HH:mm")
}

export function EventModal({ open, onClose, onSave, onDelete, initialDate, event }) {
  const { session } = useAuth()
  const { profiles } = useProfiles()

  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')

  const isEdit = Boolean(event)

  const now = new Date()
  const defaultStart = initialDate ? new Date(initialDate).setHours(9, 0) : now
  const defaultEnd = initialDate ? new Date(initialDate).setHours(10, 0) : new Date(now.getTime() + 60 * 60000)

  const blank = {
    title:            '',
    description:      '',
    start_time:       format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
    end_time:         format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
    location_link:    '',
    reminder_minutes: 15,
    assigneeIds:      [],
  }

  const [form, setForm]     = useState(blank)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (event) {
      setForm({
        title:            event.title || '',
        description:      event.description || '',
        start_time:       toLocalInput(event.start_time),
        end_time:         toLocalInput(event.end_time),
        location_link:    event.location_link || '',
        reminder_minutes: event.reminder_minutes !== undefined && event.reminder_minutes !== null ? Number(event.reminder_minutes) : 15,
        assigneeIds:      event.event_assignees?.map((ea) => ea.profiles?.id).filter(Boolean) || [],
      })
      setTags(event.tags || [])
    } else {
      setForm({
        ...blank,
        start_time: format(defaultStart, "yyyy-MM-dd'T'HH:mm"),
        end_time:   format(defaultEnd, "yyyy-MM-dd'T'HH:mm"),
      })
      setTags([])
    }
    setTagInput('')
    setErrors({})
    setSaveError(null)
  }, [event, initialDate, open])

  function set(key, val) {
    setForm((f) => ({ ...f, [key]: val }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }))
  }

  function validate() {
    const e = {}
    if (!form.title?.trim()) e.title      = 'Název je povinný'
    if (!form.start_time)    e.start_time = 'Vyber začátek'
    if (!form.end_time)      e.end_time   = 'Vyber konec'
    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      e.end_time = 'Konec musí být po začátku'
    }
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      console.warn("Ukládání zablokováno validací:", errs)
      return
    }

    setLoading(true)
    setSaveError(null)
    try {
      const startD = new Date(form.start_time)
      const endD = new Date(form.end_time)

      if (isNaN(startD.getTime()) || isNaN(endD.getTime())) {
        throw new Error('Neplatný formát data.')
      }

      const payload = {
        title:            form.title.trim(),
        description:      form.description.trim() || null,
        start_time:       startD.toISOString(),
        end_time:         endD.toISOString(),
        location_link:    form.location_link.trim() || null,
        reminder_minutes: Number(form.reminder_minutes),
        created_by:       session?.user?.id,
        assigneeIds:      form.assigneeIds || [],
        tags:             tags || [],
      }

      console.log("Odesílám payload:", payload)
      await onSave(payload, event?.id)
      onClose()
    } catch (err) {
      console.error("Chyba při ukládání:", err)
      setSaveError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Opravdu smazat tuto událost?')) return
    setLoading(true)
    try {
      await onDelete(event.id)
      onClose()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const newTag = tagInput.trim()
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag])
      }
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
      <Modal
          open={open}
          onClose={onClose}
          title={isEdit ? 'Upravit událost' : 'Nová událost'}
          size="lg"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
              label="Název události"
              placeholder="Týmová porada"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
              autoFocus
          />

          <Textarea
              label="Popis"
              placeholder="Agenda, poznámky…"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
                label="Začátek"
                type="datetime-local"
                value={form.start_time}
                onChange={(e) => set('start_time', e.target.value)}
                error={errors.start_time}
            />
            <Input
                label="Konec"
                type="datetime-local"
                value={form.end_time}
                onChange={(e) => set('end_time', e.target.value)}
                error={errors.end_time}
            />
          </div>

          <Input
              label="Odkaz na schůzku"
              placeholder="https://meet.google.com/…"
              type="url"
              value={form.location_link}
              onChange={(e) => set('location_link', e.target.value)}
          />

          <div className="relative">
            <MultiSelect
                label="Přiřazení členové"
                options={profiles || []}
                value={form.assigneeIds}
                onChange={(ids) => set('assigneeIds', ids)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-body font-medium text-black/50 dark:text-white/50 uppercase tracking-widest">
              Štítky (Tagy)
            </label>

            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-black/10 dark:bg-white/10 text-black dark:text-white text-xs rounded-md">
                #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-red-500 hover:text-red-400 ml-1 font-bold">×</button>
              </span>
              ))}
            </div>

            <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Napiš tag a stiskni Enter..."
                className="bg-transparent border border-black/10 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-black dark:text-white focus:outline-none focus:border-teal w-full transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-widest font-body">
              Upozornění
            </label>
            <select
                value={form.reminder_minutes}
                onChange={(e) => set('reminder_minutes', Number(e.target.value))}
                className="w-full bg-transparent border border-black/10 dark:border-white/12 focus:border-teal rounded-xl px-4 py-3 text-sm text-black dark:text-white font-body outline-none transition-all duration-150 [&>option]:bg-white dark:[&>option]:bg-surface-modal"
            >
              {REMINDER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {saveError && (
              <div className="px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/8 text-sm text-red-400 font-body">
                {saveError}
              </div>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-black/10 dark:border-white/6 mt-2">
            {isEdit && (
                <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={handleDelete}
                    loading={loading}
                >
                  Smazat
                </Button>
            )}
            <div className="flex-1" />
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Zrušit
            </Button>
            <Button type="submit" loading={loading} size="sm">
              {isEdit ? 'Uložit změny' : 'Vytvořit událost'}
            </Button>
          </div>
        </form>
      </Modal>
  )
}
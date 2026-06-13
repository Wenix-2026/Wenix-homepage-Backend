import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Avatar } from './Avatar'
import clsx from 'clsx'

/**
 * options:   [{ id, full_name, email, avatar_url }]
 * value:     string[] (pole id)
 * onChange:  (ids: string[]) => void
 */
export function MultiSelect({ label, options = [], value = [], onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggle(id) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const selected = options.filter((o) => value.includes(o.id))

  return (
      <div className="flex flex-col gap-1.5" ref={ref}>
        {label && (
            <label className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-widest font-body">
              {label}
            </label>
        )}

        {/* Trigger */}
        <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={clsx(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-body text-left transition-all duration-150 outline-none',
                open ? 'border-teal' : 'border-black/10 dark:border-white/12'
            )}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {selected.length === 0 ? (
                <span className="text-black/30 dark:text-white/25">Vyber členy týmu…</span>
            ) : (
                selected.map((p) => (
                    <span
                        key={p.id}
                        className="flex items-center gap-1.5 bg-black/5 dark:bg-white/8 rounded-lg px-2 py-0.5"
                    >
                <Avatar name={p.full_name || p.email} src={p.avatar_url} size="xs" />
                <span className="text-black dark:text-white text-xs">{p.full_name || p.email}</span>
              </span>
                ))
            )}
          </div>
          <ChevronDown
              size={14}
              className={clsx('text-black/40 dark:text-white/40 transition-transform flex-shrink-0 ml-2', open && 'rotate-180')}
          />
        </button>

        {/* Dropdown */}
        {open && (
            <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#131313] border border-black/10 dark:border-white/10 rounded-xl shadow-xl overflow-hidden">
              {options.map((opt) => {
                const isSelected = value.includes(opt.id)
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggle(opt.id)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-black/5 dark:hover:bg-white/6 transition-colors text-sm font-body text-black dark:text-white text-left"
                    >
                      <Avatar name={opt.full_name || opt.email} src={opt.avatar_url} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{opt.full_name || '-'}</div>
                        <div className="text-xs text-black/40 dark:text-white/40 truncate">{opt.email}</div>
                      </div>
                      {isSelected && <Check size={14} className="text-teal flex-shrink-0" />}
                    </button>
                )
              })}
              {options.length === 0 && (
                  <div className="px-4 py-3 text-sm text-black/30 dark:text-white/30 font-body">Žádní členové</div>
              )}
            </div>
        )}
      </div>
  )
}
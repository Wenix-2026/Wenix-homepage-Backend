import { useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

export function Modal({ open, onClose, title, children, size = 'md' }) {
  // Zavření na Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-3xl',
  }

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        />

        {/* Panel */}
        <div
            className={clsx(
                'relative w-full bg-white dark:bg-[#131313] border border-black/10 dark:border-white/6 rounded-xl shadow-2xl',
                'flex flex-col max-h-[90vh]',
                sizes[size]
            )}
            onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/6 flex-shrink-0">
            <h2 className="font-display text-xl tracking-wide text-black dark:text-white uppercase">
              {title}
            </h2>
            <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-black/40 hover:text-black hover:bg-black/5 dark:text-white/40 dark:hover:text-white dark:hover:bg-white/8 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            {children}
          </div>
        </div>
      </div>
  )
}
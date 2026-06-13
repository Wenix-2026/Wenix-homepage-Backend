import clsx from 'clsx'

/**
 * variant: 'primary' | 'secondary' | 'ghost' | 'danger'
 * size:    'sm' | 'md' | 'lg'
 */
export function Button({
  children,
  variant = 'primary',
  size    = 'md',
  loading = false,
  className,
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-150 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:opacity-40 disabled:pointer-events-none select-none'

  const variants = {
    primary:   'bg-white text-black hover:bg-white/90 active:scale-[0.98]',
    secondary: 'bg-transparent border border-white/12 text-white hover:bg-white/6 active:scale-[0.98]',
    ghost:     'bg-transparent text-white/60 hover:text-white hover:bg-white/6',
    danger:    'bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-7 py-3.5 text-base',
  }

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

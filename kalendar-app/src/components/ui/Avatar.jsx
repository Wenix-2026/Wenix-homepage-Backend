import clsx from 'clsx'

export function Avatar({ name = '', src, size = 'md', className }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const sizes = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-7 h-7 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover border border-white/10', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={clsx(
        'rounded-full flex items-center justify-center font-body font-semibold',
        'bg-gradient-to-br from-teal/80 to-blue/80 text-white border border-white/10',
        sizes[size],
        className
      )}
    >
      {initials || '?'}
    </div>
  )
}

import clsx from 'clsx'

export function Input({ label, error, className, ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-widest font-body">
                    {label}
                </label>
            )}
            <input
                className={clsx(
                    'w-full bg-transparent border rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder-black/30 dark:placeholder-white/25 font-body',
                    'transition-all duration-150 outline-none',
                    error
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-black/10 focus:border-teal dark:border-white/12 dark:focus:border-teal',
                    className
                )}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-500 dark:text-red-400 font-body">{error}</span>
            )}
        </div>
    )
}

export function Textarea({ label, error, className, ...props }) {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-xs font-medium text-black/50 dark:text-white/50 uppercase tracking-widest font-body">
                    {label}
                </label>
            )}
            <textarea
                rows={3}
                className={clsx(
                    'w-full bg-transparent border rounded-xl px-4 py-3 text-sm text-black dark:text-white placeholder-black/30 dark:placeholder-white/25 font-body resize-none',
                    'transition-all duration-150 outline-none',
                    error
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-black/10 focus:border-teal dark:border-white/12 dark:focus:border-teal',
                    className
                )}
                {...props}
            />
            {error && (
                <span className="text-xs text-red-500 dark:text-red-400 font-body">{error}</span>
            )}
        </div>
    )
}
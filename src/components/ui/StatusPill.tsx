import clsx from 'clsx'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const dotTones: Record<StatusTone, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-ink-muted/50',
  info: 'bg-brand-500',
}

const textTones: Record<StatusTone, string> = {
  success: 'text-emerald-700',
  warning: 'text-amber-700',
  danger: 'text-rose-700',
  neutral: 'text-ink-muted',
  info: 'text-brand-700',
}

/** Status is always communicated with a label, never with colour alone. */
export function StatusPill({
  tone,
  label,
  className,
  pulse = false,
}: {
  tone: StatusTone
  label: string
  className?: string
  pulse?: boolean
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-2 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium',
        textTones[tone],
        className,
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse ? (
          <span
            className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', dotTones[tone])}
          />
        ) : null}
        <span className={clsx('relative inline-flex h-2 w-2 rounded-full', dotTones[tone])} />
      </span>
      {label}
    </span>
  )
}

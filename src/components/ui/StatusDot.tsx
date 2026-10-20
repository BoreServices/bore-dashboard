import clsx from 'clsx'

export type StatusTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const dotTones: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  neutral: 'bg-ink-faint',
  info: 'bg-brand-500',
}

const textTones: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  neutral: 'text-ink-muted',
  info: 'text-brand-600',
}

/** Status is always communicated with a label, never with colour alone. */
export function StatusDot({
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
    <span className={clsx('inline-flex items-center gap-1.5 text-xs font-medium', textTones[tone], className)}>
      <span className="relative flex h-1.5 w-1.5">
        {pulse ? (
          <span
            className={clsx('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', dotTones[tone])}
          />
        ) : null}
        <span className={clsx('relative inline-flex h-1.5 w-1.5 rounded-full', dotTones[tone])} />
      </span>
      {label}
    </span>
  )
}

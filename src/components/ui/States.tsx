import type { ReactNode } from 'react'
import clsx from 'clsx'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string
  description: ReactNode
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/70 px-6 py-14 text-center">
      {icon ? <div className="mb-4 text-brand-400">{icon}</div> : null}
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-ink-muted">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}: {
  title?: string
  description: ReactNode
  onRetry?: () => void
  retryLabel?: string
  className?: string
}) {
  return (
    <div
      role="alert"
      className={clsx(
        'flex flex-col items-center justify-center rounded-2xl border border-rose-100 bg-rose-50/60 px-6 py-12 text-center',
        className,
      )}
    >
      <h3 className="text-base font-semibold text-rose-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-rose-800/80">{description}</p>
      {onRetry ? (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}

export function InlineNotice({
  tone = 'info',
  title,
  children,
  className,
}: {
  tone?: 'info' | 'warning' | 'danger'
  title?: ReactNode
  children: ReactNode
  className?: string
}) {
  const tones = {
    info: 'border-brand-100 bg-brand-50/70 text-brand-900',
    warning: 'border-amber-100 bg-amber-50/70 text-amber-900',
    danger: 'border-rose-100 bg-rose-50/70 text-rose-900',
  }
  return (
    <div className={clsx('rounded-xl border px-4 py-3 text-sm', tones[tone], className)}>
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={clsx(title && 'mt-1', 'text-[13px] leading-relaxed opacity-90')}>{children}</div>
    </div>
  )
}

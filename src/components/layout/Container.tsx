import type { ReactNode } from 'react'
import clsx from 'clsx'

export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: 'default' | 'wide'
}) {
  return (
    <div
      className={clsx(
        'mx-auto w-full px-4 sm:px-6',
        size === 'wide' ? 'max-w-7xl' : 'max-w-6xl',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-500">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 text-base leading-relaxed text-ink-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}

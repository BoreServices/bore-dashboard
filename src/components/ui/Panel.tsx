import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

/**
 * The one bordered surface in the system. Sections are separated by rules and
 * whitespace rather than by nesting more boxes.
 */
export function Panel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
  flush?: boolean
}) {
  return (
    <section className={clsx('rounded border border-line bg-surface', className)}>
      {title ? (
        <header className="flex items-center justify-between gap-4 border-b border-line px-4 py-2.5">
          <div className="min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-ink-muted">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className={clsx(flush ? '' : 'px-4 py-4', bodyClassName)}>{children}</div>
    </section>
  )
}

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx('border-0 border-t border-line', className)} />
}

/** Label/value pair used across the dashboard and detail panels. */
export function DataRow({
  label,
  children,
  className,
}: {
  label: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={clsx(
        'grid grid-cols-[10rem_1fr] items-baseline gap-4 border-b border-line py-2.5 last:border-b-0',
        className,
      )}
    >
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-base text-ink">{children}</dd>
    </div>
  )
}

export function KeyValue({
  items,
  className,
}: {
  items: { label: string; value: ReactNode }[]
  className?: string
}) {
  return (
    <dl className={clsx('divide-y divide-line', className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-baseline justify-between gap-4 py-2">
          <dt className="text-xs text-ink-muted">{item.label}</dt>
          <dd className="font-mono text-base text-ink tabular-nums">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function SectionTitle({
  children,
  actions,
  className,
}: {
  children: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={clsx('mb-3 flex items-center justify-between gap-4', className)}>
      <h2 className="text-base font-semibold text-ink">{children}</h2>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}

export function Muted({ children, className }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={clsx('text-xs text-ink-muted', className)}>{children}</span>
}

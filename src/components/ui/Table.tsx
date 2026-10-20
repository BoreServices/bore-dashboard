import type { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react'
import clsx from 'clsx'

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={clsx('w-full border-collapse text-base', className)} {...props} />
    </div>
  )
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx(
        'border-b border-line px-3 py-2 text-left text-2xs font-semibold uppercase tracking-[0.08em] text-ink-muted',
        className,
      )}
      {...props}
    />
  )
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={clsx('border-b border-line px-3 py-2.5 align-middle text-ink', className)} {...props} />
  )
}

export function Tr({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx('last:[&>td]:border-b-0', className)} {...props} />
}

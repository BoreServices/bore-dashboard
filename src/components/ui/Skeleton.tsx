import clsx from 'clsx'

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx('skeleton', className)} aria-hidden />
}

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={clsx('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={clsx('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  )
}

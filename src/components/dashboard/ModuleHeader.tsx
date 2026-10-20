import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'

export function ModuleHeader({
  title,
  description,
  actions,
}: {
  title: string
  description: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-2xl text-base leading-relaxed text-ink-soft">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  )
}

/**
 * The shape every configuration page has while it loads, so the page does not
 * jump when the configuration arrives.
 */
export function ModuleSkeleton() {
  return (
    <div className="max-w-3xl">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-5 h-24 w-full" />
      <Skeleton className="mt-4 h-48 w-full" />
    </div>
  )
}

/** Warns before a reload or navigation discards unsaved edits. */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])
}

export function SaveBar({
  dirty,
  saving,
  onSave,
  onDiscard,
  summary,
}: {
  dirty: boolean
  saving?: boolean
  onSave: () => void
  onDiscard: () => void
  summary?: string
}) {
  if (!dirty) return null

  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-line bg-surface/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
        <p className="text-xs text-ink-muted">{summary ?? 'Unsaved changes'}</p>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onDiscard} disabled={saving}>
            Discard
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} loading={saving}>
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

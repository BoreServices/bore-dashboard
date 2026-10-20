import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { EmbedField } from '../../lib/embed'
import { newId } from '../../lib/embed'
import { Input, Switch, Textarea } from '../ui/Field'

function ItemChrome({
  index,
  total,
  label,
  onMove,
  onRemove,
}: {
  index: number
  total: number
  label: string
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <div className="mb-2.5 flex items-center justify-between gap-2">
      <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-muted">{label}</span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMove(-1)}
          disabled={index === 0}
          aria-label={`Move ${label.toLowerCase()} up`}
          className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
        >
          <ArrowUp className="h-3 w-3" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          aria-label={`Move ${label.toLowerCase()} down`}
          className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
        >
          <ArrowDown className="h-3 w-3" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${label.toLowerCase()}`}
          className="rounded p-1 text-ink-muted transition-colors hover:bg-danger/5 hover:text-danger"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
        </button>
      </div>
    </div>
  )
}

export function FieldEditor({
  fields,
  onChange,
}: {
  fields: EmbedField[]
  onChange: (fields: EmbedField[]) => void
}) {
  const update = (id: string, patch: Partial<EmbedField>) => {
    onChange(fields.map((field) => (field.id === id ? { ...field, ...patch } : field)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= fields.length) return
    const next = [...fields]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-2.5">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded border border-line bg-inset p-3">
          <ItemChrome
            index={index}
            total={fields.length}
            label={`Field ${index + 1}`}
            onMove={(direction) => move(index, direction)}
            onRemove={() => onChange(fields.filter((entry) => entry.id !== field.id))}
          />
          <div className="space-y-2.5">
            <Input
              label="Name"
              value={field.name}
              maxLength={256}
              placeholder="Field name"
              onChange={(event) => update(field.id, { name: event.target.value })}
            />
            <Textarea
              label="Value"
              rows={2}
              value={field.value}
              maxLength={1024}
              placeholder="Field value"
              onChange={(event) => update(field.id, { value: event.target.value })}
            />
            <Switch
              checked={field.inline}
              onChange={(checked) => update(field.id, { inline: checked })}
              label="Inline field"
              description="Inline fields sit side by side, up to three per row."
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([...fields, { id: newId('field'), name: '', value: '', inline: true }])
        }
        disabled={fields.length >= 25}
        className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-line-strong px-3 py-2 text-base font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-3 w-3" aria-hidden />
        Add field
      </button>
    </div>
  )
}

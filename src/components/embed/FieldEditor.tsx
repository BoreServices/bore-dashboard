import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { EmbedField } from '../../lib/embed'
import { newId } from '../../lib/embed'
import { Input, Switch, Textarea } from '../ui/Field'

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
    <div className="space-y-4">
      {fields.map((field, index) => (
        <div key={field.id} className="rounded-xl border border-line bg-canvas/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Field {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move field ${index + 1} up`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === fields.length - 1}
                aria-label={`Move field ${index + 1} down`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChange(fields.filter((entry) => entry.id !== field.id))}
                aria-label={`Remove field ${index + 1}`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-rose-50 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="space-y-3">
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
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add field
      </button>
    </div>
  )
}

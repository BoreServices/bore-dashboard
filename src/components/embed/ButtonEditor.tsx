import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import type { EmbedButton, EmbedButtonStyle } from '../../lib/embed'
import { newId } from '../../lib/embed'
import { Input, Select, Switch } from '../ui/Field'

const styles: { value: EmbedButtonStyle; label: string }[] = [
  { value: 'primary', label: 'Primary (blurple)' },
  { value: 'secondary', label: 'Secondary (grey)' },
  { value: 'success', label: 'Success (green)' },
  { value: 'danger', label: 'Danger (red)' },
]

export function ButtonEditor({
  buttons,
  onChange,
}: {
  buttons: EmbedButton[]
  onChange: (buttons: EmbedButton[]) => void
}) {
  const update = (id: string, patch: Partial<EmbedButton>) => {
    onChange(buttons.map((button) => (button.id === id ? { ...button, ...patch } : button)))
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= buttons.length) return
    const next = [...buttons]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {buttons.map((button, index) => (
        <div key={button.id} className="rounded-xl border border-line bg-canvas/50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Button {index + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move button ${index + 1} up`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === buttons.length - 1}
                aria-label={`Move button ${index + 1} down`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChange(buttons.filter((entry) => entry.id !== button.id))}
                aria-label={`Remove button ${index + 1}`}
                className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-rose-50 hover:text-danger"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <Input
              label="Label"
              value={button.label}
              maxLength={80}
              placeholder="Open dashboard"
              onChange={(event) => update(button.id, { label: event.target.value })}
            />
            <Input
              label="URL"
              value={button.url}
              placeholder="https://example.com"
              onChange={(event) => update(button.id, { url: event.target.value })}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label="Emoji"
                value={button.emoji}
                placeholder="🔗"
                onChange={(event) => update(button.id, { emoji: event.target.value })}
              />
              <Select
                label="Style"
                value={button.style}
                onChange={(event) => update(button.id, { style: event.target.value as EmbedButtonStyle })}
              >
                {styles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </Select>
            </div>
            <Switch
              checked={button.disabled}
              onChange={(checked) => update(button.id, { disabled: checked })}
              label="Disabled"
              description="Disabled buttons are rendered greyed out in Discord."
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...buttons,
            { id: newId('button'), label: '', url: '', emoji: '', style: 'primary', disabled: false },
          ])
        }
        disabled={buttons.length >= 5}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-4 py-3 text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-4 w-4" aria-hidden />
        Add button
      </button>
    </div>
  )
}

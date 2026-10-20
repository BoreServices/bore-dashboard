import { Plus, Trash2, ArrowDown, ArrowUp } from 'lucide-react'
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
    <div className="space-y-2.5">
      {buttons.map((button, index) => (
        <div key={button.id} className="rounded border border-line bg-inset p-3">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-muted">
              Button {index + 1}
            </span>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label={`Move button ${index + 1} up`}
                className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === buttons.length - 1}
                aria-label={`Move button ${index + 1} down`}
                className="rounded p-1 text-ink-muted transition-colors hover:bg-surface hover:text-ink disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChange(buttons.filter((entry) => entry.id !== button.id))}
                aria-label={`Remove button ${index + 1}`}
                className="rounded p-1 text-ink-muted transition-colors hover:bg-danger/5 hover:text-danger"
              >
                <Trash2 className="h-3 w-3" aria-hidden />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
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
            <div className="grid gap-2.5 sm:grid-cols-2">
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
        className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-line-strong px-3 py-2 text-base font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Plus className="h-3 w-3" aria-hidden />
        Add button
      </button>
    </div>
  )
}

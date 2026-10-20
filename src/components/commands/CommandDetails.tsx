import type { Command } from '../../types/api'
import { Modal } from '../ui/Modal'
import { Tag } from '../ui/Tag'
import { CopyButton } from '../ui/CopyButton'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-baseline gap-4 border-b border-line py-2.5 last:border-b-0">
      <dt className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-muted">{label}</dt>
      <dd className="min-w-0 text-base text-ink-soft">{children}</dd>
    </div>
  )
}

export function CommandDetails({
  command,
  open,
  onClose,
}: {
  command: Command | null
  open: boolean
  onClose: () => void
}) {
  if (!command) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="drawer"
      title={command.name}
      description={command.category}
    >
      <div className="space-y-5">
        {command.description ? (
          <p className="text-base leading-relaxed text-ink-soft">{command.description}</p>
        ) : (
          <p className="text-base italic text-ink-muted">This command has no description.</p>
        )}

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-muted">syntax</p>
            <CopyButton
              variant="outline"
              value={command.syntax ?? command.name}
              label="Copy"
              copiedLabel="Copied"
            />
          </div>
          <code className="block overflow-x-auto rounded border border-line bg-inset px-3 py-2 font-mono text-base text-ink">
            {command.syntax ?? command.name}
          </code>
        </div>

        <dl>
          <Row label="Parameters">
            {command.args ? (
              <span className="font-mono text-base text-ink">{command.args}</span>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Permissions">
            {command.permissions.length ? (
              <span className="flex flex-wrap gap-1">
                {command.permissions.map((permission, index) => (
                  <Tag key={`${permission}-${index}`} tone="brand">
                    {permission}
                  </Tag>
                ))}
              </span>
            ) : (
              <span className="text-ink-muted">None required</span>
            )}
          </Row>

          <Row label="Aliases">
            {command.aliases.length ? (
              <span className="flex flex-wrap gap-1">
                {command.aliases.map((alias, index) => (
                  <Tag key={`${alias}-${index}`} tone="outline">
                    {alias}
                  </Tag>
                ))}
              </span>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Cooldown">
            {command.cooldown ? (
              <span className="font-mono text-base">{command.cooldown}</span>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Flags">
            {command.flags.length ? (
              <span className="flex flex-wrap gap-1">
                {command.flags.map((flag, index) => (
                  <Tag key={`${flag}-${index}`} tone="outline">
                    {flag}
                  </Tag>
                ))}
              </span>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Example">
            {command.example ? (
              <span className="flex items-start justify-between gap-3">
                <code className="block min-w-0 overflow-x-auto rounded border border-line bg-inset px-2.5 py-1.5 font-mono text-sm text-ink">
                  {command.example}
                </code>
                <CopyButton
                  variant="outline"
                  value={command.example}
                  label="Copy"
                  copiedLabel="Copied"
                />
              </span>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>
        </dl>
      </div>
    </Modal>
  )
}

import type { Command } from '../../types/api'
import { Modal } from '../ui/Modal'
import { Badge } from '../ui/Badge'
import { CopyButton } from '../ui/CopyButton'
import { CommandSyntax } from './CommandSyntax'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] items-start gap-3 border-b border-line py-2.5 last:border-b-0">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="text-sm text-ink-soft">{children}</dd>
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
      title={command.name}
      description={command.category}
      size="md"
    >
      <div className="space-y-5">
        {command.description ? (
          <p className="text-sm leading-relaxed text-ink-soft">{command.description}</p>
        ) : (
          <p className="text-sm italic text-ink-muted">This command has no description.</p>
        )}

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">Syntax</p>
          <div className="flex items-start justify-between gap-3 rounded-xl border border-line bg-canvas px-3.5 py-3">
            <CommandSyntax syntax={command.syntax} name={command.name} />
            <CopyButton
              variant="outline"
              value={command.syntax ?? command.name}
              label="Copy syntax"
              copiedLabel="Syntax copied"
            />
          </div>
        </div>

        <dl className="border-t border-line">
          <Row label="Parameters">
            {command.args ? (
              <span className="font-mono text-[13px] text-ink">{command.args}</span>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Permissions">
            {command.permissions.length ? (
              <div className="flex flex-wrap gap-1.5">
                {command.permissions.map((permission, index) => (
                  <Badge key={`${permission}-${index}`} tone="brand">
                    {permission}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-ink-muted">None required</span>
            )}
          </Row>

          <Row label="Aliases">
            {command.aliases.length ? (
              <div className="flex flex-wrap gap-1.5">
                {command.aliases.map((alias, index) => (
                  <Badge key={`${alias}-${index}`} tone="outline">
                    {alias}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Cooldown">
            {command.cooldown ? (
              <span className="text-ink-soft">{command.cooldown}</span>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Flags">
            {command.flags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {command.flags.map((flag, index) => (
                  <Badge key={`${flag}-${index}`} tone="outline">
                    {flag}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>

          <Row label="Example">
            {command.example ? (
              <div className="flex items-start justify-between gap-3">
                <code className="block overflow-x-auto rounded-lg bg-canvas px-3 py-2 font-mono text-[13px] text-ink">
                  {command.example}
                </code>
                <CopyButton
                  variant="outline"
                  value={command.example}
                  label="Copy example"
                  copiedLabel="Example copied"
                />
              </div>
            ) : (
              <span className="text-ink-muted">None</span>
            )}
          </Row>
        </dl>
      </div>
    </Modal>
  )
}

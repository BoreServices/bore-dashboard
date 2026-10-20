import { useDashboard } from './DashboardContext'

export function ChannelSelect({
  value,
  onChange,
  id,
  disabled,
  allowNone = false,
  noneLabel = 'Not set',
}: {
  value: string | null
  onChange: (channelId: string | null) => void
  id?: string
  disabled?: boolean
  allowNone?: boolean
  noneLabel?: string
}) {
  const { channels, channelsPending } = useDashboard()

  return (
    <select
      id={id}
      value={value ?? ''}
      disabled={disabled || channelsPending}
      onChange={(event) => onChange(event.target.value || null)}
      className="h-8 w-full rounded border border-line-strong bg-surface px-2 text-base text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-inset disabled:text-ink-muted"
    >
      {allowNone ? <option value="">{noneLabel}</option> : null}
      {channelsPending ? <option value="">Loading channels…</option> : null}
      {channels.map((channel) => (
        <option key={channel.id} value={channel.id}>
          #{channel.name}
        </option>
      ))}
    </select>
  )
}

export function RoleSelect({
  value,
  onChange,
  id,
  disabled,
  allowNone = true,
  noneLabel = 'Not set',
  excludeManaged = true,
  requireAssignable = false,
}: {
  value: string | null
  onChange: (roleId: string | null) => void
  id?: string
  disabled?: boolean
  allowNone?: boolean
  noneLabel?: string
  excludeManaged?: boolean
  /** Hide the roles Discord would refuse to let the bot assign. */
  requireAssignable?: boolean
}) {
  const { roles, rolesPending, botRolePosition, selectedGuild } = useDashboard()

  const visible = roles.filter((role) => {
    if (excludeManaged && role.managed) return false
    // Discord refuses to let a bot hand out a role at or above its own.
    if (requireAssignable && role.position >= botRolePosition) return false
    // The @everyone role is not something anybody can be given.
    if (role.id === selectedGuild?.id) return false
    return true
  })

  return (
    <select
      id={id}
      value={value ?? ''}
      disabled={disabled || rolesPending}
      onChange={(event) => onChange(event.target.value || null)}
      className="h-8 w-full rounded border border-line-strong bg-surface px-2 text-base text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:bg-inset disabled:text-ink-muted"
    >
      {allowNone ? <option value="">{noneLabel}</option> : null}
      {rolesPending ? <option value="">Loading roles…</option> : null}
      {visible.map((role) => (
        <option key={role.id} value={role.id}>
          {role.name}
        </option>
      ))}
    </select>
  )
}

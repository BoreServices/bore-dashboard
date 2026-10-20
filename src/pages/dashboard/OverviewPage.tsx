import { Link } from 'react-router-dom'
import { AlertTriangle, ArrowRight, CheckCircle2, CircleSlash } from 'lucide-react'
import { ModuleHeader } from '../../components/dashboard/ModuleHeader'
import { useDashboard } from '../../components/dashboard/DashboardContext'
import { PERMISSIONS, hasPermission } from '../../lib/dashboard'
import { formatNumber } from '../../lib/format'
import { SITE } from '../../lib/site'
import { EmptyState, ErrorState, Notice } from '../../components/ui/States'
import { Skeleton } from '../../components/ui/Skeleton'
import { usePageMeta } from '../../lib/usePageMeta'

type SummaryRow = {
  label: string
  value: string
  to: string
  warn?: boolean
}

export function OverviewPage() {
  usePageMeta(
    'Dashboard · Bore',
    'Bore configuration for the servers you manage.',
    '/dashboard',
  )

  const { config, configPending, configError, refreshConfig, selectedGuild } = useDashboard()

  if (configPending) {
    return (
      <div className="max-w-3xl">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-6 h-32 w-full" />
        <Skeleton className="mt-4 h-48 w-full" />
      </div>
    )
  }

  if (configError) {
    return (
      <div className="max-w-3xl">
        <ErrorState
          title="Could not load this server"
          description={
            configError instanceof Error
              ? configError.message
              : 'The dashboard data could not be loaded.'
          }
          onRetry={refreshConfig}
        />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="max-w-3xl">
        <EmptyState
          title="No server selected"
          description="Pick a server from the top bar to see its Bore configuration."
        />
      </div>
    )
  }

  const canManageGuild = hasPermission(config.guild.permissions, PERMISSIONS.manage_guild)
  const canManageMessages = hasPermission(config.guild.permissions, PERMISSIONS.manage_messages)

  const rows: SummaryRow[] = [
    {
      label: 'Command prefix',
      value: config.prefix ?? ',',
      to: '/dashboard/general',
      warn: !config.prefix,
    },
    {
      label: 'Welcome messages',
      value: config.welcome.length
        ? config.welcome.map((entry) => `#${entry.channelName ?? 'unknown'}`).join(', ')
        : 'None',
      to: '/dashboard/welcome',
    },
    {
      label: 'Leave messages',
      value: config.leave.length
        ? config.leave.map((entry) => `#${entry.channelName ?? 'unknown'}`).join(', ')
        : 'None',
      to: '/dashboard/leave',
    },
    {
      label: 'Boost messages',
      value: config.boost.length
        ? config.boost.map((entry) => `#${entry.channelName ?? 'unknown'}`).join(', ')
        : 'None',
      to: '/dashboard/boost',
    },
    {
      label: 'Auto roles',
      value: config.autoroles.length
        ? config.autoroles.map((role) => role.roleName ?? role.roleId).join(', ')
        : 'None',
      to: '/dashboard/autoroles',
    },
    {
      label: 'Aliases',
      value: config.aliases.length
        ? config.aliases.map((alias) => `${alias.alias} → ${alias.command}`).join(', ')
        : 'None',
      to: '/dashboard/aliases',
    },
    {
      label: 'Anti-nuke',
      value: config.antinuke.enabled
        ? `On · ${config.antinuke.modules.filter((module) => module.punishment).length} modules armed`
        : 'Off',
      to: '/dashboard/antinuke',
      warn: config.antinuke.enabled && !config.antinuke.logChannelId,
    },
    {
      label: 'Honeypots',
      value: config.honeypot.channels.length
        ? `${config.honeypot.channels.length} bait channel${config.honeypot.channels.length === 1 ? '' : 's'}`
        : 'None',
      to: '/dashboard/honeypot',
      warn: config.honeypot.channels.length > 0 && !config.honeypot.jailRoleId,
    },
  ]

  const warnings: { text: string; to?: string }[] = []
  if (config.guild.botInstalled === false) {
    warnings.push({
      text: 'Bore is not installed in this server. The settings below are stored but the bot cannot act on them.',
    })
  }
  if (!canManageGuild && !canManageMessages) {
    warnings.push({
      text: 'You do not have Manage Server or Manage Messages here, so the settings for this server are read-only.',
    })
  }
  if (config.antinuke.enabled && !config.antinuke.logChannelId) {
    warnings.push({
      text: 'Anti-nuke is enabled without a log channel — punishments happen without an audit trail.',
      to: '/dashboard/antinuke',
    })
  }
  if (config.honeypot.channels.length > 0 && !config.honeypot.jailRoleId) {
    warnings.push({
      text: 'Honeypot channels are configured without a jail role, so the jail punishment cannot be applied.',
      to: '/dashboard/honeypot',
    })
  }
  if (!config.prefix) {
    warnings.push({
      text: 'This server uses the default command prefix ",".',
      to: '/dashboard/general',
    })
  }

  return (
    <div className="max-w-3xl">
      <ModuleHeader
        title={config.guild.name}
        description={
          <>
            Server configuration as stored in the bot database. Every value below is read from the
            bot&apos;s own tables.
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded border border-line bg-surface px-3.5 py-3">
          <p className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-faint">server id</p>
          <p className="mt-1 font-mono text-base text-ink">{config.guild.id}</p>
        </div>
        <div className="rounded border border-line bg-surface px-3.5 py-3">
          <p className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-faint">members</p>
          <p className="mt-1 font-mono text-base tabular-nums text-ink">
            {config.guild.memberCount !== null ? formatNumber(config.guild.memberCount) : 'Not exposed'}
          </p>
        </div>
        <div className="rounded border border-line bg-surface px-3.5 py-3">
          <p className="font-mono text-2xs uppercase tracking-[0.1em] text-ink-faint">bore</p>
          <p className="mt-1 flex items-center gap-1.5 text-base text-ink">
            {config.guild.botInstalled === false ? (
              <>
                <CircleSlash className="h-3.5 w-3.5 text-ink-faint" aria-hidden />
                Not installed
              </>
            ) : config.guild.botInstalled === true ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                Installed
              </>
            ) : (
              <>
                <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden />
                Unknown
              </>
            )}
          </p>
          {config.guild.botInstalled === false ? (
            <a
              href={config.guild.installUrl ?? SITE.inviteUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-2 inline-flex items-center gap-1 text-2xs font-medium text-brand-600 hover:underline"
            >
              Add Bore to this server
              <ArrowRight className="h-3 w-3" aria-hidden />
            </a>
          ) : null}
        </div>
      </div>

      {warnings.length ? (
        <div className="mt-4 space-y-2">
          {warnings.map((warning) => (
            <Notice key={warning.text} tone="warning">
              <span className="flex items-start justify-between gap-3">
                <span>{warning.text}</span>
                {warning.to ? (
                  <Link
                    to={warning.to}
                    className="shrink-0 whitespace-nowrap font-medium text-brand-600 hover:underline"
                  >
                    fix
                  </Link>
                ) : null}
              </span>
            </Notice>
          ))}
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded border border-line bg-surface">
        <h2 className="border-b border-line bg-inset px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
          configuration
        </h2>
        <dl>
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[9rem_1fr] items-baseline gap-4 border-b border-line px-3.5 py-2.5 last:border-b-0"
            >
              <dt className="text-xs text-ink-muted">{row.label}</dt>
              <dd className="flex items-baseline justify-between gap-3">
                <span
                  className={
                    row.warn
                      ? 'font-mono text-base text-warning'
                      : 'font-mono text-base text-ink'
                  }
                >
                  {row.value}
                </span>
                <Link
                  to={row.to}
                  className="shrink-0 text-2xs font-medium text-brand-600 hover:underline"
                >
                  manage
                </Link>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-6 flex items-center justify-between gap-4 rounded border border-line bg-surface px-3.5 py-3">
        <p className="text-xs text-ink-muted">
          Signed in as {selectedGuild?.owner ? 'an owner of' : 'a member of'}{' '}
          <span className="font-mono text-ink">{config.guild.name}</span>.
        </p>
        <Link
          to="/commands"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
        >
          command reference
          <ArrowRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

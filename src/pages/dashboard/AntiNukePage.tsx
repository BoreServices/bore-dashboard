import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ModuleHeader, ModuleSkeleton, SaveBar, useUnsavedChanges } from '../../components/dashboard/ModuleHeader'
import { useDashboard } from '../../components/dashboard/DashboardContext'
import { ChannelSelect } from '../../components/dashboard/Pickers'
import { useModuleMutation } from '../../lib/dashboard'
import { Input, Select, SettingRow, Switch } from '../../components/ui/Field'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { EmptyState, ErrorState, Notice } from '../../components/ui/States'
import { usePageMeta } from '../../lib/usePageMeta'

/** Module names and labels taken from the bot's own anti-nuke cog. */
const MODULE_LABELS: Record<string, string> = {
  ban: 'Mass member ban',
  kick: 'Mass member kick',
  role: 'Role deletion',
  rolecreate: 'Role creation',
  channel: 'Channel creation or deletion',
  emoji: 'Emoji deletion',
  webhook: 'Webhook creation',
  invite: 'Invite deletion',
  botadd: 'Bot additions',
  prune: 'Member prune',
  vanity: 'Vanity URL changes',
  guild: 'Server rename',
}

/** The bot punishes these on the first action, so the threshold is fixed. */
const INSTANT_MODULES = new Set(['botadd', 'prune', 'vanity', 'guild'])

const PUNISHMENTS = [
  { value: 'ban', label: 'Ban' },
  { value: 'kick', label: 'Kick' },
  { value: 'stripstaff', label: 'Strip staff roles' },
  { value: 'kickstripstaff', label: 'Kick and strip staff roles' },
]

type ModuleState = { module: string; punishment: string; threshold: number }

export function AntiNukePage() {
  usePageMeta(
    'Anti-nuke · Bore',
    'Thresholds and punishments for destructive actions in this server.',
    '/dashboard/antinuke',
  )

  const { config, configPending, configError, refreshConfig, selectedGuildId } = useDashboard()
  const mutation = useModuleMutation(selectedGuildId)

  const [enabled, setEnabled] = useState(true)
  const [logChannelId, setLogChannelId] = useState<string | null>(null)
  const [windowSeconds, setWindowSeconds] = useState(10)
  const [modules, setModules] = useState<ModuleState[]>([])

  useEffect(() => {
    if (!config) return
    setEnabled(config.antinuke.enabled)
    setLogChannelId(config.antinuke.logChannelId)
    setWindowSeconds(config.antinuke.windowSeconds)
    setModules(config.antinuke.modules.map((entry) => ({ ...entry })))
  }, [config])

  const baseline = config
    ? JSON.stringify({
        enabled: config.antinuke.enabled,
        logChannelId: config.antinuke.logChannelId,
        windowSeconds: config.antinuke.windowSeconds,
        modules: config.antinuke.modules,
      })
    : ''

  const current = JSON.stringify({
    enabled,
    logChannelId,
    windowSeconds,
    modules,
  })

  const dirty = current !== baseline
  useUnsavedChanges(dirty)

  if (configPending) return <ModuleSkeleton />

  if (configError) {
    return (
      <ErrorState
        title="Could not load this server"
        description={configError instanceof Error ? configError.message : 'Unknown error'}
        onRetry={refreshConfig}
      />
    )
  }

  if (!config) {
    return <EmptyState title="No server selected" description="Pick a server from the top bar." />
  }

  const updateModule = (module: string, patch: Partial<ModuleState>) => {
    setModules((current) =>
      current.map((entry) => (entry.module === module ? { ...entry, ...patch } : entry)),
    )
  }

  const save = async () => {
    try {
      await mutation.mutateAsync({
        module: 'antinuke',
        body: {
          enabled,
          logChannelId,
          windowSeconds,
          modules: modules.map((entry) => ({
            module: entry.module,
            punishment: entry.punishment,
            threshold: INSTANT_MODULES.has(entry.module) ? 1 : entry.threshold,
          })),
        },
      })
      toast.success('Anti-nuke settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the settings')
    }
  }

  const discard = () => {
    setEnabled(config.antinuke.enabled)
    setLogChannelId(config.antinuke.logChannelId)
    setWindowSeconds(config.antinuke.windowSeconds)
    setModules(config.antinuke.modules.map((entry) => ({ ...entry })))
  }

  return (
    <div className="max-w-3xl">
      <ModuleHeader
        title="Anti-nuke"
        description="Punishes members who perform destructive actions in bursts. Each module has its own punishment and threshold."
      />

      <div className="overflow-hidden rounded border border-line bg-surface">
        <SettingRow
          label="Protection"
          description="Turn the whole module on or off for this server."
        >
          <div className="max-w-sm">
            <Switch
              checked={enabled}
              onChange={setEnabled}
              label={enabled ? 'Enabled' : 'Disabled'}
              description="Disabled shards keep their settings but never punish anybody."
            />
          </div>
        </SettingRow>

        <SettingRow
          label="Log channel"
          htmlFor="antinuke-log"
          description="Where punishments are reported. Without it the actions happen silently."
        >
          <div className="max-w-sm">
            <ChannelSelect
              id="antinuke-log"
              value={logChannelId}
              onChange={setLogChannelId}
              allowNone
              noneLabel="No log channel"
            />
          </div>
        </SettingRow>

        <SettingRow
          label="Action window"
          htmlFor="antinuke-window"
          description="How many seconds of actions count as one burst. The bot caps this at 60."
        >
          <Input
            id="antinuke-window"
            type="number"
            min={1}
            max={60}
            value={windowSeconds}
            onChange={(event) => setWindowSeconds(Number(event.target.value))}
            className="w-24 font-mono"
          />
        </SettingRow>
      </div>

      <section className="mt-6 overflow-hidden rounded border border-line bg-surface">
        <h2 className="border-b border-line bg-inset px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
          modules
        </h2>

        {modules.length ? (
          <Table>
            <thead>
              <tr>
                <Th>action</Th>
                <Th className="w-56">punishment</Th>
                <Th className="w-28 text-right">threshold</Th>
              </tr>
            </thead>
            <tbody>
              {modules.map((entry) => (
                <Tr key={entry.module}>
                  <Td>
                    <span className="text-base text-ink">{MODULE_LABELS[entry.module] ?? entry.module}</span>
                    <span className="ml-2 font-mono text-2xs text-ink-faint">{entry.module}</span>
                  </Td>
                  <Td>
                    <Select
                      value={entry.punishment}
                      aria-label={`Punishment for ${entry.module}`}
                      onChange={(event) => updateModule(entry.module, { punishment: event.target.value })}
                      className="h-7"
                    >
                      {PUNISHMENTS.map((punishment) => (
                        <option key={punishment.value} value={punishment.value}>
                          {punishment.label}
                        </option>
                      ))}
                    </Select>
                  </Td>
                  <Td className="text-right">
                    {INSTANT_MODULES.has(entry.module) ? (
                      <span className="font-mono text-base text-ink-faint">1</span>
                    ) : (
                      <Input
                        type="number"
                        min={1}
                        max={25}
                        value={entry.threshold}
                        aria-label={`Threshold for ${entry.module}`}
                        onChange={(event) =>
                          updateModule(entry.module, { threshold: Number(event.target.value) })
                        }
                        className="ml-auto h-7 w-16 text-right font-mono"
                      />
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="No modules configured"
            description="This server has no anti-nuke modules armed. The bot applies its defaults until a module is configured here."
          />
        )}
      </section>

      <Notice className="mt-4">
        Written to the bot&apos;s <code className="font-mono">antinuke_guild</code> and{' '}
        <code className="font-mono">antinuke_settings</code> tables. The bot re-reads them when it
        loads its state, so a change applies on the next burst.
      </Notice>

      <SaveBar
        dirty={dirty}
        saving={mutation.isPending}
        onSave={save}
        onDiscard={discard}
        summary="Anti-nuke changes not saved"
      />
    </div>
  )
}

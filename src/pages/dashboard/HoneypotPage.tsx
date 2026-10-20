import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModuleHeader, ModuleSkeleton, SaveBar, useUnsavedChanges } from '../../components/dashboard/ModuleHeader'
import { useDashboard } from '../../components/dashboard/DashboardContext'
import { ChannelSelect, RoleSelect } from '../../components/dashboard/Pickers'
import { useModuleMutation } from '../../lib/dashboard'
import { Button } from '../../components/ui/Button'
import { Select, SettingRow } from '../../components/ui/Field'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { EmptyState, ErrorState, Notice } from '../../components/ui/States'
import { usePageMeta } from '../../lib/usePageMeta'

const PUNISHMENTS = [
  { value: 'ban', label: 'Ban' },
  { value: 'softban', label: 'Softban' },
  { value: 'jail', label: 'Jail' },
]

export function HoneypotPage() {
  usePageMeta(
    'Honeypots · Bore',
    'Decoy channels that catch spammers in this server.',
    '/dashboard/honeypot',
  )

  const { config, configPending, configError, refreshConfig, selectedGuildId, channels } =
    useDashboard()
  const mutation = useModuleMutation(selectedGuildId)

  const [staffRoleId, setStaffRoleId] = useState<string | null>(null)
  const [logChannelId, setLogChannelId] = useState<string | null>(null)
  const [jailRoleId, setJailRoleId] = useState<string | null>(null)
  const [newChannelId, setNewChannelId] = useState<string | null>(null)
  const [newPunishment, setNewPunishment] = useState('jail')

  useEffect(() => {
    if (!config) return
    setStaffRoleId(config.honeypot.staffRoleId)
    setLogChannelId(config.honeypot.logChannelId)
    setJailRoleId(config.honeypot.jailRoleId)
  }, [config])

  const baseline = config
    ? JSON.stringify({
        staffRoleId: config.honeypot.staffRoleId,
        logChannelId: config.honeypot.logChannelId,
        jailRoleId: config.honeypot.jailRoleId,
      })
    : ''

  const dirty =
    JSON.stringify({ staffRoleId, logChannelId, jailRoleId }) !== baseline
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

  const save = async () => {
    try {
      await mutation.mutateAsync({
        module: 'honeypot',
        body: { staffRoleId, logChannelId, jailRoleId },
      })
      toast.success('Honeypot settings saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the settings')
    }
  }

  const discard = () => {
    setStaffRoleId(config.honeypot.staffRoleId)
    setLogChannelId(config.honeypot.logChannelId)
    setJailRoleId(config.honeypot.jailRoleId)
  }

  const addChannel = async () => {
    if (!newChannelId) {
      toast.error('Choose a channel first')
      return
    }
    try {
      await mutation.mutateAsync({
        module: 'honeypot',
        body: { action: 'add', channelId: newChannelId, punishment: newPunishment },
      })
      setNewChannelId(null)
      toast.success('Honeypot channel added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add the channel')
    }
  }

  const removeChannel = async (channelId: string) => {
    try {
      await mutation.mutateAsync({
        module: 'honeypot',
        body: { action: 'remove', channelId },
      })
      toast.success('Honeypot channel removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the channel')
    }
  }

  return (
    <div className="max-w-3xl">
      <ModuleHeader
        title="Honeypots"
        description="Channels that look like normal conversation but punish anyone who posts in them."
      />

      <div className="overflow-hidden rounded border border-line bg-surface">
        <SettingRow
          label="Staff exemption"
          htmlFor="honeypot-staff"
          description="Members with this role are never punished by a honeypot."
        >
          <div className="max-w-sm">
            <RoleSelect id="honeypot-staff" value={staffRoleId} onChange={setStaffRoleId} />
          </div>
        </SettingRow>

        <SettingRow
          label="Log channel"
          htmlFor="honeypot-log"
          description="Where honeypot punishments are reported."
        >
          <div className="max-w-sm">
            <ChannelSelect
              id="honeypot-log"
              value={logChannelId}
              onChange={setLogChannelId}
              allowNone
              noneLabel="No log channel"
            />
          </div>
        </SettingRow>

        <SettingRow
          label="Jail role"
          htmlFor="honeypot-jail"
          description="Applied when the jail punishment is used. It has to sit below Bore's own role, or Discord refuses to hand it out."
        >
          <div className="max-w-sm">
            <RoleSelect
              id="honeypot-jail"
              value={jailRoleId}
              onChange={setJailRoleId}
              requireAssignable
            />
          </div>
        </SettingRow>
      </div>

      <section className="mt-6 overflow-hidden rounded border border-line bg-surface">
        <h2 className="border-b border-line bg-inset px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
          bait channels
        </h2>

        {config.honeypot.channels.length ? (
          <Table>
            <thead>
              <tr>
                <Th>channel</Th>
                <Th className="w-40">punishment</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {config.honeypot.channels.map((entry) => (
                <Tr key={entry.channelId}>
                  <Td className="font-mono text-base">
                    {entry.channelName ? `#${entry.channelName}` : 'deleted'}
                  </Td>
                  <Td className="font-mono text-base text-ink-soft">{entry.punishment}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeChannel(entry.channelId)}
                        aria-label={`Remove the honeypot channel ${entry.channelName ?? ''}`}
                        className="rounded p-1.5 text-ink-muted transition-colors hover:bg-danger/5 hover:text-danger"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <EmptyState
            title="No bait channels"
            description="Nobody is being caught right now. Add a channel to start trapping spam."
          />
        )}

        <div className="flex flex-wrap items-end gap-2 border-t border-line px-3.5 py-3">
          <div className="w-full max-w-xs space-y-1.5">
            <label htmlFor="honeypot-channel" className="block text-xs font-medium text-ink-soft">
              Channel
            </label>
            <ChannelSelect
              id="honeypot-channel"
              value={newChannelId}
              onChange={setNewChannelId}
              noneLabel="Select a channel"
              allowNone={false}
            />
          </div>
          <div className="w-full max-w-[10rem] space-y-1.5">
            <Select
              label="Punishment"
              value={newPunishment}
              onChange={(event) => setNewPunishment(event.target.value)}
            >
              {PUNISHMENTS.map((punishment) => (
                <option key={punishment.value} value={punishment.value}>
                  {punishment.label}
                </option>
              ))}
            </Select>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={addChannel}
            loading={mutation.isPending}
            disabled={!newChannelId || !channels.length}
          >
            <Plus className="h-3 w-3" aria-hidden />
            Add channel
          </Button>
        </div>
      </section>

      <Notice className="mt-4">
        Stored in the bot&apos;s <code className="font-mono">honeypots</code> and{' '}
        <code className="font-mono">honeypot_settings</code> tables. The bot reads the settings
        when a message arrives, so they apply immediately.
      </Notice>

      <SaveBar
        dirty={dirty}
        saving={mutation.isPending}
        onSave={save}
        onDiscard={discard}
        summary="Honeypot changes not saved"
      />
    </div>
  )
}

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModuleHeader, ModuleSkeleton } from '../../components/dashboard/ModuleHeader'
import { useDashboard } from '../../components/dashboard/DashboardContext'
import { useModuleMutation } from '../../lib/dashboard'
import { useCommandsQuery } from '../../lib/queries'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Field'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { EmptyState, ErrorState, Notice } from '../../components/ui/States'
import { usePageMeta } from '../../lib/usePageMeta'

export function AliasesPage() {
  usePageMeta(
    'Aliases · Bore',
    'Custom shortcuts for Bore commands in this server.',
    '/dashboard/aliases',
  )

  const { config, configPending, configError, refreshConfig, selectedGuildId } = useDashboard()
  const mutation = useModuleMutation(selectedGuildId)
  const commands = useCommandsQuery()

  const [alias, setAlias] = useState('')
  const [command, setCommand] = useState('')

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

  const commandNames = (commands.data?.categories ?? []).flatMap((category) =>
    category.commands.map((entry) => entry.name),
  )

  const add = async () => {
    if (!alias.trim() || !command.trim()) {
      toast.error('An alias and a command are both required')
      return
    }
    try {
      await mutation.mutateAsync({
        module: 'aliases',
        body: { action: 'add', alias: alias.trim(), command: command.trim() },
      })
      setAlias('')
      setCommand('')
      toast.success('Alias added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add the alias')
    }
  }

  const remove = async (target: string) => {
    try {
      await mutation.mutateAsync({ module: 'aliases', body: { action: 'delete', alias: target } })
      toast.success('Alias removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the alias')
    }
  }

  return (
    <div className="max-w-3xl">
      <ModuleHeader
        title="Aliases"
        description="Short commands that run another Bore command. The alias cannot shadow a real command."
      />

      {config.warnings?.map((warning) => (
        <Notice key={warning} tone="warning" className="mb-4" title="Schema migration needed">
          {warning}
        </Notice>
      ))}

      {config.aliases.length ? (
        <div className="overflow-hidden rounded border border-line bg-surface">
          <Table>
            <thead>
              <tr>
                <Th className="w-48">alias</Th>
                <Th>runs</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {config.aliases.map((entry) => (
                <Tr key={entry.alias}>
                  <Td className="font-mono text-base text-brand-700">{entry.alias}</Td>
                  <Td className="font-mono text-base text-ink-soft">{entry.command}</Td>
                  <Td>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(entry.alias)}
                        aria-label={`Remove the alias ${entry.alias}`}
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
        </div>
      ) : (
        <div className="rounded border border-line bg-surface">
          <EmptyState
            title="No aliases"
            description="Nobody in this server has a shortcut yet."
          />
        </div>
      )}

      <div className="mt-6 rounded border border-line bg-surface">
        <h2 className="border-b border-line bg-inset px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
          add alias
        </h2>
        <div className="flex flex-wrap items-end gap-2 px-3.5 py-3.5">
          <div className="w-full max-w-[12rem] space-y-1.5">
            <Input
              label="Alias"
              value={alias}
              maxLength={32}
              placeholder="mod"
              onChange={(event) => setAlias(event.target.value)}
            />
          </div>
          <div className="w-full max-w-[16rem] space-y-1.5">
            <Input
              label="Command"
              list="bore-commands"
              value={command}
              placeholder="purge"
              onChange={(event) => setCommand(event.target.value)}
            />
            <datalist id="bore-commands">
              {commandNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={add}
            loading={mutation.isPending}
            disabled={!alias.trim() || !command.trim()}
          >
            <Plus className="h-3 w-3" aria-hidden />
            Add alias
          </Button>
        </div>
      </div>

      <Notice className="mt-4">
        Stored in the bot&apos;s <code className="font-mono">aliases</code> table. The command is
        checked against the running bot before it is saved.
      </Notice>
    </div>
  )
}

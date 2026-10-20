import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModuleHeader, ModuleSkeleton } from '../../components/dashboard/ModuleHeader'
import { useDashboard } from '../../components/dashboard/DashboardContext'
import { RoleSelect } from '../../components/dashboard/Pickers'
import { useModuleMutation } from '../../lib/dashboard'
import { Button } from '../../components/ui/Button'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { EmptyState, ErrorState, Notice } from '../../components/ui/States'
import { usePageMeta } from '../../lib/usePageMeta'

export function AutoRolesPage() {
  usePageMeta(
    'Auto roles · Bore',
    'Roles Bore assigns to new members when they join the server.',
    '/dashboard/autoroles',
  )

  const { config, configPending, configError, refreshConfig, selectedGuildId, roles } =
    useDashboard()
  const mutation = useModuleMutation(selectedGuildId)
  const [roleId, setRoleId] = useState<string | null>(null)

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

  const add = async () => {
    if (!roleId) {
      toast.error('Choose a role first')
      return
    }
    try {
      await mutation.mutateAsync({ module: 'autoroles', body: { action: 'add', roleId } })
      setRoleId(null)
      toast.success('Auto role added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not add the role')
    }
  }

  const remove = async (target: string) => {
    try {
      await mutation.mutateAsync({ module: 'autoroles', body: { action: 'delete', roleId: target } })
      toast.success('Auto role removed')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the role')
    }
  }

  const roleName = (id: string) => roles.find((role) => role.id === id)?.name ?? id

  return (
    <div className="max-w-3xl">
      <ModuleHeader
        title="Auto roles"
        description="Roles Bore gives to a member when they join. Only roles below the bot's highest role can be assigned."
      />

      {config.autoroles.length ? (
        <div className="overflow-hidden rounded border border-line bg-surface">
          <Table>
            <thead>
              <tr>
                <Th>role</Th>
                <Th className="w-24 text-right">action</Th>
              </tr>
            </thead>
            <tbody>
              {config.autoroles.map((entry) => (
                <Tr key={entry.roleId}>
                  <Td className="font-mono text-base">
                    {entry.roleName ?? roleName(entry.roleId)}
                  </Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={() => remove(entry.roleId)}
                      aria-label={`Remove ${entry.roleName ?? 'auto role'}`}
                      className="rounded p-1.5 text-ink-muted transition-colors hover:bg-danger/5 hover:text-danger"
                    >
                      <Trash2 className="h-3 w-3" aria-hidden />
                    </button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="rounded border border-line bg-surface">
          <EmptyState
            title="No auto roles"
            description="Members joining the server will not receive any role automatically."
          />
        </div>
      )}

      <div className="mt-6 rounded border border-line bg-surface">
        <h2 className="border-b border-line bg-inset px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
          add auto role
        </h2>
        <div className="flex flex-wrap items-end gap-2 px-3.5 py-3.5">
          <div className="w-full max-w-xs space-y-1.5">
            <label htmlFor="autorole" className="block text-xs font-medium text-ink-soft">
              Role
            </label>
            <RoleSelect
              id="autorole"
              value={roleId}
              onChange={setRoleId}
              noneLabel="Select a role"
              allowNone={false}
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={add}
            loading={mutation.isPending}
            disabled={!roleId}
          >
            <Plus className="h-3 w-3" aria-hidden />
            Add role
          </Button>
        </div>
      </div>

      <Notice className="mt-4">
        Stored in the bot&apos;s <code className="font-mono">autorole</code> table and applied the
        moment a member joins.
      </Notice>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { ModuleHeader, SaveBar, useUnsavedChanges } from '../../components/dashboard/ModuleHeader'
import { useDashboard } from '../../components/dashboard/DashboardContext'
import { useModuleMutation } from '../../lib/dashboard'
import { Input, SettingRow } from '../../components/ui/Field'
import { EmptyState, ErrorState, Notice } from '../../components/ui/States'
import { Skeleton } from '../../components/ui/Skeleton'
import { usePageMeta } from '../../lib/usePageMeta'

export function GeneralPage() {
  usePageMeta('General settings · Bore', 'Command prefix and general server options.', '/dashboard/general')

  const { config, configPending, configError, refreshConfig, selectedGuildId } = useDashboard()
  const mutation = useModuleMutation(selectedGuildId)

  const [prefix, setPrefix] = useState('')
  const [savedPrefix, setSavedPrefix] = useState('')

  useEffect(() => {
    if (!config) return
    const value = config.prefix ?? ''
    setPrefix(value)
    setSavedPrefix(value)
  }, [config])

  const dirty = prefix !== savedPrefix
  useUnsavedChanges(dirty)

  if (configPending) {
    return (
      <div className="max-w-3xl">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-6 h-40 w-full" />
      </div>
    )
  }

  if (configError) {
    return (
      <div className="max-w-3xl">
        <ErrorState
          title="Could not load this server"
          description={configError instanceof Error ? configError.message : 'Unknown error'}
          onRetry={refreshConfig}
        />
      </div>
    )
  }

  if (!config) {
    return (
      <div className="max-w-3xl">
        <EmptyState title="No server selected" description="Pick a server from the top bar." />
      </div>
    )
  }

  const save = async () => {
    try {
      await mutation.mutateAsync({
        module: 'prefix',
        body: prefix ? { prefix } : { prefix: null },
      })
      setSavedPrefix(prefix)
      toast.success(prefix ? `Prefix set to ${prefix}` : 'Prefix reset to the default')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the prefix')
    }
  }

  return (
    <div className="max-w-3xl">
      <ModuleHeader
        title="General"
        description="The prefix every command in this server responds to."
      />

      <div className="overflow-hidden rounded border border-line bg-surface">
        <SettingRow
          label="Command prefix"
          htmlFor="prefix"
          description="Between one and seven characters, no spaces. Leave empty to use the bot default of a comma."
        >
          <div className="flex items-center gap-2">
            <Input
              id="prefix"
              value={prefix}
              maxLength={7}
              placeholder=","
              onChange={(event) => setPrefix(event.target.value)}
              className="w-32 font-mono"
            />
            {prefix !== savedPrefix ? (
              <span className="text-2xs text-warning">Unsaved</span>
            ) : null}
          </div>
        </SettingRow>
      </div>

      <Notice className="mt-4">
        This writes to the same <code className="font-mono">prefix</code> table the bot reads on
        every message, so the change applies immediately — no restart needed.
      </Notice>

      <SaveBar
        dirty={dirty}
        saving={mutation.isPending}
        onSave={save}
        onDiscard={() => setPrefix(savedPrefix)}
        summary="Prefix change not saved"
      />
    </div>
  )
}

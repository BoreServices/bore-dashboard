import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { ModuleHeader, ModuleSkeleton } from '../../components/dashboard/ModuleHeader'
import { useDashboard } from '../../components/dashboard/DashboardContext'
import { ChannelSelect } from '../../components/dashboard/Pickers'
import { useModuleMutation } from '../../lib/dashboard'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Field'
import { Table, Td, Th, Tr } from '../../components/ui/Table'
import { EmptyState, ErrorState, Notice } from '../../components/ui/States'
import { Markdown } from '../../components/embed/Markdown'
import { PLACEHOLDERS } from '../../lib/placeholders'
import { usePageMeta } from '../../lib/usePageMeta'

type MessageModule = 'welcome' | 'leave' | 'boost'

const copy: Record<MessageModule, { title: string; description: string }> = {
  welcome: {
    title: 'Welcome messages',
    description: 'The message Bore sends when somebody joins the server.',
  },
  leave: {
    title: 'Leave messages',
    description: 'The message Bore sends when somebody leaves the server.',
  },
  boost: {
    title: 'Boost messages',
    description: 'The message Bore sends when the server gains a boost.',
  },
}

export function MessagesPage({ module }: { module: MessageModule }) {
  usePageMeta(`${copy[module].title} · Bore`, copy[module].description, `/dashboard/${module}`)

  const { config, configPending, configError, refreshConfig, selectedGuildId, channels } =
    useDashboard()
  const mutation = useModuleMutation(selectedGuildId)

  const [channelId, setChannelId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState<string | null>(null)

  const entries = config?.[module] ?? []

  useEffect(() => {
    if (!editing && entries.length === 0) {
      setChannelId(null)
      setMessage('')
    }
  }, [entries.length, editing])

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

  const startEdit = (entry: { channelId: string; message: string }) => {
    setEditing(entry.channelId)
    setChannelId(entry.channelId)
    setMessage(entry.message)
  }

  const cancelEdit = () => {
    setEditing(null)
    setChannelId(null)
    setMessage('')
  }

  const save = async () => {
    if (!channelId) {
      toast.error('Choose a channel first')
      return
    }
    if (!message.trim()) {
      toast.error('The message cannot be empty')
      return
    }
    try {
      await mutation.mutateAsync({
        module,
        body: { action: 'upsert', channelId, message },
      })
      toast.success('Message saved')
      cancelEdit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save the message')
    }
  }

  const remove = async (targetChannelId: string) => {
    try {
      await mutation.mutateAsync({ module, body: { action: 'delete', channelId: targetChannelId } })
      toast.success('Message removed')
      if (editing === targetChannelId) cancelEdit()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove the message')
    }
  }

  return (
    <div className="max-w-3xl">
      <ModuleHeader title={copy[module].title} description={copy[module].description} />

      {entries.length ? (
        <div className="overflow-hidden rounded border border-line bg-surface">
          <Table>
            <thead>
              <tr>
                <Th className="w-44">channel</Th>
                <Th>message</Th>
                <Th className="w-24" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <Tr key={entry.channelId}>
                  <Td className="font-mono text-base">
                    {entry.channelName ? `#${entry.channelName}` : 'deleted'}
                  </Td>
                  <Td>
                    <div className="max-w-md text-base leading-relaxed text-ink-soft">
                      {entry.message.startsWith('{embed}') ? (
                        <span className="font-mono text-sm text-ink-muted">
                          embed script ·{' '}
                          {entry.message.replace(/\{embed\}\$v\{/g, '').slice(0, 80)}
                        </span>
                      ) : (
                        <Markdown>{entry.message}</Markdown>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(entry)}>
                        Edit
                      </Button>
                      <button
                        type="button"
                        onClick={() => remove(entry.channelId)}
                        aria-label={`Remove the message for ${entry.channelName ?? 'this channel'}`}
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
            title="No message configured"
            description={`Bore sends nothing for this event yet. Add a channel and a message below.`}
          />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded border border-line bg-surface">
        <h2 className="border-b border-line bg-inset px-3.5 py-2 font-mono text-2xs uppercase tracking-[0.12em] text-ink-muted">
          {editing ? 'edit message' : 'add message'}
        </h2>
        <div className="space-y-3 px-3.5 py-3.5">
          <div className="grid gap-3 sm:grid-cols-[14rem_1fr] sm:items-start">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-ink-soft">Channel</span>
              <ChannelSelect value={channelId} onChange={setChannelId} id="message-channel" />
            </label>

            <div className="space-y-1.5">
              <Textarea
                label="Message"
                rows={4}
                value={message}
                maxLength={4000}
                placeholder={`Welcome to the server, {user.mention}!`}
                onChange={(event) => setMessage(event.target.value)}
              />
              <p className="text-2xs text-ink-muted">
                Plain text, or an embed script starting with{' '}
                <code className="font-mono">{'{embed}'}</code>. These placeholders are replaced by
                the bot when the message is sent:{' '}
                <span className="font-mono">
                  {PLACEHOLDERS.filter((placeholder) => placeholder.token.startsWith('{user}') || placeholder.token.startsWith('{guild}')).map((placeholder) => placeholder.token).join(' ')}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={save}
              loading={mutation.isPending}
              disabled={!channels.length}
            >
              <Plus className="h-3 w-3" aria-hidden />
              {editing ? 'Save changes' : 'Add message'}
            </Button>
            {editing ? (
              <Button variant="ghost" size="sm" onClick={cancelEdit}>
                Cancel
              </Button>
            ) : null}
            {!channels.length ? (
              <span className="text-2xs text-ink-muted">
                No channels available for this server.
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <Notice className="mt-4">
        The message is stored in the bot&apos;s{' '}
        <code className="font-mono">{module}</code> table and read live when a member joins,
        leaves or boosts — no restart needed.
      </Notice>
    </div>
  )
}

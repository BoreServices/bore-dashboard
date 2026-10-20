import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from '../src/App'

const commandsPayload = {
  categories: [
    {
      name: 'Moderation',
      commands: [
        {
          name: 'ban',
          description: 'Ban a user from the server.',
          category: 'Moderation',
          args: 'user',
          syntax: 'ban (user)',
          permissions: ['ban members'],
          aliases: [],
          cooldown: '2 per 5s (user)',
          example: ',ban @spammer spam',
          flags: [],
        },
      ],
    },
    {
      name: 'Fun',
      commands: [
        {
          name: '8ball',
          description: 'Ask the magic eight ball.',
          category: 'Fun',
          args: 'question',
          syntax: '8ball (question)',
          permissions: [],
          aliases: ['eightball'],
          cooldown: null,
          example: null,
          flags: [],
        },
      ],
    },
  ],
  commandCount: 2,
  fetchedAt: new Date().toISOString(),
}

const statusPayload = {
  shards: [
    {
      shardId: 0,
      isReady: true,
      serverCount: 512,
      cachedUserCount: 48210,
      uptime: Math.floor(Date.now() / 1000) - 3600,
      latency: 42,
    },
    {
      shardId: 1,
      isReady: false,
      serverCount: 12,
      cachedUserCount: 900,
      uptime: Math.floor(Date.now() / 1000) - 3600,
      latency: 310,
    },
  ],
  fetchedAt: new Date().toISOString(),
}

const statsPayload = { members: 79222, servers: 912, fetchedAt: new Date().toISOString() }

function mockApi(overrides: Record<string, () => Response> = {}) {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    const key = url.split('?')[0]
    const custom = overrides[key]
    if (custom) return custom()

    const payload =
      key === '/api/commands'
        ? commandsPayload
        : key === '/api/status'
          ? statusPayload
          : key === '/api/stats'
            ? statsPayload
            : key === '/api/auth/session'
              ? null
              : {}

    if (payload === null) {
      return new Response(JSON.stringify({ error: 'unauthenticated', message: 'No active session.' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })
  })
}

function renderApp(route: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('public pages', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockApi())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the homepage with live statistics', async () => {
    renderApp('/')

    expect(
      screen.getByRole('heading', { name: /Everything a Discord server needs/i }),
    ).toBeInTheDocument()

    expect(await screen.findByText('912')).toBeInTheDocument()
    expect(screen.getByText('79,222')).toBeInTheDocument()
  })

  it('lists commands from the bot API and filters them', async () => {
    const user = userEvent.setup()
    renderApp('/commands')

    expect(await screen.findByText('ban')).toBeInTheDocument()
    expect(screen.getByText('8ball')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Search commands'), '8ball')
    await waitFor(() => expect(screen.queryByText('ban')).not.toBeInTheDocument())
    expect(screen.getByText('8ball')).toBeInTheDocument()
  })

  it('opens the command details dialog with copyable syntax', async () => {
    const user = userEvent.setup()
    renderApp('/commands')

    await waitFor(() => expect(screen.getByText('ban')).toBeInTheDocument())
    await user.click(screen.getByText('ban'))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('ban members')).toBeInTheDocument()
    expect(within(dialog).getByText('2 per 5s (user)')).toBeInTheDocument()
    expect(within(dialog).getByText(',ban @spammer spam')).toBeInTheDocument()
  })

  it('shows shard health on the status page', async () => {
    renderApp('/status')

    expect(await screen.findByText('Shard #0')).toBeInTheDocument()
    expect(screen.getByText('Shard #1')).toBeInTheDocument()
    expect(screen.getByText('Ready')).toBeInTheDocument()
    expect(screen.getByText('Not ready')).toBeInTheDocument()
  })

  it('reports an honest error state when the bot API is unreachable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ error: 'bot_api_unreachable', message: 'The bot API could not be reached.' }), {
          status: 502,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    )

    renderApp('/commands')

    expect(
      await screen.findByText('The command directory is unavailable'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('toggles the mobile navigation', async () => {
    const user = userEvent.setup()
    renderApp('/')

    const toggle = screen.getByRole('button', { name: /open menu/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument()
  })

  it('shows the sign in call to action on the dashboard when signed out', async () => {
    renderApp('/dashboard')
    expect(await screen.findByText('Sign in to open your dashboard')).toBeInTheDocument()
  })

  it('renders the embed builder with a live preview', async () => {
    const user = userEvent.setup()
    renderApp('/embed')

    const title = screen.getByLabelText('Title')
    await waitFor(() => expect(title).toHaveValue('Welcome to Bore'))

    await user.clear(title)
    await user.type(title, 'Updated title')

    expect(screen.getByText('Updated title')).toBeInTheDocument()
  })

  it('renders a branded not found page', async () => {
    renderApp('/does-not-exist')
    expect(screen.getByText('404')).toBeInTheDocument()
  })
})

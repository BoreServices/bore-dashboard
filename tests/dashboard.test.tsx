import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { App } from '../src/App'

const session = {
  user: { id: '1', username: 'bore', globalName: 'Bore', avatar: null },
  guildsAvailable: true,
  guilds: [],
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
}

const guilds = {
  guilds: [
    {
      id: '111',
      name: 'Alpha Server',
      icon: null,
      owner: true,
      memberCount: 1204,
      permissions: '34359747024',
      botInstalled: true,
    },
    {
      id: '222',
      name: 'Beta Server',
      icon: null,
      owner: false,
      memberCount: null,
      permissions: '0',
      botInstalled: false,
    },
  ],
  fetchedAt: new Date().toISOString(),
}

const config = {
  guild: guilds.guilds[0],
  prefix: '?',
  welcome: [{ channelId: 'c1', channelName: 'general', message: 'Welcome {user.mention}' }],
  leave: [],
  boost: [],
  autoroles: [{ roleId: 'r1', roleName: 'Member' }],
  aliases: [{ alias: 'mod', command: 'purge' }],
  antinuke: {
    enabled: true,
    logChannelId: null,
    windowSeconds: 10,
    modules: [{ module: 'ban', punishment: 'ban', threshold: 3 }],
  },
  honeypot: { staffRoleId: null, logChannelId: null, jailRoleId: null, channels: [] },
  fetchedAt: new Date().toISOString(),
}

function mockApi(overrides: Record<string, unknown> = {}) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString()
    const key = url.split('?')[0]

    if (key in overrides) {
      const override = overrides[key]
      if (typeof override === 'function') return (override as (u: string, i?: RequestInit) => Promise<Response>)(url, init)
      return new Response(JSON.stringify(override), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    if (key === '/api/auth/session' || key === '/api/auth/me') {
      return new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (key === '/api/dashboard/guilds') {
      return new Response(JSON.stringify(guilds), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (key === '/api/dashboard/guilds/111/config') {
      return new Response(JSON.stringify(config), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (key === '/api/dashboard/guilds/111/channels') {
      return new Response(JSON.stringify({ channels: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (key === '/api/dashboard/guilds/111/roles') {
      return new Response(JSON.stringify({ roles: [] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }
    if (key === '/api/commands') {
      return new Response(JSON.stringify({ categories: [], commandCount: 0, fetchedAt: '' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'not_found' }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  })
}

function renderApp(route: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('dashboard', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockApi())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the server configuration on the overview', async () => {
    renderApp('/dashboard')

    expect(await screen.findByRole('heading', { name: 'Alpha Server' })).toBeInTheDocument()
    expect(screen.getByText('111')).toBeInTheDocument()
    expect(screen.getByText('?')).toBeInTheDocument()
    expect(screen.getByText('Installed')).toBeInTheDocument()
  })

  it('lists the modules that have a real backend behind them', async () => {
    renderApp('/dashboard')

    const nav = await screen.findByRole('navigation', { name: 'Dashboard' })
    for (const label of ['Overview', 'General', 'Welcome', 'Leave', 'Boosts', 'Auto roles', 'Aliases', 'Anti-nuke', 'Honeypots']) {
      expect(within(nav).getByText(label)).toBeInTheDocument()
    }
  })

  it('saves the prefix through the server and keeps the saved value', async () => {
    const user = userEvent.setup()
    const calls: { url: string; body: unknown }[] = []

    vi.stubGlobal(
      'fetch',
      mockApi({
        '/api/dashboard/guilds/111/config/prefix': (url: string, init?: RequestInit) => {
          calls.push({ url, body: init?.body ? JSON.parse(String(init.body)) : null })
          return Promise.resolve(
            new Response(JSON.stringify({ ok: true, module: 'prefix', config: {} }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
          )
        },
      }),
    )

    renderApp('/dashboard/general')

    const input = await screen.findByLabelText('Command prefix')
    await waitFor(() => expect(input).toHaveValue('?'))

    await user.clear(input)
    await user.type(input, '!')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(calls).toHaveLength(1))
    expect(calls[0].body).toEqual({ prefix: '!' })
  })

  it('lists the servers the user can manage', async () => {
    const user = userEvent.setup()
    renderApp('/dashboard')

    await screen.findByRole('heading', { name: 'Alpha Server' })
    await user.click(screen.getByRole('button', { name: /Alpha Server/ }))

    expect(await screen.findByText('Beta Server')).toBeInTheDocument()
    expect(screen.getByText('not installed')).toBeInTheDocument()
  })
  it('makes the controls read-only without the permission the module needs', async () => {
    vi.stubGlobal(
      'fetch',
      mockApi({
        '/api/dashboard/guilds/111/config': {
          ...config,
          guild: { ...guilds.guilds[0], permissions: '0' },
        },
      }),
    )

    renderApp('/dashboard/general')

    const input = await screen.findByLabelText('Command prefix')
    await waitFor(() => expect(input).toBeDisabled())
    expect(screen.getByText(/Manage Messages permission/)).toBeInTheDocument()
  })
  it('renders every dashboard route with the stored configuration', async () => {
    const routes: [string, string][] = [
      ['/dashboard/general', 'General'],
      ['/dashboard/welcome', 'Welcome messages'],
      ['/dashboard/leave', 'Leave messages'],
      ['/dashboard/boost', 'Boost messages'],
      ['/dashboard/autoroles', 'Auto roles'],
      ['/dashboard/aliases', 'Aliases'],
      ['/dashboard/antinuke', 'Anti-nuke'],
      ['/dashboard/honeypot', 'Honeypots'],
    ]

    for (const [route, heading] of routes) {
      const view = renderApp(route)
      expect(await screen.findByRole('heading', { name: heading }), route).toBeInTheDocument()
      view.unmount()
    }
  })
})

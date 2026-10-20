import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  useGuildChannelsQuery,
  useGuildConfigQuery,
  useGuildRolesQuery,
  useGuildsQuery,
} from '../../lib/dashboard'
import type { DashboardChannel, DashboardGuild, DashboardRole, GuildConfig } from '../../types/dashboard'

const STORAGE_KEY = 'bore.dashboard.guild'

type DashboardContextValue = {
  guilds: DashboardGuild[]
  guildsPending: boolean
  guildsError: unknown
  refreshGuilds: () => void
  selectedGuildId: string | null
  selectGuild: (guildId: string) => void
  selectedGuild: DashboardGuild | null
  config: GuildConfig | undefined
  configPending: boolean
  configError: unknown
  refreshConfig: () => void
  channels: DashboardChannel[]
  channelsPending: boolean
  roles: DashboardRole[]
  rolesPending: boolean
  /** The highest role the bot holds; roles at or above it cannot be assigned. */
  botRolePosition: number
}

const DashboardContext = createContext<DashboardContextValue | null>(null)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const guildsQuery = useGuildsQuery()
  const guilds = guildsQuery.data?.guilds ?? []

  const [selectedGuildId, setSelectedGuildId] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })

  // Keep the selection valid: a stored guild the user no longer has is dropped.
  useEffect(() => {
    if (!guilds.length) return
    if (selectedGuildId && guilds.some((guild) => guild.id === selectedGuildId)) return
    setSelectedGuildId(guilds[0].id)
  }, [guilds, selectedGuildId])

  const selectGuild = useCallback((guildId: string) => {
    setSelectedGuildId(guildId)
    try {
      window.localStorage.setItem(STORAGE_KEY, guildId)
    } catch {
      // ignore
    }
  }, [])

  const configQuery = useGuildConfigQuery(selectedGuildId)
  const channelsQuery = useGuildChannelsQuery(selectedGuildId)
  const rolesQuery = useGuildRolesQuery(selectedGuildId)

  const value = useMemo<DashboardContextValue>(
    () => ({
      guilds,
      guildsPending: guildsQuery.isPending,
      guildsError: guildsQuery.error,
      refreshGuilds: () => void guildsQuery.refetch(),
      selectedGuildId,
      selectGuild,
      selectedGuild: guilds.find((guild) => guild.id === selectedGuildId) ?? null,
      config: configQuery.data,
      configPending: configQuery.isPending,
      configError: configQuery.error,
      refreshConfig: () => void configQuery.refetch(),
      channels: channelsQuery.data?.channels ?? [],
      channelsPending: channelsQuery.isPending,
      roles: rolesQuery.data?.roles ?? [],
      rolesPending: rolesQuery.isPending,
      botRolePosition: rolesQuery.data?.botRolePosition ?? Number.MAX_SAFE_INTEGER,
    }),
    [
      guilds,
      guildsQuery,
      selectedGuildId,
      selectGuild,
      configQuery,
      channelsQuery,
      rolesQuery,
    ],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext)
  if (!context) throw new Error('useDashboard must be used inside DashboardProvider')
  return context
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './api'
import {
  channelsResponseSchema,
  guildConfigSchema,
  guildsResponseSchema,
  moduleUpdateResponseSchema,
  rolesResponseSchema,
} from '../types/dashboard'

export const dashboardKeys = {
  guilds: ['dashboard', 'guilds'] as const,
  config: (guildId: string) => ['dashboard', 'config', guildId] as const,
  channels: (guildId: string) => ['dashboard', 'channels', guildId] as const,
  roles: (guildId: string) => ['dashboard', 'roles', guildId] as const,
}

/** Discord permission bits (discord.py 2.7.1 values). */
export const PERMISSIONS = {
  administrator: 8,
  manage_guild: 32,
  manage_channels: 16,
  manage_messages: 8192,
  manage_roles: 268435456,
} as const

export function hasPermission(permissions: string | undefined | null, flag: number): boolean {
  if (!permissions) return false
  try {
    const value = BigInt(permissions)
    if ((value & BigInt(PERMISSIONS.administrator)) === BigInt(PERMISSIONS.administrator)) return true
    return (value & BigInt(flag)) === BigInt(flag)
  } catch {
    return false
  }
}

export function useGuildsQuery() {
  return useQuery({
    queryKey: dashboardKeys.guilds,
    queryFn: ({ signal }) => apiFetch('/api/dashboard/guilds', guildsResponseSchema, { signal }),
    staleTime: 60_000,
  })
}

export function useGuildConfigQuery(guildId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.config(guildId ?? 'none'),
    queryFn: ({ signal }) =>
      apiFetch(`/api/dashboard/guilds/${guildId}/config`, guildConfigSchema, { signal }),
    enabled: Boolean(guildId),
    staleTime: 10_000,
  })
}

export function useGuildChannelsQuery(guildId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.channels(guildId ?? 'none'),
    queryFn: ({ signal }) =>
      apiFetch(`/api/dashboard/guilds/${guildId}/channels`, channelsResponseSchema, { signal }),
    enabled: Boolean(guildId),
    staleTime: 60_000,
  })
}

export function useGuildRolesQuery(guildId: string | null) {
  return useQuery({
    queryKey: dashboardKeys.roles(guildId ?? 'none'),
    queryFn: ({ signal }) =>
      apiFetch(`/api/dashboard/guilds/${guildId}/roles`, rolesResponseSchema, { signal }),
    enabled: Boolean(guildId),
    staleTime: 60_000,
  })
}

/**
 * Every write goes through one mutation so the saved configuration always
 * comes back from the server rather than from local state.
 */
export function useModuleMutation(guildId: string | null) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ module, body }: { module: string; body: unknown }) => {
      if (!guildId) throw new Error('No server selected')
      return apiFetch(
        `/api/dashboard/guilds/${guildId}/config/${module}`,
        moduleUpdateResponseSchema,
        {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        },
      )
    },
    onSuccess: () => {
      if (guildId) {
        void queryClient.invalidateQueries({ queryKey: dashboardKeys.config(guildId) })
      }
    },
  })
}

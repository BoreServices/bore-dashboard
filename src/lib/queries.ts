import { useQuery } from '@tanstack/react-query'
import { ApiError, apiFetch } from './api'
import {
  commandsResponseSchema,
  guildConfigSchema,
  sessionResponseSchema,
  shardsResponseSchema,
  statsResponseSchema,
  statusResponseSchema,
} from '../types/api'

export const queryKeys = {
  commands: ['commands'] as const,
  status: ['status'] as const,
  stats: ['stats'] as const,
  shards: ['shards'] as const,
  session: ['session'] as const,
  guild: (guildId: string) => ['guild', guildId] as const,
}

export function useCommandsQuery() {
  return useQuery({
    queryKey: queryKeys.commands,
    queryFn: ({ signal }) => apiFetch('/api/commands', commandsResponseSchema, { signal }),
    staleTime: 60_000,
  })
}

export function useStatusQuery() {
  return useQuery({
    queryKey: queryKeys.status,
    queryFn: ({ signal }) => apiFetch('/api/status', statusResponseSchema, { signal }),
    refetchInterval: 12_000,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  })
}

export function useStatsQuery() {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: ({ signal }) => apiFetch('/api/stats', statsResponseSchema, { signal }),
    staleTime: 30_000,
  })
}

export function useShardsQuery() {
  return useQuery({
    queryKey: queryKeys.shards,
    queryFn: ({ signal }) => apiFetch('/api/shards', shardsResponseSchema, { signal }),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })
}

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async ({ signal }) => {
      try {
        return await apiFetch('/api/auth/session', sessionResponseSchema, { signal })
      } catch (error) {
        // Not being signed in is a normal state, not an error to surface.
        if (error instanceof ApiError && error.status === 401) return null
        throw error
      }
    },
    retry: false,
    staleTime: 60_000,
  })
}

export function useGuildConfigQuery(guildId: string | null) {
  return useQuery({
    queryKey: queryKeys.guild(guildId ?? 'none'),
    queryFn: ({ signal }) =>
      apiFetch(`/api/dashboard/guild?guildId=${encodeURIComponent(guildId as string)}`, guildConfigSchema, {
        signal,
      }),
    enabled: Boolean(guildId),
    retry: 0,
    staleTime: 30_000,
  })
}

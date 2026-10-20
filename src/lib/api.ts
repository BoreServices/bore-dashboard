import { z } from 'zod'

export class ApiError extends Error {
  status: number
  code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/**
 * All API traffic goes to same-origin Vercel endpoints so the bot API URL and
 * any credentials stay on the server.
 */
export async function apiFetch<T>(
  path: string,
  schema: z.ZodType<T>,
  init?: RequestInit & { signal?: AbortSignal },
): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { accept: 'application/json', ...(init?.headers ?? {}) },
    })
  } catch (error) {
    if (init?.signal?.aborted) throw error
    throw new ApiError(0, 'network_error', 'Could not reach the server.')
  }

  const text = await response.text()
  let json: unknown = undefined
  try {
    json = text ? JSON.parse(text) : undefined
  } catch {
    json = undefined
  }

  if (!response.ok) {
    const payload = json as { error?: string; message?: string } | undefined
    throw new ApiError(
      response.status,
      payload?.error ?? 'request_failed',
      payload?.message ?? `Request failed with status ${response.status}.`,
    )
  }

  const parsed = schema.safeParse(json)
  if (!parsed.success) {
    throw new ApiError(response.status, 'invalid_payload', 'The server returned an unexpected response.')
  }
  return parsed.data
}

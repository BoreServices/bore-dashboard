import { NextResponse } from 'next/server'

const UPSTREAM_TIMEOUT = 5000
const MEM_TTL = 30_000

const cache = new Map<string, { data: unknown; ts: number }>()

export async function proxyGet(
  url: string,
  transform?: (data: unknown) => unknown
): Promise<NextResponse> {
  const key = url
  const cached = cache.get(key)
  if (cached && Date.now() - cached.ts < MEM_TTL) {
    const body = transform ? transform(cached.data) : cached.data
    return NextResponse.json(body, {
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60' },
    })
  }

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
      cache: 'no-store',
    })
    const json = await res.json()
    cache.set(key, { data: json, ts: Date.now() })
    return NextResponse.json(transform ? transform(json) : json, {
      status: res.status,
      headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30, stale-while-revalidate=60' },
    })
  } catch (err) {
    const timeout = err instanceof Error && err.name === 'TimeoutError'
    return NextResponse.json(
      { error: timeout ? 'upstream timeout' : 'upstream error' },
      { status: timeout ? 504 : 502 }
    )
  }
}

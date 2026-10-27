import { NextRequest } from 'next/server'
import { proxyGet } from '@/lib/proxyGet'
import { API_BASE } from '@/lib/api'

export function GET(req: NextRequest) {
  const idx = req.nextUrl.searchParams.get('idx') ?? ''
  return proxyGet(`${API_BASE}/guild/find?idx=${encodeURIComponent(idx)}`)
}

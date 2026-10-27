import { proxyGet } from '@/lib/proxyGet'
import { API_BASE } from '@/lib/api'

export function GET() {
  return proxyGet(`${API_BASE}/commands`)
}

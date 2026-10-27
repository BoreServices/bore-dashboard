import { NextResponse } from 'next/server'
import { getEliraShapeHealth } from '@/lib/health'

export async function GET() {
  try {
    return NextResponse.json(await getEliraShapeHealth())
  } catch {
    return NextResponse.json({ error: 'upstream error' }, { status: 502 })
  }
}

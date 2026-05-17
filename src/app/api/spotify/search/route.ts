import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  const q = request.nextUrl.searchParams.get('q')

  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }
  if (!q?.trim()) return NextResponse.json({ tracks: { items: [] } })

  try {
    const data = await spotifyFetch(user, `/search?q=${encodeURIComponent(q)}&type=track&limit=10`)
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    if (msg === 'Not connected') return NextResponse.json({ connected: false })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

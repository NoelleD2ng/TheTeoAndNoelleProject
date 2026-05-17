import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  const typeParam = request.nextUrl.searchParams.get('type') ?? 'tracks'
  const range = request.nextUrl.searchParams.get('range') ?? 'medium_term'

  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }
  if (typeParam !== 'tracks' && typeParam !== 'artists') {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  try {
    const data = await spotifyFetch(user, `/me/top/${typeParam}?time_range=${range}&limit=20`)
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    if (msg === 'Not connected') return NextResponse.json({ connected: false })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

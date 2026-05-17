import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  const offset = request.nextUrl.searchParams.get('offset') ?? '0'

  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  try {
    const data = await spotifyFetch(user, `/me/tracks?limit=20&offset=${offset}`)
    return NextResponse.json(data)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    if (msg === 'Not connected') return NextResponse.json({ connected: false })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

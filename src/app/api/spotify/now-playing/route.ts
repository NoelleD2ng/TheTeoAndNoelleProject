import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  try {
    const data = await spotifyFetch(user, '/me/player/currently-playing') as {
      is_playing: boolean
      progress_ms: number
      item?: {
        id: string
        name: string
        duration_ms: number
        artists: { name: string }[]
        album: { name: string; images: { url: string }[] }
        external_urls: { spotify: string }
      }
    } | null

    if (!data) return NextResponse.json({ playing: false, track: null })

    return NextResponse.json({
      playing: data.is_playing,
      track: data.item
        ? {
            id: data.item.id,
            name: data.item.name,
            artists: data.item.artists.map(a => a.name),
            album: data.item.album.name,
            albumArt: data.item.album.images?.[0]?.url,
            duration: data.item.duration_ms,
            progress: data.progress_ms,
            url: data.item.external_urls.spotify,
          }
        : null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    if (msg === 'Not connected') return NextResponse.json({ connected: false })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

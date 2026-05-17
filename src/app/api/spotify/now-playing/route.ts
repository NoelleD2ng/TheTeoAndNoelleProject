import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'

type CurrentlyPlaying = {
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

type RecentlyPlayed = {
  items?: Array<{
    track: {
      id: string
      name: string
      duration_ms: number
      artists: { name: string }[]
      album: { name: string; images: { url: string }[] }
      external_urls: { spotify: string }
    }
    played_at: string
  }>
} | null

function formatTrack(item: NonNullable<NonNullable<CurrentlyPlaying>['item']>, progress: number) {
  return {
    id: item.id,
    name: item.name,
    artists: item.artists.map(a => a.name),
    album: item.album.name,
    albumArt: item.album.images?.[0]?.url,
    duration: item.duration_ms,
    progress,
    url: item.external_urls.spotify,
  }
}

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  try {
    const data = await spotifyFetch(user, '/me/player/currently-playing') as CurrentlyPlaying

    if (data?.item) {
      return NextResponse.json({
        playing: data.is_playing,
        recent: false,
        track: formatTrack(data.item, data.progress_ms),
      })
    }

    // Fall back to recently played
    const recent = await spotifyFetch(user, '/me/player/recently-played?limit=1') as RecentlyPlayed
    const recentItem = recent?.items?.[0]

    if (recentItem) {
      return NextResponse.json({
        playing: false,
        recent: true,
        track: {
          ...formatTrack(recentItem.track, 0),
          playedAt: recentItem.played_at,
        },
      })
    }

    return NextResponse.json({ playing: false, recent: false, track: null })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    if (msg === 'Not connected') return NextResponse.json({ connected: false })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

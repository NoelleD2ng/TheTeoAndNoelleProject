import { NextRequest, NextResponse } from 'next/server'
import { getValidToken } from '@/lib/spotify'

export async function POST(request: NextRequest) {
  const { user, name, description, trackUris } = await request.json() as {
    user: string
    name: string
    description?: string
    trackUris?: string[]
  }

  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const token = await getValidToken(user)
  if (!token) return NextResponse.json({ error: 'Not connected' }, { status: 401 })

  // Step 1: create playlist
  const createRes = await fetch('https://api.spotify.com/v1/me/playlists', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description: description ?? '', public: false }),
  })
  if (!createRes.ok) {
    const body = await createRes.text()
    return NextResponse.json({ error: `Create failed ${createRes.status}: ${body}` }, { status: 500 })
  }
  const playlist = await createRes.json() as { id: string; external_urls: { spotify: string } }

  if (!playlist?.id) {
    return NextResponse.json({ error: 'Spotify returned no playlist ID' }, { status: 500 })
  }

  // Step 2: add tracks
  let trackError: string | undefined
  if (trackUris?.length) {
    const addRes = await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ uris: trackUris }),
    })
    if (!addRes.ok) {
      const body = await addRes.text()
      trackError = `Add tracks ${addRes.status}: ${body}`
    }
  }

  return NextResponse.json({
    url: playlist.external_urls.spotify,
    id: playlist.id,
    trackError,
  })
}

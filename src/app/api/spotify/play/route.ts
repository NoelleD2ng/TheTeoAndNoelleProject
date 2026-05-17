import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'

export async function PUT(request: NextRequest) {
  const { user, uris, deviceId, contextUri } = await request.json() as {
    user: string
    deviceId: string
    uris?: string[]
    contextUri?: string
  }

  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  if (!deviceId) {
    return NextResponse.json({ error: 'No active player — wait for the player to connect, then try again' }, { status: 400 })
  }

  const body = contextUri
    ? { context_uri: contextUri }
    : uris?.length
      ? { uris }
      : {}

  try {
    await spotifyFetch(user, `/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

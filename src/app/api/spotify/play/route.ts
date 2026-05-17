import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'

export async function PUT(request: NextRequest) {
  const { user, uris, deviceId } = await request.json() as {
    user: string
    uris?: string[]
    deviceId: string
  }

  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  try {
    await spotifyFetch(user, `/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      body: JSON.stringify(uris?.length ? { uris } : {}),
    })
    return NextResponse.json({ success: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

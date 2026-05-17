import { NextRequest, NextResponse } from 'next/server'
import { spotifyFetch } from '@/lib/spotify'
import { supabase } from '@/lib/supabase'

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

  try {
    const { data: tokenData } = await supabase
      .from('spotify_tokens')
      .select('spotify_user_id')
      .eq('user_key', user)
      .single()

    if (!tokenData) return NextResponse.json({ error: 'Not connected' }, { status: 401 })

    const playlist = await spotifyFetch(
      user,
      `/users/${tokenData.spotify_user_id}/playlists`,
      {
        method: 'POST',
        body: JSON.stringify({ name, description: description ?? '', public: false }),
      }
    ) as { id: string; external_urls: { spotify: string } }

    if (trackUris?.length) {
      await spotifyFetch(user, `/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        body: JSON.stringify({ uris: trackUris }),
      })
    }

    return NextResponse.json({ url: playlist.external_urls.spotify, id: playlist.id })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode } from '@/lib/spotify'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  if (error || !code || (state !== 'teo' && state !== 'noelle')) {
    return NextResponse.redirect(new URL('/spotify?error=auth_failed', origin))
  }

  const user = state as 'teo' | 'noelle'
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!

  try {
    const tokens = await exchangeCode(code, redirectUri)

    const profileRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })
    const profile = await profileRes.json() as {
      id: string
      display_name?: string
      images?: { url: string }[]
    }

    await supabase.from('spotify_tokens').upsert(
      {
        user_key: user,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        spotify_user_id: profile.id,
        display_name: profile.display_name ?? user,
        avatar_url: profile.images?.[0]?.url ?? null,
      },
      { onConflict: 'user_key' }
    )

    return NextResponse.redirect(new URL('/spotify?connected=true', origin))
  } catch {
    return NextResponse.redirect(new URL('/spotify?error=token_exchange', origin))
  }
}

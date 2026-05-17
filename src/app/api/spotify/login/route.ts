import { NextRequest, NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!
  return NextResponse.redirect(getAuthUrl(user, redirectUri))
}

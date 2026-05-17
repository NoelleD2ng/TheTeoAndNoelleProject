import { supabase } from './supabase'

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!

export type SpotifyUser = 'teo' | 'noelle'

export function getAuthUrl(user: SpotifyUser, redirectUri: string): string {
  const scopes = [
    'user-read-currently-playing',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-top-read',
    'user-library-read',
    'playlist-modify-public',
    'playlist-modify-private',
    'user-read-recently-played',
    'streaming',
  ].join(' ')

  return `https://accounts.spotify.com/authorize?${new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state: user,
    show_dialog: 'true',
  })}`
}

function authHeader() {
  return `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
}

export async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: authHeader() },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
  })
  if (!res.ok) throw new Error(`Token exchange failed: ${await res.text()}`)
  return res.json() as Promise<{ access_token: string; refresh_token: string; expires_in: number; scope: string }>
}

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Authorization: authHeader() },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)
  return res.json() as Promise<{ access_token: string; refresh_token?: string; expires_in: number }>
}

export async function getValidToken(user: SpotifyUser): Promise<string | null> {
  const { data } = await supabase
    .from('spotify_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_key', user)
    .single()

  if (!data) return null

  if (Date.now() < new Date(data.expires_at).getTime() - 5 * 60 * 1000) {
    return data.access_token
  }

  try {
    const refreshed = await refreshAccessToken(data.refresh_token)
    await supabase
      .from('spotify_tokens')
      .update({
        access_token: refreshed.access_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        ...(refreshed.refresh_token && { refresh_token: refreshed.refresh_token }),
      })
      .eq('user_key', user)
    return refreshed.access_token
  } catch {
    return null
  }
}

export async function spotifyFetch(
  user: SpotifyUser,
  path: string,
  options?: RequestInit
): Promise<unknown> {
  const token = await getValidToken(user)
  if (!token) throw new Error('Not connected')

  const res = await fetch(`https://api.spotify.com/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (res.status === 204) return null
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string; status?: number } }
    const msg = err.error?.message ?? 'Unknown error'
    throw new Error(`Spotify ${res.status}: ${msg}`)
  }
  return res.json()
}

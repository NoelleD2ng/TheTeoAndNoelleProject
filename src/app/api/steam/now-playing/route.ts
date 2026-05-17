import { NextRequest, NextResponse } from 'next/server'

const KEY = process.env.STEAM_API_KEY
const STEAM_IDS: Record<string, string | undefined> = {
  teo: process.env.STEAM_ID_TEO,
  noelle: process.env.STEAM_ID_NOELLE,
}

type SummaryPlayer = { gameid?: string; gameextrainfo?: string }
type RecentGame = { name: string; appid: number }

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const steamId = STEAM_IDS[user]
  if (!KEY || !steamId) {
    return NextResponse.json({ configured: false })
  }

  try {
    const summaryRes = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?key=${KEY}&steamids=${steamId}`
    )
    const summary = await summaryRes.json() as { response: { players: SummaryPlayer[] } }
    const player = summary.response.players[0]

    if (player?.gameextrainfo) {
      return NextResponse.json({
        configured: true,
        current: true,
        game: player.gameextrainfo,
        appId: player.gameid ?? null,
      })
    }

    const recentRes = await fetch(
      `https://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/?key=${KEY}&steamid=${steamId}&count=1`
    )
    const recent = await recentRes.json() as { response: { games?: RecentGame[] } }
    const recentGame = recent.response.games?.[0]

    return NextResponse.json({
      configured: true,
      current: false,
      game: recentGame?.name ?? null,
      appId: recentGame ? String(recentGame.appid) : null,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getValidToken } from '@/lib/spotify'

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get('user')
  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  const token = await getValidToken(user)
  if (!token) return NextResponse.json({ error: 'Not connected' }, { status: 401 })

  return NextResponse.json({ token })
}

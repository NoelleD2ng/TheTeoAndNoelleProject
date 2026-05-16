import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url))
  response.cookies.set('tno-session', '', { maxAge: 0, path: '/' })
  return response
}

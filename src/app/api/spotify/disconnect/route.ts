import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  const { user } = await request.json() as { user: string }

  if (user !== 'teo' && user !== 'noelle') {
    return NextResponse.json({ error: 'Invalid user' }, { status: 400 })
  }

  await supabase.from('spotify_tokens').delete().eq('user_key', user)
  return NextResponse.json({ success: true })
}

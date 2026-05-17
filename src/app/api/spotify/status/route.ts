import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data } = await supabase
    .from('spotify_tokens')
    .select('user_key, display_name, avatar_url')

  const result: Record<string, { connected: boolean; display_name?: string; avatar_url?: string | null }> = {
    teo: { connected: false },
    noelle: { connected: false },
  }

  for (const row of data ?? []) {
    result[row.user_key] = {
      connected: true,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
    }
  }

  return NextResponse.json(result)
}

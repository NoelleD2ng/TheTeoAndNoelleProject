import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Memory = {
  id: string
  image_url: string
  caption: string | null
  uploaded_by: string | null
  created_at: string
}

export type PlaceMetadata = {
  rating?: number
  visit_date?: string
  what_happened_here?: string
  funniest_moment?: string
  journal_entry?: string
  playlist_url?: string
  voice_note_url?: string
}

export type Place = {
  id: string
  name: string
  lat: number
  lng: number
  notes: string | null
  status: 'want-to-go' | 'visited'
  linked_memory_ids: string[] | null
  metadata: PlaceMetadata | null
  created_at: string
}

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    // Skip auth.getSession() on every request — this app uses cookie auth,
    // not Supabase Auth, so returning null falls back to the anon key.
    accessToken: async () => null,
  }
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

export type JournalEntry = {
  id: string
  type: 'journal' | 'love-note'
  title: string | null
  content: string
  mood: string | null
  images: string[]
  created_at: string
}

export type Todo = {
  id: string
  text: string
  done: boolean
  owner: 'teo' | 'noelle' | 'both'
  created_at: string
}

export type BucketItem = {
  id: string
  text: string
  done: boolean
  category: 'travel' | 'experience' | 'food' | 'adventure' | 'learn' | 'other'
  created_at: string
}

export type DateIdea = {
  id: string
  title: string
  category: 'outdoor' | 'indoor' | 'food' | 'travel' | 'fun' | 'creative'
  done: boolean
  rating: number
  notes: string | null
  planned_date: string | null
  cost: 'free' | 'affordable' | 'splurge' | null
  vibes: string[] | null
  created_at: string
}

export type CurrentlyEntry = {
  user_name: 'teo' | 'noelle'
  watching: string | null
  obsessed_with: string | null
  updated_at: string
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

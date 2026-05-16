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

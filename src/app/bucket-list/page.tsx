'use client'

import { useEffect, useState } from 'react'
import { supabase, type BucketItem } from '@/lib/supabase'

const categories = {
  travel:     { label: 'Travel',     emoji: '✈️' },
  experience: { label: 'Experience', emoji: '🎉' },
  food:       { label: 'Food',       emoji: '🍜' },
  adventure:  { label: 'Adventure',  emoji: '🧗' },
  learn:      { label: 'Learn',      emoji: '📚' },
  other:      { label: 'Other',      emoji: '⭐' },
} as const

type Category = keyof typeof categories

const DEFAULTS: Omit<BucketItem, 'id' | 'created_at'>[] = [
  { text: 'Korean BBQ',                                           done: false, category: 'food' },
  { text: 'Make a pizza together',                                done: false, category: 'food' },
  { text: 'Make cheesecake',                                      done: false, category: 'food' },
  { text: 'Go to arcade',                                         done: false, category: 'experience' },
  { text: 'Go fishing',                                           done: false, category: 'adventure' },
  { text: "Drive Teo's sister to Buffalo",                        done: false, category: 'other' },
  { text: "Cut Teo's hair",                                       done: false, category: 'other' },
  { text: "Paint Teo's room",                                     done: false, category: 'experience' },
  { text: "Go to Sara's",                                         done: false, category: 'experience' },
  { text: 'Build a productivity app together',                    done: false, category: 'learn' },
  { text: 'Do a research project together',                       done: false, category: 'learn' },
  { text: 'Drink boba',                                           done: false, category: 'food' },
  { text: 'Starbucks date',                                       done: false, category: 'food' },
  { text: 'Make music together',                                  done: false, category: 'experience' },
  { text: 'Watch anime together',                                 done: false, category: 'experience' },
  { text: 'Get Pokémon cards',                                    done: false, category: 'experience' },
  { text: 'Go to Toronto',                                        done: false, category: 'travel' },
  { text: 'Go to Waldameer',                                      done: false, category: 'adventure' },
  { text: "Get McDonald's at 3am",                                done: false, category: 'food' },
  { text: 'Go to the zoo',                                        done: false, category: 'adventure' },
  { text: 'Whole day of Pokémon GO',                              done: false, category: 'adventure' },
  { text: 'Food truck Fridays at Shade Beach',                    done: false, category: 'food' },
  { text: 'Go to the library together',                           done: false, category: 'learn' },
  { text: 'Bowling at Round One',                                 done: false, category: 'experience' },
  { text: 'Try Tipsy Bean café',                                  done: false, category: 'food' },
  { text: 'Hackathon-style coding session outside the apartment', done: false, category: 'learn' },
  { text: 'Beach at night',                                       done: false, category: 'adventure' },
  { text: 'Escape room',                                          done: false, category: 'adventure' },
  { text: 'Board game night',                                     done: false, category: 'experience' },
  { text: 'Bath bombs',                                           done: false, category: 'experience' },
  { text: 'Make summer-themed relationship bracelets',            done: false, category: 'experience' },
  { text: 'Take new photo booth photos',                          done: false, category: 'experience' },
  { text: 'Makeout in the rain',                                  done: false, category: 'adventure' },
  { text: 'Build and host a website on Vercel together',          done: false, category: 'learn' },
  { text: 'Role play 😈',                                         done: false, category: 'other' },
  { text: 'One person picks snacks, other picks the movie',       done: false, category: 'experience' },
  { text: 'Watch a YouTube rabbit hole together',                 done: false, category: 'experience' },
  { text: 'Learn about investing together',                       done: false, category: 'learn' },
  { text: 'Play It Takes Two or another co-op game',              done: false, category: 'experience' },
  { text: 'Watch a documentary about AI or tech',                 done: false, category: 'learn' },
]

export default function BucketListPage() {
  const [items, setItems] = useState<BucketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [category, setCategory] = useState<Category>('experience')

  useEffect(() => {
    supabase
      .from('bucket_list')
      .select('*')
      .order('created_at', { ascending: true })
      .then(async ({ data }) => {
        if (data && data.length === 0) {
          const { data: seeded } = await supabase
            .from('bucket_list')
            .insert(DEFAULTS)
            .select()
          setItems(seeded ?? [])
        } else {
          setItems(data ?? [])
        }
        setLoading(false)
      })
  }, [])

  async function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    const { data } = await supabase
      .from('bucket_list')
      .insert({ text: text.trim(), done: false, category })
      .select()
      .single()
    if (data) setItems(prev => [...prev, data])
    setText('')
  }

  async function toggle(id: string, done: boolean) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, done: !done } : i))
    await supabase.from('bucket_list').update({ done: !done }).eq('id', id)
  }

  async function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    await supabase.from('bucket_list').delete().eq('id', id)
  }

  const remaining = items.filter(i => !i.done).length

  if (loading) return null

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <div className="mb-8 pt-14">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/70 mb-1">dreams</p>
        <h1 className="text-3xl font-semibold text-[#2C1A0E]">Bucket List 🌟</h1>
        <p className="text-[#7A6155] mt-1 text-sm">
          {items.length === 0
            ? 'all the things we want to do together'
            : `${items.filter(i => i.done).length} of ${items.length} done`}
        </p>
      </div>

      <form onSubmit={addItem} className="bg-white rounded-2xl border border-[#E8DDD4] p-4 mb-6 flex flex-col gap-3" style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="add something to our bucket list..."
          className="w-full px-3 py-2.5 rounded-xl border border-[#E8DDD4] bg-[#F5EFE8] text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none focus:border-[#C4784A]/40 transition-colors"
        />
        <div className="flex gap-2 flex-wrap">
          {(Object.keys(categories) as Category[]).map(cat => (
            <button key={cat} type="button" onClick={() => setCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${category === cat ? 'bg-[#C4784A] text-white' : 'bg-[#F5EFE8] text-[#7A6155] hover:bg-[#EDD9C8]'}`}>
              {categories[cat].emoji} {categories[cat].label}
            </button>
          ))}
          <button type="submit" className="ml-auto bg-[#C4784A] hover:bg-[#B36840] text-white px-4 py-1 rounded-full text-sm transition-colors">Add</button>
        </div>
      </form>

      {remaining > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-medium text-[#AE9B8E] uppercase tracking-wider mb-2">Still to do</h2>
          <div className="flex flex-col gap-2">
            {items.filter(i => !i.done).map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-[#E8DDD4] px-4 py-3 flex items-center gap-3 group" style={{ boxShadow: '0 1px 8px rgba(44,26,14,0.04)' }}>
                <button onClick={() => toggle(item.id, item.done)}>
                  <div className="w-5 h-5 rounded-full border-2 border-[#E8DDD4] hover:border-[#C4784A]/50 transition-colors" />
                </button>
                <span className="text-lg">{categories[item.category as Category]?.emoji ?? '⭐'}</span>
                <span className="flex-1 text-sm text-[#2C1A0E]">{item.text}</span>
                <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-[#AE9B8E] hover:text-[#C4784A] text-xs transition-all">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.some(i => i.done) && (
        <div>
          <h2 className="text-xs font-medium text-[#AE9B8E] uppercase tracking-wider mb-2">Done 🎉</h2>
          <div className="flex flex-col gap-2">
            {items.filter(i => i.done).map(item => (
              <div key={item.id} className="bg-white rounded-xl border border-[#E8DDD4] px-4 py-3 flex items-center gap-3 opacity-50 group">
                <button onClick={() => toggle(item.id, item.done)}>
                  <div className="w-5 h-5 rounded-full bg-[#C4784A] border-2 border-[#C4784A] flex items-center justify-center">
                    <span className="text-white text-xs leading-none">✓</span>
                  </div>
                </button>
                <span className="text-lg">{categories[item.category as Category]?.emoji ?? '⭐'}</span>
                <span className="flex-1 text-sm text-[#7A6155] line-through">{item.text}</span>
                <button onClick={() => remove(item.id)} className="opacity-0 group-hover:opacity-100 text-[#AE9B8E] hover:text-[#C4784A] text-xs transition-all">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-[#AE9B8E]">
          <p className="text-4xl mb-3">🌟</p>
          <p className="text-sm">your bucket list is empty — dream big!</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type DateIdea = { id: string; title: string; category: 'outdoor' | 'indoor' | 'food' | 'travel' | 'fun' | 'creative'; done: boolean; rating: number; notes: string }

const categories = {
  outdoor:  { label: 'Outdoor',       emoji: '🌿' },
  indoor:   { label: 'Cozy',          emoji: '🏠' },
  food:     { label: 'Food & Drinks', emoji: '🍽️' },
  travel:   { label: 'Travel',        emoji: '✈️' },
  fun:      { label: 'Fun & Games',   emoji: '🎲' },
  creative: { label: 'Creative',      emoji: '🎨' },
} as const

type Category = keyof typeof categories

const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none bg-[#F5EFE8] border border-[#E8DDD4] focus:border-[#C4784A]/40 transition-colors'

function Stars({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} onClick={() => onRate(n)} className={`text-sm transition-colors ${n <= rating ? 'text-[#C4784A]' : 'text-[#E8DDD4] hover:text-[#C4784A]/50'}`}>♥</button>
      ))}
    </div>
  )
}

export default function DateIdeasPage() {
  const [ideas, setIdeas, hydrated] = useLocalStorage<DateIdea[]>('tno-dates', [])
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<Category>('indoor')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [filter, setFilter] = useState<'all' | 'todo' | 'done'>('all')

  function addIdea(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setIdeas(prev => [...prev, { id: crypto.randomUUID(), title: title.trim(), category, done: false, rating: 0, notes: notes.trim() }])
    setTitle(''); setNotes(''); setShowForm(false)
  }
  function toggleDone(id: string) { setIdeas(prev => prev.map(i => i.id === id ? { ...i, done: !i.done } : i)) }
  function rate(id: string, rating: number) { setIdeas(prev => prev.map(i => i.id === id ? { ...i, rating } : i)) }
  function remove(id: string) { setIdeas(prev => prev.filter(i => i.id !== id)) }

  const filtered = ideas.filter(i => filter === 'all' ? true : filter === 'todo' ? !i.done : i.done)

  if (!hydrated) return null

  return (
    <div className="pt-20 p-6 md:p-10 max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/70 mb-1">romance</p>
          <h1 className="text-3xl font-semibold text-[#2C1A0E]">Date Ideas</h1>
          <p className="text-[#7A6155] mt-1 text-sm">{ideas.filter(i => i.done).length} done · {ideas.filter(i => !i.done).length} ideas left</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 rounded-xl text-sm font-medium bg-[#C4784A] text-white hover:bg-[#B36840] transition-colors">
          + Add
        </button>
      </div>

      {showForm && (
        <form onSubmit={addIdea} className="rounded-2xl border border-[#E8DDD4] bg-white p-5 mb-5 flex flex-col gap-3" style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Date idea... *" className={inputCls} required />
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(categories) as Category[]).map(cat => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${category === cat ? 'bg-[#C4784A] text-white' : 'bg-[#F5EFE8] text-[#7A6155] hover:bg-[#EDD9C8]'}`}>
                {categories[cat].emoji} {categories[cat].label}
              </button>
            ))}
          </div>
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." className={inputCls} />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium bg-[#C4784A] text-white hover:bg-[#B36840] transition-colors">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-[#7A6155] hover:text-[#2C1A0E] transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {ideas.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['all', 'todo', 'done'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${filter === f ? 'bg-[#C4784A] text-white' : 'bg-[#F5EFE8] text-[#7A6155] hover:bg-[#EDD9C8]'}`}>
              {f === 'all' ? 'All' : f === 'todo' ? 'Ideas' : 'Done'}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && ideas.length === 0 && (
          <div className="text-center py-16 text-[#AE9B8E]">
            <p className="text-4xl mb-3">💝</p>
            <p className="text-sm">no date ideas yet — get creative!</p>
          </div>
        )}
        {filtered.map(idea => (
          <div key={idea.id} className={`rounded-2xl border border-[#E8DDD4] bg-white p-4 flex flex-col gap-2 group ${idea.done ? 'opacity-60' : ''}`} style={{ boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}>
            <div className="flex items-start gap-3">
              <button onClick={() => toggleDone(idea.id)} className="shrink-0 mt-0.5">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${idea.done ? 'border-[#C4784A] bg-[#C4784A]' : 'border-[#E8DDD4] hover:border-[#C4784A]/50'}`}>
                  {idea.done && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                </div>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-sm font-medium ${idea.done ? 'line-through text-[#AE9B8E]' : 'text-[#2C1A0E]'}`}>{idea.title}</span>
                  <span className="text-xs text-[#AE9B8E]">{categories[idea.category].emoji} {categories[idea.category].label}</span>
                </div>
                {idea.notes && <p className="text-xs text-[#7A6155] mt-0.5">{idea.notes}</p>}
                {idea.done && <div className="mt-2"><Stars rating={idea.rating} onRate={r => rate(idea.id, r)} /></div>}
              </div>
              <button onClick={() => remove(idea.id)} className="opacity-0 group-hover:opacity-100 text-[#AE9B8E] hover:text-[#C4784A] text-xs transition-all shrink-0">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

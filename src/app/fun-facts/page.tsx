'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Fact = { id: string; text: string; about: 'teo' | 'noelle' | 'us' }

const sections = [
  { key: 'teo' as const,    title: 'Teo',         emoji: '🐻' },
  { key: 'noelle' as const, title: 'Noelle',       emoji: '🌸' },
  { key: 'us' as const,     title: 'Us Together',  emoji: '💕' },
]

function FactSection({ title, emoji, about, facts, onAdd, onDelete }: {
  title: string; emoji: string; about: 'teo' | 'noelle' | 'us'
  facts: Fact[]
  onAdd: (text: string, about: 'teo' | 'noelle' | 'us') => void
  onDelete: (id: string) => void
}) {
  const [input, setInput] = useState('')
  const filtered = facts.filter(f => f.about === about)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    onAdd(input.trim(), about)
    setInput('')
  }

  return (
    <div className="rounded-2xl border border-[#E8DDD4] bg-white p-5 flex flex-col gap-3" style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}>
      <h2 className="text-sm font-medium text-[#2C1A0E] tracking-wide">{emoji} {title}</h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="add a fun fact..."
          className="flex-1 px-3 py-2 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none bg-[#F5EFE8] border border-[#E8DDD4] focus:border-[#C4784A]/40 transition-colors"
        />
        <button type="submit" className="px-3 py-2 rounded-xl text-sm font-medium bg-[#C4784A] text-white hover:bg-[#B36840] transition-colors">+</button>
      </form>
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && <p className="text-[#AE9B8E] text-xs text-center py-3">no facts yet</p>}
        {filtered.map(fact => (
          <div key={fact.id} className="flex items-start gap-2 p-2 rounded-lg group">
            <span className="text-[#C4784A]/40 text-xs mt-1 shrink-0">✦</span>
            <p className="flex-1 text-sm text-[#2C1A0E] leading-relaxed">{fact.text}</p>
            <button onClick={() => onDelete(fact.id)} className="opacity-0 group-hover:opacity-100 text-[#AE9B8E] hover:text-[#C4784A] text-xs transition-all shrink-0 mt-0.5">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FunFactsPage() {
  const [facts, setFacts, hydrated] = useLocalStorage<Fact[]>('tno-facts', [])

  function addFact(text: string, about: 'teo' | 'noelle' | 'us') {
    setFacts(prev => [...prev, { id: crypto.randomUUID(), text, about }])
  }
  function deleteFact(id: string) {
    setFacts(prev => prev.filter(f => f.id !== id))
  }

  if (!hydrated) return null

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/70 mb-1">about us</p>
        <h1 className="text-3xl font-semibold text-[#2C1A0E]">Fun Facts</h1>
        <p className="text-[#7A6155] mt-1 text-sm">little things that make us, us</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => (
          <FactSection key={s.key} title={s.title} emoji={s.emoji} about={s.key} facts={facts} onAdd={addFact} onDelete={deleteFact} />
        ))}
      </div>
    </div>
  )
}

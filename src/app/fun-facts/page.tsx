'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Fact = { id: string; text: string; about: 'teo' | 'noelle' | 'us' }

const sections = [
  { key: 'teo' as const,    title: 'Teo',          emoji: '🐻' },
  { key: 'noelle' as const, title: 'Noelle',        emoji: '🌸' },
  { key: 'us' as const,     title: 'Us Together',   emoji: '💕' },
]

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }

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
    <div className="rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-3" style={card}>
      <h2 className="text-sm font-medium text-white/80 tracking-wide">{emoji} {title}</h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="add a fun fact..."
          className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button type="submit" className="px-3 py-2 rounded-xl text-sm font-medium" style={{ background: '#c8a97e', color: '#080d1a' }}>+</button>
      </form>
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && <p className="text-white/20 text-xs text-center py-3">no facts yet</p>}
        {filtered.map(fact => (
          <div key={fact.id} className="flex items-start gap-2 p-2 rounded-lg group">
            <span className="text-[#c8a97e]/40 text-xs mt-1 shrink-0">✦</span>
            <p className="flex-1 text-sm text-white/60 leading-relaxed">{fact.text}</p>
            <button onClick={() => onDelete(fact.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 text-xs transition-all shrink-0 mt-0.5">✕</button>
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
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 mb-1">about us</p>
        <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Fun Facts</h1>
        <p className="text-white/35 mt-1 text-sm">little things that make us, us</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => (
          <FactSection key={s.key} title={s.title} emoji={s.emoji} about={s.key} facts={facts} onAdd={addFact} onDelete={deleteFact} />
        ))}
      </div>
    </div>
  )
}

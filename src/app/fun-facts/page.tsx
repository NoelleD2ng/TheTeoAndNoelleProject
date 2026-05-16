'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Fact = {
  id: string
  text: string
  about: 'teo' | 'noelle' | 'us'
}

const sections = [
  { key: 'teo' as const, title: 'Teo', emoji: '🐻' },
  { key: 'noelle' as const, title: 'Noelle', emoji: '🌸' },
  { key: 'us' as const, title: 'Us Together', emoji: '💕' },
]

function FactSection({
  title,
  emoji,
  about,
  facts,
  onAdd,
  onDelete,
}: {
  title: string
  emoji: string
  about: 'teo' | 'noelle' | 'us'
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
    <div className="bg-white rounded-2xl border border-rose-100 p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-stone-700">
        {emoji} {title}
      </h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="add a fun fact..."
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
        <button
          type="submit"
          className="bg-rose-400 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-sm transition-colors"
        >
          +
        </button>
      </form>
      <div className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <p className="text-stone-300 text-sm text-center py-3">no facts yet</p>
        )}
        {filtered.map(fact => (
          <div
            key={fact.id}
            className="flex items-start gap-2 p-2 rounded-lg group"
          >
            <span className="text-rose-300 text-xs mt-1 shrink-0">✦</span>
            <p className="flex-1 text-sm text-stone-600 leading-relaxed">{fact.text}</p>
            <button
              onClick={() => onDelete(fact.id)}
              className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all shrink-0 mt-0.5"
            >
              ✕
            </button>
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
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-800">Fun Facts ✨</h1>
        <p className="text-stone-400 mt-1 text-sm">little things that make us, us</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map(s => (
          <FactSection
            key={s.key}
            title={s.title}
            emoji={s.emoji}
            about={s.key}
            facts={facts}
            onAdd={addFact}
            onDelete={deleteFact}
          />
        ))}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type DateIdea = {
  id: string
  title: string
  category: 'outdoor' | 'indoor' | 'food' | 'travel' | 'fun' | 'creative'
  done: boolean
  rating: number
  notes: string
}

const categories = {
  outdoor: { label: 'Outdoor', emoji: '🌿' },
  indoor: { label: 'Cozy', emoji: '🏠' },
  food: { label: 'Food & Drinks', emoji: '🍽️' },
  travel: { label: 'Travel', emoji: '✈️' },
  fun: { label: 'Fun & Games', emoji: '🎲' },
  creative: { label: 'Creative', emoji: '🎨' },
} as const

type Category = keyof typeof categories

function Stars({ rating, onRate }: { rating: number; onRate: (n: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onRate(n)}
          className={`text-base transition-colors ${n <= rating ? 'text-rose-400' : 'text-stone-200 hover:text-rose-200'}`}
        >
          ♥
        </button>
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
    setIdeas(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        category,
        done: false,
        rating: 0,
        notes: notes.trim(),
      },
    ])
    setTitle('')
    setNotes('')
    setShowForm(false)
  }

  function toggleDone(id: string) {
    setIdeas(prev => prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)))
  }

  function rate(id: string, rating: number) {
    setIdeas(prev => prev.map(i => (i.id === id ? { ...i, rating } : i)))
  }

  function remove(id: string) {
    setIdeas(prev => prev.filter(i => i.id !== id))
  }

  const filtered = ideas.filter(i => {
    if (filter === 'todo') return !i.done
    if (filter === 'done') return i.done
    return true
  })

  if (!hydrated) return null

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">Date Ideas 💝</h1>
          <p className="text-stone-400 mt-1 text-sm">
            {ideas.filter(i => i.done).length} dates done • {ideas.filter(i => !i.done).length} ideas left
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Add Idea
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addIdea}
          className="bg-white rounded-2xl border border-rose-100 p-5 mb-5 flex flex-col gap-3"
        >
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Date idea... *"
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            required
          />
          <div className="flex gap-2 flex-wrap">
            {(Object.keys(categories) as Category[]).map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  category === cat
                    ? 'bg-rose-400 text-white'
                    : 'bg-rose-50 text-stone-500 hover:bg-rose-100'
                }`}
              >
                {categories[cat].emoji} {categories[cat].label}
              </button>
            ))}
          </div>
          <input
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes or ideas for the date..."
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm text-stone-400 hover:text-stone-600"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {ideas.length > 0 && (
        <div className="flex gap-2 mb-4">
          {(['all', 'todo', 'done'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === f ? 'bg-rose-400 text-white' : 'text-stone-400 hover:text-rose-400'
              }`}
            >
              {f === 'all' ? 'All' : f === 'todo' ? 'Ideas' : 'Done'}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {filtered.length === 0 && ideas.length === 0 && (
          <div className="text-center py-12 text-stone-300">
            <p className="text-4xl mb-3">💝</p>
            <p className="text-sm">no date ideas yet — get creative!</p>
          </div>
        )}
        {filtered.map(idea => (
          <div
            key={idea.id}
            className={`bg-white rounded-2xl border border-rose-100 p-4 flex flex-col gap-2 group ${idea.done ? 'opacity-75' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button onClick={() => toggleDone(idea.id)} className="shrink-0 mt-0.5">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                    idea.done
                      ? 'bg-rose-400 border-rose-400'
                      : 'border-stone-300 hover:border-rose-300'
                  }`}
                >
                  {idea.done && <span className="text-white text-xs leading-none">✓</span>}
                </div>
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-sm font-medium ${idea.done ? 'line-through text-stone-400' : 'text-stone-700'}`}
                  >
                    {idea.title}
                  </span>
                  <span className="text-xs text-stone-300">
                    {categories[idea.category].emoji} {categories[idea.category].label}
                  </span>
                </div>
                {idea.notes && <p className="text-xs text-stone-400 mt-0.5">{idea.notes}</p>}
                {idea.done && (
                  <div className="mt-2">
                    <Stars rating={idea.rating} onRate={r => rate(idea.id, r)} />
                  </div>
                )}
              </div>
              <button
                onClick={() => remove(idea.id)}
                className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

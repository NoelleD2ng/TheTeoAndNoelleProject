'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type BucketItem = {
  id: string
  text: string
  done: boolean
  category: 'travel' | 'experience' | 'food' | 'adventure' | 'learn' | 'other'
}

const categories = {
  travel: { label: 'Travel', emoji: '✈️' },
  experience: { label: 'Experience', emoji: '🎉' },
  food: { label: 'Food', emoji: '🍜' },
  adventure: { label: 'Adventure', emoji: '🧗' },
  learn: { label: 'Learn', emoji: '📚' },
  other: { label: 'Other', emoji: '⭐' },
} as const

type Category = keyof typeof categories

export default function BucketListPage() {
  const [items, setItems, hydrated] = useLocalStorage<BucketItem[]>('tno-bucket', [])
  const [text, setText] = useState('')
  const [category, setCategory] = useState<Category>('experience')

  function addItem(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setItems(prev => [
      ...prev,
      { id: crypto.randomUUID(), text: text.trim(), done: false, category },
    ])
    setText('')
  }

  function toggle(id: string) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)))
  }

  function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const remaining = items.filter(i => !i.done).length

  if (!hydrated) return null

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-800">Bucket List 🌟</h1>
        <p className="text-stone-400 mt-1 text-sm">
          {items.length === 0
            ? 'all the things we want to do together'
            : `${items.filter(i => i.done).length} of ${items.length} done`}
        </p>
      </div>

      <form onSubmit={addItem} className="bg-white rounded-2xl border border-rose-100 p-4 mb-6 flex flex-col gap-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="add something to our bucket list..."
          className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
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
          <button
            type="submit"
            className="ml-auto bg-rose-400 hover:bg-rose-500 text-white px-4 py-1 rounded-full text-sm transition-colors"
          >
            Add
          </button>
        </div>
      </form>

      {remaining > 0 && (
        <div className="mb-4">
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Still to do</h2>
          <div className="flex flex-col gap-2">
            {items
              .filter(i => !i.done)
              .map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-rose-100 px-4 py-3 flex items-center gap-3 group"
                >
                  <button onClick={() => toggle(item.id)}>
                    <div className="w-5 h-5 rounded-full border-2 border-stone-300 hover:border-rose-400 transition-colors" />
                  </button>
                  <span className="text-lg">{categories[item.category].emoji}</span>
                  <span className="flex-1 text-sm text-stone-700">{item.text}</span>
                  <button
                    onClick={() => remove(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {items.some(i => i.done) && (
        <div>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-2">Done 🎉</h2>
          <div className="flex flex-col gap-2">
            {items
              .filter(i => i.done)
              .map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-rose-100 px-4 py-3 flex items-center gap-3 opacity-60 group"
                >
                  <button onClick={() => toggle(item.id)}>
                    <div className="w-5 h-5 rounded-full bg-rose-400 border-2 border-rose-400 flex items-center justify-center">
                      <span className="text-white text-xs leading-none">✓</span>
                    </div>
                  </button>
                  <span className="text-lg">{categories[item.category].emoji}</span>
                  <span className="flex-1 text-sm text-stone-500 line-through">{item.text}</span>
                  <button
                    onClick={() => remove(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="text-center py-12 text-stone-300">
          <p className="text-4xl mb-3">🌟</p>
          <p className="text-sm">your bucket list is empty — dream big!</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Plan = {
  id: string
  title: string
  date: string
  description: string
  done: boolean
}

export default function PlansPage() {
  const [plans, setPlans, hydrated] = useLocalStorage<Plan[]>('tno-plans', [])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  function addPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setPlans(prev => [
      ...prev,
      { id: crypto.randomUUID(), title: title.trim(), date, description: description.trim(), done: false },
    ])
    setTitle('')
    setDate('')
    setDescription('')
    setShowForm(false)
  }

  function toggle(id: string) {
    setPlans(prev => prev.map(p => (p.id === id ? { ...p, done: !p.done } : p)))
  }

  function remove(id: string) {
    setPlans(prev => prev.filter(p => p.id !== id))
  }

  const upcoming = plans
    .filter(p => !p.done)
    .sort((a, b) => (a.date > b.date ? 1 : -1))
  const past = plans.filter(p => p.done)

  if (!hydrated) return null

  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">Plans 📅</h1>
          <p className="text-stone-400 mt-1 text-sm">things we're looking forward to</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Add Plan
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addPlan}
          className="bg-white rounded-2xl border border-rose-100 p-5 mb-6 flex flex-col gap-3"
        >
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="What are we planning? *"
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
            required
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Details, notes, ideas..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none"
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
              className="px-4 py-2 rounded-xl text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Upcoming</h2>
          <div className="flex flex-col gap-3">
            {upcoming.map(plan => (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-rose-100 p-4 flex gap-4 group"
              >
                {plan.date && (
                  <div className="text-center shrink-0 bg-rose-50 rounded-xl px-3 py-2 self-start">
                    <p className="text-xs text-rose-400 font-medium">
                      {new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-bold text-rose-500 leading-none">
                      {new Date(plan.date + 'T00:00:00').getDate()}
                    </p>
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-stone-700">{plan.title}</p>
                  {plan.description && (
                    <p className="text-sm text-stone-400 mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => remove(plan.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all"
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => toggle(plan.id)}
                    className="text-xs text-stone-300 hover:text-rose-400 transition-colors"
                  >
                    mark done
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Done 🎉</h2>
          <div className="flex flex-col gap-2">
            {past.map(plan => (
              <div
                key={plan.id}
                className="bg-white rounded-xl border border-rose-100 px-4 py-3 flex items-center gap-3 opacity-60 group"
              >
                <span className="text-rose-300 text-sm">✓</span>
                <span className="flex-1 text-sm text-stone-500 line-through">{plan.title}</span>
                <button
                  onClick={() => remove(plan.id)}
                  className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <div className="text-center py-12 text-stone-300">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">no plans yet — add something to look forward to!</p>
        </div>
      )}
    </div>
  )
}

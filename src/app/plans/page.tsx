'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Plan = { id: string; title: string; date: string; description: string; done: boolean }

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }
const border = 'border border-white/[0.08]'

export default function PlansPage() {
  const [plans, setPlans, hydrated] = useLocalStorage<Plan[]>('tno-plans', [])
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  function addPlan(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setPlans(prev => [...prev, { id: crypto.randomUUID(), title: title.trim(), date, description: description.trim(), done: false }])
    setTitle(''); setDate(''); setDescription(''); setShowForm(false)
  }
  function toggle(id: string) { setPlans(prev => prev.map(p => p.id === id ? { ...p, done: !p.done } : p)) }
  function remove(id: string) { setPlans(prev => prev.filter(p => p.id !== id)) }

  const upcoming = plans.filter(p => !p.done).sort((a, b) => a.date > b.date ? 1 : -1)
  const past = plans.filter(p => p.done)

  if (!hydrated) return null

  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/45 focus:outline-none transition-all'
  const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }

  return (
    <div className="pt-20 p-6 md:p-10 max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 mb-1">upcoming</p>
          <h1 className="text-3xl font-bold text-white" >Plans</h1>
          <p className="text-white/60 mt-1 text-sm">things we're looking forward to</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#c8a97e', color: '#080d1a' }}>+ Add</button>
      </div>

      {showForm && (
        <form onSubmit={addPlan} className={`${border} rounded-2xl p-5 mb-6 flex flex-col gap-3`} style={card}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="What are we planning? *" className={inputCls} style={inputStyle} required />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputCls} style={inputStyle} />
          <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Details, notes, ideas..." rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#c8a97e', color: '#080d1a' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white/80 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {upcoming.length > 0 && (
        <div className="mb-6">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">Upcoming</p>
          <div className="flex flex-col gap-3">
            {upcoming.map(plan => (
              <div key={plan.id} className={`${border} rounded-2xl p-4 flex gap-4 group`} style={card}>
                {plan.date && (
                  <div className="text-center shrink-0 rounded-xl px-3 py-2 self-start" style={{ background: 'rgba(200,169,126,0.1)' }}>
                    <p className="text-[10px] text-[#c8a97e]/70 font-medium">{new Date(plan.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}</p>
                    <p className="text-xl font-semibold text-[#c8a97e] leading-none">{new Date(plan.date + 'T00:00:00').getDate()}</p>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-white/95">{plan.title}</p>
                  {plan.description && <p className="text-xs text-white/60 mt-1">{plan.description}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => remove(plan.id)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/75 text-xs transition-all">✕</button>
                  <button onClick={() => toggle(plan.id)} className="text-xs text-white/40 hover:text-[#c8a97e]/60 transition-colors">done ✓</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/45 mb-3">Done</p>
          <div className="flex flex-col gap-2">
            {past.map(plan => (
              <div key={plan.id} className={`${border} rounded-xl px-4 py-3 flex items-center gap-3 opacity-40 group`} style={card}>
                <span className="text-[#c8a97e] text-xs">✓</span>
                <span className="flex-1 text-sm text-white/75 line-through">{plan.title}</span>
                <button onClick={() => remove(plan.id)} className="opacity-0 group-hover:opacity-100 text-white/40 hover:text-white/75 text-xs transition-all">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {plans.length === 0 && (
        <div className="text-center py-16 text-white/40">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-sm">no plans yet — add something to look forward to</p>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Task = {
  id: string
  text: string
  done: boolean
  owner: 'teo' | 'noelle' | 'both'
}

function TaskList({
  title, emoji, owner, tasks, onAdd, onToggle, onDelete,
}: {
  title: string; emoji: string; owner: 'teo' | 'noelle' | 'both'
  tasks: Task[]
  onAdd: (text: string, owner: 'teo' | 'noelle' | 'both') => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const [input, setInput] = useState('')
  const filtered = tasks.filter(t => t.owner === owner)

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    onAdd(input.trim(), owner)
    setInput('')
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] p-5 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }}>
      <h2 className="text-sm font-medium text-white/80 tracking-wide">{emoji} {title}</h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="add a task..."
          className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
        />
        <button type="submit" className="px-3 py-2 rounded-xl text-sm font-medium transition-colors" style={{ background: '#c8a97e', color: '#080d1a' }}>+</button>
      </form>
      <div className="flex flex-col gap-1">
        {filtered.length === 0 && <p className="text-white/20 text-xs text-center py-4">no tasks yet</p>}
        {filtered.map(task => (
          <div key={task.id} className={`flex items-center gap-2.5 p-2 rounded-lg group ${task.done ? 'opacity-40' : ''}`}>
            <button onClick={() => onToggle(task.id)} className="shrink-0">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${task.done ? 'border-[#c8a97e]' : 'border-white/20 hover:border-[#c8a97e]/50'}`} style={task.done ? { background: '#c8a97e' } : {}}>
                {task.done && <span className="text-[#080d1a] text-[9px] leading-none font-bold">✓</span>}
              </div>
            </button>
            <span className={`flex-1 text-sm ${task.done ? 'line-through text-white/30' : 'text-white/70'}`}>{task.text}</span>
            <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 text-xs transition-all">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TodosPage() {
  const [tasks, setTasks, hydrated] = useLocalStorage<Task[]>('tno-tasks', [])

  function addTask(text: string, owner: 'teo' | 'noelle' | 'both') {
    setTasks(prev => [...prev, { id: crypto.randomUUID(), text, done: false, owner }])
  }
  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }
  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  if (!hydrated) return null

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 mb-1">shared</p>
        <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'var(--font-playfair)' }}>To-Do Lists</h1>
        <p className="text-white/35 mt-1 text-sm">things we want to get done</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TaskList title="Teo's Tasks" emoji="🐻" owner="teo" tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
        <TaskList title="Noelle's Tasks" emoji="🌸" owner="noelle" tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
        <TaskList title="Our Tasks" emoji="💕" owner="both" tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { supabase, type Todo } from '@/lib/supabase'

type Owner = 'teo' | 'noelle' | 'both'

function TaskList({
  title, emoji, owner, tasks, onAdd, onToggle, onDelete,
}: {
  title: string
  emoji: string
  owner: Owner
  tasks: Todo[]
  onAdd: (text: string, owner: Owner) => void
  onToggle: (id: string, done: boolean) => void
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
    <div className="rounded-2xl border border-[#E8DDD4] bg-white p-5 flex flex-col gap-3" style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}>
      <h2 className="text-sm font-medium text-[#2C1A0E] tracking-wide">{emoji} {title}</h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="add a task..."
          className="flex-1 px-3 py-2 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none bg-[#F5EFE8] border border-[#E8DDD4] focus:border-[#C4784A]/40 transition-colors"
        />
        <button type="submit" className="px-3 py-2 rounded-xl text-sm font-medium bg-[#C4784A] text-white hover:bg-[#B36840] transition-colors">+</button>
      </form>
      <div className="flex flex-col gap-1">
        {filtered.length === 0 && <p className="text-[#AE9B8E] text-xs text-center py-4">no tasks yet</p>}
        {filtered.map(task => (
          <div key={task.id} className={`flex items-center gap-2.5 p-2 rounded-lg group ${task.done ? 'opacity-50' : ''}`}>
            <button onClick={() => onToggle(task.id, task.done)} className="shrink-0">
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${task.done ? 'border-[#C4784A] bg-[#C4784A]' : 'border-[#E8DDD4] hover:border-[#C4784A]/50'}`}>
                {task.done && <span className="text-white text-[9px] leading-none font-bold">✓</span>}
              </div>
            </button>
            <span className={`flex-1 text-sm ${task.done ? 'line-through text-[#AE9B8E]' : 'text-[#2C1A0E]'}`}>{task.text}</span>
            <button onClick={() => onDelete(task.id)} className="opacity-0 group-hover:opacity-100 text-[#AE9B8E] hover:text-[#C4784A] text-xs transition-all">✕</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TodosPage() {
  const [tasks, setTasks] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setTasks(data ?? [])
        setLoading(false)
      })
  }, [])

  async function addTask(text: string, owner: Owner) {
    const { data } = await supabase
      .from('todos')
      .insert({ text, done: false, owner })
      .select()
      .single()
    if (data) setTasks(prev => [...prev, data])
  }

  async function toggleTask(id: string, done: boolean) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !done } : t))
    await supabase.from('todos').update({ done: !done }).eq('id', id)
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    await supabase.from('todos').delete().eq('id', id)
  }

  if (loading) return null

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/70 mb-1">shared</p>
        <h1 className="text-3xl font-semibold text-[#2C1A0E]">To-Do Lists</h1>
        <p className="text-[#7A6155] mt-1 text-sm">things we want to get done</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TaskList title="Teo's Tasks" emoji="🐻" owner="teo" tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
        <TaskList title="Noelle's Tasks" emoji="🌸" owner="noelle" tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
        <TaskList title="Our Tasks" emoji="💕" owner="both" tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
      </div>
    </div>
  )
}

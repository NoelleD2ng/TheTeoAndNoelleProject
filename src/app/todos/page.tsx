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
  title,
  emoji,
  owner,
  tasks,
  onAdd,
  onToggle,
  onDelete,
}: {
  title: string
  emoji: string
  owner: 'teo' | 'noelle' | 'both'
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
    <div className="bg-white rounded-2xl border border-rose-100 p-5 flex flex-col gap-3">
      <h2 className="font-semibold text-stone-700">
        {emoji} {title}
      </h2>
      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="add a task..."
          className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
        />
        <button
          type="submit"
          className="bg-rose-400 hover:bg-rose-500 text-white px-3 py-2 rounded-xl text-sm transition-colors"
        >
          +
        </button>
      </form>

      <div className="flex flex-col gap-1">
        {filtered.length === 0 && (
          <p className="text-stone-300 text-sm text-center py-4">no tasks yet</p>
        )}
        {filtered.map(task => (
          <div
            key={task.id}
            className={`flex items-center gap-2.5 p-2 rounded-lg group ${task.done ? 'opacity-50' : ''}`}
          >
            <button onClick={() => onToggle(task.id)} className="shrink-0">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  task.done
                    ? 'bg-rose-400 border-rose-400'
                    : 'border-stone-300 hover:border-rose-300'
                }`}
              >
                {task.done && <span className="text-white text-xs leading-none">✓</span>}
              </div>
            </button>
            <span
              className={`flex-1 text-sm ${task.done ? 'line-through text-stone-400' : 'text-stone-700'}`}
            >
              {task.text}
            </span>
            <button
              onClick={() => onDelete(task.id)}
              className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TodosPage() {
  const [tasks, setTasks, hydrated] = useLocalStorage<Task[]>('tno-tasks', [])

  function addTask(text: string, owner: 'teo' | 'noelle' | 'both') {
    setTasks(prev => [
      ...prev,
      { id: crypto.randomUUID(), text, done: false, owner },
    ])
  }

  function toggleTask(id: string) {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  if (!hydrated) return null

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-800">To-Do Lists ✅</h1>
        <p className="text-stone-400 mt-1 text-sm">things we want to get done</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TaskList
          title="Teo's Tasks"
          emoji="🐻"
          owner="teo"
          tasks={tasks}
          onAdd={addTask}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
        <TaskList
          title="Noelle's Tasks"
          emoji="🌸"
          owner="noelle"
          tasks={tasks}
          onAdd={addTask}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
        <TaskList
          title="Our Tasks"
          emoji="💕"
          owner="both"
          tasks={tasks}
          onAdd={addTask}
          onToggle={toggleTask}
          onDelete={deleteTask}
        />
      </div>
    </div>
  )
}

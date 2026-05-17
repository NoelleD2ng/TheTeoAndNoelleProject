'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type JournalEntry } from '@/lib/supabase'

type Tab = 'journal' | 'love-note'

const MOODS = ['✨', '🥰', '😊', '😌', '🤔', '😔', '😤', '🥺']

const glass = { background: 'rgba(250,248,245,0.97)', backdropFilter: 'blur(16px)' }
const serifFont = { fontFamily: 'Georgia, "Times New Roman", serif' }

function formatLong(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('journal')
  const [selected, setSelected] = useState<JournalEntry | null>(null)
  const [composing, setComposing] = useState(false)

  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newMood, setNewMood] = useState('')
  const [saving, setSaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filtered = entries.filter(e => e.type === tab)

  useEffect(() => {
    supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [])

  useEffect(() => {
    if (composing) textareaRef.current?.focus()
  }, [composing])

  function startCompose() {
    setSelected(null)
    setNewTitle('')
    setNewContent('')
    setNewMood('')
    setComposing(true)
  }

  function switchTab(t: Tab) {
    setTab(t)
    setSelected(null)
    setComposing(false)
  }

  async function save() {
    if (!newContent.trim() || saving) return
    setSaving(true)
    const { data } = await supabase.from('journal_entries').insert({
      type: tab,
      title: newTitle.trim() || null,
      content: newContent.trim(),
      mood: newMood || null,
    }).select().single()
    if (data) {
      setEntries(prev => [data, ...prev])
      setSelected(data)
    }
    setComposing(false)
    setSaving(false)
  }

  async function deleteEntry(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id)
    setEntries(prev => prev.filter(e => e.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ paddingTop: 64 }}>

      {/* Header */}
      <div className="shrink-0 px-6 py-3 flex items-center gap-5" style={{ ...glass, borderBottom: '1px solid #E8DDD4', position: 'relative', zIndex: 10 }}>
        <div className="shrink-0">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/60 leading-none">our little world</p>
          <h1 className="text-lg font-bold text-[#2C1A0E] leading-tight">Journal</h1>
        </div>

        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5EFE8', border: '1px solid #E8DDD4' }}>
          {([
            { value: 'journal' as Tab, label: '✍ My Journal' },
            { value: 'love-note' as Tab, label: '♥ Love Notes' },
          ]).map(t => (
            <button
              key={t.value}
              onClick={() => switchTab(t.value)}
              className="px-4 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: tab === t.value ? '#fff' : 'transparent',
                color: tab === t.value ? '#C4784A' : '#7A6155',
                boxShadow: tab === t.value ? '0 1px 4px rgba(44,26,14,0.1)' : 'none',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <button
          onClick={startCompose}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
          style={{ background: '#C4784A', color: '#fff' }}
        >
          + {tab === 'journal' ? 'New Entry' : 'New Note'}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="w-72 shrink-0 overflow-y-auto" style={{ background: '#FAF8F5', borderRight: '1px solid #E8DDD4' }}>
          {loading ? (
            <div className="text-center py-10 text-[#AE9B8E] text-xs">loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-6">
              <p className="text-5xl mb-4" style={{ opacity: 0.3 }}>{tab === 'journal' ? '📖' : '💌'}</p>
              <p className="text-xs text-[#7A6155]/35 leading-relaxed">
                {tab === 'journal'
                  ? 'Your first entry is waiting to be written.'
                  : 'Write Teo a love note — he\'ll love it.'}
              </p>
              <button
                onClick={startCompose}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:scale-105"
                style={{ background: '#FDF0E8', color: '#C4784A', border: '1px dashed rgba(196,120,74,0.4)' }}
              >
                Write one now →
              </button>
            </div>
          ) : (
            <div className="p-2 flex flex-col gap-1">
              {filtered.map(entry => (
                <button
                  key={entry.id}
                  onClick={() => { setSelected(entry); setComposing(false) }}
                  className="w-full text-left px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: selected?.id === entry.id ? '#FDF0E8' : '#fff',
                    border: `1px solid ${selected?.id === entry.id ? '#E8C9B0' : '#E8DDD4'}`,
                  }}
                >
                  <div className="flex items-start gap-2">
                    {entry.mood && <span className="text-base shrink-0 mt-0.5 leading-none">{entry.mood}</span>}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#2C1A0E] truncate">
                        {entry.title ?? (tab === 'love-note' ? 'Love note' : 'Untitled')}
                      </p>
                      <p className="text-[10px] text-[#7A6155]/40 mt-0.5">{formatShort(entry.created_at)}</p>
                      <p className="text-xs text-[#7A6155]/50 mt-1 leading-relaxed" style={{
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                      }}>
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Main writing / reading area */}
        <div className="flex-1 overflow-y-auto" style={{ background: '#FDFBF9' }}>

          {composing && (
            <div className="max-w-2xl mx-auto px-10 py-12">
              <p className="text-[10px] tracking-[0.35em] uppercase text-[#C4784A]/45 mb-8">
                {tab === 'journal' ? 'New journal entry' : 'New love note for Teo'}
              </p>

              {tab === 'journal' && (
                <div className="flex gap-3 mb-8 flex-wrap">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setNewMood(newMood === m ? '' : m)}
                      className="text-xl transition-all hover:scale-125 active:scale-110"
                      style={{ opacity: newMood && newMood !== m ? 0.25 : 1 }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}

              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={tab === 'journal' ? 'Title (optional)...' : 'A little title for Teo...'}
                className="w-full bg-transparent border-none outline-none placeholder:text-[#AE9B8E]/40 mb-6 text-2xl font-bold text-[#2C1A0E]"
                style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}
              />

              <div className="text-xs text-[#7A6155]/35 mb-6 tracking-wider">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>

              <textarea
                ref={textareaRef}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder={tab === 'journal' ? "What's on your mind today..." : "Dear Teo,\n\n..."}
                rows={20}
                className="w-full bg-transparent border-none outline-none resize-none text-[#2C1A0E]/80 leading-loose text-base placeholder:text-[#AE9B8E]/35"
                style={serifFont}
              />

              <div className="flex gap-3 mt-8 pt-6" style={{ borderTop: '1px solid #E8DDD4' }}>
                <button
                  onClick={save}
                  disabled={!newContent.trim() || saving}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                  style={{ background: '#C4784A', color: '#fff' }}
                >
                  {saving ? 'Saving...' : tab === 'journal' ? 'Save entry' : 'Send with love ♥'}
                </button>
                <button
                  onClick={() => setComposing(false)}
                  className="px-4 py-2.5 rounded-xl text-sm text-[#7A6155]/40 hover:text-[#7A6155] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {!composing && selected && (
            <div className="max-w-2xl mx-auto px-10 py-12">
              <div className="flex items-start justify-between gap-6 mb-10">
                <div>
                  {selected.mood && (
                    <span className="text-3xl block mb-4">{selected.mood}</span>
                  )}
                  <p className="text-xs text-[#7A6155]/40 tracking-widest uppercase mb-3">
                    {formatLong(selected.created_at)}
                  </p>
                  {selected.title && (
                    <h2 className="text-3xl font-bold text-[#2C1A0E] leading-tight" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
                      {selected.title}
                    </h2>
                  )}
                </div>
                <button
                  onClick={() => deleteEntry(selected.id)}
                  className="shrink-0 text-xs px-3 py-1.5 rounded-lg transition-colors hover:text-red-400 mt-1"
                  style={{ color: 'rgba(248,113,113,0.45)', background: '#F5EFE8' }}
                >
                  Delete
                </button>
              </div>

              {selected.type === 'love-note' && (
                <div className="mb-8 px-5 py-3.5 rounded-2xl" style={{
                  background: 'linear-gradient(135deg, rgba(196,120,74,0.07), rgba(232,168,124,0.07))',
                  border: '1px solid rgba(196,120,74,0.18)',
                }}>
                  <p className="text-xs text-[#C4784A]/55 tracking-widest uppercase">A love note for Teo ♥</p>
                </div>
              )}

              <p className="text-[#2C1A0E]/72 leading-loose text-base whitespace-pre-wrap" style={serifFont}>
                {selected.content}
              </p>
            </div>
          )}

          {!composing && !selected && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-7xl mb-6" style={{ opacity: 0.1 }}>{tab === 'journal' ? '✍' : '♥'}</p>
                <p className="text-sm text-[#7A6155]/30 mb-1">
                  {tab === 'journal' ? 'Your thoughts, your space.' : 'Little notes, big love.'}
                </p>
                <p className="text-xs text-[#7A6155]/20">Select an entry or write a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type JournalEntry } from '@/lib/supabase'

const MOODS = ['✨', '🥰', '😊', '😌', '🤔', '😔', '😤', '🥺']
const serif = { fontFamily: 'Georgia, "Times New Roman", serif' }

function formatLong(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function formatYear(d: string) {
  return new Date(d).getFullYear()
}

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<JournalEntry | null>(null)
  const [composing, setComposing] = useState(false)

  const [newType, setNewType] = useState<'journal' | 'love-note'>('journal')
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newMood, setNewMood] = useState('')
  const [saving, setSaving] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setEntries(data ?? []); setLoading(false) })
  }, [])

  useEffect(() => {
    if (composing) setTimeout(() => textareaRef.current?.focus(), 80)
  }, [composing])

  function startCompose() {
    setSelected(null)
    setComposing(true)
    setNewType('journal')
    setNewTitle('')
    setNewContent('')
    setNewMood('')
  }

  async function save() {
    if (!newContent.trim() || saving) return
    setSaving(true)
    const { data } = await supabase.from('journal_entries').insert({
      type: newType,
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

  const isLove = (e: JournalEntry) => e.type === 'love-note'

  return (
    <>
      <style>{`
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .entry-in { animation: fade-up 0.45s cubic-bezier(0.34,1.56,0.64,1) both; }
        .compose-in { animation: fade-up 0.38s ease both; }
        .paper-bg {
          background:
            radial-gradient(ellipse at 20% 0%, rgba(196,120,74,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 80% 100%, rgba(196,120,74,0.04) 0%, transparent 60%),
            #FDFAF7;
        }
      `}</style>

      <div className="h-screen flex flex-col overflow-hidden" style={{ paddingTop: 64 }}>

        {/* Header */}
        <div
          className="shrink-0 px-8 py-4 flex items-center justify-between"
          style={{
            background: 'rgba(253,250,247,0.97)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid #EDE4DA',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div>
            <p className="text-[9px] tracking-[0.45em] uppercase text-[#C4784A]/50 leading-none mb-1">noelle & teo</p>
            <h1 className="text-xl font-bold text-[#2C1A0E]" style={serif}>Our Journal</h1>
          </div>

          <button
            onClick={startCompose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #C4784A 0%, #D4896A 100%)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(196,120,74,0.35)',
            }}
          >
            <span style={{ fontSize: 16 }}>✦</span> Write
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* ── Sidebar ── */}
          <div
            className="w-64 shrink-0 flex flex-col overflow-hidden"
            style={{ background: '#FAF7F4', borderRight: '1px solid #EDE4DA' }}
          >
            {/* Count pills */}
            {!loading && entries.length > 0 && (
              <div className="px-4 py-3 flex gap-2 shrink-0" style={{ borderBottom: '1px solid #EDE4DA' }}>
                <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: '#F5EFE8', color: '#7A6155' }}>
                  {entries.filter(e => e.type === 'journal').length} entries
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded-full" style={{ background: '#FDF0E8', color: '#C4784A' }}>
                  {entries.filter(e => e.type === 'love-note').length} love notes
                </span>
              </div>
            )}

            <div className="flex-1 overflow-y-auto py-2 px-2">
              {loading ? (
                <div className="text-center py-12 text-[#AE9B8E] text-xs">loading...</div>
              ) : entries.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <p className="text-4xl mb-3" style={{ opacity: 0.2 }}>✦</p>
                  <p className="text-xs text-[#7A6155]/35 leading-relaxed">Your story starts here.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {entries.map(entry => {
                    const love = isLove(entry)
                    const active = selected?.id === entry.id && !composing
                    return (
                      <button
                        key={entry.id}
                        onClick={() => { setSelected(entry); setComposing(false) }}
                        className="w-full text-left px-3 py-3 rounded-xl transition-all relative overflow-hidden"
                        style={{
                          background: active
                            ? (love ? '#FDF0E8' : '#F5EFE8')
                            : '#fff',
                          border: `1px solid ${active ? (love ? '#E8C9B0' : '#DDD0C4') : '#EDE4DA'}`,
                        }}
                      >
                        {/* left accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full"
                          style={{ background: love ? '#C4784A' : '#C8B5A8' }}
                        />
                        <div className="pl-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {love && <span className="text-[10px] text-[#C4784A]/70">♥</span>}
                            {entry.mood && <span className="text-xs leading-none">{entry.mood}</span>}
                            <span className="text-[10px] text-[#7A6155]/35 ml-auto">{formatShort(entry.created_at)}</span>
                          </div>
                          <p className="text-xs font-semibold text-[#2C1A0E] truncate">
                            {entry.title ?? (love ? 'Love note' : 'Journal entry')}
                          </p>
                          <p
                            className="text-[11px] text-[#7A6155]/50 mt-0.5 leading-relaxed"
                            style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                          >
                            {entry.content}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Main area ── */}
          <div className="flex-1 overflow-y-auto paper-bg">

            {/* ── Compose ── */}
            {composing && (
              <div className="max-w-xl mx-auto px-8 py-12 compose-in">

                {/* Type toggle */}
                <div className="flex gap-1 p-1 rounded-2xl mb-10 w-fit" style={{ background: '#F0E8E0', border: '1px solid #E0D4C8' }}>
                  {([
                    { v: 'journal' as const, label: '✍ Entry' },
                    { v: 'love-note' as const, label: '♥ Love Note' },
                  ]).map(({ v, label }) => (
                    <button
                      key={v}
                      onClick={() => setNewType(v)}
                      className="px-5 py-2 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: newType === v ? '#fff' : 'transparent',
                        color: newType === v ? '#C4784A' : '#7A6155',
                        boxShadow: newType === v ? '0 1px 6px rgba(44,26,14,0.1)' : 'none',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Mood */}
                <div className="flex gap-3 mb-8 flex-wrap">
                  {MOODS.map(m => (
                    <button
                      key={m}
                      onClick={() => setNewMood(newMood === m ? '' : m)}
                      className="text-xl transition-all hover:scale-125 active:scale-110"
                      style={{ opacity: newMood && newMood !== m ? 0.2 : 1 }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* Date */}
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#7A6155]/35 mb-5">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>

                {/* Title */}
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={newType === 'love-note' ? 'A little title for Teo...' : 'Title...'}
                  className="w-full bg-transparent border-none outline-none placeholder:text-[#C8B5A8]/60 mb-5 text-[1.6rem] font-bold text-[#2C1A0E]"
                  style={serif}
                />

                {newType === 'love-note' && (
                  <p className="text-sm text-[#C4784A]/40 mb-4 -mt-2" style={serif}>Dear Teo,</p>
                )}

                {/* Content */}
                <textarea
                  ref={textareaRef}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder={newType === 'love-note' ? 'Tell him something wonderful...' : "What's on your mind..."}
                  rows={18}
                  className="w-full bg-transparent border-none outline-none resize-none text-[#3A2214]/75 leading-[1.9] text-[0.95rem] placeholder:text-[#C8B5A8]/45"
                  style={serif}
                />

                <div
                  className="flex items-center gap-3 mt-8 pt-6"
                  style={{ borderTop: '1px solid #E8DDD4' }}
                >
                  <button
                    onClick={save}
                    disabled={!newContent.trim() || saving}
                    className="px-7 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                    style={{ background: '#C4784A', color: '#fff', boxShadow: '0 3px 12px rgba(196,120,74,0.3)' }}
                  >
                    {saving ? 'Saving...' : newType === 'love-note' ? 'Send with love ♥' : 'Save entry'}
                  </button>
                  <button
                    onClick={() => setComposing(false)}
                    className="px-4 py-2.5 text-sm text-[#7A6155]/40 hover:text-[#7A6155] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* ── Reading view ── */}
            {!composing && selected && (
              <div className="max-w-xl mx-auto px-8 py-12 entry-in">

                {/* Love note header decoration */}
                {isLove(selected) && (
                  <div
                    className="mb-10 px-6 py-5 rounded-3xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(196,120,74,0.07) 0%, rgba(232,168,124,0.07) 100%)',
                      border: '1px solid rgba(196,120,74,0.18)',
                    }}
                  >
                    <p className="text-xs tracking-[0.45em] uppercase text-[#C4784A]/55 mb-1">a love note for teo</p>
                    <p className="text-2xl text-[#C4784A]/25">♥</p>
                  </div>
                )}

                {/* Mood + date */}
                <div className="flex items-center gap-3 mb-6">
                  {selected.mood && <span className="text-2xl">{selected.mood}</span>}
                  <div>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-[#7A6155]/35">{formatLong(selected.created_at)}</p>
                    {!isLove(selected) && (
                      <p className="text-[9px] tracking-wider uppercase text-[#C4784A]/40 mt-0.5">journal entry</p>
                    )}
                  </div>
                  <button
                    onClick={() => deleteEntry(selected.id)}
                    className="ml-auto text-[11px] px-3 py-1.5 rounded-lg transition-colors hover:text-red-400"
                    style={{ color: 'rgba(248,113,113,0.4)', background: '#F5EFE8' }}
                  >
                    Delete
                  </button>
                </div>

                {/* Title */}
                {selected.title && (
                  <h2
                    className="text-[2rem] font-bold text-[#2C1A0E] leading-tight mb-8"
                    style={serif}
                  >
                    {selected.title}
                  </h2>
                )}

                {isLove(selected) && (
                  <p className="text-base text-[#C4784A]/50 mb-6" style={serif}>Dear Teo,</p>
                )}

                {/* Body */}
                <p
                  className="text-[#3A2214]/70 leading-[1.95] text-[0.95rem] whitespace-pre-wrap"
                  style={serif}
                >
                  {selected.content}
                </p>

                {isLove(selected) && (
                  <p className="text-base text-[#C4784A]/45 mt-8" style={serif}>With love, Noelle ♥</p>
                )}

                {/* Year stamp */}
                <p className="text-[10px] tracking-[0.4em] uppercase text-[#7A6155]/20 mt-14">
                  {formatYear(selected.created_at)}
                </p>
              </div>
            )}

            {/* ── Welcome letter ── */}
            {!composing && !selected && (
              <div className="max-w-xl mx-auto px-8 py-14 entry-in">

                <p className="text-[9px] tracking-[0.55em] uppercase text-[#C4784A]/40 mb-8">for teo, always</p>

                <h2 className="text-[1.9rem] font-bold text-[#2C1A0E] leading-snug mb-10" style={serif}>
                  When you need me,<br />read this.
                </h2>

                <div className="flex flex-col gap-6 text-[0.93rem] text-[#3A2214]/65 leading-[1.95]" style={serif}>
                  <p>
                    Before you read anything else in this journal, I want you to know why I'm making it.
                    I know there have been moments in our relationship where I've hurt your trust, made you overthink,
                    or made you feel smaller than you deserve to feel. I can't change the past, but I can choose how
                    I love you moving forward — intentionally, honestly, and consistently.
                  </p>

                  <p>That's why I'm making this for you.</p>

                  <p>
                    This isn't going to be a one-time thing that gets forgotten after a week. I want this to become
                    a routine for me. Something I continue adding to every day or every other day so there's something
                    new for you to come back to whenever you need it.
                  </p>

                  <p className="text-[#C4784A]/60 italic">I want these notes to grow with us.</p>

                  <div style={{ borderTop: '1px solid #E8DDD4', paddingTop: 24, marginTop: 4 }}>
                    <p>
                      I'm going to fill these notes with real moments, real memories, and real details from our
                      everyday life together — so it never feels generic or distant. I want you to be able to open
                      to any page and remember specific nights, conversations, jokes, dates, little moments, or
                      feelings we shared around the time I wrote it.
                    </p>
                  </div>

                  <p>
                    Maybe one page will be about how happy I felt after one of our late-night talks. Maybe another
                    will be about the way you held my hand in the car, or a small moment where you're holding my hand
                    and kiss it. Maybe another will be about a random moment that made me look at you and think,
                    <span className="text-[#2C1A0E]/80 italic"> "I love him so much, he's so silly and makes me genuinely happy."</span>
                  </p>

                  <div
                    className="px-6 py-6 rounded-2xl my-2"
                    style={{
                      background: 'linear-gradient(135deg, rgba(196,120,74,0.07) 0%, rgba(232,168,124,0.06) 100%)',
                      border: '1px solid rgba(196,120,74,0.15)',
                    }}
                  >
                    <p className="text-[#2C1A0E]/75">
                      And most importantly, I want this journal to remind you of something I never want you to forget:
                    </p>
                    <p className="text-[1.05rem] font-semibold text-[#C4784A] mt-3 mb-3">
                      You are deeply loved by me.
                    </p>
                    <p>
                      Not conditionally. Not temporarily. Not only during easy moments.
                      You are loved in the quiet days, the difficult days, the healing days,
                      and all the in-between moments too.
                    </p>
                  </div>

                  <p>
                    So whenever you feel insecure, overwhelmed, doubtful, or distant from me — I want you to come
                    back here and let these pages remind you how important you are to my heart.
                  </p>

                  <p className="text-[#C4784A]/55 mt-4">With all my love, Noelle ♥</p>
                </div>

                <div className="mt-16 flex items-center gap-3">
                  <div className="flex-1 h-px" style={{ background: '#E8DDD4' }} />
                  <span className="text-[#C4784A]/20 text-lg">♥</span>
                  <div className="flex-1 h-px" style={{ background: '#E8DDD4' }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

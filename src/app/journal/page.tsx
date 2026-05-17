'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type JournalEntry } from '@/lib/supabase'

const MOODS = ['✨', '🥰', '😊', '😌', '🤔', '😔', '😤', '🥺']
const serif = { fontFamily: 'Georgia, "Times New Roman", serif' }

const CARD_CONFIG = [
  { rot: -5,  anim: 'note-float-a', delay: 0   },
  { rot:  4,  anim: 'note-float-b', delay: 220  },
  { rot: -2,  anim: 'note-float-c', delay: 110  },
  { rot:  7,  anim: 'note-float-a', delay: 330  },
  { rot: -6,  anim: 'note-float-b', delay: 80   },
  { rot:  3,  anim: 'note-float-c', delay: 180  },
  { rot: -8,  anim: 'note-float-a', delay: 260  },
  { rot:  5,  anim: 'note-float-b', delay: 140  },
  { rot: -3,  anim: 'note-float-c', delay: 300  },
  { rot:  6,  anim: 'note-float-a', delay: 50   },
]

function formatLong(d: string) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  const [saveError, setSaveError] = useState<string | null>(null)
  const [newImages, setNewImages] = useState<string[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    supabase
      .from('journal_entries')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error) setEntries(data ?? [])
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    if (composing) setTimeout(() => textareaRef.current?.focus(), 80)
  }, [composing])

  function startCompose() {
    setComposing(true)
    setNewType('journal')
    setNewTitle('')
    setNewContent('')
    setNewMood('')
    setNewImages([])
    setSaveError(null)
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const imageItem = Array.from(e.clipboardData.items).find(i => i.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    const file = imageItem.getAsFile()
    if (!file) return
    setUploadingImage(true)
    const ext = file.type.split('/')[1] ?? 'png'
    const path = `journal/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('journal-images').upload(path, file, { contentType: file.type })
    if (error) { setSaveError('Image upload failed — make sure the journal-images storage bucket exists and is public.'); setUploadingImage(false); return }
    const { data: urlData } = supabase.storage.from('journal-images').getPublicUrl(path)
    setNewImages(prev => [...prev, urlData.publicUrl])
    setUploadingImage(false)
  }

  async function save() {
    if (!newContent.trim() || saving) return
    setSaving(true)
    setSaveError(null)
    const { data, error } = await supabase.from('journal_entries').insert({
      type: newType,
      title: newTitle.trim() || null,
      content: newContent.trim(),
      mood: newMood || null,
      images: newImages,
    }).select().single()
    if (error) {
      setSaveError('Could not save — make sure the journal_entries table exists in Supabase.')
      setSaving(false)
      return
    }
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
        @keyframes note-float-a {
          0%, 100% { transform: translateY(0px);   }
          50%       { transform: translateY(-9px);  }
        }
        @keyframes note-float-b {
          0%, 100% { transform: translateY(0px);   }
          35%       { transform: translateY(-7px);  }
          70%       { transform: translateY(-12px); }
        }
        @keyframes note-float-c {
          0%, 100% { transform: translateY(0px);   }
          25%       { transform: translateY(-11px); }
          75%       { transform: translateY(-5px);  }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.93) translateY(22px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .fade-in  { animation: fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .modal-in { animation: modal-in 0.38s cubic-bezier(0.34,1.56,0.64,1) both; }
        .paper-bg {
          background:
            radial-gradient(ellipse at 15% 10%, rgba(196,120,74,0.05) 0%, transparent 55%),
            radial-gradient(ellipse at 85% 90%, rgba(196,120,74,0.04) 0%, transparent 55%),
            #FDFAF7;
        }
        .entry-card {
          transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.25s ease;
          cursor: pointer;
        }
        .entry-card:hover {
          transform: rotate(0deg) scale(1.04) !important;
          box-shadow: 0 16px 48px rgba(44,26,14,0.18) !important;
          z-index: 10;
          position: relative;
        }
      `}</style>

      <div className="min-h-screen paper-bg" style={{ paddingTop: 64 }}>

        {/* ── Page header ── */}
        <div className="max-w-2xl mx-auto px-8 pt-14 pb-6 flex items-end justify-between">
          <div>
            <p className="text-[9px] tracking-[0.55em] uppercase text-[#C4784A]/40 mb-2">noelle & teo</p>
            <h1 className="text-3xl font-bold text-[#2C1A0E]" style={serif}>Our Journal</h1>
          </div>
          <button
            onClick={startCompose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold mb-1"
            style={{
              background: 'linear-gradient(135deg, #C4784A 0%, #D4896A 100%)',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(196,120,74,0.32)',
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span>✦</span> Write
          </button>
        </div>

        {/* ── Welcome letter ── */}
        <div className="max-w-2xl mx-auto px-8 pb-14 fade-in">
          <div
            className="rounded-3xl px-10 py-10"
            style={{
              background: '#fff',
              border: '1px solid #EDE4DA',
              boxShadow: '0 8px 40px rgba(44,26,14,0.07), 0 2px 8px rgba(44,26,14,0.04)',
            }}
          >
            <p className="text-[9px] tracking-[0.55em] uppercase text-[#C4784A]/40 mb-6">for teo, always</p>

            <h2 className="text-[1.75rem] font-bold text-[#2C1A0E] leading-snug mb-8" style={serif}>
              When you need me,<br />read this.
            </h2>

            <div className="flex flex-col gap-5 text-[0.92rem] text-[#3A2214]/65 leading-[1.95]" style={serif}>
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
              <p className="text-[#C4784A]/55 italic">I want these notes to grow with us.</p>
              <div style={{ borderTop: '1px solid #EDE4DA', paddingTop: 20 }}>
                <p>
                  I'm going to fill these notes with real moments, real memories, and real details from our
                  everyday life together — so it never feels generic or distant. I want you to be able to open
                  to any page and remember specific nights, conversations, jokes, dates, little moments, or
                  feelings we shared around the time I wrote it.
                </p>
              </div>
              <p>
                Maybe one page will be about how happy I felt after one of our late-night talks. Maybe another
                will be about the way you held my hand in the car, or a small moment where you're holding my
                hand and kiss it. Maybe another will be about a random moment that made me look at you and think,{' '}
                <span className="text-[#2C1A0E]/80 italic">"I love him so much, he's so silly and makes me genuinely happy."</span>
              </p>
              <div
                className="px-6 py-6 rounded-2xl"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,120,74,0.07) 0%, rgba(232,168,124,0.06) 100%)',
                  border: '1px solid rgba(196,120,74,0.16)',
                }}
              >
                <p>And most importantly, I want this journal to remind you of something I never want you to forget:</p>
                <p className="text-[1.05rem] font-semibold text-[#C4784A] mt-3 mb-3">You are deeply loved by me.</p>
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
              <p className="text-[#C4784A]/50 mt-2">With all my love, Noelle ♥</p>
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        {entries.length > 0 && (
          <div className="max-w-2xl mx-auto px-8 flex items-center gap-4 mb-16">
            <div className="flex-1 h-px" style={{ background: '#EDE4DA' }} />
            <span className="text-[#C4784A]/25 text-base">♥</span>
            <div className="flex-1 h-px" style={{ background: '#EDE4DA' }} />
          </div>
        )}

        {/* ── Floating entry cards ── */}
        {!loading && entries.length > 0 && (
          <div
            className="max-w-3xl mx-auto px-10 pb-28"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '2.5rem' }}
          >
            {entries.map((entry, i) => {
              const cfg = CARD_CONFIG[i % CARD_CONFIG.length]
              const love = isLove(entry)
              return (
                <div
                  key={entry.id}
                  style={{
                    animation: `${cfg.anim} ${3.4 + (i % 3) * 0.4}s ease-in-out ${cfg.delay}ms infinite`,
                  }}
                >
                  <div
                    className="entry-card rounded-2xl p-5"
                    style={{
                      transform: `rotate(${cfg.rot}deg)`,
                      background: love
                        ? 'linear-gradient(145deg, #FFF8F3, #FDF2EC)'
                        : 'linear-gradient(145deg, #ffffff, #FDFBF8)',
                      border: `1px solid ${love ? 'rgba(196,120,74,0.22)' : '#EDE4DA'}`,
                      boxShadow: '0 6px 24px rgba(44,26,14,0.1), 0 2px 6px rgba(44,26,14,0.06)',
                    }}
                    onClick={() => setSelected(entry)}
                  >
                    {/* top row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        {love && <span className="text-[#C4784A]/60 text-xs">♥</span>}
                        {entry.mood && <span className="text-sm leading-none">{entry.mood}</span>}
                      </div>
                      <span className="text-[9px] text-[#7A6155]/35 tracking-wide">{formatShort(entry.created_at)}</span>
                    </div>

                    {/* title */}
                    <p className="text-sm font-bold text-[#2C1A0E] mb-2 leading-snug" style={serif}>
                      {entry.title ?? (love ? 'Love note' : 'Journal entry')}
                    </p>

                    {/* preview */}
                    <p
                      className="text-[11px] text-[#7A6155]/60 leading-relaxed"
                      style={{
                        ...serif,
                        display: '-webkit-box',
                        WebkitLineClamp: 4,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {entry.content}
                    </p>

                    {/* read more hint */}
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-[9px] text-[#C4784A]/40 tracking-wider uppercase">
                        {love ? 'read note →' : 'read entry →'}
                      </p>
                      {(entry.images?.length ?? 0) > 0 && (
                        <span className="text-[9px] text-[#7A6155]/30">📷 {entry.images.length}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Entry reading modal ── */}
      {selected && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-6"
          style={{ background: 'rgba(10,6,3,0.72)', backdropFilter: 'blur(14px)' }}
          onClick={e => { if (e.target === e.currentTarget) setSelected(null) }}
        >
          <div
            className="w-full max-w-xl rounded-3xl overflow-hidden flex flex-col modal-in"
            style={{
              background: '#FDFAF7',
              border: '1px solid #EDE4DA',
              maxHeight: '88vh',
              boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
            }}
          >
            {isLove(selected) && (
              <div
                className="px-8 py-5 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,120,74,0.09), rgba(232,168,124,0.07))',
                  borderBottom: '1px solid rgba(196,120,74,0.14)',
                }}
              >
                <p className="text-[9px] tracking-[0.5em] uppercase text-[#C4784A]/55">a love note for teo ♥</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-8 py-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  {selected.mood && <span className="text-2xl">{selected.mood}</span>}
                  <div>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-[#7A6155]/35">{formatLong(selected.created_at)}</p>
                    {!isLove(selected) && (
                      <p className="text-[9px] tracking-wider uppercase text-[#7A6155]/25 mt-0.5">journal entry</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => deleteEntry(selected.id)}
                    className="text-[11px] px-3 py-1.5 rounded-lg transition-colors hover:text-red-400"
                    style={{ color: 'rgba(248,113,113,0.4)', background: '#F5EFE8' }}
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setSelected(null)}
                    className="text-[#7A6155]/30 hover:text-[#7A6155]/70 text-2xl leading-none transition-colors"
                  >×</button>
                </div>
              </div>

              {selected.title && (
                <h2 className="text-[1.8rem] font-bold text-[#2C1A0E] leading-tight mb-6" style={serif}>
                  {selected.title}
                </h2>
              )}

              {isLove(selected) && (
                <p className="text-sm text-[#C4784A]/45 mb-5" style={serif}>Dear Teo,</p>
              )}

              <p className="text-[0.93rem] text-[#3A2214]/70 leading-[1.95] whitespace-pre-wrap" style={serif}>
                {selected.content}
              </p>

              {selected.images?.length > 0 && (
                <div className="mt-8 flex flex-col gap-4">
                  {selected.images.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt=""
                      className="w-full rounded-2xl object-cover"
                      style={{ maxHeight: 420, border: '1px solid #EDE4DA' }}
                    />
                  ))}
                </div>
              )}

              {isLove(selected) && (
                <p className="text-sm text-[#C4784A]/40 mt-8" style={serif}>With love, Noelle ♥</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Compose modal ── */}
      {composing && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-6"
          style={{ background: 'rgba(10,6,3,0.72)', backdropFilter: 'blur(14px)' }}
          onClick={e => { if (e.target === e.currentTarget) setComposing(false) }}
        >
          <div
            className="w-full max-w-xl rounded-3xl overflow-hidden flex flex-col modal-in"
            style={{
              background: '#FDFAF7',
              border: '1px solid #EDE4DA',
              maxHeight: '90vh',
              boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
            }}
          >
            <div className="px-8 pt-8 pb-5 shrink-0" style={{ borderBottom: '1px solid #EDE4DA' }}>
              <div className="flex gap-1 p-1 rounded-2xl w-fit mb-5" style={{ background: '#F0E8E0', border: '1px solid #E0D4C8' }}>
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
              <div className="flex gap-3 flex-wrap">
                {MOODS.map(m => (
                  <button
                    key={m}
                    onClick={() => setNewMood(newMood === m ? '' : m)}
                    className="text-lg transition-all hover:scale-125 active:scale-110"
                    style={{ opacity: newMood && newMood !== m ? 0.2 : 1 }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              <p className="text-[10px] tracking-[0.4em] uppercase text-[#7A6155]/30 mb-4">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder={newType === 'love-note' ? 'A little title for Teo...' : 'Title...'}
                className="w-full bg-transparent border-none outline-none placeholder:text-[#C8B5A8]/50 mb-4 text-[1.5rem] font-bold text-[#2C1A0E]"
                style={serif}
              />
              {newType === 'love-note' && (
                <p className="text-sm text-[#C4784A]/40 mb-3" style={serif}>Dear Teo,</p>
              )}
              <textarea
                ref={textareaRef}
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                onPaste={handlePaste}
                placeholder={newType === 'love-note' ? 'Tell him something wonderful...' : "What's on your mind..."}
                rows={12}
                className="w-full bg-transparent border-none outline-none resize-none text-[#3A2214]/75 leading-[1.9] text-[0.93rem] placeholder:text-[#C8B5A8]/40"
                style={serif}
              />

              {/* Image previews */}
              {(newImages.length > 0 || uploadingImage) && (
                <div className="flex gap-3 flex-wrap mt-2">
                  {newImages.map((url, i) => (
                    <div key={url} className="relative group">
                      <img
                        src={url}
                        alt=""
                        className="w-24 h-24 object-cover rounded-xl"
                        style={{ border: '2px solid #EDE4DA' }}
                      />
                      <button
                        onClick={() => setNewImages(prev => prev.filter((_, j) => j !== i))}
                        className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: '#2C1A0E', color: '#fff' }}
                      >×</button>
                    </div>
                  ))}
                  {uploadingImage && (
                    <div className="w-24 h-24 rounded-xl flex items-center justify-center" style={{ background: '#F5EFE8', border: '2px dashed #E8DDD4' }}>
                      <span className="text-xs text-[#C4784A]/50">uploading...</span>
                    </div>
                  )}
                </div>
              )}
              {!uploadingImage && (
                <p className="text-[10px] text-[#7A6155]/25 mt-3 tracking-wide">Paste an image anywhere to attach it</p>
              )}
            </div>

            <div className="px-8 py-5 shrink-0 flex flex-col gap-3" style={{ borderTop: '1px solid #EDE4DA' }}>
              {saveError && (
                <p className="text-xs text-red-400/80 px-1">{saveError}</p>
              )}
              <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={!newContent.trim() || saving}
                className="px-7 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
                style={{
                  background: '#C4784A',
                  color: '#fff',
                  boxShadow: '0 3px 12px rgba(196,120,74,0.3)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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
          </div>
        </div>
      )}
    </>
  )
}

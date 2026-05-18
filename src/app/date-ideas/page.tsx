'use client'

import { useEffect, useState } from 'react'
import { supabase, type DateIdea } from '@/lib/supabase'

const categories = {
  outdoor:  { label: 'Outdoor',       emoji: '🌿', bg: 'rgba(74,197,134,0.09)',  border: 'rgba(74,197,134,0.24)'  },
  indoor:   { label: 'Cozy',          emoji: '🏠', bg: 'rgba(196,120,74,0.08)',  border: 'rgba(196,120,74,0.22)'  },
  food:     { label: 'Food & Drinks', emoji: '🍽️',  bg: 'rgba(251,146,60,0.09)',  border: 'rgba(251,146,60,0.24)'  },
  travel:   { label: 'Travel',        emoji: '✈️',  bg: 'rgba(96,165,250,0.09)',  border: 'rgba(96,165,250,0.22)'  },
  fun:      { label: 'Fun & Games',   emoji: '🎲', bg: 'rgba(167,139,250,0.09)', border: 'rgba(167,139,250,0.22)' },
  creative: { label: 'Creative',      emoji: '🎨', bg: 'rgba(251,191,36,0.09)',  border: 'rgba(251,191,36,0.24)'  },
} as const

const COSTS = [
  { v: 'free',       label: 'Free',       icon: '💸' },
  { v: 'affordable', label: 'Affordable', icon: '$'  },
  { v: 'splurge',    label: 'Splurge',    icon: '🥂' },
] as const

const VIBES = [
  { v: 'romantic',    icon: '🌹', label: 'Romantic'    },
  { v: 'adventurous', icon: '🧗', label: 'Adventurous' },
  { v: 'cozy',        icon: '🕯️', label: 'Cozy'        },
  { v: 'spontaneous', icon: '⚡', label: 'Spontaneous' },
  { v: 'fancy',       icon: '🥂', label: 'Fancy'       },
  { v: 'lowkey',      icon: '🌙', label: 'Low-key'     },
] as const

type Category = keyof typeof categories
type Filter = 'all' | 'ideas' | 'planned' | 'done'

type Suggestion = {
  title: string
  category: Category
  cost: 'free' | 'affordable' | 'splurge'
  vibes: string[]
  notes?: string
}

// Full pool — shown suggestions are drawn from here and swapped on add
const SUGGESTIONS_POOL: Suggestion[] = [
  // Outdoor
  { title: 'Sunrise picnic in the park',          category: 'outdoor',  cost: 'free',       vibes: ['romantic', 'lowkey'],         notes: 'Bring a blanket, fruit, pastries, and coffee' },
  { title: 'Stargazing with hot chocolate',        category: 'outdoor',  cost: 'free',       vibes: ['romantic', 'cozy'],           notes: 'Find a dark spot away from the city lights' },
  { title: 'Farmers market morning',               category: 'outdoor',  cost: 'affordable', vibes: ['lowkey', 'spontaneous'],      notes: 'Walk around, try samples, cook together after' },
  { title: 'Sunset walk along the water',          category: 'outdoor',  cost: 'free',       vibes: ['romantic', 'lowkey'],         notes: 'Golden hour, just the two of you' },
  { title: 'Bike ride to a new neighborhood',      category: 'outdoor',  cost: 'free',       vibes: ['adventurous', 'spontaneous']  },
  { title: 'Botanical garden walk',                category: 'outdoor',  cost: 'affordable', vibes: ['romantic', 'lowkey'],         notes: 'Slow and wandering, no agenda' },
  { title: 'Outdoor movie night',                  category: 'outdoor',  cost: 'affordable', vibes: ['cozy', 'romantic'],           notes: 'Bring snacks and a blanket' },
  { title: 'Berry or apple picking at a farm',     category: 'outdoor',  cost: 'affordable', vibes: ['spontaneous', 'adventurous'], notes: 'Then make something with what you picked' },
  { title: 'Hike to a scenic overlook',            category: 'outdoor',  cost: 'free',       vibes: ['adventurous', 'romantic'],    notes: 'Pack lunch and eat at the top' },
  { title: 'Visit a beach or lakeside at sunset',  category: 'outdoor',  cost: 'free',       vibes: ['romantic', 'lowkey']          },
  // Cozy
  { title: 'Build a blanket fort & watch movies',  category: 'indoor',   cost: 'free',       vibes: ['cozy', 'lowkey'],             notes: 'Pick two movies — one each' },
  { title: 'Cook a new recipe together',           category: 'indoor',   cost: 'affordable', vibes: ['cozy', 'romantic'],           notes: 'Pick something neither of you has made before' },
  { title: 'Home spa night',                       category: 'indoor',   cost: 'free',       vibes: ['romantic', 'cozy'],           notes: 'Face masks, candles, good music, zero plans' },
  { title: 'Bake something from scratch together', category: 'indoor',   cost: 'affordable', vibes: ['cozy', 'spontaneous'],        notes: 'Cookies, cinnamon rolls, bread — anything' },
  { title: 'Dress up for dinner at home',          category: 'indoor',   cost: 'affordable', vibes: ['romantic', 'fancy'],          notes: 'Order from somewhere nice, light candles, dress up like it\'s a real night out' },
  { title: 'Game night — board games or cards',    category: 'indoor',   cost: 'free',       vibes: ['spontaneous', 'lowkey'],      notes: 'Make it competitive, winner picks dessert' },
  { title: 'Slow morning with breakfast in bed',   category: 'indoor',   cost: 'free',       vibes: ['cozy', 'romantic'],           notes: 'No phones, no plans, just the morning' },
  { title: 'Make homemade cocktails or mocktails', category: 'indoor',   cost: 'affordable', vibes: ['spontaneous', 'fancy'],       notes: 'Look up recipes together and experiment' },
  { title: 'Read the same book & discuss it',      category: 'indoor',   cost: 'free',       vibes: ['cozy', 'lowkey']              },
  { title: 'Watch the sunrise together at home',   category: 'indoor',   cost: 'free',       vibes: ['romantic', 'cozy'],           notes: 'Coffee in pajamas, watching the sky change color' },
  // Food
  { title: 'Sushi omakase dinner',                 category: 'food',     cost: 'splurge',    vibes: ['fancy', 'romantic']           },
  { title: 'Dessert crawl',                        category: 'food',     cost: 'affordable', vibes: ['spontaneous', 'adventurous'], notes: 'Pick 3 different spots and try something at each' },
  { title: 'Try a cuisine neither of you has had', category: 'food',     cost: 'affordable', vibes: ['adventurous', 'spontaneous'], notes: 'Ethiopian, Georgian, Peruvian — somewhere new' },
  { title: 'Late-night diner run',                 category: 'food',     cost: 'affordable', vibes: ['spontaneous', 'lowkey'],      notes: 'Pancakes at midnight hits different' },
  { title: 'Fancy brunch at a nice spot',          category: 'food',     cost: 'splurge',    vibes: ['fancy', 'romantic']           },
  { title: 'Wine or cocktail tasting',             category: 'food',     cost: 'affordable', vibes: ['fancy', 'romantic']           },
  { title: 'Cook a 3-course meal together',        category: 'food',     cost: 'affordable', vibes: ['romantic', 'cozy'],           notes: 'Dress up, set the table nicely, make it feel special' },
  { title: 'Food hall tour — try a bit of everything', category: 'food', cost: 'affordable', vibes: ['adventurous', 'spontaneous'] },
  { title: 'Make homemade pizza from scratch',     category: 'food',     cost: 'affordable', vibes: ['cozy', 'spontaneous'],        notes: 'Each make your own half with whatever toppings you want' },
  { title: 'Tasting menu at a restaurant',         category: 'food',     cost: 'splurge',    vibes: ['fancy', 'romantic'],          notes: 'Let the chef decide — just show up and enjoy' },
  // Travel
  { title: 'Overnight trip to a nearby city',      category: 'travel',   cost: 'splurge',    vibes: ['adventurous', 'romantic'],    notes: 'Even one night away feels like an escape' },
  { title: 'Day trip somewhere new',               category: 'travel',   cost: 'affordable', vibes: ['adventurous', 'spontaneous'], notes: 'Pick a direction and just go' },
  { title: 'Plan a dream trip together',           category: 'travel',   cost: 'free',       vibes: ['romantic', 'cozy'],           notes: 'Pick somewhere you both want to go and actually start planning it' },
  { title: 'Explore a neighborhood you\'ve never been to', category: 'travel', cost: 'free', vibes: ['adventurous', 'spontaneous'], notes: 'Walk, find a coffee shop, be tourists in your own city' },
  { title: 'Scenic drive with no destination',     category: 'travel',   cost: 'free',       vibes: ['spontaneous', 'romantic'],    notes: 'Good playlist, windows down, see where you end up' },
  { title: 'Rent a cabin for a weekend',           category: 'travel',   cost: 'splurge',    vibes: ['romantic', 'cozy'],           notes: 'Fireplace, no wifi, just you two' },
  { title: 'Take a train or ferry somewhere',      category: 'travel',   cost: 'affordable', vibes: ['adventurous', 'spontaneous'], notes: 'The journey is the date' },
  // Fun
  { title: 'Escape room',                          category: 'fun',      cost: 'affordable', vibes: ['adventurous', 'spontaneous']  },
  { title: 'Mini golf + ice cream after',          category: 'fun',      cost: 'affordable', vibes: ['lowkey', 'spontaneous']       },
  { title: 'Arcade bar night',                     category: 'fun',      cost: 'affordable', vibes: ['spontaneous', 'adventurous'], notes: 'Make it a bet — loser buys dinner' },
  { title: 'Trivia night at a bar',                category: 'fun',      cost: 'affordable', vibes: ['lowkey', 'spontaneous'],      notes: 'Go as a team, embarrass yourselves together' },
  { title: 'Bowling with silly rules',             category: 'fun',      cost: 'affordable', vibes: ['spontaneous', 'lowkey'],      notes: 'Eyes closed every other turn, non-dominant hand only, etc.' },
  { title: 'Go-kart racing',                       category: 'fun',      cost: 'affordable', vibes: ['adventurous', 'spontaneous']  },
  { title: 'Comedy show or improv night',          category: 'fun',      cost: 'affordable', vibes: ['spontaneous', 'lowkey']       },
  { title: 'Laser tag',                            category: 'fun',      cost: 'affordable', vibes: ['adventurous', 'spontaneous']  },
  // Creative
  { title: 'Mini photoshoot together',             category: 'creative', cost: 'free',       vibes: ['romantic', 'spontaneous'],    notes: 'Golden hour, a nice location, just your phone — you\'ll love the photos' },
  { title: 'Paint & sip class',                    category: 'creative', cost: 'affordable', vibes: ['romantic', 'lowkey']          },
  { title: 'Make a shared playlist',               category: 'creative', cost: 'free',       vibes: ['cozy', 'romantic'],           notes: 'Take turns adding songs, no skipping, see what you make together' },
  { title: 'Write letters to each other',          category: 'creative', cost: 'free',       vibes: ['romantic', 'cozy'],           notes: 'Seal them and save one to read on your anniversary' },
  { title: 'Pottery or ceramics class',            category: 'creative', cost: 'affordable', vibes: ['romantic', 'adventurous'],    notes: 'Ghost moment guaranteed' },
  { title: 'Visit a local art museum',             category: 'creative', cost: 'affordable', vibes: ['lowkey', 'romantic'],         notes: 'Pick a favorite piece and explain why' },
  { title: 'Make a scrapbook of your memories',    category: 'creative', cost: 'free',       vibes: ['romantic', 'cozy'],           notes: 'Print a few photos, grab some glue and pens, make something to keep' },
  { title: 'Learn a dance together',               category: 'creative', cost: 'free',       vibes: ['spontaneous', 'romantic'],    notes: 'Just YouTube it, you\'ll be terrible and it\'ll be perfect' },
  { title: 'Make a short film or vlog together',   category: 'creative', cost: 'free',       vibes: ['spontaneous', 'adventurous'], notes: 'Document a random day — you\'ll treasure it later' },
]

// Initial suggestions shown per category (3 each)
const INITIAL_PER_CAT = 3
function getInitialSuggestions(excludeTitles: Set<string>): Suggestion[] {
  const result: Suggestion[] = []
  for (const cat of Object.keys(categories) as Category[]) {
    const pool = SUGGESTIONS_POOL.filter(s => s.category === cat && !excludeTitles.has(s.title))
    result.push(...pool.slice(0, INITIAL_PER_CAT))
  }
  return result
}

const ROTS = [-2, 1.5, -1, 2, -1.5, 1, -2.5, 1.5, -1, 2]

const serif = { fontFamily: 'var(--font-serif, Georgia, "Times New Roman", serif)' }

function countdown(dateStr: string): string | null {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(dateStr); d.setHours(0, 0, 0, 0)
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return null
  if (diff === 0) return 'today! 🎉'
  if (diff === 1) return 'tomorrow!'
  if (diff < 7) return `in ${diff} days`
  if (diff < 14) return 'next week'
  if (diff < 30) return `in ${Math.round(diff / 7)} weeks`
  return `in ${Math.round(diff / 30)} months`
}

function Hearts({ rating, onRate }: { rating: number; onRate?: (n: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onRate?.(n)}
          onMouseEnter={() => onRate && setHover(n)}
          onMouseLeave={() => setHover(0)}
          disabled={!onRate}
          style={{ background: 'none', border: 'none', padding: 0, cursor: onRate ? 'pointer' : 'default', lineHeight: 1 }}
        >
          <span style={{ fontSize: 14, color: n <= (hover || rating) ? '#C4784A' : '#E8DDD4', transition: 'color 0.15s' }}>♥</span>
        </button>
      ))}
    </div>
  )
}

export default function DateIdeasPage() {
  const [ideas, setIdeas] = useState<DateIdea[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [composing, setComposing] = useState(false)
  const [surprise, setSurprise] = useState<DateIdea | null>(null)

  const [fTitle, setFTitle]           = useState('')
  const [fCat, setFCat]               = useState<Category>('indoor')
  const [fNotes, setFNotes]           = useState('')
  const [fCost, setFCost]             = useState('')
  const [fVibes, setFVibes]           = useState<string[]>([])
  const [fDate, setFDate]             = useState('')
  const [saving, setSaving]           = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [addingSuggestion, setAddingSuggestion] = useState<string | null>(null)
  const [displayedSuggestions, setDisplayedSuggestions] = useState<Suggestion[]>([])

  useEffect(() => {
    supabase
      .from('date_ideas')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const fetched = data ?? []
        setIdeas(fetched)
        setDisplayedSuggestions(getInitialSuggestions(new Set(fetched.map(i => i.title))))
        setLoading(false)
      })
  }, [])

  function openCompose() {
    setFTitle(''); setFCat('indoor'); setFNotes(''); setFCost(''); setFVibes([]); setFDate('')
    setComposing(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!fTitle.trim() || saving) return
    setSaving(true)
    const { data } = await supabase.from('date_ideas').insert({
      title: fTitle.trim(),
      category: fCat,
      notes: fNotes.trim() || null,
      cost: fCost || null,
      vibes: fVibes.length ? fVibes : null,
      planned_date: fDate || null,
      done: false,
      rating: 0,
    }).select().single()
    if (data) setIdeas(prev => [data, ...prev])
    setComposing(false)
    setSaving(false)
  }

  async function toggleDone(id: string, done: boolean) {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, done: !done } : i))
    await supabase.from('date_ideas').update({ done: !done }).eq('id', id)
  }

  async function rate(id: string, rating: number) {
    setIdeas(prev => prev.map(i => i.id === id ? { ...i, rating } : i))
    await supabase.from('date_ideas').update({ rating }).eq('id', id)
  }

  async function remove(id: string) {
    setIdeas(prev => prev.filter(i => i.id !== id))
    await supabase.from('date_ideas').delete().eq('id', id)
  }

  function pickSurprise() {
    const pool = ideas.filter(i => !i.done)
    if (!pool.length) return
    const next = pool[Math.floor(Math.random() * pool.length)]
    setSurprise(next)
  }

  async function quickAdd(s: Suggestion) {
    if (addingSuggestion === s.title) return
    setAddingSuggestion(s.title)
    const { data } = await supabase.from('date_ideas').insert({
      title: s.title,
      category: s.category,
      notes: s.notes ?? null,
      cost: s.cost,
      vibes: s.vibes,
      planned_date: null,
      done: false,
      rating: 0,
    }).select().single()

    if (data) {
      setIdeas(prev => {
        const updated = [data, ...prev]
        // Swap this suggestion for a fresh one from the pool
        setDisplayedSuggestions(cur => {
          const shownTitles = new Set(cur.map(x => x.title))
          const addedTitles = new Set(updated.map(i => i.title))
          const pool = SUGGESTIONS_POOL.filter(
            x => x.category === s.category && !shownTitles.has(x.title) && !addedTitles.has(x.title)
          )
          if (pool.length === 0) return cur.filter(x => x.title !== s.title)
          const replacement = pool[Math.floor(Math.random() * pool.length)]
          return cur.map(x => x.title === s.title ? replacement : x)
        })
        return updated
      })
    }
    setAddingSuggestion(null)
  }

  const filtered = ideas.filter(i => {
    if (filter === 'ideas')   return !i.done && !i.planned_date
    if (filter === 'planned') return !i.done && !!i.planned_date
    if (filter === 'done')    return i.done
    return true
  })

  const doneCnt    = ideas.filter(i => i.done).length
  const plannedCnt = ideas.filter(i => !i.done && !!i.planned_date).length
  const ideaCnt    = ideas.filter(i => !i.done && !i.planned_date).length

  const inputSt  = { background: '#F5EFE8', border: '1px solid #E8DDD4', outline: 'none' }
  const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E]'

  if (loading) return null

  return (
    <>
      <style>{`
        @keyframes card-pop {
          from { opacity: 0; transform: translateY(18px) scale(0.94); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes modal-in {
          from { opacity: 0; transform: scale(0.88) translateY(20px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
        @keyframes surprise-reveal {
          from { opacity: 0; transform: scale(0.82) rotate(-4deg); }
          to   { opacity: 1; transform: scale(1)    rotate(0deg);  }
        }
        .date-card {
          transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
          cursor: pointer;
        }
        .date-card:hover {
          transform: rotate(0deg) scale(1.05) !important;
          box-shadow: 0 20px 48px rgba(44,26,14,0.18) !important;
          z-index: 10;
          position: relative;
        }
      `}</style>

      <div className="min-h-screen" style={{
        paddingTop: 64,
        background: 'radial-gradient(ellipse at 20% 0%, rgba(196,120,74,0.05) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(196,120,74,0.04) 0%, transparent 50%), #FDFAF7',
      }}>

        {/* ── Header ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 pt-10 sm:pt-14 pb-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[9px] tracking-[0.55em] uppercase text-[#C4784A]/40 mb-1.5">noelle & teo</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]" style={serif}>Date Ideas</h1>
              <p className="text-[#AE9B8E] text-xs mt-1.5 tracking-wide">
                {doneCnt > 0 && <span>{doneCnt} done · </span>}
                {plannedCnt > 0 && <span>{plannedCnt} planned · </span>}
                {ideaCnt} dreaming
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              {ideas.filter(i => !i.done).length > 0 && (
                <button
                  onClick={pickSurprise}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #C4784A 0%, #D4896A 100%)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(196,120,74,0.38)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  ✨ Surprise us
                </button>
              )}
              <button
                onClick={openCompose}
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold"
                style={{ background: '#F0E8E0', color: '#7A6155', border: '1px solid #E8DDD4' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#EAE0D8')}
                onMouseLeave={e => (e.currentTarget.style.background = '#F0E8E0')}
              >
                + Add idea
              </button>
            </div>
          </div>

          {/* Filter tabs */}
          {ideas.length > 0 && (
            <div className="flex gap-2 mt-6 flex-wrap">
              {([
                { k: 'all',     label: 'All'     },
                { k: 'ideas',   label: 'Ideas'   },
                { k: 'planned', label: 'Planned' },
                { k: 'done',    label: 'Done'    },
              ] as const).map(({ k, label }) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: filter === k ? '#C4784A' : '#F0E8E0',
                    color: filter === k ? '#fff' : '#7A6155',
                    border: '1px solid #E8DDD4',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Suggestions panel ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 mb-8">
          <button
            onClick={() => setShowSuggestions(s => !s)}
            className="flex items-center gap-2 text-sm text-[#7A6155]/60 hover:text-[#C4784A] transition-colors"
          >
            <span style={{ fontSize: 14, transition: 'transform 0.2s', display: 'inline-block', transform: showSuggestions ? 'rotate(90deg)' : 'rotate(0deg)' }}>›</span>
            {showSuggestions ? 'Hide suggestions' : 'Need inspiration? See our recommendations'}
          </button>

          {showSuggestions && (
            <div className="mt-5 flex flex-col gap-6">
              {(Object.keys(categories) as Category[]).map(cat => {
                const group = displayedSuggestions.filter(s => s.category === cat)
                if (!group.length) return null
                const catInfo = categories[cat]
                return (
                  <div key={cat}>
                    <p className="text-[10px] tracking-[0.4em] uppercase mb-3 flex items-center gap-1.5" style={{ color: '#7A6155' }}>
                      <span>{catInfo.emoji}</span> {catInfo.label}
                    </p>
                    <div className="flex flex-col gap-2">
                      {group.map(s => {
                        const adding = addingSuggestion === s.title
                        const costInfo = COSTS.find(c => c.v === s.cost)
                        return (
                          <div
                            key={s.title}
                            className="flex items-start justify-between gap-4 px-4 py-3 rounded-2xl"
                            style={{
                              background: catInfo.bg,
                              border: `1px solid ${catInfo.border}`,
                              animation: 'card-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) both',
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#2C1A0E]" style={serif}>{s.title}</p>
                              {s.notes && (
                                <p className="text-[11px] text-[#7A6155]/60 mt-0.5 leading-relaxed">{s.notes}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {costInfo && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,120,74,0.1)', color: '#C4784A' }}>
                                    {costInfo.icon} {costInfo.label}
                                  </span>
                                )}
                                {s.vibes.map(v => {
                                  const vibe = VIBES.find(x => x.v === v)
                                  return vibe ? (
                                    <span key={v} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(44,26,14,0.06)', color: '#7A6155' }}>
                                      {vibe.icon} {vibe.label}
                                    </span>
                                  ) : null
                                })}
                              </div>
                            </div>
                            <button
                              onClick={() => quickAdd(s)}
                              disabled={adding}
                              className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
                              style={{ background: '#C4784A', color: '#fff' }}
                            >
                              {adding ? '...' : '+ Add'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Card grid ── */}
        <div className="max-w-4xl mx-auto px-4 sm:px-8 pb-28">
          {filtered.length === 0 && (
            <div className="text-center py-24 text-[#AE9B8E]">
              <p className="text-4xl mb-3">💝</p>
              <p className="text-sm">
                {filter === 'all' ? 'No date ideas yet — add something!' : `Nothing in ${filter} yet.`}
              </p>
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '1.75rem',
          }}>
            {filtered.map((idea, i) => {
              const cat = categories[idea.category as Category] ?? categories.indoor
              const rot = idea.done ? 0 : ROTS[i % ROTS.length]
              const cd = idea.planned_date ? countdown(idea.planned_date) : null
              const costInfo = COSTS.find(c => c.v === idea.cost)

              return (
                <div
                  key={idea.id}
                  className="date-card rounded-2xl p-5 flex flex-col gap-3 group"
                  style={{
                    background: idea.done ? '#FAF8F5' : cat.bg,
                    border: `1px solid ${idea.done ? '#EDE4DA' : cat.border}`,
                    boxShadow: '0 4px 20px rgba(44,26,14,0.08)',
                    transform: `rotate(${rot}deg)`,
                    opacity: idea.done ? 0.6 : 1,
                    animation: `card-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${(i % 8) * 55}ms both`,
                  }}
                >
                  {/* top: emoji + controls */}
                  <div className="flex items-start justify-between">
                    <span style={{ fontSize: 26, lineHeight: 1 }}>{cat.emoji}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleDone(idea.id, idea.done)}
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0"
                        style={{
                          borderColor: idea.done ? '#C4784A' : 'rgba(196,120,74,0.3)',
                          background: idea.done ? '#C4784A' : 'transparent',
                        }}
                        title={idea.done ? 'Mark undone' : 'Mark done'}
                      >
                        {idea.done && <span style={{ color: '#fff', fontSize: 8, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                      </button>
                      <button
                        onClick={() => remove(idea.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[#AE9B8E] hover:text-red-400"
                        style={{ fontSize: 12, lineHeight: 1 }}
                        title="Remove"
                      >✕</button>
                    </div>
                  </div>

                  {/* title + notes */}
                  <div className="flex-1">
                    <p
                      className="text-sm font-bold text-[#2C1A0E] leading-snug"
                      style={{
                        ...serif,
                        textDecoration: idea.done ? 'line-through' : 'none',
                        opacity: idea.done ? 0.55 : 1,
                      }}
                    >
                      {idea.title}
                    </p>
                    {idea.notes && (
                      <p className="text-[11px] text-[#7A6155]/65 mt-1.5 leading-relaxed">{idea.notes}</p>
                    )}
                  </div>

                  {/* cost + vibe tags */}
                  {((idea.cost) || (idea.vibes?.length ?? 0) > 0) && (
                    <div className="flex flex-wrap gap-1">
                      {costInfo && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(196,120,74,0.1)', color: '#C4784A' }}
                        >
                          {costInfo.icon} {costInfo.label}
                        </span>
                      )}
                      {(idea.vibes ?? []).map(v => {
                        const vibe = VIBES.find(x => x.v === v)
                        return vibe ? (
                          <span
                            key={v}
                            className="text-[10px] px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(44,26,14,0.06)', color: '#7A6155' }}
                          >
                            {vibe.icon} {vibe.label}
                          </span>
                        ) : null
                      })}
                    </div>
                  )}

                  {/* planned countdown */}
                  {!idea.done && cd && (
                    <div className="flex items-center gap-1.5 pt-1" style={{ borderTop: '1px solid rgba(196,120,74,0.12)' }}>
                      <span style={{ fontSize: 11 }}>📅</span>
                      <span className="text-[11px] font-semibold" style={{ color: '#C4784A' }}>{cd}</span>
                    </div>
                  )}

                  {/* rating after done */}
                  {idea.done && (
                    <div className="pt-1" style={{ borderTop: '1px solid #EDE4DA' }}>
                      <Hearts rating={idea.rating} onRate={r => rate(idea.id, r)} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Surprise modal ── */}
      {surprise && (() => {
        const cat = categories[surprise.category as Category] ?? categories.indoor
        const costInfo = COSTS.find(c => c.v === surprise.cost)
        return (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6"
            style={{ background: 'rgba(10,6,3,0.78)', backdropFilter: 'blur(18px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSurprise(null) }}
          >
            <div style={{ maxWidth: 380, width: '100%' }}>
              <p className="text-center text-[10px] tracking-[0.5em] uppercase text-white/35 mb-5">
                tonight, you two should
              </p>

              <div
                className="rounded-3xl p-8 flex flex-col gap-4"
                style={{
                  background: cat.bg,
                  border: `1px solid ${cat.border}`,
                  boxShadow: '0 32px 80px rgba(0,0,0,0.45)',
                  animation: 'surprise-reveal 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
                }}
              >
                <span style={{ fontSize: 44, lineHeight: 1 }}>{cat.emoji}</span>
                <p className="text-[1.6rem] font-bold text-[#2C1A0E] leading-snug" style={serif}>
                  {surprise.title}
                </p>
                {surprise.notes && (
                  <p className="text-sm text-[#7A6155]/70 leading-relaxed">{surprise.notes}</p>
                )}
                {(costInfo || (surprise.vibes?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {costInfo && (
                      <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: 'rgba(196,120,74,0.12)', color: '#C4784A' }}>
                        {costInfo.icon} {costInfo.label}
                      </span>
                    )}
                    {(surprise.vibes ?? []).map(v => {
                      const vibe = VIBES.find(x => x.v === v)
                      return vibe ? (
                        <span key={v} className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(44,26,14,0.07)', color: '#7A6155' }}>
                          {vibe.icon} {vibe.label}
                        </span>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-5 justify-center">
                <button
                  onClick={pickSurprise}
                  className="px-5 py-2.5 rounded-xl text-sm text-white/50 hover:text-white transition-colors"
                >
                  Try another →
                </button>
                <button
                  onClick={() => setSurprise(null)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold"
                  style={{
                    background: 'linear-gradient(135deg, #C4784A, #D4896A)',
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(196,120,74,0.45)',
                  }}
                >
                  Let&apos;s do it! ♥
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Compose modal ── */}
      {composing && (
        <div
          className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: 'rgba(10,6,3,0.72)', backdropFilter: 'blur(14px)' }}
          onClick={e => { if (e.target === e.currentTarget) setComposing(false) }}
        >
          <form
            onSubmit={save}
            className="w-full max-w-lg sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col"
            style={{
              background: '#FDFAF7',
              border: '1px solid #EDE4DA',
              boxShadow: '0 40px 100px rgba(0,0,0,0.45)',
              maxHeight: '92vh',
              animation: 'modal-in 0.38s cubic-bezier(0.34,1.56,0.64,1) both',
            }}
          >
            {/* title input in header */}
            <div className="px-6 pt-7 pb-4 shrink-0" style={{ borderBottom: '1px solid #EDE4DA' }}>
              <p className="text-[9px] tracking-[0.55em] uppercase text-[#C4784A]/40 mb-3">plan a date</p>
              <input
                value={fTitle}
                onChange={e => setFTitle(e.target.value)}
                placeholder="What's the date idea? *"
                required
                autoFocus
                className="w-full bg-transparent border-none outline-none text-[1.2rem] font-bold text-[#2C1A0E] placeholder:text-[#C8B5A8]/50"
                style={serif}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
              {/* Category */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#7A6155]/45 mb-2">Category</p>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(categories) as Category[]).map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setFCat(c)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: fCat === c ? '#C4784A' : '#F0E8E0',
                        color: fCat === c ? '#fff' : '#7A6155',
                        border: '1px solid #E8DDD4',
                      }}
                    >
                      {categories[c].emoji} {categories[c].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cost */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#7A6155]/45 mb-2">Cost</p>
                <div className="flex gap-2">
                  {COSTS.map(({ v, label, icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFCost(fCost === v ? '' : v)}
                      className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                      style={{
                        background: fCost === v ? '#C4784A' : '#F0E8E0',
                        color: fCost === v ? '#fff' : '#7A6155',
                        border: '1px solid #E8DDD4',
                      }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vibes */}
              <div>
                <p className="text-[10px] tracking-widests uppercase text-[#7A6155]/45 mb-2">Vibe</p>
                <div className="flex gap-2 flex-wrap">
                  {VIBES.map(({ v, icon, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setFVibes(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v])}
                      className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: fVibes.includes(v) ? '#C4784A' : '#F0E8E0',
                        color: fVibes.includes(v) ? '#fff' : '#7A6155',
                        border: '1px solid #E8DDD4',
                      }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#7A6155]/45 mb-2">Notes</p>
                <textarea
                  value={fNotes}
                  onChange={e => setFNotes(e.target.value)}
                  placeholder="Any details, where to go, what to bring..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                  style={inputSt}
                />
              </div>

              {/* Planned date */}
              <div>
                <p className="text-[10px] tracking-widest uppercase text-[#7A6155]/45 mb-2">Plan for a date</p>
                <input
                  type="date"
                  value={fDate}
                  onChange={e => setFDate(e.target.value)}
                  className={inputCls}
                  style={inputSt}
                />
                {fDate && countdown(fDate) && (
                  <p className="text-[11px] text-[#C4784A] mt-1.5 ml-1">📅 {countdown(fDate)}</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 shrink-0 flex items-center gap-3" style={{ borderTop: '1px solid #EDE4DA' }}>
              <button
                type="submit"
                disabled={!fTitle.trim() || saving}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40 transition-transform"
                style={{
                  background: '#C4784A',
                  color: '#fff',
                  boxShadow: '0 3px 12px rgba(196,120,74,0.3)',
                }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
              >
                {saving ? 'Saving...' : 'Save idea'}
              </button>
              <button
                type="button"
                onClick={() => setComposing(false)}
                className="px-4 py-2.5 text-sm text-[#7A6155]/40 hover:text-[#7A6155] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

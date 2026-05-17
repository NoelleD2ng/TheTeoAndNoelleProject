'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type User = 'teo' | 'noelle'
const USERS: User[] = ['teo', 'noelle']
const DISPLAY: Record<User, string> = { teo: 'Teo', noelle: 'Noelle' }

type SpotifyState =
  | { status: 'loading' }
  | { status: 'disconnected' }
  | { status: 'empty' }
  | { status: 'playing'; track: Track }
  | { status: 'recent'; track: Track }

type SteamState =
  | { status: 'loading' }
  | { status: 'unconfigured' }
  | { status: 'empty' }
  | { status: 'playing'; game: string; appId: string | null }
  | { status: 'recent'; game: string; appId: string | null }

type Track = {
  name: string
  artists: string[]
  albumArt?: string
  url: string
}

type ManualData = Record<User, { watching: string; obsessed_with: string }>

const serif = { fontFamily: 'var(--font-serif, Georgia, "Times New Roman", serif)' }

function cardStyle(accent?: boolean) {
  return {
    background: accent ? 'linear-gradient(145deg, #FFF8F3, #FDF2EC)' : '#fff',
    border: `1px solid ${accent ? 'rgba(196,120,74,0.18)' : '#EDE4DA'}`,
    boxShadow: '0 4px 20px rgba(44,26,14,0.07)',
    borderRadius: 20,
    padding: '18px 20px',
  }
}

function UserBadge({ user }: { user: User }) {
  return (
    <p
      className="text-[9px] tracking-[0.5em] uppercase mb-3 font-medium"
      style={{ color: user === 'teo' ? 'rgba(196,120,74,0.55)' : 'rgba(130,90,160,0.5)' }}
    >
      {DISPLAY[user]}
    </p>
  )
}

function SectionLabel({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-base leading-none">{emoji}</span>
      <h2 className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#2C1A0E]/35">{label}</h2>
      <div className="flex-1 h-px" style={{ background: '#EDE4DA' }} />
    </div>
  )
}

function SpotifyCard({ user, state }: { user: User; state: SpotifyState }) {
  return (
    <div style={cardStyle()}>
      <UserBadge user={user} />
      {state.status === 'loading' && (
        <div className="h-14 animate-pulse rounded-xl" style={{ background: '#F5EFE8' }} />
      )}
      {state.status === 'disconnected' && (
        <p className="text-xs text-[#7A6155]/30" style={serif}>Not connected to Spotify</p>
      )}
      {state.status === 'empty' && (
        <p className="text-xs text-[#7A6155]/30" style={serif}>Nothing playing</p>
      )}
      {(state.status === 'playing' || state.status === 'recent') && (
        <a
          href={state.track.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-3 items-center group"
        >
          {state.track.albumArt && (
            <img
              src={state.track.albumArt}
              alt=""
              className="w-14 h-14 rounded-xl object-cover shrink-0"
              style={{ border: '1px solid #EDE4DA' }}
            />
          )}
          <div className="min-w-0 flex-1">
            {state.status === 'playing' ? (
              <div className="flex gap-[3px] items-end h-3 mb-2">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    className="w-0.5 rounded-sm inline-block origin-bottom"
                    style={{
                      background: '#C4784A',
                      height: '100%',
                      animation: `eq ${0.7 + i * 0.18}s ease-in-out ${i * 0.12}s infinite alternate`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[9px] tracking-wider uppercase text-[#7A6155]/30 mb-1.5">last played</p>
            )}
            <p
              className="text-sm font-semibold text-[#2C1A0E] truncate group-hover:text-[#C4784A] transition-colors leading-snug"
              style={serif}
            >
              {state.track.name}
            </p>
            <p className="text-xs text-[#7A6155]/45 truncate mt-0.5">
              {state.track.artists.join(', ')}
            </p>
          </div>
        </a>
      )}
    </div>
  )
}

function SteamCard({ user, state }: { user: User; state: SteamState }) {
  return (
    <div style={cardStyle()}>
      <UserBadge user={user} />
      {state.status === 'loading' && (
        <div className="h-14 animate-pulse rounded-xl" style={{ background: '#F5EFE8' }} />
      )}
      {state.status === 'unconfigured' && (
        <p className="text-xs text-[#7A6155]/30" style={serif}>Steam not connected</p>
      )}
      {state.status === 'empty' && (
        <p className="text-xs text-[#7A6155]/30" style={serif}>No recent games</p>
      )}
      {(state.status === 'playing' || state.status === 'recent') && (
        <div>
          {state.appId && (
            <img
              src={`https://cdn.akamai.steamstatic.com/steam/apps/${state.appId}/header.jpg`}
              alt={state.game}
              className="w-full rounded-xl mb-3 object-cover"
              style={{ height: 72, border: '1px solid #EDE4DA' }}
            />
          )}
          <div className="flex items-center gap-2">
            {state.status === 'playing' ? (
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#4ade80' }} />
            ) : (
              <p className="text-[9px] tracking-wider uppercase text-[#7A6155]/30">recently</p>
            )}
            <p className="text-sm font-semibold text-[#2C1A0E] truncate" style={serif}>
              {state.game}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function ManualCard({
  user,
  value,
  placeholder,
  onChange,
  onSave,
}: {
  user: User
  value: string
  placeholder: string
  onChange: (v: string) => void
  onSave: (v: string) => void
}) {
  return (
    <div style={cardStyle()}>
      <UserBadge user={user} />
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={e => onSave(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full bg-transparent border-none outline-none resize-none text-sm text-[#2C1A0E] leading-relaxed"
        style={{ ...serif, color: value ? '#2C1A0E' : undefined }}
      />
      {!value && (
        <p className="text-[9px] tracking-wider uppercase text-[#C4784A]/25 mt-2">click to edit</p>
      )}
    </div>
  )
}

export default function CurrentlyPage() {
  const [spotify, setSpotify] = useState<Record<User, SpotifyState>>({
    teo: { status: 'loading' },
    noelle: { status: 'loading' },
  })
  const [steam, setSteam] = useState<Record<User, SteamState>>({
    teo: { status: 'loading' },
    noelle: { status: 'loading' },
  })
  const [manual, setManual] = useState<ManualData>({
    teo: { watching: '', obsessed_with: '' },
    noelle: { watching: '', obsessed_with: '' },
  })

  useEffect(() => {
    for (const user of USERS) {
      fetch(`/api/spotify/now-playing?user=${user}`)
        .then(r => r.json())
        .then(data => {
          let state: SpotifyState
          if (data.connected === false) {
            state = { status: 'disconnected' }
          } else if (data.track && data.playing) {
            state = { status: 'playing', track: data.track }
          } else if (data.track && data.recent) {
            state = { status: 'recent', track: data.track }
          } else {
            state = { status: 'empty' }
          }
          setSpotify(prev => ({ ...prev, [user]: state }))
        })
        .catch(() => setSpotify(prev => ({ ...prev, [user]: { status: 'disconnected' } })))
    }
  }, [])

  useEffect(() => {
    for (const user of USERS) {
      fetch(`/api/steam/now-playing?user=${user}`)
        .then(r => r.json())
        .then(data => {
          let state: SteamState
          if (!data.configured) {
            state = { status: 'unconfigured' }
          } else if (data.game && data.current) {
            state = { status: 'playing', game: data.game, appId: data.appId }
          } else if (data.game) {
            state = { status: 'recent', game: data.game, appId: data.appId }
          } else {
            state = { status: 'empty' }
          }
          setSteam(prev => ({ ...prev, [user]: state }))
        })
        .catch(() => setSteam(prev => ({ ...prev, [user]: { status: 'unconfigured' } })))
    }
  }, [])

  useEffect(() => {
    supabase
      .from('currently')
      .select('*')
      .then(({ data }) => {
        if (!data) return
        setManual(prev => {
          const next = { ...prev }
          for (const row of data) {
            if (row.user_name === 'teo' || row.user_name === 'noelle') {
              next[row.user_name as User] = {
                watching: row.watching ?? '',
                obsessed_with: row.obsessed_with ?? '',
              }
            }
          }
          return next
        })
      })
  }, [])

  async function saveField(user: User, field: 'watching' | 'obsessed_with', value: string) {
    await supabase
      .from('currently')
      .upsert(
        { user_name: user, [field]: value, updated_at: new Date().toISOString() },
        { onConflict: 'user_name' }
      )
  }

  return (
    <>
      <style>{`
        @keyframes eq {
          from { transform: scaleY(0.3); }
          to   { transform: scaleY(1); }
        }
      `}</style>
      <div
        className="min-h-screen"
        style={{
          paddingTop: 64,
          background:
            'radial-gradient(ellipse at 20% 10%, rgba(196,120,74,0.04) 0%, transparent 50%), #FDFAF7',
        }}
      >
        {/* Header */}
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 sm:pt-14 pb-10">
          <p className="text-[9px] tracking-[0.55em] uppercase text-[#C4784A]/40 mb-2">teo & noelle</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]" style={serif}>
            Currently
          </h1>
          <p className="text-sm text-[#7A6155]/40 mt-2 tracking-wide" style={serif}>
            what we&apos;re into right now
          </p>
        </div>

        {/* Sections */}
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pb-24 space-y-10">
          <section>
            <SectionLabel emoji="🎵" label="Listening To" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {USERS.map(user => (
                <SpotifyCard key={user} user={user} state={spotify[user]} />
              ))}
            </div>
          </section>

          <section>
            <SectionLabel emoji="📺" label="Watching" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {USERS.map(user => (
                <ManualCard
                  key={user}
                  user={user}
                  value={manual[user].watching}
                  placeholder="Add a show or movie..."
                  onChange={v =>
                    setManual(prev => ({ ...prev, [user]: { ...prev[user], watching: v } }))
                  }
                  onSave={v => saveField(user, 'watching', v)}
                />
              ))}
            </div>
          </section>

          <section>
            <SectionLabel emoji="🎮" label="Playing" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {USERS.map(user => (
                <SteamCard key={user} user={user} state={steam[user]} />
              ))}
            </div>
          </section>

          <section>
            <SectionLabel emoji="✨" label="Obsessed With" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {USERS.map(user => (
                <ManualCard
                  key={user}
                  user={user}
                  value={manual[user].obsessed_with}
                  placeholder="What are you obsessed with?"
                  onChange={v =>
                    setManual(prev => ({ ...prev, [user]: { ...prev[user], obsessed_with: v } }))
                  }
                  onSave={v => saveField(user, 'obsessed_with', v)}
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  )
}

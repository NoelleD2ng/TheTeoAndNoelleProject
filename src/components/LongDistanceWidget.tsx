'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

type User = 'teo' | 'noelle'
const DISPLAY: Record<User, string> = { teo: 'Teo', noelle: 'Noelle' }
const CITY: Record<User, string> = { teo: 'Erie, PA', noelle: 'San Diego, CA' }
const TZ: Record<User, string> = { teo: 'America/New_York', noelle: 'America/Los_Angeles' }

type Weather = { temp: number; description: string; icon: string } | null
type OnlineState = Record<User, boolean>

const serif = { fontFamily: 'var(--font-serif, Georgia, "Times New Roman", serif)' }

function useLocalTime(tz: string) {
  const [time, setTime] = useState('')
  useEffect(() => {
    function tick() {
      setTime(new Date().toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true }))
    }
    tick()
    const id = setInterval(tick, 10000)
    return () => clearInterval(id)
  }, [tz])
  return time
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr)
  const now = new Date()
  target.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.round((target.getTime() - now.getTime()) / 86400000))
}

function WeatherIcon({ icon, desc }: { icon: string; desc: string }) {
  return (
    <img
      src={`https://openweathermap.org/img/wn/${icon}.png`}
      alt={desc}
      width={32}
      height={32}
      style={{ imageRendering: 'crisp-edges' }}
    />
  )
}

function UserColumn({
  user, weather, online, teoTime, noelleTime,
}: {
  user: User
  weather: Weather
  online: boolean
  teoTime: string
  noelleTime: string
}) {
  const time = user === 'teo' ? teoTime : noelleTime

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-3">
        <span
          className="w-2 h-2 rounded-full shrink-0 transition-colors"
          style={{ background: online ? '#4ade80' : '#E8DDD4' }}
        />
        <p className="text-[10px] tracking-[0.4em] uppercase font-medium"
           style={{ color: user === 'teo' ? 'rgba(196,120,74,0.6)' : 'rgba(130,90,160,0.5)' }}>
          {DISPLAY[user]}
        </p>
      </div>

      <p className="text-xl font-semibold text-[#2C1A0E] leading-none mb-0.5" style={serif}>{time}</p>
      <p className="text-[10px] text-[#7A6155]/40 mb-3">{CITY[user]}</p>

      {weather ? (
        <div className="flex items-center gap-1">
          <WeatherIcon icon={weather.icon} desc={weather.description} />
          <div>
            <p className="text-sm font-semibold text-[#2C1A0E]">{weather.temp}°F</p>
            <p className="text-[10px] text-[#7A6155]/50 capitalize">{weather.description}</p>
          </div>
        </div>
      ) : (
        <div className="h-8 w-20 animate-pulse rounded-lg" style={{ background: '#F5EFE8' }} />
      )}
    </div>
  )
}

export default function LongDistanceWidget() {
  const [identity, setIdentity] = useState<User | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [online, setOnline] = useState<OnlineState>({ teo: false, noelle: false })
  const [weather, setWeather] = useState<Record<User, Weather>>({ teo: null, noelle: null })
  const [nextVisit, setNextVisit] = useState('')
  const [editingVisit, setEditingVisit] = useState(false)
  const [visitInput, setVisitInput] = useState('')

  const teoTime = useLocalTime(TZ.teo)
  const noelleTime = useLocalTime(TZ.noelle)

  // Load identity from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('tno-identity') as User | null
    if (stored === 'teo' || stored === 'noelle') {
      setIdentity(stored)
    } else {
      setShowPicker(true)
    }
  }, [])

  // Heartbeat — update presence every 60s
  const updatePresence = useCallback(async (user: User) => {
    await supabase
      .from('presence')
      .upsert({ user_name: user, last_seen: new Date().toISOString() }, { onConflict: 'user_name' })
  }, [])

  useEffect(() => {
    if (!identity) return
    updatePresence(identity)
    const id = setInterval(() => updatePresence(identity), 60000)
    return () => clearInterval(id)
  }, [identity, updatePresence])

  // Poll online status every 30s
  useEffect(() => {
    async function checkOnline() {
      const { data } = await supabase.from('presence').select('*')
      if (!data) return
      const now = Date.now()
      const next: OnlineState = { teo: false, noelle: false }
      for (const row of data) {
        const u = row.user_name as User
        if (u === 'teo' || u === 'noelle') {
          next[u] = now - new Date(row.last_seen as string).getTime() < 3 * 60 * 1000
        }
      }
      setOnline(next)
    }
    checkOnline()
    const id = setInterval(checkOnline, 30000)
    return () => clearInterval(id)
  }, [])

  // Fetch weather
  useEffect(() => {
    fetch('/api/weather')
      .then(r => r.json())
      .then(data => {
        if (data.configured) {
          setWeather({ teo: data.teo, noelle: data.noelle })
        }
      })
      .catch(() => {})
  }, [])

  // Load next visit date
  useEffect(() => {
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'next_visit')
      .single()
      .then(({ data }) => {
        if (data?.value) setNextVisit(data.value)
      })
  }, [])

  function chooseIdentity(user: User) {
    localStorage.setItem('tno-identity', user)
    setIdentity(user)
    setShowPicker(false)
    updatePresence(user)
  }

  async function saveVisit() {
    if (!visitInput) return
    await supabase
      .from('settings')
      .upsert({ key: 'next_visit', value: visitInput }, { onConflict: 'key' })
    setNextVisit(visitInput)
    setEditingVisit(false)
  }

  const days = nextVisit ? daysUntil(nextVisit) : null

  return (
    <>
      {/* Identity picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center"
             style={{ background: 'rgba(10,6,3,0.6)', backdropFilter: 'blur(12px)' }}>
          <div className="rounded-3xl p-8 max-w-xs w-full mx-4 text-center"
               style={{ background: '#FDFAF7', border: '1px solid #EDE4DA', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
            <p className="text-[9px] tracking-[0.5em] uppercase text-[#C4784A]/40 mb-4">welcome</p>
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-2" style={serif}>Who are you?</h2>
            <p className="text-xs text-[#7A6155]/50 mb-6">This stays on your device.</p>
            <div className="flex gap-3">
              {(['teo', 'noelle'] as User[]).map(u => (
                <button key={u} onClick={() => chooseIdentity(u)}
                  className="flex-1 py-3 rounded-2xl text-sm font-semibold transition-all hover:scale-105"
                  style={{ background: '#C4784A', color: '#fff', boxShadow: '0 4px 16px rgba(196,120,74,0.3)' }}>
                  {DISPLAY[u]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl p-6 sm:p-8"
           style={{
             background: '#fff',
             border: '1px solid #EDE4DA',
             boxShadow: '0 4px 24px rgba(44,26,14,0.07)',
           }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[9px] tracking-[0.5em] uppercase text-[#C4784A]/40 mb-1">long distance</p>
            <h3 className="text-base font-semibold text-[#2C1A0E]" style={serif}>Right now</h3>
          </div>
          {/* Days until visit */}
          <div className="text-right">
            {editingVisit ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={visitInput}
                  onChange={e => setVisitInput(e.target.value)}
                  className="text-xs px-2 py-1 rounded-lg border border-[#E8DDD4] bg-[#F5EFE8] text-[#2C1A0E] focus:outline-none"
                />
                <button onClick={saveVisit}
                  className="text-xs px-2 py-1 rounded-lg text-white"
                  style={{ background: '#C4784A' }}>Save</button>
                <button onClick={() => setEditingVisit(false)}
                  className="text-xs text-[#7A6155]/40 hover:text-[#7A6155]">✕</button>
              </div>
            ) : days !== null ? (
              <button onClick={() => { setVisitInput(nextVisit); setEditingVisit(true) }}
                className="text-right group">
                <p className="text-2xl font-bold text-[#C4784A]" style={serif}>{days}</p>
                <p className="text-[9px] tracking-wider uppercase text-[#7A6155]/35 group-hover:text-[#7A6155]/60 transition-colors">
                  days until next visit
                </p>
              </button>
            ) : (
              <button onClick={() => { setVisitInput(''); setEditingVisit(true) }}
                className="text-[10px] text-[#C4784A]/40 hover:text-[#C4784A] transition-colors tracking-wide">
                + set next visit
              </button>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px mb-6" style={{ background: '#EDE4DA' }} />

        {/* Two columns */}
        <div className="flex gap-6 sm:gap-10">
          <UserColumn user="teo" weather={weather.teo} online={online.teo} teoTime={teoTime} noelleTime={noelleTime} />
          <div className="w-px self-stretch" style={{ background: '#EDE4DA' }} />
          <UserColumn user="noelle" weather={weather.noelle} online={online.noelle} teoTime={teoTime} noelleTime={noelleTime} />
        </div>

        {/* Identity switcher */}
        {identity && (
          <div className="mt-5 pt-4 flex justify-end" style={{ borderTop: '1px solid #EDE4DA' }}>
            <button onClick={() => setShowPicker(true)}
              className="text-[9px] tracking-wider uppercase text-[#7A6155]/25 hover:text-[#7A6155]/50 transition-colors">
              you&apos;re {DISPLAY[identity]} · switch
            </button>
          </div>
        )}
      </div>
    </>
  )
}

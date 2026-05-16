'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Place = { id: string; name: string; location: string; emoji: string; notes: string; visited: boolean }

const card = { background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(12px)' }
const border = 'border border-white/[0.08]'
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none transition-all'
const inputStyle = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }

export default function PlacesPage() {
  const [places, setPlaces, hydrated] = useLocalStorage<Place[]>('tno-places', [])
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [emoji, setEmoji] = useState('📍')
  const [notes, setNotes] = useState('')
  const [showForm, setShowForm] = useState(false)

  function addPlace(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setPlaces(prev => [...prev, { id: crypto.randomUUID(), name: name.trim(), location: location.trim(), emoji, notes: notes.trim(), visited: false }])
    setName(''); setLocation(''); setEmoji('📍'); setNotes(''); setShowForm(false)
  }
  function toggleVisited(id: string) { setPlaces(prev => prev.map(p => p.id === id ? { ...p, visited: !p.visited } : p)) }
  function remove(id: string) { setPlaces(prev => prev.filter(p => p.id !== id)) }

  const wantToGo = places.filter(p => !p.visited)
  const beenThere = places.filter(p => p.visited)

  if (!hydrated) return null

  const PlaceCard = ({ place }: { place: Place }) => (
    <div className={`${border} rounded-2xl p-4 group flex flex-col gap-2`} style={card}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{place.emoji}</span>
          <div>
            <p className="text-sm text-white/80 font-medium flex items-center gap-1.5">
              {place.name}
              {place.visited && <span className="text-[#c8a97e] text-xs">✓</span>}
            </p>
            {place.location && <p className="text-xs text-white/30">{place.location}</p>}
          </div>
        </div>
        <button onClick={() => remove(place.id)} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-white/50 text-xs transition-all">✕</button>
      </div>
      {place.notes && <p className="text-xs text-white/30 pl-10">{place.notes}</p>}
      {!place.visited && (
        <button onClick={() => toggleVisited(place.id)} className="text-xs text-white/20 hover:text-[#c8a97e]/60 transition-colors text-left pl-10">mark visited ✓</button>
      )}
    </div>
  )

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 mb-1">explore</p>
          <h1 className="text-3xl font-light text-white" style={{ fontFamily: 'var(--font-playfair)' }}>Places</h1>
          <p className="text-white/35 mt-1 text-sm">places we want to go and places we&apos;ve been</p>
        </div>
        <button onClick={() => setShowForm(s => !s)} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#c8a97e', color: '#080d1a' }}>+ Add</button>
      </div>

      {showForm && (
        <form onSubmit={addPlace} className={`${border} rounded-2xl p-5 mb-6 flex flex-col gap-3 max-w-lg`} style={card}>
          <div className="flex gap-2">
            <input value={emoji} onChange={e => setEmoji(e.target.value)} maxLength={2} className="w-12 px-2 py-2.5 rounded-xl text-center text-lg focus:outline-none" style={inputStyle} />
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Place name *" className={inputCls} style={inputStyle} required />
          </div>
          <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City, Country" className={inputCls} style={inputStyle} />
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes..." rows={2} className={`${inputCls} resize-none`} style={inputStyle} />
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-xl text-sm font-medium" style={{ background: '#c8a97e', color: '#080d1a' }}>Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-xl text-sm text-white/35 hover:text-white/60 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {wantToGo.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-3">Want to go</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wantToGo.map(p => <PlaceCard key={p.id} place={p} />)}
          </div>
        </div>
      )}

      {beenThere.length > 0 && (
        <div>
          <p className="text-[10px] tracking-[0.25em] uppercase text-white/25 mb-3">Been there</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
            {beenThere.map(p => <PlaceCard key={p.id} place={p} />)}
          </div>
        </div>
      )}

      {places.length === 0 && (
        <div className="text-center py-16 text-white/20">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-sm">no places yet — where do you want to go?</p>
        </div>
      )}
    </div>
  )
}

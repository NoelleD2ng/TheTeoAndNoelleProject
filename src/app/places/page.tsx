'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'

type Place = {
  id: string
  name: string
  location: string
  emoji: string
  notes: string
  visited: boolean
}

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
    setPlaces(prev => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: name.trim(),
        location: location.trim(),
        emoji,
        notes: notes.trim(),
        visited: false,
      },
    ])
    setName('')
    setLocation('')
    setEmoji('📍')
    setNotes('')
    setShowForm(false)
  }

  function toggleVisited(id: string) {
    setPlaces(prev => prev.map(p => (p.id === id ? { ...p, visited: !p.visited } : p)))
  }

  function remove(id: string) {
    setPlaces(prev => prev.filter(p => p.id !== id))
  }

  const wantToGo = places.filter(p => !p.visited)
  const beenThere = places.filter(p => p.visited)

  if (!hydrated) return null

  return (
    <div className="p-6 md:p-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-stone-800">Places 📍</h1>
          <p className="text-stone-400 mt-1 text-sm">places we want to go and places we&apos;ve been</p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
        >
          + Add Place
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addPlace}
          className="bg-white rounded-2xl border border-rose-100 p-5 mb-6 flex flex-col gap-3 max-w-lg"
        >
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={e => setEmoji(e.target.value)}
              maxLength={2}
              className="w-14 px-2 py-2.5 rounded-xl border border-stone-200 text-center text-lg focus:outline-none focus:border-rose-300"
            />
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Place name *"
              className="flex-1 px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
              required
            />
          </div>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="City, Country"
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100"
          />
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Notes, things to do there..."
            rows={2}
            className="w-full px-3 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 resize-none"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-rose-400 hover:bg-rose-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm text-stone-400 hover:text-stone-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {wantToGo.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Want to go</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {wantToGo.map(place => (
              <div
                key={place.id}
                className="bg-white rounded-2xl border border-rose-100 p-4 group flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{place.emoji}</span>
                    <div>
                      <p className="font-medium text-stone-700 text-sm">{place.name}</p>
                      {place.location && (
                        <p className="text-xs text-stone-400">{place.location}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(place.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
                {place.notes && <p className="text-xs text-stone-400">{place.notes}</p>}
                <button
                  onClick={() => toggleVisited(place.id)}
                  className="text-xs text-stone-300 hover:text-rose-400 transition-colors text-left mt-1"
                >
                  mark as visited ✓
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {beenThere.length > 0 && (
        <div>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">Been there 🗺️</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {beenThere.map(place => (
              <div
                key={place.id}
                className="bg-white rounded-2xl border border-rose-100 p-4 group opacity-75 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{place.emoji}</span>
                    <div>
                      <p className="font-medium text-stone-700 text-sm flex items-center gap-1">
                        {place.name}
                        <span className="text-rose-300 text-xs">✓</span>
                      </p>
                      {place.location && (
                        <p className="text-xs text-stone-400">{place.location}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => remove(place.id)}
                    className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-400 text-xs transition-all"
                  >
                    ✕
                  </button>
                </div>
                {place.notes && <p className="text-xs text-stone-400">{place.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {places.length === 0 && (
        <div className="text-center py-12 text-stone-300">
          <p className="text-4xl mb-3">🗺️</p>
          <p className="text-sm">no places yet — where do you want to go?</p>
        </div>
      )}
    </div>
  )
}

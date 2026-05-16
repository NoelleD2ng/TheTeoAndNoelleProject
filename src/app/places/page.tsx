'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { supabase, type Memory } from '@/lib/supabase'
import type { MapPlace } from '@/components/PlacesMap'

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false })

type GeoResult = { place_id: number; display_name: string; lat: string; lon: string }
type FlyTarget = { lat: number; lng: number; ts: number } | null
type Filter = 'all' | 'want-to-go' | 'visited'

const glass = { background: 'rgba(8,13,26,0.88)', backdropFilter: 'blur(16px)' }
const inputSt = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)' }

export default function PlacesPage() {
  const [places, setPlaces, hydrated] = useLocalStorage<MapPlace[]>('tno-places', [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<FlyTarget>(null)

  // geocoding search
  const [query, setQuery] = useState('')
  const [geoResults, setGeoResults] = useState<GeoResult[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()
  const searchRef = useRef<HTMLDivElement>(null)

  // sidebar state
  const [filter, setFilter] = useState<Filter>('all')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState<'want-to-go' | 'visited'>('want-to-go')

  // memories
  const [allMemories, setAllMemories] = useState<Memory[]>([])
  const [memoriesLoaded, setMemoriesLoaded] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set())

  const selectedPlace = places.find(p => p.id === selectedId) ?? null
  const wantCount = places.filter(p => p.status === 'want-to-go').length
  const visitedCount = places.filter(p => p.status === 'visited').length

  const filteredPlaces = places.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter
    const matchSearch = !sidebarSearch || p.name.toLowerCase().includes(sidebarSearch.toLowerCase())
    return matchFilter && matchSearch
  })

  // geocoding
  useEffect(() => {
    if (!query.trim()) { setGeoResults([]); return }
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(async () => {
      setGeoLoading(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`)
        setGeoResults(await res.json())
      } catch { setGeoResults([]) }
      setGeoLoading(false)
    }, 450)
    return () => clearTimeout(searchTimer.current)
  }, [query])

  // close search dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setGeoResults([])
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function flyToGeo(r: GeoResult) {
    setFlyTarget({ lat: parseFloat(r.lat), lng: parseFloat(r.lon), ts: Date.now() })
    setQuery(r.display_name.split(',')[0])
    setGeoResults([])
  }

  function addPlace(place: Omit<MapPlace, 'id'>) {
    setPlaces(prev => [...prev, { ...place, id: crypto.randomUUID() }])
  }

  function deletePlace(id: string) {
    setPlaces(prev => prev.filter(p => p.id !== id))
    setSelectedId(null)
  }

  function openEdit(place: MapPlace) {
    setEditName(place.name); setEditNotes(place.notes); setEditStatus(place.status)
    setEditing(true)
  }

  function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !editName.trim()) return
    setPlaces(prev => prev.map(p => p.id === selectedId ? { ...p, name: editName.trim(), notes: editNotes.trim(), status: editStatus } : p))
    setEditing(false)
  }

  async function openPicker() {
    if (!memoriesLoaded) {
      const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
      setAllMemories(data ?? [])
      setMemoriesLoaded(true)
    }
    setPickerSelection(new Set(selectedPlace?.linked_memory_ids ?? []))
    setShowPicker(true)
  }

  function savePicker() {
    if (!selectedId) return
    setPlaces(prev => prev.map(p => p.id === selectedId ? { ...p, linked_memory_ids: Array.from(pickerSelection) } : p))
    setShowPicker(false)
  }

  function selectPlace(place: MapPlace | null) {
    setSelectedId(place?.id ?? null)
    setEditing(false)
  }

  function flyToPlace(place: MapPlace) {
    setSelectedId(place.id)
    setEditing(false)
    setFlyTarget({ lat: place.lat, lng: place.lng, ts: Date.now() })
  }

  if (!hydrated) return null

  const linkedMemories = allMemories.filter(m => selectedPlace?.linked_memory_ids?.includes(m.id))

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ paddingTop: 64 }}>

      {/* Header with search */}
      <div className="shrink-0 px-4 py-2.5 flex items-center gap-4" style={{ ...glass, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="shrink-0">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 leading-none">explore</p>
          <h1 className="text-lg font-bold text-white leading-tight">Places</h1>
        </div>

        {/* Geocoding search */}
        <div className="flex-1 max-w-sm relative" ref={searchRef}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={inputSt}>
            <span className="text-white/35 text-sm">🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search any location in the world..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/35 focus:outline-none"
            />
            {geoLoading && <span className="text-white/30 text-xs">...</span>}
            {query && !geoLoading && <button onClick={() => { setQuery(''); setGeoResults([]) }} className="text-white/30 hover:text-white/60 transition-colors text-base leading-none">×</button>}
          </div>
          {geoResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 rounded-xl overflow-hidden z-50 shadow-2xl" style={{ background: 'rgba(8,13,26,0.97)', border: '1px solid rgba(255,255,255,0.15)' }}>
              {geoResults.map(r => (
                <button key={r.place_id} onClick={() => flyToGeo(r)} className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/[0.06] hover:text-white transition-colors border-b border-white/[0.07] last:border-0">
                  <span className="font-medium">{r.display_name.split(',')[0]}</span>
                  <span className="text-white/35 text-xs ml-1.5">{r.display_name.split(',').slice(1, 3).join(',')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="shrink-0 flex gap-4 text-xs text-white/45">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#c8a97e' }} />{wantCount} want to go</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#4ade80' }} />{visitedCount} visited</span>
        </div>
      </div>

      {/* Body: sidebar + map */}
      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden" style={{ background: 'rgba(8,13,26,0.92)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>

          {/* List view */}
          {!selectedPlace && (
            <>
              {/* Filter tabs */}
              <div className="flex gap-1 p-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                {(['all', 'want-to-go', 'visited'] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all" style={{
                    background: filter === f ? 'rgba(200,169,126,0.2)' : 'transparent',
                    color: filter === f ? '#c8a97e' : 'rgba(255,255,255,0.4)',
                    border: filter === f ? '1px solid rgba(200,169,126,0.35)' : '1px solid transparent',
                  }}>
                    {f === 'want-to-go' ? '♥ want to go' : f === 'visited' ? '✓ visited' : 'all'}
                  </button>
                ))}
              </div>

              {/* Sidebar search */}
              <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <input
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  placeholder="Filter your places..."
                  className="w-full px-3 py-2 rounded-lg text-xs text-white placeholder:text-white/30 focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>

              {/* Place list */}
              <div className="flex-1 overflow-y-auto">
                {filteredPlaces.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <p className="text-3xl mb-2">🗺️</p>
                    <p className="text-xs text-white/30">{places.length === 0 ? 'Click the map to add your first place' : 'No places match this filter'}</p>
                  </div>
                ) : (
                  <div className="p-2 flex flex-col gap-1">
                    {filteredPlaces.map(place => (
                      <button
                        key={place.id}
                        onClick={() => flyToPlace(place)}
                        className="w-full text-left px-3 py-2.5 rounded-xl transition-all group"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs shrink-0" style={{ color: place.status === 'visited' ? '#4ade80' : '#c8a97e' }}>
                            {place.status === 'visited' ? '✓' : '♥'}
                          </span>
                          <p className="text-sm text-white/85 font-medium truncate flex-1">{place.name}</p>
                          {(place.linked_memory_ids?.length ?? 0) > 0 && (
                            <span className="text-xs text-white/30 shrink-0">📷 {place.linked_memory_ids!.length}</span>
                          )}
                        </div>
                        {place.notes && <p className="text-xs text-white/35 mt-0.5 pl-5 truncate">{place.notes}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Detail view */}
          {selectedPlace && (
            <div className="flex flex-col flex-1 overflow-hidden">
              {/* Back */}
              <div className="px-3 py-2.5 shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <button onClick={() => { setSelectedId(null); setEditing(false) }} className="text-white/40 hover:text-white/70 transition-colors text-sm">← back</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!editing ? (
                  <>
                    {/* Place info */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-white font-semibold text-base leading-tight">{selectedPlace.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: selectedPlace.status === 'visited' ? '#4ade80' : '#c8a97e' }}>
                            {selectedPlace.status === 'visited' ? '✓ Been there' : '♥ Want to go'}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEdit(selectedPlace)} className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.06)' }}>Edit</button>
                          <button onClick={() => deletePlace(selectedPlace.id)} className="text-xs hover:text-red-400 transition-colors px-2 py-1 rounded-lg" style={{ color: 'rgba(248,113,113,0.6)', background: 'rgba(255,255,255,0.06)' }}>Delete</button>
                        </div>
                      </div>
                      {selectedPlace.notes && <p className="text-sm text-white/60 mt-3 leading-relaxed">{selectedPlace.notes}</p>}
                    </div>

                    {/* Linked memories */}
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16 }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-white/45 tracking-wider uppercase">Linked Memories</p>
                        <button onClick={openPicker} className="text-xs text-[#c8a97e]/70 hover:text-[#c8a97e] transition-colors">+ link</button>
                      </div>

                      {(selectedPlace.linked_memory_ids?.length ?? 0) === 0 ? (
                        <button onClick={openPicker} className="w-full py-4 rounded-xl text-xs text-white/25 border border-dashed border-white/[0.1] hover:border-white/20 hover:text-white/40 transition-all">
                          Link photos from Memories →
                        </button>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-1.5 mb-2">
                            {linkedMemories.slice(0, 6).map(m => (
                              <a key={m.id} href="/memories" className="aspect-square rounded-lg overflow-hidden block" style={{ background: 'rgba(255,255,255,0.07)' }}>
                                {m.image_url.endsWith('.pdf') ? (
                                  <div className="w-full h-full flex items-center justify-center text-lg">📄</div>
                                ) : (
                                  <img src={m.image_url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                                )}
                              </a>
                            ))}
                          </div>
                          {linkedMemories.length > 6 && <p className="text-xs text-white/30 text-center">+{linkedMemories.length - 6} more</p>}
                          <button onClick={openPicker} className="w-full mt-2 py-2 rounded-lg text-xs text-white/35 hover:text-white/60 transition-colors" style={{ background: 'rgba(255,255,255,0.05)' }}>Manage memories</button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  /* Edit form */
                  <form onSubmit={saveEdit} className="flex flex-col gap-3">
                    <p className="text-[10px] tracking-widest uppercase text-[#c8a97e]/60 mb-1">Edit place</p>
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Place name *"
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none"
                      style={inputSt}
                      autoFocus
                      required
                    />
                    <textarea
                      value={editNotes}
                      onChange={e => setEditNotes(e.target.value)}
                      placeholder="Notes..."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/40 focus:outline-none resize-none"
                      style={inputSt}
                    />
                    <div className="flex gap-2">
                      {(['want-to-go', 'visited'] as const).map(s => (
                        <button key={s} type="button" onClick={() => setEditStatus(s)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all" style={{
                          background: editStatus === s ? (s === 'visited' ? '#4ade80' : '#c8a97e') : 'rgba(255,255,255,0.07)',
                          color: editStatus === s ? '#080d1a' : 'rgba(255,255,255,0.5)',
                          border: '1px solid rgba(255,255,255,0.12)',
                        }}>
                          {s === 'want-to-go' ? '♥ Want to go' : '✓ Been there'}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: '#c8a97e', color: '#080d1a' }}>Save</button>
                      <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm text-white/45 hover:text-white transition-colors">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <PlacesMap
            places={places}
            selectedId={selectedId}
            flyTarget={flyTarget}
            onAdd={addPlace}
            onSelectPlace={selectPlace}
          />
        </div>
      </div>

      {/* Memory picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: 'rgba(8,13,26,0.97)', border: '1px solid rgba(255,255,255,0.15)', maxHeight: '80vh' }}>
            <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <p className="text-white font-semibold">Link Memories</p>
                <p className="text-xs text-white/40 mt-0.5">Select photos to link to <span className="text-[#c8a97e]">{selectedPlace?.name}</span></p>
              </div>
              <button onClick={() => setShowPicker(false)} className="text-white/35 hover:text-white/70 text-2xl leading-none transition-colors">×</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {allMemories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📷</p>
                  <p className="text-sm text-white/35">No memories yet — upload some on the Memories page</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {allMemories.map(m => {
                    const selected = pickerSelection.has(m.id)
                    return (
                      <button
                        key={m.id}
                        onClick={() => setPickerSelection(prev => {
                          const next = new Set(prev)
                          selected ? next.delete(m.id) : next.add(m.id)
                          return next
                        })}
                        className="aspect-square rounded-xl overflow-hidden relative transition-all"
                        style={{ outline: selected ? '2px solid #c8a97e' : '2px solid transparent', outlineOffset: 2 }}
                      >
                        {m.image_url.endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <span className="text-2xl">📄</span>
                            <span className="text-xs text-white/40 truncate px-2 w-full text-center">{m.caption ?? 'PDF'}</span>
                          </div>
                        ) : (
                          <img src={m.image_url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                        )}
                        {selected && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(200,169,126,0.25)' }}>
                            <span className="text-white text-xl font-bold drop-shadow">✓</span>
                          </div>
                        )}
                        {m.caption && (
                          <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                            <p className="text-xs text-white/70 truncate">{m.caption}</p>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <p className="text-xs text-white/35">{pickerSelection.size} selected</p>
              <div className="flex gap-3">
                <button onClick={() => setShowPicker(false)} className="px-4 py-2 rounded-xl text-sm text-white/45 hover:text-white transition-colors">Cancel</button>
                <button onClick={savePicker} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: '#c8a97e', color: '#080d1a' }}>Save links</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

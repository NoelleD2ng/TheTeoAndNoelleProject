'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { supabase, type Memory, type PlaceMetadata } from '@/lib/supabase'
import type { MapPlace } from '@/components/PlacesMap'

const PlacesMap = dynamic(() => import('@/components/PlacesMap'), { ssr: false })

type GeoResult = { place_id: number; display_name: string; lat: string; lon: string }
type FlyTarget = { lat: number; lng: number; ts: number } | null
type Filter = 'all' | 'want-to-go' | 'visited'

const glass = { background: 'rgba(250,248,245,0.97)', backdropFilter: 'blur(16px)', borderRight: '1px solid #E8DDD4' }
const inputSt = { background: '#F5EFE8', border: '1px solid #E8DDD4' }

function HeartRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(value === i ? 0 : i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? 'transition-transform hover:scale-125' : 'cursor-default'}
          style={{ background: 'none', border: 'none', padding: 0, lineHeight: 1 }}
        >
          <span style={{ fontSize: 18, color: i <= (hover || value) ? '#C4784A' : '#E8DDD4' }}>♥</span>
        </button>
      ))}
    </div>
  )
}

export default function PlacesPage() {
  const [places, setPlaces] = useState<MapPlace[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [flyTarget, setFlyTarget] = useState<FlyTarget>(null)

  const [query, setQuery] = useState('')
  const [geoResults, setGeoResults] = useState<GeoResult[]>([])
  const [geoLoading, setGeoLoading] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const [filter, setFilter] = useState<Filter>('all')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editStatus, setEditStatus] = useState<'want-to-go' | 'visited'>('want-to-go')
  const [editMeta, setEditMeta] = useState<PlaceMetadata>({})

  const [allMemories, setAllMemories] = useState<Memory[]>([])
  const [memoriesLoaded, setMemoriesLoaded] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerSelection, setPickerSelection] = useState<Set<string>>(new Set())

  const [showMemoryCard, setShowMemoryCard] = useState(false)
  const [photosPopped, setPhotosPopped] = useState(false)
  const popTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedPlace = places.find(p => p.id === selectedId) ?? null
  const wantCount = places.filter(p => p.status === 'want-to-go').length
  const visitedCount = places.filter(p => p.status === 'visited').length

  const filteredPlaces = places.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter
    const matchSearch = !sidebarSearch || p.name.toLowerCase().includes(sidebarSearch.toLowerCase())
    return matchFilter && matchSearch
  })

  const FLOAT_POSITIONS = [
    { dx: -190, dy: -135, rot: -12, delay: 0,   floatAnim: 'photo-float-a' },
    { dx: 155,  dy: -150, rot:   8, delay: 55,  floatAnim: 'photo-float-b' },
    { dx: -220, dy:   20, rot:  -5, delay: 95,  floatAnim: 'photo-float-c' },
    { dx: 205,  dy:   25, rot:  11, delay: 40,  floatAnim: 'photo-float-a' },
    { dx: -155, dy:  175, rot:  -8, delay: 75,  floatAnim: 'photo-float-b' },
    { dx: 140,  dy:  180, rot:   6, delay: 115, floatAnim: 'photo-float-c' },
  ]

  useEffect(() => {
    if (popTimer.current) clearTimeout(popTimer.current)
    setPhotosPopped(false)
    if (selectedId) {
      popTimer.current = setTimeout(() => setPhotosPopped(true), 280)
    }
    return () => { if (popTimer.current) clearTimeout(popTimer.current) }
  }, [selectedId])

  useEffect(() => {
    async function fetchPlaces() {
      const { data } = await supabase.from('places').select('*').order('created_at', { ascending: false })
      setPlaces((data ?? []).map(p => ({
        ...p,
        notes: p.notes ?? '',
        linked_memory_ids: p.linked_memory_ids ?? [],
        metadata: p.metadata ?? {},
      })))
      setLoading(false)
    }

    async function fetchMemories() {
      const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
      setAllMemories(data ?? [])
      setMemoriesLoaded(true)
    }

    fetchPlaces()
    fetchMemories()

    const channel = supabase
      .channel('places-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'places' }, () => fetchPlaces())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
    }


    searchTimer.current = setTimeout(async () => {
      if (!query.trim()) {
        setGeoResults([])
        return
      }

      setGeoLoading(true)
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`)
        setGeoResults(await res.json())
      } catch {
        setGeoResults([])
      }
      setGeoLoading(false)
    }, 450)

    return () => {
      if (searchTimer.current) {
        clearTimeout(searchTimer.current)
      }
    }
  }, [query])

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

  async function addPlace(place: Omit<MapPlace, 'id'>) {
    const { data } = await supabase.from('places').insert({
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      notes: place.notes || null,
      status: place.status,
      linked_memory_ids: [],
      metadata: {},
    }).select().single()
    if (data) setPlaces(prev => [{ ...data, notes: data.notes ?? '', linked_memory_ids: data.linked_memory_ids ?? [], metadata: data.metadata ?? {} }, ...prev])
  }

  async function updatePlaceFields(id: string, updates: { name?: string; notes?: string; status?: 'want-to-go' | 'visited'; linked_memory_ids?: string[]; metadata?: PlaceMetadata }) {
    await supabase.from('places').update(updates).eq('id', id)
    setPlaces(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  async function deletePlace(id: string) {
    await supabase.from('places').delete().eq('id', id)
    setPlaces(prev => prev.filter(p => p.id !== id))
    setSelectedId(null)
    setShowMemoryCard(false)
  }

  function openEdit(place: MapPlace) {
    setEditName(place.name)
    setEditNotes(place.notes)
    setEditStatus(place.status)
    setEditMeta(place.metadata ?? {})
    setEditing(true)
    setShowMemoryCard(false)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId || !editName.trim()) return
    await updatePlaceFields(selectedId, {
      name: editName.trim(),
      notes: editNotes.trim(),
      status: editStatus,
      metadata: editMeta,
    })
    setEditing(false)
  }

  async function ensureMemoriesLoaded() {
    if (!memoriesLoaded) {
      const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
      setAllMemories(data ?? [])
      setMemoriesLoaded(true)
    }
  }

  async function openPicker() {
    await ensureMemoriesLoaded()
    setPickerSelection(new Set(selectedPlace?.linked_memory_ids ?? []))
    setShowPicker(true)
  }

  async function openMemoryCard() {
    await ensureMemoriesLoaded()
    setShowMemoryCard(true)
  }

  async function savePicker() {
    if (!selectedId) return
    const ids = Array.from(pickerSelection)
    await updatePlaceFields(selectedId, { linked_memory_ids: ids })
    setShowPicker(false)
  }

  function selectPlace(place: MapPlace | null) {
    if (!place) { setSelectedId(null); setEditing(false); setShowMemoryCard(false); return }
    setSelectedId(place.id)
    setEditing(false)
    setShowMemoryCard(false)
    setFlyTarget({ lat: place.lat, lng: place.lng, ts: Date.now() })
  }

  function flyToPlace(place: MapPlace) {
    setSelectedId(place.id)
    setEditing(false)
    setShowMemoryCard(false)
    setFlyTarget({ lat: place.lat, lng: place.lng, ts: Date.now() })
  }

  const linkedMemories = allMemories.filter(m => selectedPlace?.linked_memory_ids?.includes(m.id))

  const meta = selectedPlace?.metadata ?? {}
  const hasMemoryContent = linkedMemories.length > 0 || meta.what_happened_here || meta.funniest_moment || meta.journal_entry || meta.playlist_url || meta.voice_note_url || meta.rating

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ paddingTop: 64 }}>

      <div className="shrink-0 px-4 py-2.5 flex items-center gap-4" style={{ ...glass, borderBottom: '1px solid #E8DDD4' }}>
        <div className="shrink-0">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/60 leading-none">explore</p>
          <h1 className="text-lg font-bold text-[#2C1A0E] leading-tight">Places</h1>
        </div>

        <div className="flex-1 max-w-sm relative" ref={searchRef}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={inputSt}>
            <span className="text-[#7A6155]/35 text-sm">🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search any location in the world..."
              className="flex-1 bg-transparent text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/35 focus:outline-none"
            />
            {geoLoading && <span className="text-[#7A6155]/30 text-xs">...</span>}
            {query && !geoLoading && <button onClick={() => { setQuery(''); setGeoResults([]) }} className="text-[#7A6155]/30 hover:text-[#7A6155]/60 transition-colors text-base leading-none">×</button>}
          </div>
          {geoResults.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 rounded-xl overflow-hidden z-50 shadow-2xl" style={{ background: '#FAF8F5', border: '1px solid #E8DDD4' }}>
              {geoResults.map(r => (
                <button key={r.place_id} onClick={() => flyToGeo(r)} className="w-full text-left px-4 py-2.5 text-sm text-[#7A6155]/80 hover:bg-[#F5EFE8] hover:text-[#2C1A0E] transition-colors border-b border-[#E8DDD4] last:border-0">
                  <span className="font-medium">{r.display_name.split(',')[0]}</span>
                  <span className="text-[#7A6155]/35 text-xs ml-1.5">{r.display_name.split(',').slice(1, 3).join(',')}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 flex gap-4 text-xs text-[#7A6155]/45">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#c8a97e' }} />{wantCount} want to go</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#4ade80' }} />{visitedCount} visited</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        <div className="w-72 shrink-0 flex flex-col overflow-hidden" style={{ background: '#FAF8F5', borderRight: '1px solid #E8DDD4' }}>

          {!selectedPlace && (
            <>
              <div className="flex gap-1 p-3 shrink-0" style={{ borderBottom: '1px solid #E8DDD4' }}>
                {(['all', 'want-to-go', 'visited'] as Filter[]).map(f => (
                  <button key={f} onClick={() => setFilter(f)} className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize transition-all" style={{
                    background: filter === f ? '#FDF0E8' : 'transparent',
                    color: filter === f ? '#C4784A' : '#7A6155',
                    border: filter === f ? '1px solid #E8DDD4' : '1px solid transparent',
                  }}>
                    {f === 'want-to-go' ? '♥ want to go' : f === 'visited' ? '✓ visited' : 'all'}
                  </button>
                ))}
              </div>

              <div className="px-3 py-2.5 shrink-0" style={{ borderBottom: '1px solid #E8DDD4' }}>
                <input
                  value={sidebarSearch}
                  onChange={e => setSidebarSearch(e.target.value)}
                  placeholder="Filter your places..."
                  className="w-full px-3 py-2 rounded-lg text-xs text-[#2C1A0E] placeholder:text-[#7A6155]/30 focus:outline-none"
                  style={{ background: '#F5EFE8', border: '1px solid #E8DDD4' }}
                />
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-10 text-[#AE9B8E] text-xs">loading...</div>
                ) : filteredPlaces.length === 0 ? (
                  <div className="text-center py-10 px-4">
                    <p className="text-3xl mb-2">🗺️</p>
                    <p className="text-xs text-[#7A6155]/30">{places.length === 0 ? 'Click the map to add your first place' : 'No places match this filter'}</p>
                  </div>
                ) : (
                  <div className="p-2 flex flex-col gap-1">
                    {filteredPlaces.map(place => (
                      <button
                        key={place.id}
                        onClick={() => flyToPlace(place)}
                        className="w-full text-left px-3 py-2.5 rounded-xl transition-all group"
                        style={{ background: '#FFFFFF', border: '1px solid #E8DDD4' }}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs shrink-0" style={{ color: place.status === 'visited' ? '#4ade80' : '#c8a97e' }}>
                            {place.status === 'visited' ? '✓' : '♥'}
                          </span>
                          <p className="text-sm text-[#2C1A0E] font-medium truncate flex-1">{place.name}</p>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(place.metadata?.rating ?? 0) > 0 && (
                              <span className="text-[10px] text-[#C4784A]/50">{'♥'.repeat(place.metadata!.rating!)}</span>
                            )}
                            {(place.linked_memory_ids?.length ?? 0) > 0 && (
                              <span className="text-xs text-[#7A6155]/30">📷 {place.linked_memory_ids!.length}</span>
                            )}
                          </div>
                        </div>
                        {place.notes && <p className="text-xs text-[#7A6155]/35 mt-0.5 pl-5 truncate">{place.notes}</p>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedPlace && (
            <div className="flex flex-col flex-1 overflow-hidden">
              <div className="px-3 py-2.5 shrink-0 flex items-center gap-2" style={{ borderBottom: '1px solid #E8DDD4' }}>
                <button onClick={() => { setSelectedId(null); setEditing(false); setShowMemoryCard(false) }} className="text-[#7A6155]/40 hover:text-[#7A6155]/70 transition-colors text-sm">← back</button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {!editing ? (
                  <>
                    <div className="mb-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-[#2C1A0E] font-semibold text-base leading-tight">{selectedPlace.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: selectedPlace.status === 'visited' ? '#4ade80' : '#c8a97e' }}>
                            {selectedPlace.status === 'visited' ? '✓ Been there' : '♥ Want to go'}
                          </p>
                          {(selectedPlace.metadata?.rating ?? 0) > 0 && (
                            <div className="flex gap-0.5 mt-1.5">
                              {[1, 2, 3, 4, 5].map(i => (
                                <span key={i} style={{ fontSize: 13, color: i <= selectedPlace.metadata!.rating! ? '#C4784A' : '#E8DDD4' }}>♥</span>
                              ))}
                            </div>
                          )}
                          {selectedPlace.metadata?.visit_date && (
                            <p className="text-xs text-[#7A6155]/40 mt-1">
                              {new Date(selectedPlace.metadata.visit_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => openEdit(selectedPlace)} className="text-xs text-[#7A6155]/40 hover:text-[#7A6155]/70 transition-colors px-2 py-1 rounded-lg" style={{ background: '#F5EFE8' }}>Edit</button>
                          <button onClick={() => deletePlace(selectedPlace.id)} className="text-xs hover:text-red-400 transition-colors px-2 py-1 rounded-lg" style={{ color: 'rgba(248,113,113,0.6)', background: '#F5EFE8' }}>Delete</button>
                        </div>
                      </div>
                      {selectedPlace.notes && <p className="text-sm text-[#7A6155]/60 mt-3 leading-relaxed">{selectedPlace.notes}</p>}
                    </div>

                    <button
                      onClick={openMemoryCard}
                      className="w-full py-3 rounded-2xl text-sm font-semibold mb-4 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: hasMemoryContent
                          ? 'linear-gradient(135deg, #C4784A 0%, #E8A87C 100%)'
                          : 'linear-gradient(135deg, rgba(196,120,74,0.35) 0%, rgba(232,168,124,0.35) 100%)',
                        color: hasMemoryContent ? '#fff' : '#C4784A',
                        boxShadow: hasMemoryContent ? '0 4px 20px rgba(196,120,74,0.4)' : 'none',
                        border: hasMemoryContent ? 'none' : '1px dashed rgba(196,120,74,0.4)',
                      }}
                    >
                      {hasMemoryContent ? 'Open memory ✦' : 'Add memory details ✦'}
                    </button>

                    <div style={{ borderTop: '1px solid #E8DDD4', paddingTop: 16 }}>
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-[#7A6155]/45 tracking-wider uppercase">Photos</p>
                        <button onClick={openPicker} className="text-xs text-[#C4784A]/70 hover:text-[#C4784A] transition-colors">+ link</button>
                      </div>
                      {(selectedPlace.linked_memory_ids?.length ?? 0) === 0 ? (
                        <button onClick={openPicker} className="w-full py-4 rounded-xl text-xs text-[#7A6155]/25 border border-dashed border-[#E8DDD4] hover:border-[#C4784A]/30 hover:text-[#7A6155]/40 transition-all">
                          Link photos from Memories →
                        </button>
                      ) : (
                        <>
                          <div className="grid grid-cols-3 gap-1.5 mb-2">
                            {linkedMemories.slice(0, 6).map(m => (
                              <a key={m.id} href="/memories" className="aspect-square rounded-lg overflow-hidden block" style={{ background: '#F5EFE8' }}>
                                {m.image_url.endsWith('.pdf') ? (
                                  <div className="w-full h-full flex items-center justify-center text-lg">📄</div>
                                ) : (
                                  <img src={m.image_url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                                )}
                              </a>
                            ))}
                          </div>
                          {linkedMemories.length > 6 && <p className="text-xs text-[#7A6155]/30 text-center">+{linkedMemories.length - 6} more</p>}
                          <button onClick={openPicker} className="w-full mt-2 py-2 rounded-lg text-xs text-[#7A6155]/35 hover:text-[#7A6155]/60 transition-colors" style={{ background: '#F5EFE8' }}>Manage photos</button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <form onSubmit={saveEdit} className="flex flex-col gap-3">
                    <p className="text-[10px] tracking-widest uppercase text-[#C4784A]/60 mb-1">Edit place</p>

                    <input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Place name *" className="w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/40 focus:outline-none" style={inputSt} autoFocus required />
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notes..." rows={2} className="w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/40 focus:outline-none resize-none" style={inputSt} />

                    <div className="flex gap-2">
                      {(['want-to-go', 'visited'] as const).map(s => (
                        <button key={s} type="button" onClick={() => setEditStatus(s)} className="flex-1 py-2 rounded-xl text-xs font-medium transition-all" style={{
                          background: editStatus === s ? (s === 'visited' ? '#4ade80' : '#C4784A') : '#F5EFE8',
                          color: editStatus === s ? '#fff' : '#7A6155',
                          border: '1px solid #E8DDD4',
                        }}>
                          {s === 'want-to-go' ? '♥ Want to go' : '✓ Been there'}
                        </button>
                      ))}
                    </div>

                    <div style={{ borderTop: '1px solid #E8DDD4', marginTop: 4, paddingTop: 12 }}>
                      <p className="text-[10px] tracking-widest uppercase text-[#C4784A]/60 mb-3">Memory details</p>

                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-xs text-[#7A6155]/50 mb-1.5">Date rating</p>
                          <HeartRating value={editMeta.rating ?? 0} onChange={v => setEditMeta(prev => ({ ...prev, rating: v }))} />
                        </div>

                        <div>
                          <p className="text-xs text-[#7A6155]/50 mb-1">Visit date</p>
                          <input
                            type="date"
                            value={editMeta.visit_date ?? ''}
                            onChange={e => setEditMeta(prev => ({ ...prev, visit_date: e.target.value }))}
                            className="w-full px-3 py-2 rounded-xl text-sm text-[#2C1A0E] focus:outline-none"
                            style={inputSt}
                          />
                        </div>

                        <textarea
                          value={editMeta.what_happened_here ?? ''}
                          onChange={e => setEditMeta(prev => ({ ...prev, what_happened_here: e.target.value }))}
                          placeholder="What happened here..."
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/40 focus:outline-none resize-none"
                          style={inputSt}
                        />

                        <input
                          value={editMeta.funniest_moment ?? ''}
                          onChange={e => setEditMeta(prev => ({ ...prev, funniest_moment: e.target.value }))}
                          placeholder="Funniest moment..."
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/40 focus:outline-none"
                          style={inputSt}
                        />

                        <textarea
                          value={editMeta.journal_entry ?? ''}
                          onChange={e => setEditMeta(prev => ({ ...prev, journal_entry: e.target.value }))}
                          placeholder="Journal entry..."
                          rows={3}
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/40 focus:outline-none resize-none"
                          style={inputSt}
                        />

                        <input
                          value={editMeta.playlist_url ?? ''}
                          onChange={e => setEditMeta(prev => ({ ...prev, playlist_url: e.target.value }))}
                          placeholder="Playlist URL (Spotify, etc.)..."
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/40 focus:outline-none"
                          style={inputSt}
                        />

                        <input
                          value={editMeta.voice_note_url ?? ''}
                          onChange={e => setEditMeta(prev => ({ ...prev, voice_note_url: e.target.value }))}
                          placeholder="Voice note URL..."
                          className="w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#7A6155]/40 focus:outline-none"
                          style={inputSt}
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: '#C4784A', color: '#fff' }}>Save</button>
                      <button type="button" onClick={() => setEditing(false)} className="px-4 py-2 rounded-xl text-sm text-[#7A6155]/45 hover:text-[#2C1A0E] transition-colors">Cancel</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 relative">
          <PlacesMap
            places={places}
            selectedId={selectedId}
            flyTarget={flyTarget}
            onAdd={addPlace}
            onSelectPlace={selectPlace}
          />

          {selectedPlace && linkedMemories.length > 0 && linkedMemories.slice(0, 6).map((m, i) => {
            const pos = FLOAT_POSITIONS[i % FLOAT_POSITIONS.length]
            return (
              <div
                key={m.id}
                className="absolute"
                style={{
                  left: '50%',
                  top: '50%',
                  zIndex: 600,
                  pointerEvents: photosPopped ? 'auto' : 'none',
                  transform: photosPopped
                    ? `translate(calc(-50% + ${pos.dx}px), calc(-50% + ${pos.dy}px)) rotate(${pos.rot}deg)`
                    : `translate(-50%, -50%) scale(0) rotate(0deg)`,
                  opacity: photosPopped ? 1 : 0,
                  transition: `transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${photosPopped ? pos.delay : 0}ms, opacity 0.35s ease ${photosPopped ? pos.delay : 0}ms`,
                }}
                onClick={openMemoryCard}
              >
                <div style={{ animation: photosPopped ? `${pos.floatAnim} 3.2s ease-in-out ${pos.delay + 650}ms infinite` : 'none' }}>
                  <div
                    className="cursor-pointer transition-transform hover:scale-110 active:scale-95"
                    style={{
                      width: 130,
                      height: 130,
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: '4px solid rgba(255,255,255,0.95)',
                      boxShadow: '0 10px 32px rgba(0,0,0,0.42), 0 3px 12px rgba(44,26,14,0.28)',
                    }}
                  >
                    {m.image_url.toLowerCase().endsWith('.pdf') ? (
                      <div className="w-full h-full flex items-center justify-center" style={{ background: '#F5EFE8' }}>
                        <span className="text-xl">📄</span>
                      </div>
                    ) : (
                      <img src={m.image_url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showPicker && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
          <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col" style={{ background: '#FAF8F5', border: '1px solid #E8DDD4', maxHeight: '80vh' }}>
            <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid #E8DDD4' }}>
              <div>
                <p className="text-[#2C1A0E] font-semibold">Link Photos</p>
                <p className="text-xs text-[#7A6155]/40 mt-0.5">Select memories to link to <span className="text-[#C4784A]">{selectedPlace?.name}</span></p>
              </div>
              <button onClick={() => setShowPicker(false)} className="text-[#7A6155]/35 hover:text-[#7A6155]/70 text-2xl leading-none transition-colors">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {allMemories.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-3xl mb-2">📷</p>
                  <p className="text-sm text-[#7A6155]/35">No memories yet — upload some on the Memories page</p>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {allMemories.map(m => {
                    const sel = pickerSelection.has(m.id)
                    return (
                      <button key={m.id} onClick={() => setPickerSelection(prev => { const n = new Set(prev); sel ? n.delete(m.id) : n.add(m.id); return n })} className="aspect-square rounded-xl overflow-hidden relative transition-all" style={{ outline: sel ? '2px solid #C4784A' : '2px solid transparent', outlineOffset: 2 }}>
                        {m.image_url.endsWith('.pdf') ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ background: '#F5EFE8' }}>
                            <span className="text-2xl">📄</span>
                            <span className="text-xs text-[#7A6155]/40 truncate px-2 w-full text-center">{m.caption ?? 'PDF'}</span>
                          </div>
                        ) : (
                          <img src={m.image_url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                        )}
                        {sel && <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(196,120,74,0.25)' }}><span className="text-white text-xl font-bold drop-shadow">✓</span></div>}
                        {m.caption && <div className="absolute bottom-0 left-0 right-0 px-2 py-1" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.5))' }}><p className="text-xs text-white/80 truncate">{m.caption}</p></div>}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="px-6 py-4 flex items-center justify-between shrink-0" style={{ borderTop: '1px solid #E8DDD4' }}>
              <p className="text-xs text-[#7A6155]/35">{pickerSelection.size} selected</p>
              <div className="flex gap-3">
                <button onClick={() => setShowPicker(false)} className="px-4 py-2 rounded-xl text-sm text-[#7A6155]/45 hover:text-[#2C1A0E] transition-colors">Cancel</button>
                <button onClick={savePicker} className="px-5 py-2 rounded-xl text-sm font-semibold" style={{ background: '#C4784A', color: '#fff' }}>Save links</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showMemoryCard && selectedPlace && (
        <div
          className="fixed inset-0 z-[3000] flex items-center justify-center p-6"
          style={{ background: 'rgba(8,6,4,0.78)', backdropFilter: 'blur(14px)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowMemoryCard(false) }}
        >
          <div
            className="w-full max-w-2xl rounded-3xl overflow-hidden flex flex-col"
            style={{
              background: '#FAF8F5',
              border: '1px solid rgba(232,221,212,0.8)',
              maxHeight: '88vh',
              animation: 'memcard-in 0.42s cubic-bezier(0.34,1.56,0.64,1) both',
              boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            <div className="px-7 pt-7 pb-5 shrink-0" style={{ borderBottom: '1px solid #F0E6DC' }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] tracking-[0.35em] uppercase text-[#C4784A]/45 mb-1.5">memory pin</p>
                  <h2 className="text-2xl font-bold text-[#2C1A0E] leading-tight">{selectedPlace.name}</h2>
                  {selectedPlace.metadata?.visit_date && (
                    <p className="text-sm text-[#7A6155]/45 mt-1.5">
                      {new Date(selectedPlace.metadata.visit_date + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  )}
                  {(selectedPlace.metadata?.rating ?? 0) > 0 && (
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map(i => (
                        <span key={i} style={{ fontSize: 18, color: i <= selectedPlace.metadata!.rating! ? '#C4784A' : '#E8DDD4' }}>♥</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowMemoryCard(false)}
                  className="text-[#7A6155]/30 hover:text-[#7A6155]/65 text-3xl leading-none transition-colors shrink-0 mt-1"
                >×</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-7 py-6 flex flex-col gap-7">

              {linkedMemories.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/40 mb-3">Photos</p>
                  <div className="flex gap-2.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {linkedMemories.map(m => (
                      <div key={m.id} className="shrink-0 w-40 h-40 rounded-2xl overflow-hidden" style={{ background: '#F5EFE8' }}>
                        {m.image_url.endsWith('.pdf') ? (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📄</div>
                        ) : (
                          <img src={m.image_url} alt={m.caption ?? ''} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedPlace.metadata?.what_happened_here && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/40 mb-2.5">What happened here</p>
                  <p className="text-[#2C1A0E]/70 leading-relaxed text-sm">{selectedPlace.metadata.what_happened_here}</p>
                </div>
              )}

              {selectedPlace.metadata?.funniest_moment && (
                <div className="px-5 py-4 rounded-2xl" style={{ background: '#FDF0E8', borderLeft: '3px solid #C4784A' }}>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/40 mb-2">Funniest moment</p>
                  <p className="text-[#2C1A0E]/80 text-sm italic leading-relaxed">"{selectedPlace.metadata.funniest_moment}"</p>
                </div>
              )}

              {selectedPlace.metadata?.journal_entry && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/40 mb-2.5">Journal</p>
                  <p className="text-[#2C1A0E]/60 text-sm leading-loose italic" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                    {selectedPlace.metadata.journal_entry}
                  </p>
                </div>
              )}

              {selectedPlace.metadata?.playlist_url && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/40 mb-2.5">Playlist</p>
                  <a
                    href={selectedPlace.metadata.playlist_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: '#F5EFE8', border: '1px solid #E8DDD4' }}
                  >
                    <span className="text-xl shrink-0">🎵</span>
                    <span className="text-sm text-[#C4784A] truncate flex-1">Open playlist →</span>
                  </a>
                </div>
              )}

              {selectedPlace.metadata?.voice_note_url && (
                <div>
                  <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/40 mb-2.5">Voice note</p>
                  <audio
                    src={selectedPlace.metadata.voice_note_url}
                    controls
                    className="w-full rounded-xl"
                  />
                </div>
              )}

              {!hasMemoryContent && (
                <div className="text-center py-10">
                  <p className="text-5xl mb-4" style={{ opacity: 0.25 }}>✦</p>
                  <p className="text-sm text-[#7A6155]/40">No memory details yet.</p>
                  <p className="text-xs text-[#7A6155]/25 mt-1">Close and tap Edit to start filling this in.</p>
                </div>
              )}
            </div>

            <div className="px-7 py-4 shrink-0 flex justify-between items-center" style={{ borderTop: '1px solid #F0E6DC' }}>
              <button
                onClick={() => { setShowMemoryCard(false); openEdit(selectedPlace) }}
                className="text-xs text-[#C4784A]/60 hover:text-[#C4784A] transition-colors"
              >
                Edit memory →
              </button>
              <button
                onClick={() => setShowMemoryCard(false)}
                className="px-5 py-2 rounded-xl text-sm"
                style={{ background: '#F5EFE8', color: '#7A6155', border: '1px solid #E8DDD4' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes memcard-in {
          from { opacity: 0; transform: scale(0.86) translateY(24px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes photo-float-a {
          0%   { transform: translate(0px, 0px) rotate(0deg); }
          25%  { transform: translate(9px, -13px) rotate(1.5deg); }
          50%  { transform: translate(2px, -18px) rotate(0deg); }
          75%  { transform: translate(-7px, -10px) rotate(-1deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        @keyframes photo-float-b {
          0%   { transform: translate(0px, 0px) rotate(0deg); }
          30%  { transform: translate(-11px, -9px) rotate(-1.5deg); }
          60%  { transform: translate(7px, -16px) rotate(1deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
        @keyframes photo-float-c {
          0%   { transform: translate(0px, 0px) rotate(0deg); }
          20%  { transform: translate(6px, -15px) rotate(1deg); }
          55%  { transform: translate(-9px, -8px) rotate(-1.5deg); }
          80%  { transform: translate(4px, -20px) rotate(0.5deg); }
          100% { transform: translate(0px, 0px) rotate(0deg); }
        }
      `}</style>
    </div>
  )
}

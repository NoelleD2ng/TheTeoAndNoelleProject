'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { PlaceMetadata } from '@/lib/supabase'

export type { PlaceMetadata }

export type MapPlace = {
  id: string
  name: string
  lat: number
  lng: number
  notes: string
  status: 'want-to-go' | 'visited'
  linked_memory_ids?: string[]
  metadata?: PlaceMetadata
}

type Props = {
  places: MapPlace[]
  selectedId: string | null
  flyTarget: { lat: number; lng: number; ts: number; zoom?: number } | null
  onAdd: (place: Omit<MapPlace, 'id'>) => void
  onSelectPlace: (place: MapPlace | null) => void
}

const PIN_CSS = `
.map-pin{border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .25s cubic-bezier(.34,1.56,.64,1)}
.pin-visited{background:#4ade80;border:2.5px solid rgba(255,255,255,.92);animation:pin-pulse 2.6s ease-in-out infinite}
.pin-visited span{color:#064e2b;font-weight:900;line-height:1}
.pin-dream{background:rgba(200,169,126,.25);border:1.5px solid rgba(255,255,255,.25);filter:grayscale(.72) opacity(.52)}
.pin-dream span{color:rgba(100,60,20,.55);font-weight:700;line-height:1}
.pin-selected{transform:scale(1.32)!important}
.pin-visited.pin-selected{animation:pin-pulse-sel 1.5s ease-in-out infinite!important}
@keyframes pin-pulse{
  0%,100%{box-shadow:0 0 0 0 rgba(74,222,128,.55),0 0 16px rgba(74,222,128,.28),0 3px 12px rgba(0,0,0,.5)}
  50%{box-shadow:0 0 0 10px rgba(74,222,128,0),0 0 26px rgba(74,222,128,.5),0 3px 12px rgba(0,0,0,.5)}
}
@keyframes pin-pulse-sel{
  0%,100%{box-shadow:0 0 0 5px rgba(74,222,128,.45),0 0 32px rgba(74,222,128,.7),0 4px 20px rgba(0,0,0,.6)}
  50%{box-shadow:0 0 0 14px rgba(74,222,128,0),0 0 48px rgba(74,222,128,.9),0 4px 20px rgba(0,0,0,.6)}
}
`

function makeIcon(status: 'want-to-go' | 'visited', selected: boolean, memCount: number) {
  const isV = status === 'visited'
  const base = 26 + Math.min(memCount * 4, 18)
  const sz = selected ? base + 10 : base
  const cls = ['map-pin', isV ? 'pin-visited' : 'pin-dream', selected ? 'pin-selected' : ''].filter(Boolean).join(' ')
  const fs = Math.round(sz * 0.38)
  return L.divIcon({
    html: `<div class="${cls}" style="width:${sz}px;height:${sz}px"><span style="font-size:${fs}px">${isV ? '✓' : '♥'}</span></div>`,
    className: '',
    iconSize: [sz, sz],
    iconAnchor: [sz / 2, sz / 2],
  })
}


function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const ref = useRef(onMapClick)
  ref.current = onMapClick
  const [handlers] = useState(() => ({ click: (e: L.LeafletMouseEvent) => ref.current(e.latlng.lat, e.latlng.lng) }))
  useMapEvents(handlers)
  return null
}

type PlaceMarkerProps = {
  place: MapPlace
  isSelected: boolean
  markerJustClickedRef: React.MutableRefObject<boolean>
  onSelectPlace: (p: MapPlace) => void
  setAddState: (s: { lat: number; lng: number } | null) => void
}

function PlaceMarker({ place, isSelected, markerJustClickedRef, onSelectPlace, setAddState }: PlaceMarkerProps) {
  const markerRef = useRef<L.Marker | null>(null)
  const latestRef = useRef({ place, onSelectPlace, setAddState })
  latestRef.current = { place, onSelectPlace, setAddState }

  // Re-runs whenever the icon changes (selection/status/memCount) so we always bind
  // to the current _icon DOM element, bypassing Leaflet's event routing entirely.
  const memCount = place.linked_memory_ids?.length ?? 0
  useEffect(() => {
    const marker = markerRef.current
    if (!marker) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const icon = (marker as any)._icon as HTMLElement | undefined
    if (!icon) return

    function onClick(e: MouseEvent) {
      e.stopPropagation()
      markerJustClickedRef.current = true
      const { place, onSelectPlace, setAddState } = latestRef.current
      setAddState(null)
      onSelectPlace(place)
    }

    function onContextMenu(e: MouseEvent) {
      e.preventDefault()
      e.stopPropagation()
      markerJustClickedRef.current = true
      const { place, onSelectPlace, setAddState } = latestRef.current
      setAddState(null)
      onSelectPlace(place)
    }

    icon.addEventListener('click', onClick)
    icon.addEventListener('contextmenu', onContextMenu)
    return () => {
      icon.removeEventListener('click', onClick)
      icon.removeEventListener('contextmenu', onContextMenu)
    }
  // isSelected/place.status/memCount trigger icon change → new _icon element → re-bind
  }, [isSelected, place.status, memCount, markerJustClickedRef])

  return (
    <Marker
      ref={markerRef}
      position={[place.lat, place.lng]}
      icon={makeIcon(place.status, isSelected, memCount)}
    />
  )
}

function FlyToHandler({ target }: { target: Props['flyTarget'] }) {
  const map = useMap()
  useEffect(() => {
    if (!target) return
    const zoom = target.zoom ?? Math.max(map.getZoom(), 14)
    const duration = target.zoom ? 1.4 : 0.7
    map.flyTo([target.lat, target.lng], zoom, { duration, easeLinearity: 0.25 })
  }, [target, map])
  return null
}


const glass = { background: 'rgba(250,248,245,.97)', backdropFilter: 'blur(16px)', border: '1px solid #E8DDD4', boxShadow: '0 4px 24px rgba(44,26,14,.12)' }
const inputSt = { background: '#F5EFE8', border: '1px solid #E8DDD4' }
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none'

function StatusToggle({ value, onChange }: { value: 'want-to-go' | 'visited'; onChange: (v: 'want-to-go' | 'visited') => void }) {
  return (
    <div className="flex gap-2">
      {(['want-to-go', 'visited'] as const).map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{
          background: value === s ? (s === 'visited' ? '#4ade80' : '#C4784A') : '#F5EFE8',
          color: value === s ? (s === 'visited' ? '#064e2b' : '#fff') : '#7A6155',
          border: '1px solid #E8DDD4',
        }}>
          {s === 'want-to-go' ? '♥ Want to go' : '✓ Been there'}
        </button>
      ))}
    </div>
  )
}

function HeartRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button key={i} type="button"
          onClick={() => onChange(value === i ? 0 : i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-125"
          style={{ background: 'none', border: 'none', padding: 0, lineHeight: 1 }}
        >
          <span style={{ fontSize: 18, color: i <= (hover || value) ? '#C4784A' : '#E8DDD4' }}>♥</span>
        </button>
      ))}
    </div>
  )
}

export default function PlacesMap({ places, selectedId, flyTarget, onAdd, onSelectPlace }: Props) {
  const [addState, setAddState] = useState<{ lat: number; lng: number } | null>(null)
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newStatus, setNewStatus] = useState<'want-to-go' | 'visited'>('want-to-go')
  const [newMeta, setNewMeta] = useState<PlaceMetadata>({})
  const markerJustClicked = useRef(false)

  const visitedPath = places
    .filter(p => p.status === 'visited')
    .map(p => [p.lat, p.lng] as [number, number])

  function handleMapClick(lat: number, lng: number) {
    if (markerJustClicked.current) { markerJustClicked.current = false; return }
    if (addState) { setAddState(null); return }
    if (selectedId) { onSelectPlace(null); return }
    setAddState({ lat, lng })
    setNewName(''); setNewNotes(''); setNewStatus('want-to-go'); setNewMeta({})
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addState || !newName.trim()) return
    onAdd({ name: newName.trim(), lat: addState.lat, lng: addState.lng, notes: newNotes.trim(), status: newStatus, metadata: newMeta })
    setAddState(null)
    setNewMeta({})
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: PIN_CSS }} />
      <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} zoomControl={false} wheelPxPerZoomLevel={40} zoomSnap={0.5} zoomDelta={0.5}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapEvents onMapClick={handleMapClick} />
        <FlyToHandler target={flyTarget} />

        {visitedPath.length >= 2 && (
          <Polyline
            positions={visitedPath}
            pathOptions={{ color: '#C4784A', weight: 2.5, opacity: 0.38, dashArray: '6 14' }}
          />
        )}

        {places.map(place => (
          <PlaceMarker
            key={place.id}
            place={place}
            isSelected={place.id === selectedId}
            markerJustClickedRef={markerJustClicked}
            onSelectPlace={onSelectPlace}
            setAddState={setAddState}
          />
        ))}
      </MapContainer>

      {!addState && !selectedId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] text-xs text-white/20 pointer-events-none select-none">
          Click anywhere on the map to pin a place
        </div>
      )}

      {addState && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-96 rounded-2xl shadow-2xl flex flex-col" style={{ ...glass, maxHeight: 'calc(100vh - 120px)' }}>
          <div className="px-5 pt-5 pb-3 shrink-0">
            <p className="text-[10px] tracking-widest uppercase text-[#c8a97e]/70">Pin a place</p>
          </div>
          <form onSubmit={handleAdd} className="flex flex-col overflow-y-auto px-5 pb-5" style={{ gap: 12 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Place name *" className={inputCls} style={inputSt} autoFocus required />
            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="What's special about this place..." rows={2} className={`${inputCls} resize-none`} style={inputSt} />
            <StatusToggle value={newStatus} onChange={setNewStatus} />

            <div style={{ borderTop: '1px solid #E8DDD4', paddingTop: 12, marginTop: 4 }}>
              <p className="text-[10px] tracking-widest uppercase text-[#C4784A]/60 mb-3">Memory details</p>
              <div className="flex flex-col" style={{ gap: 12 }}>
                <div>
                  <p className="text-xs text-[#7A6155]/50 mb-1.5">Date rating</p>
                  <HeartRating value={newMeta.rating ?? 0} onChange={v => setNewMeta(prev => ({ ...prev, rating: v }))} />
                </div>

                <div>
                  <p className="text-xs text-[#7A6155]/50 mb-1">Visit date</p>
                  <input
                    type="date"
                    value={newMeta.visit_date ?? ''}
                    onChange={e => setNewMeta(prev => ({ ...prev, visit_date: e.target.value }))}
                    className={inputCls}
                    style={inputSt}
                  />
                </div>

                <textarea
                  value={newMeta.what_happened_here ?? ''}
                  onChange={e => setNewMeta(prev => ({ ...prev, what_happened_here: e.target.value }))}
                  placeholder="What happened here..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                  style={inputSt}
                />

                <input
                  value={newMeta.funniest_moment ?? ''}
                  onChange={e => setNewMeta(prev => ({ ...prev, funniest_moment: e.target.value }))}
                  placeholder="Funniest moment..."
                  className={inputCls}
                  style={inputSt}
                />

                <textarea
                  value={newMeta.journal_entry ?? ''}
                  onChange={e => setNewMeta(prev => ({ ...prev, journal_entry: e.target.value }))}
                  placeholder="Journal entry..."
                  rows={3}
                  className={`${inputCls} resize-none`}
                  style={inputSt}
                />

                <input
                  value={newMeta.playlist_url ?? ''}
                  onChange={e => setNewMeta(prev => ({ ...prev, playlist_url: e.target.value }))}
                  placeholder="Playlist URL (Spotify, etc.)..."
                  className={inputCls}
                  style={inputSt}
                />

                <input
                  value={newMeta.voice_note_url ?? ''}
                  onChange={e => setNewMeta(prev => ({ ...prev, voice_note_url: e.target.value }))}
                  placeholder="Voice note URL..."
                  className={inputCls}
                  style={inputSt}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: '#C4784A', color: '#fff' }}>Save Pin</button>
              <button type="button" onClick={() => setAddState(null)} className="px-4 py-2 rounded-xl text-sm text-[#7A6155]/45 hover:text-[#2C1A0E] transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

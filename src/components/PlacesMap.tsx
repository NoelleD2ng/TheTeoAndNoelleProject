'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MapPlace = {
  id: string
  name: string
  lat: number
  lng: number
  notes: string
  status: 'want-to-go' | 'visited'
  linked_memory_ids?: string[]
}

type Props = {
  places: MapPlace[]
  selectedId: string | null
  flyTarget: { lat: number; lng: number; ts: number } | null
  onAdd: (place: Omit<MapPlace, 'id'>) => void
  onSelectPlace: (place: MapPlace | null) => void
}

function makeIcon(status: 'want-to-go' | 'visited', selected: boolean) {
  const bg = status === 'visited' ? '#4ade80' : '#c8a97e'
  const symbol = status === 'visited' ? '✓' : '♥'
  const size = selected ? 34 : 26
  const border = selected ? '3px solid #fff' : '2.5px solid rgba(255,255,255,0.85)'
  const shadow = selected
    ? '0 0 0 4px rgba(200,169,126,0.4), 0 3px 14px rgba(0,0,0,0.7)'
    : '0 2px 12px rgba(0,0,0,0.65)'
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:${border};box-shadow:${shadow};display:flex;align-items:center;justify-content:center;cursor:pointer;"><span style="font-size:${selected ? 14 : 11}px;color:#080d1a;font-weight:900;line-height:1;">${symbol}</span></div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

const glass = { background: 'rgba(8,13,26,0.92)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.15)' }
const inputSt = { background: 'rgba(255,255,255,0.09)', border: '1px solid rgba(255,255,255,0.18)' }
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder:text-white/50 focus:outline-none'

type AddState = { lat: number; lng: number } | null

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: e => onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function FlyToHandler({ target }: { target: { lat: number; lng: number; ts: number } | null }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.lat, target.lng], Math.max(map.getZoom(), 6), { duration: 1.2 })
  }, [target, map])
  return null
}

function StatusToggle({ value, onChange }: { value: 'want-to-go' | 'visited'; onChange: (v: 'want-to-go' | 'visited') => void }) {
  return (
    <div className="flex gap-2">
      {(['want-to-go', 'visited'] as const).map(s => (
        <button key={s} type="button" onClick={() => onChange(s)} className="flex-1 py-2 rounded-xl text-sm font-medium transition-all" style={{
          background: value === s ? (s === 'visited' ? '#4ade80' : '#c8a97e') : 'rgba(255,255,255,0.07)',
          color: value === s ? '#080d1a' : 'rgba(255,255,255,0.55)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {s === 'want-to-go' ? '♥ Want to go' : '✓ Been there'}
        </button>
      ))}
    </div>
  )
}

export default function PlacesMap({ places, selectedId, flyTarget, onAdd, onSelectPlace }: Props) {
  const [addState, setAddState] = useState<AddState>(null)
  const [newName, setNewName] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [newStatus, setNewStatus] = useState<'want-to-go' | 'visited'>('want-to-go')

  function handleMapClick(lat: number, lng: number) {
    if (addState) { setAddState(null); return }
    onSelectPlace(null)
    setAddState({ lat, lng })
    setNewName(''); setNewNotes(''); setNewStatus('want-to-go')
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addState || !newName.trim()) return
    onAdd({ name: newName.trim(), lat: addState.lat, lng: addState.lng, notes: newNotes.trim(), status: newStatus })
    setAddState(null)
  }

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }} zoomControl={false}>
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapEvents onMapClick={handleMapClick} />
        <FlyToHandler target={flyTarget} />
        {places.map(place => (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={makeIcon(place.status, place.id === selectedId)}
            eventHandlers={{
              click: e => {
                e.originalEvent.stopPropagation()
                setAddState(null)
                onSelectPlace(place)
              }
            }}
          />
        ))}
      </MapContainer>

      {!addState && !selectedId && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] text-xs text-white/25 pointer-events-none select-none">
          Click anywhere on the map to pin a place
        </div>
      )}

      {addState && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-80 rounded-2xl p-5 shadow-2xl" style={glass}>
          <p className="text-[10px] tracking-widest uppercase text-[#c8a97e]/70 mb-3">Add a place</p>
          <form onSubmit={handleAdd} className="flex flex-col gap-3">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Place name *" className={inputCls} style={inputSt} autoFocus required />
            <textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Notes — restaurants, things to do..." rows={2} className={`${inputCls} resize-none`} style={inputSt} />
            <StatusToggle value={newStatus} onChange={setNewStatus} />
            <div className="flex gap-2 pt-1">
              <button type="submit" className="flex-1 py-2 rounded-xl text-sm font-semibold" style={{ background: '#c8a97e', color: '#080d1a' }}>Save Pin</button>
              <button type="button" onClick={() => setAddState(null)} className="px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

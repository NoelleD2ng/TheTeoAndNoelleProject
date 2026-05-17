'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import SpotifyPlayer from '@/components/SpotifyPlayer'

// ── Types ─────────────────────────────────────────────────────────────────

type UserKey = 'teo' | 'noelle'
type UserStatus = { connected: boolean; display_name?: string; avatar_url?: string | null }
type Status = Record<UserKey, UserStatus>

type NowPlayingTrack = {
  id: string; name: string; artists: string[]; album: string
  albumArt?: string; duration: number; progress: number; url: string
}
type NowPlayingData = { playing: boolean; connected?: boolean; track?: NowPlayingTrack | null }

type SpotifyTrack = {
  id: string; uri: string; name: string
  artists: { name: string }[]
  album: { name: string; images: { url: string }[] }
  duration_ms: number
  external_urls: { spotify: string }
}
type SpotifyArtist = {
  id: string; name: string
  images: { url: string }[]
  genres: string[]
  external_urls: { spotify: string }
}

// ── Constants ─────────────────────────────────────────────────────────────

const USERS: UserKey[] = ['teo', 'noelle']
const LABELS: Record<UserKey, string> = { teo: 'Teo', noelle: 'Noelle' }
const COLORS: Record<UserKey, string> = { teo: '#C4784A', noelle: '#9B6B9E' }
const glass = {
  background: 'rgba(250,248,245,.97)',
  backdropFilter: 'blur(16px)',
  border: '1px solid #E8DDD4',
  boxShadow: '0 4px 24px rgba(44,26,14,.10)',
}
const inputSt = { background: '#F5EFE8', border: '1px solid #E8DDD4' }
const inputCls = 'w-full px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none'

function fmtMs(ms: number) {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// ── NowPlayingCard ────────────────────────────────────────────────────────

function NowPlayingCard({
  user, status, data,
}: { user: UserKey; status: UserStatus; data: NowPlayingData | null }) {
  if (!status.connected) {
    return (
      <div className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center" style={{ ...glass, minHeight: 148 }}>
        <span style={{ fontSize: 26 }}>🎵</span>
        <p className="text-xs text-[#AE9B8E]">Not connected</p>
        <a
          href={`/api/spotify/login?user=${user}`}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: COLORS[user] }}
        >
          Connect Spotify
        </a>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="rounded-2xl p-5 flex items-center justify-center" style={{ ...glass, minHeight: 148 }}>
        <p className="text-xs text-[#AE9B8E] animate-pulse">Loading…</p>
      </div>
    )
  }

  if (data.connected === false) {
    return (
      <div className="rounded-2xl p-5 flex flex-col items-center gap-3 text-center" style={{ ...glass, minHeight: 148 }}>
        <p className="text-xs text-[#AE9B8E]">Token expired — reconnect</p>
        <a
          href={`/api/spotify/login?user=${user}`}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-opacity hover:opacity-85"
          style={{ background: COLORS[user] }}
        >
          Reconnect
        </a>
      </div>
    )
  }

  const { track, playing } = data

  if (!track) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ ...glass, minHeight: 148 }}>
        <div className="w-14 h-14 rounded-xl bg-[#F5EFE8] flex items-center justify-center shrink-0">
          <span style={{ fontSize: 22 }}>🎵</span>
        </div>
        <div>
          <p className="text-[10px] text-[#AE9B8E] uppercase tracking-widest mb-1">Nothing Playing</p>
          <p className="text-sm text-[#7A6155]">Open Spotify to listen</p>
        </div>
      </div>
    )
  }

  return (
    <a
      href={track.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-2xl overflow-hidden hover:opacity-90 transition-opacity"
      style={glass}
    >
      <div className="flex gap-3 p-4">
        {track.albumArt && (
          <div className="shrink-0 rounded-xl overflow-hidden shadow-sm" style={{ width: 56, height: 56 }}>
            <Image src={track.albumArt} alt={track.album} width={56} height={56} className="object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            {playing && <span style={{ color: '#1DB954', fontSize: 8 }}>▶</span>}
            <p className="text-[10px] text-[#AE9B8E] uppercase tracking-widest">
              {playing ? 'Now Playing' : 'Last Played'}
            </p>
          </div>
          <p className="text-sm font-semibold text-[#2C1A0E] truncate">{track.name}</p>
          <p className="text-xs text-[#7A6155] truncate">{track.artists.join(', ')}</p>
          <p className="text-[10px] text-[#AE9B8E] truncate mt-0.5">{track.album}</p>
        </div>
      </div>
      {playing && (
        <div className="px-4 pb-3">
          <div className="h-1 rounded-full bg-[#E8DDD4] overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (track.progress / track.duration) * 100)}%`,
                background: COLORS[user],
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-[#AE9B8E]">{fmtMs(track.progress)}</span>
            <span className="text-[9px] text-[#AE9B8E]">{fmtMs(track.duration)}</span>
          </div>
        </div>
      )}
    </a>
  )
}

// ── TrackRow ──────────────────────────────────────────────────────────────

function TrackRow({
  track, index, onAdd, added, onPlay,
}: { track: SpotifyTrack; index?: number; onAdd?: (t: SpotifyTrack) => void; added?: boolean; onPlay?: (t: SpotifyTrack) => void }) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-[#E8DDD4]/50 last:border-0 hover:bg-[#F5EFE8]/60 rounded-xl transition-colors group">
      {onPlay && (
        <button
          onClick={() => onPlay(track)}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs transition-all opacity-0 group-hover:opacity-100"
          style={{ background: '#C4784A' }}
        >
          ▶
        </button>
      )}
      {!onPlay && index !== undefined && (
        <span className="w-5 text-right shrink-0 text-xs text-[#AE9B8E]">{index + 1}</span>
      )}
      {onPlay && index !== undefined && (
        <span className="w-5 text-right shrink-0 text-xs text-[#AE9B8E] group-hover:hidden">{index + 1}</span>
      )}
      {track.album.images[0] && (
        <div className="shrink-0 rounded overflow-hidden" style={{ width: 36, height: 36 }}>
          <Image src={track.album.images[0].url} alt={track.album.name} width={36} height={36} className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2C1A0E] truncate">{track.name}</p>
        <p className="text-xs text-[#7A6155] truncate">
          {track.artists.map(a => a.name).join(', ')} · {track.album.name}
        </p>
      </div>
      <span className="text-xs text-[#AE9B8E] shrink-0">{fmtMs(track.duration_ms)}</span>
      {onAdd && (
        <button
          onClick={() => onAdd(track)}
          disabled={added}
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all"
          style={{ background: added ? '#4ade80' : '#C4784A', color: '#fff', opacity: added ? 0.7 : 1 }}
        >
          {added ? '✓' : '+'}
        </button>
      )}
    </div>
  )
}

// ── ArtistCard ────────────────────────────────────────────────────────────

function ArtistRow({ artist, index }: { artist: SpotifyArtist; index: number }) {
  return (
    <a
      href={artist.external_urls.spotify}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 py-2.5 px-2 -mx-2 border-b border-[#E8DDD4]/50 last:border-0 hover:bg-[#F5EFE8]/60 rounded-xl transition-colors"
    >
      <span className="w-5 text-right shrink-0 text-xs text-[#AE9B8E]">{index + 1}</span>
      {artist.images[0] && (
        <div className="shrink-0 rounded-full overflow-hidden" style={{ width: 40, height: 40 }}>
          <Image src={artist.images[0].url} alt={artist.name} width={40} height={40} className="object-cover" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#2C1A0E] truncate">{artist.name}</p>
        {artist.genres?.[0] && (
          <p className="text-xs text-[#7A6155] capitalize truncate">{artist.genres[0]}</p>
        )}
      </div>
    </a>
  )
}

// ── PlaylistBuilder ───────────────────────────────────────────────────────

type CreatedPlaylist = { name: string; url: string; id: string; tracks: SpotifyTrack[] }

function PlaylistBuilder({
  status, activeListener, deviceId,
}: { status: Status; activeListener: UserKey | null; deviceId: string | null }) {
  const connected = USERS.filter(u => status[u].connected)
  const [creatorUser, setCreatorUser] = useState<UserKey>(connected[0] ?? 'teo')
  const [name, setName] = useState('')
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState<SpotifyTrack[]>([])
  const [searching, setSearching] = useState(false)
  const [queue, setQueue] = useState<SpotifyTrack[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [created, setCreated] = useState<CreatedPlaylist | null>(null)
  const [playingPlaylist, setPlayingPlaylist] = useState(false)
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!searchQ.trim()) { setSearchResults([]); return }
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setSearching(true)
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/spotify/search?user=${creatorUser}&q=${encodeURIComponent(searchQ)}`)
        const data = await res.json() as { tracks?: { items: SpotifyTrack[] } }
        setSearchResults(data.tracks?.items ?? [])
      } finally {
        setSearching(false)
      }
    }, 380)
  }, [searchQ, creatorUser])

  async function handleCreate() {
    if (!name.trim() || queue.length === 0 || creating) return
    setCreating(true)
    setCreateError(null)
    try {
      const res = await fetch('/api/spotify/create-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: creatorUser,
          name,
          description: 'Made with love on Teo & Noelle ♥',
          trackUris: queue.map(t => t.uri),
        }),
      })
      const data = await res.json() as { url?: string; id?: string; error?: string }
      if (data.url && data.id) {
        setCreated({ name, url: data.url, id: data.id, tracks: [...queue] })
        setQueue([])
        setName('')
        setSearchQ('')
        setSearchResults([])
      } else {
        setCreateError(data.error ?? 'Something went wrong — try again')
      }
    } catch {
      setCreateError('Network error — check your connection')
    } finally {
      setCreating(false)
    }
  }

  async function handlePlayPlaylist() {
    if (!created || !activeListener || !deviceId) return
    setPlayingPlaylist(true)
    await fetch('/api/spotify/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user: activeListener,
        deviceId,
        contextUri: `spotify:playlist:${created.id}`,
      }),
    })
    setTimeout(() => setPlayingPlaylist(false), 1500)
  }

  if (connected.length === 0) {
    return (
      <p className="text-center text-[#AE9B8E] py-12 text-sm">
        Connect at least one Spotify account above to build playlists.
      </p>
    )
  }

  // ── Show created playlist ──────────────────────────────────────────────
  if (created) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] tracking-widest uppercase text-[#4ade80]/80 mb-1">Saved to Spotify ✓</p>
            <p className="text-lg font-semibold text-[#2C1A0E]">{created.name}</p>
            <p className="text-xs text-[#7A6155]">{created.tracks.length} songs</p>
          </div>
          <div className="flex gap-2">
            {activeListener && deviceId && (
              <button
                onClick={handlePlayPlaylist}
                disabled={playingPlaylist}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: COLORS[activeListener] }}
              >
                {playingPlaylist ? '▶ Playing…' : '▶ Play Now'}
              </button>
            )}
            <a
              href={created.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:opacity-90"
              style={{ background: '#F5EFE8', color: '#7A6155', border: '1px solid #E8DDD4' }}
            >
              Open in Spotify
            </a>
          </div>
        </div>

        <div className="max-h-72 overflow-y-auto rounded-xl" style={{ border: '1px solid #E8DDD4' }}>
          <div className="p-2">
            {created.tracks.map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} track={t} index={i} />
            ))}
          </div>
        </div>

        <button
          onClick={() => setCreated(null)}
          className="text-sm text-[#AE9B8E] hover:text-[#C4784A] transition-colors text-center"
        >
          + Make another playlist
        </button>
      </div>
    )
  }

  // ── Builder ────────────────────────────────────────────────────────────
  const addedIds = new Set(queue.map(t => t.id))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Search */}
      <div className="flex flex-col gap-3">
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          placeholder="Search for a song…"
          className={inputCls}
          style={inputSt}
        />
        <div>
          {searching && <p className="text-xs text-[#AE9B8E] py-2">Searching…</p>}
          {searchResults.map(t => (
            <TrackRow
              key={t.id}
              track={t}
              onAdd={tr => { if (!addedIds.has(tr.id)) setQueue(q => [...q, tr]) }}
              added={addedIds.has(t.id)}
            />
          ))}
          {!searching && searchQ && searchResults.length === 0 && (
            <p className="text-xs text-[#AE9B8E] py-2">No results</p>
          )}
        </div>
      </div>

      {/* Queue + create */}
      <div className="flex flex-col gap-3 p-4 rounded-2xl" style={{ border: '1px solid #E8DDD4' }}>
        <p className="text-[10px] tracking-widest uppercase text-[#C4784A]/60">Your Playlist</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Playlist name…"
          className={inputCls}
          style={inputSt}
        />
        {queue.length === 0 ? (
          <p className="text-xs text-[#AE9B8E] text-center py-6">Search and add songs on the left</p>
        ) : (
          <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
            {queue.map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex items-center gap-2 py-1.5 border-b border-[#E8DDD4]/50 last:border-0">
                <p className="flex-1 text-sm text-[#2C1A0E] truncate">{t.name}</p>
                <p className="text-xs text-[#AE9B8E] truncate max-w-[100px]">{t.artists[0]?.name}</p>
                <button
                  onClick={() => setQueue(q => q.filter((_, j) => j !== i))}
                  className="text-[#AE9B8E] hover:text-[#C4784A] transition-colors text-lg leading-none"
                >×</button>
              </div>
            ))}
          </div>
        )}
        {createError && (
          <p className="text-xs text-red-500 px-1">{createError}</p>
        )}
        <div className="flex gap-2 items-center pt-1">
          {connected.length > 1 && (
            <select
              value={creatorUser}
              onChange={e => setCreatorUser(e.target.value as UserKey)}
              className="flex-1 px-3 py-2.5 rounded-xl text-sm text-[#2C1A0E] focus:outline-none"
              style={inputSt}
            >
              {connected.map(u => (
                <option key={u} value={u}>Save to {LABELS[u]}&apos;s Spotify</option>
              ))}
            </select>
          )}
          <button
            onClick={handleCreate}
            disabled={!name.trim() || queue.length === 0 || creating}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: '#C4784A' }}
          >
            {creating ? 'Saving…' : 'Create ♥'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────

type Tab = 'top-tracks' | 'top-artists' | 'liked' | 'playlist'
type TimeRange = 'short_term' | 'medium_term' | 'long_term'
const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  short_term: '4 Weeks', medium_term: '6 Months', long_term: 'All Time',
}

export default function SpotifyPage() {
  const [status, setStatus] = useState<Status>({ teo: { connected: false }, noelle: { connected: false } })
  const [nowPlaying, setNowPlaying] = useState<Record<UserKey, NowPlayingData | null>>({ teo: null, noelle: null })
  const [tab, setTab] = useState<Tab>('top-tracks')
  const [browseUser, setBrowseUser] = useState<UserKey>('teo')
  const [timeRange, setTimeRange] = useState<TimeRange>('medium_term')
  const [topTracks, setTopTracks] = useState<Partial<Record<string, SpotifyTrack[]>>>({})
  const [topArtists, setTopArtists] = useState<Partial<Record<string, SpotifyArtist[]>>>({})
  const [liked, setLiked] = useState<Partial<Record<UserKey, SpotifyTrack[]>>>({})
  const [loadingTab, setLoadingTab] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [activeListener, setActiveListener] = useState<UserKey | null>(null)
  const [deviceId, setDeviceId] = useState<string | null>(null)

  // Check URL params for connection feedback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'true') setToast('Spotify connected!')
    if (params.get('error')) setToast('Connection failed — try again')
    if (params.get('connected') || params.get('error')) {
      window.history.replaceState({}, '', '/spotify')
    }
    setTimeout(() => setToast(null), 4000)
  }, [])

  // Init listener from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('spotify-listener') as UserKey | null
    if (saved === 'teo' || saved === 'noelle') setActiveListener(saved)
  }, [])

  const changeListener = (u: UserKey) => {
    setActiveListener(u)
    setDeviceId(null)
    localStorage.setItem('spotify-listener', u)
  }

  async function handlePlay(track: SpotifyTrack) {
    if (!activeListener || !deviceId) {
      setToast('Select who\'s listening first')
      setTimeout(() => setToast(null), 3000)
      return
    }
    await fetch('/api/spotify/play', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: activeListener, uris: [track.uri], deviceId }),
    })
  }

  // Load connection status
  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/spotify/status')
    const data = await res.json() as Status
    setStatus(data)
    const first = USERS.find(u => data[u].connected)
    if (first) setBrowseUser(u => u !== 'teo' && u !== 'noelle' ? first : u)
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  // Poll now-playing every 12s
  useEffect(() => {
    const connected = USERS.filter(u => status[u].connected)
    if (connected.length === 0) return

    const poll = async () => {
      await Promise.all(connected.map(async user => {
        try {
          const res = await fetch(`/api/spotify/now-playing?user=${user}`)
          const data = await res.json() as NowPlayingData
          setNowPlaying(prev => ({ ...prev, [user]: data }))
        } catch { /* ignore */ }
      }))
    }
    poll()
    const id = setInterval(poll, 12000)
    return () => clearInterval(id)
  }, [status])

  // Load tab content
  useEffect(() => {
    if (tab === 'playlist') return
    if (!status[browseUser]?.connected) return

    const ctrl = new AbortController()
    setLoadingTab(true)

    const load = async () => {
      try {
        if (tab === 'top-tracks') {
          const key = `${browseUser}:${timeRange}`
          if (topTracks[key]) { setLoadingTab(false); return }
          const res = await fetch(`/api/spotify/top?user=${browseUser}&type=tracks&range=${timeRange}`, { signal: ctrl.signal })
          const data = await res.json() as { items?: SpotifyTrack[] }
          setTopTracks(prev => ({ ...prev, [key]: data.items ?? [] }))
        } else if (tab === 'top-artists') {
          const key = `${browseUser}:${timeRange}`
          if (topArtists[key]) { setLoadingTab(false); return }
          const res = await fetch(`/api/spotify/top?user=${browseUser}&type=artists&range=${timeRange}`, { signal: ctrl.signal })
          const data = await res.json() as { items?: SpotifyArtist[] }
          setTopArtists(prev => ({ ...prev, [key]: data.items ?? [] }))
        } else if (tab === 'liked') {
          if (liked[browseUser]) { setLoadingTab(false); return }
          const res = await fetch(`/api/spotify/liked?user=${browseUser}`, { signal: ctrl.signal })
          const data = await res.json() as { items?: { track: SpotifyTrack }[] }
          setLiked(prev => ({ ...prev, [browseUser]: data.items?.map(i => i.track) ?? [] }))
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return
      } finally {
        if (!ctrl.signal.aborted) setLoadingTab(false)
      }
    }
    load()
    return () => { ctrl.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, browseUser, timeRange, status])

  const connected = USERS.filter(u => status[u].connected)
  const tracksKey = `${browseUser}:${timeRange}`
  const artistsKey = `${browseUser}:${timeRange}`

  async function handleDisconnect(user: UserKey) {
    await fetch('/api/spotify/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user }),
    })
    setStatus(prev => ({ ...prev, [user]: { connected: false } }))
    setNowPlaying(prev => ({ ...prev, [user]: null }))
    setToast(`${LABELS[user]}'s Spotify disconnected`)
    setTimeout(() => setToast(null), 3000)
  }

  const tabs = [
    { key: 'top-tracks' as Tab, label: 'Top Tracks' },
    { key: 'top-artists' as Tab, label: 'Top Artists' },
    { key: 'liked' as Tab, label: 'Liked Songs' },
    { key: 'playlist' as Tab, label: '♥ Make Playlist' },
  ]

  return (
    <main className="min-h-screen pt-20 pb-16 px-4 md:px-8" style={{ background: '#FAF8F5' }}>
      <div className="max-w-4xl mx-auto">

        {/* Toast */}
        {toast && (
          <div
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium shadow-lg"
            style={{ background: '#2C1A0E', color: '#FAF8F5' }}
          >
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#AE9B8E] mb-2">Our Sound</p>
          <h1 className="font-serif text-3xl text-[#2C1A0E] mb-2" style={{ fontFamily: 'var(--font-serif)' }}>
            Music Together
          </h1>
          <p className="text-sm text-[#7A6155]">Teo and Noelle's Spotify universe</p>
        </div>

        {/* User cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {USERS.map(user => (
            <div key={user}>
              <div className="flex items-center gap-2 mb-2.5">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                  style={{ background: COLORS[user] }}
                >
                  {LABELS[user][0]}
                </div>
                <span className="text-sm font-medium text-[#2C1A0E]">{LABELS[user]}</span>
                {status[user].connected && (
                  <button
                    onClick={() => handleDisconnect(user)}
                    className="ml-auto text-[10px] text-[#AE9B8E] hover:text-[#C4784A] transition-colors"
                  >
                    disconnect
                  </button>
                )}
              </div>
              <NowPlayingCard user={user} status={status[user]} data={nowPlaying[user]} />
            </div>
          ))}
        </div>

        {/* Player + listener selector */}
        {connected.length > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={glass}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] tracking-widest uppercase text-[#C4784A]/60">Listening as</p>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5EFE8', border: '1px solid #E8DDD4' }}>
                {connected.map(u => (
                  <button
                    key={u}
                    onClick={() => changeListener(u)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: activeListener === u ? COLORS[u] : 'transparent',
                      color: activeListener === u ? '#fff' : '#7A6155',
                    }}
                  >
                    {LABELS[u]}
                  </button>
                ))}
              </div>
            </div>
            {activeListener && status[activeListener].connected ? (
              <SpotifyPlayer
                key={activeListener}
                user={activeListener}
                color={COLORS[activeListener]}
                onDeviceReady={setDeviceId}
              />
            ) : (
              <p className="text-xs text-[#AE9B8E] text-center py-2">Select who&apos;s listening above</p>
            )}
          </div>
        )}

        {/* Tabs — only shown when at least one user is connected */}
        {connected.length > 0 && (
          <>
            <div className="flex gap-1 mb-6 p-1 rounded-2xl" style={{ background: '#F5EFE8', border: '1px solid #E8DDD4' }}>
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                  style={{
                    background: tab === key ? '#fff' : 'transparent',
                    color: tab === key ? '#C4784A' : '#7A6155',
                    boxShadow: tab === key ? '0 1px 4px rgba(44,26,14,.08)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Selectors for browse tabs */}
            {tab !== 'playlist' && (
              <div className="flex gap-3 mb-5 flex-wrap">
                {/* User selector */}
                <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5EFE8', border: '1px solid #E8DDD4' }}>
                  {connected.map(u => (
                    <button
                      key={u}
                      onClick={() => setBrowseUser(u)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: browseUser === u ? COLORS[u] : 'transparent',
                        color: browseUser === u ? '#fff' : '#7A6155',
                      }}
                    >
                      {LABELS[u]}
                    </button>
                  ))}
                </div>
                {/* Time range selector (not for liked) */}
                {tab !== 'liked' && (
                  <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#F5EFE8', border: '1px solid #E8DDD4' }}>
                    {(Object.keys(TIME_RANGE_LABELS) as TimeRange[]).map(r => (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: timeRange === r ? '#C4784A' : 'transparent',
                          color: timeRange === r ? '#fff' : '#7A6155',
                        }}
                      >
                        {TIME_RANGE_LABELS[r]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab content */}
            <div className="rounded-2xl p-4" style={glass}>
              {tab === 'playlist' ? (
                <PlaylistBuilder status={status} activeListener={activeListener} deviceId={deviceId} />
              ) : loadingTab ? (
                <p className="text-center text-[#AE9B8E] py-12 text-sm animate-pulse">Loading…</p>
              ) : tab === 'top-tracks' ? (
                (topTracks[tracksKey] ?? []).length > 0 ? (
                  topTracks[tracksKey]!.map((t, i) => <TrackRow key={t.id} track={t} index={i} onPlay={handlePlay} />)
                ) : (
                  <p className="text-center text-[#AE9B8E] py-12 text-sm">No data yet</p>
                )
              ) : tab === 'top-artists' ? (
                (topArtists[artistsKey] ?? []).length > 0 ? (
                  (topArtists[artistsKey] as SpotifyArtist[]).map((a, i) => <ArtistRow key={a.id} artist={a} index={i} />)
                ) : (
                  <p className="text-center text-[#AE9B8E] py-12 text-sm">No data yet</p>
                )
              ) : tab === 'liked' ? (
                (liked[browseUser] ?? []).length > 0 ? (
                  liked[browseUser]!.map((t, i) => <TrackRow key={t.id} track={t} index={i} onPlay={handlePlay} />)
                ) : (
                  <p className="text-center text-[#AE9B8E] py-12 text-sm">No liked songs loaded</p>
                )
              ) : null}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

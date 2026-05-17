'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Image from 'next/image'

type UserKey = 'teo' | 'noelle'

interface SpotifySDKState {
  paused: boolean
  position: number
  duration: number
  track_window: {
    current_track: {
      id: string
      name: string
      artists: { name: string }[]
      album: { name: string; images: { url: string }[] }
    }
  }
}

interface SpotifyPlayerInstance {
  connect(): Promise<boolean>
  disconnect(): void
  addListener(event: 'ready', cb: (data: { device_id: string }) => void): void
  addListener(event: 'not_ready', cb: (data: { device_id: string }) => void): void
  addListener(event: 'player_state_changed', cb: (state: SpotifySDKState | null) => void): void
  removeListener(event: string): void
  togglePlay(): Promise<void>
  nextTrack(): Promise<void>
  previousTrack(): Promise<void>
  seek(positionMs: number): Promise<void>
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void
    Spotify: {
      Player: new (options: {
        name: string
        getOAuthToken: (cb: (token: string) => void) => void
        volume?: number
      }) => SpotifyPlayerInstance
    }
  }
}

type PlayerState = {
  paused: boolean
  position: number
  duration: number
  track: {
    name: string
    artists: string[]
    albumArt?: string
  } | null
}

type Props = {
  user: UserKey
  color: string
  onDeviceReady: (deviceId: string) => void
}

function fmtMs(ms: number) {
  const s = Math.round(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function SpotifyPlayer({ user, color, onDeviceReady }: Props) {
  const [ps, setPs] = useState<PlayerState>({ paused: true, position: 0, duration: 0, track: null })
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const playerRef = useRef<SpotifyPlayerInstance | null>(null)
  const onDeviceReadyRef = useRef(onDeviceReady)
  onDeviceReadyRef.current = onDeviceReady
  const posTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const getToken = useCallback(async () => {
    const res = await fetch(`/api/spotify/token?user=${user}`)
    const data = await res.json() as { token?: string }
    return data.token ?? ''
  }, [user])

  useEffect(() => {
    let player: SpotifyPlayerInstance | null = null
    setStatus('loading')

    const init = () => {
      player = new window.Spotify.Player({
        name: 'T & N ♥',
        getOAuthToken: cb => { getToken().then(cb) },
        volume: 0.7,
      })

      player.addListener('ready', ({ device_id }) => {
        setStatus('ready')
        onDeviceReadyRef.current(device_id)
      })

      player.addListener('not_ready', () => setStatus('loading'))

      player.addListener('player_state_changed', state => {
        if (!state) return
        const t = state.track_window.current_track
        setPs({
          paused: state.paused,
          position: state.position,
          duration: state.duration,
          track: {
            name: t.name,
            artists: t.artists.map(a => a.name),
            albumArt: t.album.images[0]?.url,
          },
        })
      })

      player.connect().then(ok => {
        if (!ok) {
          setStatus('error')
          setErrorMsg('Could not connect — Spotify Premium is required.')
        }
      })

      playerRef.current = player
    }

    if (window.Spotify?.Player) {
      init()
    } else {
      window.onSpotifyWebPlaybackSDKReady = init
      if (!document.querySelector('script[src*="spotify-player"]')) {
        const s = document.createElement('script')
        s.src = 'https://sdk.scdn.co/spotify-player.js'
        s.async = true
        document.body.appendChild(s)
      }
    }

    return () => {
      player?.disconnect()
      playerRef.current = null
    }
  }, [user, getToken])

  // Tick position while playing
  useEffect(() => {
    if (posTimer.current) clearInterval(posTimer.current)
    if (!ps.paused && ps.track) {
      posTimer.current = setInterval(() => {
        setPs(s => ({ ...s, position: Math.min(s.position + 1000, s.duration) }))
      }, 1000)
    }
    return () => { if (posTimer.current) clearInterval(posTimer.current) }
  }, [ps.paused, ps.track])

  if (status === 'error') {
    return <p className="text-xs text-[#C4784A] text-center py-1">{errorMsg}</p>
  }

  const { track, paused, position, duration } = ps
  const progress = duration > 0 ? (position / duration) * 100 : 0

  return (
    <div className="flex flex-col gap-3">
      {status === 'loading' && !track && (
        <p className="text-xs text-[#AE9B8E] text-center animate-pulse">Connecting player…</p>
      )}

      {track && (
        <>
          <div className="flex items-center gap-3">
            {track.albumArt && (
              <div className="shrink-0 rounded-xl overflow-hidden shadow-sm" style={{ width: 52, height: 52 }}>
                <Image src={track.albumArt} alt="" width={52} height={52} className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[#2C1A0E] truncate">{track.name}</p>
              <p className="text-xs text-[#7A6155] truncate">{track.artists.join(', ')}</p>
            </div>
          </div>

          <div>
            <div
              className="h-1.5 rounded-full bg-[#E8DDD4] overflow-hidden cursor-pointer"
              onClick={e => {
                const r = e.currentTarget.getBoundingClientRect()
                playerRef.current?.seek(Math.round(((e.clientX - r.left) / r.width) * duration))
              }}
            >
              <div
                className="h-full rounded-full transition-[width] duration-1000"
                style={{ width: `${progress}%`, background: color }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-[#AE9B8E]">{fmtMs(position)}</span>
              <span className="text-[9px] text-[#AE9B8E]">{fmtMs(duration)}</span>
            </div>
          </div>
        </>
      )}

      {!track && status === 'ready' && (
        <p className="text-xs text-[#AE9B8E] text-center">Click ▶ on any track to play</p>
      )}

      <div className="flex items-center justify-center gap-5">
        <button
          onClick={() => playerRef.current?.previousTrack()}
          className="text-[#7A6155] hover:text-[#2C1A0E] transition-colors"
          style={{ fontSize: 18 }}
        >
          ⏮
        </button>
        <button
          onClick={() => playerRef.current?.togglePlay()}
          className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: color, fontSize: 16 }}
        >
          {paused ? '▶' : '⏸'}
        </button>
        <button
          onClick={() => playerRef.current?.nextTrack()}
          className="text-[#7A6155] hover:text-[#2C1A0E] transition-colors"
          style={{ fontSize: 18 }}
        >
          ⏭
        </button>
      </div>
    </div>
  )
}

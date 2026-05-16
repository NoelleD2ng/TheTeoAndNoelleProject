'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      window.location.href = '/'
    } else {
      setError('Wrong password.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{
        background: `
          linear-gradient(to bottom, rgba(8,13,26,0.4) 0%, rgba(8,13,26,0.9) 100%),
          linear-gradient(135deg, #0d1b36 0%, #1a2a4a 50%, #0d1b36 100%)
        `,
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-light text-white tracking-wide"
            
          >
            Teo & Noelle
          </h1>
          <p className="mt-2 text-[10px] tracking-[0.5em] uppercase text-white/35">
            our little world
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-white/[0.08] p-8"
          style={{ background: 'rgba(10,18,40,0.7)', backdropFilter: 'blur(20px)' }}
        >
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-white/35 block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="enter our password"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder:text-white/20 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(200,169,126,0.5)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              required
            />
          </div>

          {error && (
            <p className="text-[#c8a97e]/70 text-xs text-center tracking-wide">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-all disabled:opacity-40"
            style={{ background: '#c8a97e', color: '#080d1a' }}
          >
            {loading ? 'entering...' : 'enter our world'}
          </button>
        </form>
      </div>
    </div>
  )
}

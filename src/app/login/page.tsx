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
      setError('Wrong password — try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#FAF8F5]">

      {/* Soft warm glow */}
      <div
        className="fixed top-0 left-0 w-full h-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(196,120,74,0.1) 0%, transparent 70%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-10">
          <h1
            className="text-5xl text-[#2C1A0E] tracking-wide"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}
          >
            Teo & Noelle
          </h1>
          <p className="mt-3 text-[10px] tracking-[0.5em] uppercase text-[#AE9B8E]">
            our little world
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-2xl border border-[#E8DDD4] bg-white p-8"
          style={{ boxShadow: '0 4px 24px rgba(44,26,14,0.08)' }}
        >
          <div>
            <label className="text-[10px] tracking-[0.2em] uppercase text-[#AE9B8E] block mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="enter our password"
              className="w-full px-4 py-3 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none transition-all bg-[#F5EFE8] border border-[#E8DDD4] focus:border-[#C4784A]/50"
              required
            />
          </div>

          {error && (
            <p className="text-[#C4784A]/80 text-xs text-center tracking-wide">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-sm font-medium tracking-wide transition-all disabled:opacity-40 bg-[#C4784A] text-white hover:bg-[#B36840]"
          >
            {loading ? 'entering...' : 'enter our world'}
          </button>
        </form>
      </div>
    </div>
  )
}

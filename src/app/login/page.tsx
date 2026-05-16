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
      setError('Wrong password. Try again 💔')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-rose-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-6xl mb-4">💕</p>
          <h1 className="text-2xl font-semibold text-stone-800">Teo & Noelle</h1>
          <p className="text-stone-400 text-sm mt-1">our little corner of the internet</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 flex flex-col gap-4"
        >
          <div>
            <label className="text-sm text-stone-500 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="enter our secret password"
              className="w-full px-4 py-2.5 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-rose-300 focus:ring-2 focus:ring-rose-100 transition-all"
              required
            />
          </div>

          {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-rose-400 hover:bg-rose-500 disabled:bg-rose-200 text-white rounded-xl py-2.5 text-sm font-medium transition-colors cursor-pointer"
          >
            {loading ? 'entering...' : 'enter our world'}
          </button>
        </form>
      </div>
    </div>
  )
}

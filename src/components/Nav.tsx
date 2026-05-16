'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/', label: 'Our Story', emoji: '💕' },
  { href: '/todos', label: 'To-Do Lists', emoji: '✅' },
  { href: '/plans', label: 'Plans', emoji: '📅' },
  { href: '/places', label: 'Places', emoji: '📍' },
  { href: '/bucket-list', label: 'Bucket List', emoji: '🌟' },
  { href: '/projects', label: 'Projects', emoji: '💻' },
  { href: '/memories', label: 'Memories', emoji: '📸' },
  { href: '/fun-facts', label: 'Fun Facts', emoji: '✨' },
  { href: '/date-ideas', label: 'Date Ideas', emoji: '💝' },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  const linkClass = (href: string) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors ${
      pathname === href
        ? 'bg-rose-100 text-rose-600 font-medium'
        : 'text-stone-500 hover:bg-rose-50 hover:text-rose-500'
    }`

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-rose-100 min-h-screen p-5 gap-5">
        <div className="text-center pt-2">
          <p className="text-xl font-semibold text-rose-500">Teo & Noelle</p>
          <p className="text-xs text-stone-400 mt-1">our little world 💕</p>
        </div>
        <nav className="flex flex-col gap-0.5 flex-1">
          {navItems.map(item => (
            <Link key={item.href} href={item.href} className={linkClass(item.href)}>
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <button
          onClick={handleSignOut}
          className="text-xs text-stone-300 hover:text-rose-400 transition-colors py-1 text-center"
        >
          sign out
        </button>
      </aside>

      {/* Mobile header */}
      <header className="md:hidden sticky top-0 z-50 bg-white border-b border-rose-100 px-4 py-3 flex items-center justify-between">
        <p className="text-lg font-semibold text-rose-500">Teo & Noelle 💕</p>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
          className="p-1 text-stone-500 flex flex-col gap-1.5"
        >
          <span
            className={`block w-5 h-0.5 bg-current transition-transform origin-center ${open ? 'translate-y-2 rotate-45' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-opacity ${open ? 'opacity-0' : ''}`}
          />
          <span
            className={`block w-5 h-0.5 bg-current transition-transform origin-center ${open ? '-translate-y-2 -rotate-45' : ''}`}
          />
        </button>
      </header>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-white border-b border-rose-100 px-4 py-3 flex flex-col gap-0.5">
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={linkClass(item.href)}
            >
              <span>{item.emoji}</span>
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={handleSignOut}
            className="text-xs text-stone-300 hover:text-rose-400 transition-colors py-2 text-left px-3 mt-1"
          >
            sign out
          </button>
        </div>
      )}
    </>
  )
}

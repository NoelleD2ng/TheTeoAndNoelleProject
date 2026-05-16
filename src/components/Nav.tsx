'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Heart, CheckSquare, Calendar, MapPin, Star,
  Code2, Camera, Sparkles, Coffee, X, Menu, LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/',            label: 'Story',    icon: Heart },
  { href: '/todos',       label: 'To-Do',    icon: CheckSquare },
  { href: '/plans',       label: 'Plans',    icon: Calendar },
  { href: '/places',      label: 'Places',   icon: MapPin },
  { href: '/bucket-list', label: 'Bucket',   icon: Star },
  { href: '/projects',    label: 'Projects', icon: Code2 },
  { href: '/memories',    label: 'Memories', icon: Camera },
  { href: '/fun-facts',   label: 'Facts',    icon: Sparkles },
  { href: '/date-ideas',  label: 'Dates',    icon: Coffee },
]

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Fixed top navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 md:px-10 backdrop-blur-xl border-b transition-all duration-500 ${
        scrolled
          ? 'bg-[#0F172A]/90 border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,0.3)]'
          : 'bg-[#0F172A]/40 border-white/[0.04]'
      }`}>
        {/* Logo */}
        <Link href="/" className="font-serif text-sm tracking-[0.2em] text-white/60 hover:text-white/90 transition-colors shrink-0">
          T & N
        </Link>

        {/* Desktop nav links — centered */}
        <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors ${
                  active ? 'text-[#c8a97e]' : 'text-white/40 hover:text-white/75'
                }`}
              >
                <Icon size={12} strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {/* Sign out — desktop */}
          <button
            onClick={handleSignOut}
            className="hidden lg:flex items-center gap-1.5 text-[11px] tracking-wide text-white/25 hover:text-white/55 transition-colors"
          >
            <LogOut size={12} />
          </button>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setOpen(o => !o)}
            className="lg:hidden text-white/50 hover:text-white/80 transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col pt-14">
          <div
            className="absolute inset-0 bg-[#080d1a]/95 backdrop-blur-xl"
            onClick={() => setOpen(false)}
          />
          <div className="relative flex flex-col gap-1 px-6 py-8">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm tracking-wide transition-colors ${
                    active
                      ? 'bg-white/[0.06] text-[#c8a97e]'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/25 hover:text-white/50 transition-colors mt-4"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  )
}

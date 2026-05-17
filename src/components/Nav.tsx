'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Heart, CheckSquare, MapPin, Star,
  Code2, Camera, Coffee, Radio, BookOpen, X, Menu, LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/',            label: 'Story',     icon: Heart },
  { href: '/todos',       label: 'To-Do',     icon: CheckSquare },
  { href: '/journal',     label: 'Journal',   icon: BookOpen },
  { href: '/places',      label: 'Places',    icon: MapPin },
  { href: '/bucket-list', label: 'Bucket',    icon: Star },
  { href: '/projects',    label: 'Projects',  icon: Code2 },
  { href: '/memories',    label: 'Memories',  icon: Camera },
  { href: '/date-ideas',  label: 'Dates',     icon: Coffee },
  { href: '/currently',   label: 'Currently', icon: Radio },
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
      <nav className={`fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-6 md:px-10 transition-all duration-500 ${
        scrolled
          ? 'bg-[#FAF8F5]/95 border-b border-[#E8DDD4] shadow-[0_2px_16px_rgba(44,26,14,0.06)] backdrop-blur-md'
          : 'bg-[#FAF8F5]/70 border-b border-[#E8DDD4]/60 backdrop-blur-sm'
      }`}>
        {/* Logo */}
        <Link href="/" className="font-serif text-sm tracking-[0.18em] text-[#2C1A0E]/70 hover:text-[#2C1A0E] transition-colors shrink-0" style={{ fontFamily: 'var(--font-serif)' }}>
          T & N
        </Link>

        {/* Desktop nav — centered */}
        <div className="hidden lg:flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-[11px] tracking-[0.08em] uppercase transition-colors ${
                  active ? 'text-[#C4784A]' : 'text-[#7A6155]/70 hover:text-[#2C1A0E]'
                }`}
              >
                <Icon size={12} strokeWidth={active ? 2.5 : 1.75} />
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <button
            onClick={handleSignOut}
            className="hidden lg:flex items-center gap-1.5 text-[11px] tracking-wide text-[#AE9B8E] hover:text-[#7A6155] transition-colors"
          >
            <LogOut size={12} />
          </button>
          <button
            onClick={() => setOpen(o => !o)}
            className="lg:hidden text-[#7A6155] hover:text-[#2C1A0E] transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="fixed inset-0 z-40 flex flex-col pt-14">
          <div className="absolute inset-0 bg-[#FAF8F5]/97 backdrop-blur-xl" onClick={() => setOpen(false)} />
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
                      ? 'bg-[#FDF0E8] text-[#C4784A]'
                      : 'text-[#7A6155] hover:text-[#2C1A0E] hover:bg-[#F5EFE8]'
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              )
            })}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[#AE9B8E] hover:text-[#7A6155] transition-colors mt-4"
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

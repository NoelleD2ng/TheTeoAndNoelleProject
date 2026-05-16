import Link from 'next/link'
import { Camera, Star, Coffee, Calendar, CheckSquare, MapPin, Code2, Sparkles } from 'lucide-react'

const sections = [
  { href: '/memories',    label: 'Memories',    icon: Camera,      desc: 'photos & moments' },
  { href: '/bucket-list', label: 'Bucket List', icon: Star,        desc: 'dreams together' },
  { href: '/date-ideas',  label: 'Date Ideas',  icon: Coffee,      desc: 'things to try' },
  { href: '/plans',       label: 'Plans',       icon: Calendar,    desc: "what's coming up" },
  { href: '/todos',       label: 'To-Do',       icon: CheckSquare, desc: 'things to get done' },
  { href: '/places',      label: 'Places',      icon: MapPin,      desc: "where we've been" },
  { href: '/projects',    label: 'Projects',    icon: Code2,       desc: 'building together' },
  { href: '/fun-facts',   label: 'Fun Facts',   icon: Sparkles,    desc: 'little things about us' },
]

export default function OurStoryPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5]">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Warm gradient background */}
        <div
          className="absolute inset-0 animate-fade-in"
          style={{
            background: `
              linear-gradient(to bottom,
                rgba(250,248,245,0.08) 0%,
                rgba(250,248,245,0.04) 30%,
                rgba(250,248,245,0.55) 70%,
                rgba(250,248,245,1.00) 100%
              ),
              url('/homepage-photo.jpg') center/cover no-repeat,
              linear-gradient(135deg, #F5E8D4 0%, #FAF0E4 40%, #F0E4D8 100%)
            `,
          }}
        />

        {/* Warm terracotta glow — top left */}
        <div
          className="absolute animate-glow-pulse"
          style={{
            top: '12%', left: '8%',
            width: 480, height: 480,
            background: 'radial-gradient(circle, rgba(196,120,74,0.22) 0%, transparent 68%)',
            filter: 'blur(70px)',
            borderRadius: '50%',
          }}
        />

        {/* Soft peach glow — bottom right */}
        <div
          className="absolute animate-glow-pulse-slow"
          style={{
            bottom: '18%', right: '6%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, rgba(240,210,170,0.3) 0%, transparent 68%)',
            filter: 'blur(80px)',
            borderRadius: '50%',
            animationDelay: '4s',
          }}
        />

        {/* Floating dust */}
        {[
          { top: '22%', left: '16%', size: 3, delay: '0s', dur: '8s' },
          { top: '58%', left: '76%', size: 2, delay: '2s', dur: '11s' },
          { top: '33%', left: '84%', size: 2.5, delay: '4s', dur: '9s' },
          { top: '72%', left: '20%', size: 2, delay: '1s', dur: '13s' },
          { top: '14%', left: '58%', size: 1.5, delay: '3s', dur: '10s' },
          { top: '82%', left: '62%', size: 2, delay: '5s', dur: '7s' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#C4784A]"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              opacity: 0.3,
              animation: `float ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}

        {/* Hero text */}
        <div className="relative z-10 text-center px-6">
          <p className="animate-fade-up text-[10px] tracking-[0.55em] uppercase text-[#C4784A]/70 mb-7 font-light">
            a little digital world for us
          </p>
          <h1
            className="animate-fade-up-delay text-7xl md:text-9xl text-[#2C1A0E] tracking-tight leading-none"
            style={{ fontFamily: 'var(--font-serif)', fontWeight: 400 }}
          >
            Teo & Noelle
          </h1>
          <p className="animate-fade-up-delay-2 mt-7 text-[11px] tracking-[0.45em] uppercase text-[#7A6155]/60 font-light">
            our little world
          </p>
        </div>

        {/* Scroll line */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-px h-14 bg-gradient-to-b from-transparent via-[#C4784A]/25 to-transparent" />
        </div>
      </section>

      {/* ── Dashboard ─────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pt-16 pb-12 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-[0.45em] uppercase text-[#C4784A]/60 mb-3">our space</p>
          <h2 className="text-2xl font-light text-[#2C1A0E]/70" style={{ fontFamily: 'var(--font-serif)' }}>
            everything, in one place
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sections.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-[#E8DDD4] bg-white p-6 transition-all duration-300 hover:border-[#C4784A]/30 hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(196,120,74,0.1)]"
              style={{ boxShadow: '0 2px 12px rgba(44,26,14,0.05)' }}
            >
              <div className="mb-4">
                <Icon size={17} strokeWidth={1.5} className="text-[#C4784A]/55 group-hover:text-[#C4784A] transition-colors duration-300" />
              </div>
              <p className="text-sm font-medium text-[#2C1A0E]/70 group-hover:text-[#2C1A0E] transition-colors duration-300">{label}</p>
              <p className="text-xs text-[#AE9B8E] mt-1 group-hover:text-[#7A6155] transition-colors duration-300">{desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Story card ────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-28 max-w-2xl mx-auto">
        <div className="rounded-3xl border border-[#E8DDD4] bg-white p-10 md:p-14 text-center" style={{ boxShadow: '0 4px_24px rgba(44,26,14,0.07)' }}>
          <p className="text-[#2C1A0E]/65 text-lg md:text-xl leading-relaxed font-light" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
            &ldquo;Since the day we met, everything has felt a little more colorful.
            This is our little corner of the internet &mdash; just for us.&rdquo;
          </p>

          <div className="mt-10 flex flex-col gap-6">
            <div className="text-left">
              <h2 className="text-[10px] tracking-[0.35em] uppercase text-[#C4784A]/60 mb-3">How We Met</h2>
              <p className="text-[#7A6155] text-sm leading-relaxed">
                [Tell your story here — edit this in{' '}
                <code className="text-[#7A6155] text-xs bg-[#F5EFE8] px-1.5 py-0.5 rounded">src/app/page.tsx</code>]
              </p>
            </div>

            <div className="w-full h-px bg-[#E8DDD4]" />

            <div className="text-left">
              <h2 className="text-[10px] tracking-[0.35em] uppercase text-[#C4784A]/60 mb-3">Our Timeline</h2>
              <div className="flex flex-col gap-3">
                {[
                  { date: 'Month DD, YYYY', event: '[The day you met]' },
                  { date: 'Month DD, YYYY', event: '[First milestone...]' },
                  { date: 'Month DD, YYYY', event: '[Another milestone...]' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-[#C4784A]/45 text-xs shrink-0 pt-0.5 w-28">{item.date}</span>
                    <span className="text-[#7A6155] text-sm">{item.event}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

import Link from 'next/link'
import {
  Camera, Star, Coffee, Calendar, CheckSquare,
  MapPin, Code2, Sparkles,
} from 'lucide-react'

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
    <div className="min-h-screen bg-[#0F172A]">

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* Photo / gradient background */}
        <div
          className="absolute inset-0 animate-fade-in"
          style={{
            background: `
              linear-gradient(to bottom,
                rgba(15,23,42,0.2) 0%,
                rgba(15,23,42,0.05) 30%,
                rgba(15,23,42,0.65) 70%,
                rgba(15,23,42,1.00) 100%
              ),
              url('/homepage-photo.jpg') center/cover no-repeat,
              linear-gradient(135deg, #0d1b36 0%, #1a2a4a 50%, #0d1b36 100%)
            `,
          }}
        />

        {/* Warm gold glow — top left */}
        <div
          className="absolute animate-glow-pulse"
          style={{
            top: '15%', left: '10%',
            width: 480, height: 480,
            background: 'radial-gradient(circle, #D6BA8A 0%, transparent 68%)',
            filter: 'blur(72px)',
            borderRadius: '50%',
          }}
        />

        {/* Cool fog blue glow — bottom right */}
        <div
          className="absolute animate-glow-pulse-slow"
          style={{
            bottom: '20%', right: '8%',
            width: 400, height: 400,
            background: 'radial-gradient(circle, #CBD5E1 0%, transparent 68%)',
            filter: 'blur(90px)',
            borderRadius: '50%',
            animationDelay: '3s',
          }}
        />

        {/* Soft center glow */}
        <div
          className="absolute animate-float-slow"
          style={{
            top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
            width: 320, height: 320,
            background: 'radial-gradient(circle, rgba(214,186,138,0.15) 0%, transparent 70%)',
            filter: 'blur(40px)',
            borderRadius: '50%',
            animationDelay: '1.5s',
          }}
        />

        {/* Floating dust particles */}
        {[
          { top: '25%', left: '18%', size: 2, delay: '0s', dur: '8s' },
          { top: '60%', left: '75%', size: 1.5, delay: '2s', dur: '11s' },
          { top: '35%', left: '82%', size: 2.5, delay: '4s', dur: '9s' },
          { top: '70%', left: '22%', size: 1.5, delay: '1s', dur: '13s' },
          { top: '15%', left: '55%', size: 2, delay: '3s', dur: '10s' },
          { top: '80%', left: '60%', size: 1, delay: '5s', dur: '7s' },
        ].map((p, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#D6BA8A]"
            style={{
              top: p.top, left: p.left,
              width: p.size, height: p.size,
              opacity: 0.25,
              animation: `float ${p.dur} ease-in-out ${p.delay} infinite`,
            }}
          />
        ))}

        {/* Hero text */}
        <div className="relative z-10 text-center px-6">
          <p className="animate-fade-up text-[10px] tracking-[0.55em] uppercase text-[#D6BA8A]/60 mb-7 font-light">
            a little digital world for us
          </p>
          <h1 className="animate-fade-up-delay text-7xl md:text-9xl font-light text-white tracking-tight leading-none">
            Teo & Noelle
          </h1>
          <p className="animate-fade-up-delay-2 mt-7 text-[11px] tracking-[0.45em] uppercase text-white/25 font-light">
            our little world
          </p>
        </div>

        {/* Scroll line */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-float" style={{ animationDelay: '1s' }}>
          <div className="w-px h-14 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
        </div>
      </section>

      {/* ── Dashboard ────────────────────────────────────────────────── */}
      <section className="relative px-6 md:px-10 pt-16 pb-12 max-w-5xl mx-auto">
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-[0.45em] uppercase text-[#D6BA8A]/50 mb-3">our space</p>
          <h2 className="text-2xl font-light text-white/70">everything, in one place</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {sections.map(({ href, label, icon: Icon, desc }) => (
            <Link
              key={href}
              href={href}
              className="group relative rounded-2xl border border-white/[0.07] p-6 transition-all duration-300 hover:border-[#D6BA8A]/25 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(214,186,138,0.07)]"
              style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(12px)' }}
            >
              <div className="mb-4">
                <Icon
                  size={17}
                  strokeWidth={1.5}
                  className="text-[#D6BA8A]/50 group-hover:text-[#D6BA8A]/90 transition-colors duration-300"
                />
              </div>
              <p className="text-sm font-medium text-white/60 group-hover:text-white/90 transition-colors duration-300">
                {label}
              </p>
              <p className="text-xs text-white/25 mt-1 group-hover:text-white/40 transition-colors duration-300">
                {desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Story card ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-28 max-w-2xl mx-auto">
        <div
          className="rounded-3xl border border-white/[0.07] p-10 md:p-14 text-center"
          style={{ background: 'rgba(255,255,255,0.025)', backdropFilter: 'blur(24px)' }}
        >
          <p className="text-white/60 text-lg md:text-xl leading-relaxed italic font-light">
            &ldquo;Since the day we met, everything has felt a little more colorful.
            This is our little corner of the internet &mdash; just for us.&rdquo;
          </p>

          <div className="mt-10 flex flex-col gap-6">
            <div className="text-left">
              <h2 className="text-[10px] tracking-[0.35em] uppercase text-[#D6BA8A]/55 mb-3">
                How We Met
              </h2>
              <p className="text-white/45 text-sm leading-relaxed">
                [Tell your story here — edit this in{' '}
                <code className="text-white/45 text-xs">src/app/page.tsx</code>]
              </p>
            </div>

            <div className="w-full h-px bg-white/[0.06]" />

            <div className="text-left">
              <h2 className="text-[10px] tracking-[0.35em] uppercase text-[#D6BA8A]/55 mb-3">
                Our Timeline
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { date: 'Month DD, YYYY', event: '[The day you met]' },
                  { date: 'Month DD, YYYY', event: '[First milestone...]' },
                  { date: 'Month DD, YYYY', event: '[Another milestone...]' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-[#D6BA8A]/35 text-xs shrink-0 pt-0.5 w-28">{item.date}</span>
                    <span className="text-white/50 text-sm">{item.event}</span>
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

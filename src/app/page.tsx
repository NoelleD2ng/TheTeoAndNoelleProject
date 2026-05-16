export default function OurStoryPage() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center"
        style={{
          /*
           * To set your photo: drop a file called hero.jpg into the public/ folder.
           * The gradient layers create the cinematic dark vignette over your image.
           */
          background: `
            linear-gradient(to bottom,
              rgba(8,13,26,0.25) 0%,
              rgba(8,13,26,0.10) 35%,
              rgba(8,13,26,0.55) 75%,
              rgba(8,13,26,1.00) 100%
            ),
            url('/hero.jpg') center/cover no-repeat,
            linear-gradient(135deg, #0d1b36 0%, #1a2a4a 50%, #0d1b36 100%)
          `,
        }}
      >
        {/* Hero text */}
        <div className="text-center px-6 mt-10">
          <h1
            className="text-6xl md:text-8xl lg:text-9xl font-light text-white tracking-wide leading-none"
            
          >
            Teo & Noelle
          </h1>
          <p className="mt-5 text-[11px] md:text-xs tracking-[0.5em] uppercase text-white/45 font-light">
            our little world
          </p>
        </div>
      </section>

      {/* ── Content card ─────────────────────────────────────────────────── */}
      <section className="relative -mt-24 z-10 flex justify-center px-6 pb-24">
        <div
          className="w-full max-w-2xl rounded-3xl border border-white/[0.08] p-10 md:p-14 text-center"
          style={{
            background: 'rgba(10, 18, 40, 0.75)',
            backdropFilter: 'blur(24px)',
          }}
        >
          {/* Edit this section to tell your story */}
          <p
            className="text-white/65 text-lg md:text-xl leading-relaxed italic font-light"
            
          >
            &ldquo;Since the day we met, everything has felt a little more colorful.
            This is our little corner of the internet &mdash; just for us.&rdquo;
          </p>

          <div className="mt-10 flex flex-col gap-6">
            <section className="text-left">
              <h2
                className="text-xs tracking-[0.3em] uppercase text-[#c8a97e]/70 mb-3"
              >
                How We Met
              </h2>
              <p className="text-white/45 text-sm leading-relaxed">
                [Tell your story here — edit this in{' '}
                <code className="text-white/30 text-xs">src/app/page.tsx</code>]
              </p>
            </section>

            <div className="w-full h-px bg-white/[0.06]" />

            <section className="text-left">
              <h2 className="text-xs tracking-[0.3em] uppercase text-[#c8a97e]/70 mb-3">
                Our Timeline
              </h2>
              <div className="flex flex-col gap-3">
                {[
                  { date: 'Month DD, YYYY', event: '[The day you met]' },
                  { date: 'Month DD, YYYY', event: '[First milestone...]' },
                  { date: 'Month DD, YYYY', event: '[Another milestone...]' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <span className="text-[#c8a97e]/50 text-xs shrink-0 pt-0.5 w-28">{item.date}</span>
                    <span className="text-white/40 text-sm">{item.event}</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  )
}

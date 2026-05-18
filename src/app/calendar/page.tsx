'use client'

import { useState } from 'react'

const TEO_CAL    = '33fb85f44a4115013a5b2cb25055472b93064de7c0a29f866a183d7df992ba2d@group.calendar.google.com'
const NOELLE_CAL = '' // add when Noelle shares her ID

const serif = { fontFamily: 'var(--font-serif, Georgia, "Times New Roman", serif)' }

type View = 'MONTH' | 'WEEK' | 'AGENDA'

function buildSrc(view: View): string {
  const params = new URLSearchParams({
    src: TEO_CAL,
    ctz: 'America/New_York',
    showTitle: '0',
    showNav: '1',
    showDate: '1',
    showPrint: '0',
    showTabs: '0',
    showCalendars: '0',
    showTz: '0',
    mode: view,
  })
  if (NOELLE_CAL) params.append('src', NOELLE_CAL)
  return `https://calendar.google.com/calendar/embed?${params.toString()}`
}

export default function CalendarPage() {
  const [view, setView] = useState<View>('MONTH')

  return (
    <div className="min-h-screen" style={{ paddingTop: 64, background: '#FDFAF7' }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 sm:pt-12 pb-5 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="text-[9px] tracking-[0.55em] uppercase text-[#C4784A]/40 mb-2">teo & noelle</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2C1A0E]" style={serif}>Calendar</h1>
        </div>

        {/* View switcher */}
        <div className="flex gap-1 p-1 rounded-2xl" style={{ background: '#F0E8E0', border: '1px solid #E0D4C8' }}>
          {(['MONTH', 'WEEK', 'AGENDA'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: view === v ? '#fff' : 'transparent',
                color: view === v ? '#C4784A' : '#7A6155',
                boxShadow: view === v ? '0 1px 6px rgba(44,26,14,0.1)' : 'none',
              }}
            >
              {v.charAt(0) + v.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar iframe */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pb-16">
        <div
          className="w-full overflow-hidden rounded-3xl"
          style={{
            border: '1px solid #EDE4DA',
            boxShadow: '0 8px 40px rgba(44,26,14,0.08)',
          }}
        >
          <iframe
            src={buildSrc(view)}
            style={{ border: 0, width: '100%', height: 'calc(100vh - 220px)', minHeight: 500 }}
            allowFullScreen
            title="Shared Calendar"
          />
        </div>
      </div>
    </div>
  )
}

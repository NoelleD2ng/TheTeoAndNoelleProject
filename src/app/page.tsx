export default function OurStoryPage() {
  return (
    <div className="p-6 md:p-10 max-w-2xl">
      <div className="text-center mb-10">
        <p className="text-6xl mb-4">💕</p>
        <h1 className="text-4xl font-semibold text-stone-800">Teo & Noelle</h1>
        <p className="text-stone-400 mt-2 text-sm">together since [add your date here]</p>
      </div>

      <div className="flex flex-col gap-4">
        <section className="bg-white rounded-2xl border border-rose-100 p-6">
          <h2 className="text-base font-semibold text-rose-500 mb-3">💫 How We Met</h2>
          <p className="text-stone-500 leading-relaxed text-sm">
            [Tell your story here — how you two met, what that first moment was like, what
            made you notice each other. Edit this file at{' '}
            <code className="text-xs bg-rose-50 px-1 rounded">src/app/page.tsx</code>]
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-rose-100 p-6">
          <h2 className="text-base font-semibold text-rose-500 mb-3">🌹 Our First Date</h2>
          <p className="text-stone-500 leading-relaxed text-sm">
            [Describe your first date — where you went, what you talked about, how you
            felt...]
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-rose-100 p-6">
          <h2 className="text-base font-semibold text-rose-500 mb-4">📅 Our Timeline</h2>
          <div className="flex flex-col gap-4">
            {[
              { date: 'Month DD, YYYY', event: '[The day you met or your first date]' },
              { date: 'Month DD, YYYY', event: '[Another milestone — first trip, first "I love you"...]' },
              { date: 'Month DD, YYYY', event: '[Another milestone...]' },
            ].map((item, i, arr) => (
              <div key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-rose-300 shrink-0 mt-0.5" />
                  {i < arr.length - 1 && <div className="w-px flex-1 bg-rose-100 my-1" />}
                </div>
                <div className="pb-2">
                  <p className="text-xs text-rose-400 font-medium mb-0.5">{item.date}</p>
                  <p className="text-stone-500 text-sm">{item.event}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-rose-50 border border-rose-200 rounded-2xl p-6">
          <h2 className="text-base font-semibold text-rose-500 mb-3">💌 A Note</h2>
          <p className="text-stone-500 leading-relaxed text-sm italic">
            &ldquo;[Write something sweet here — a love letter, a favorite memory, or what
            you love most about each other...]&rdquo;
          </p>
        </section>
      </div>
    </div>
  )
}

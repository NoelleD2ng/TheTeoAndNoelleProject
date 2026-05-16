export default function MemoriesPage() {
  const cardStyle = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 mb-1">together</p>
        <h1 className="text-3xl font-bold text-white" >Memories</h1>
        <p className="text-white/75 mt-1 text-sm">our favorite moments together</p>
      </div>

      <div className="rounded-2xl border border-white/[0.15] p-10 text-center max-w-md" style={cardStyle}>
        <p className="text-4xl mb-4">📸</p>
        <h2 className="text-white font-medium mb-2">Photo Gallery Coming Soon</h2>
        <p className="text-white/70 text-sm mb-6 leading-relaxed">
          Set up Supabase Storage to start uploading and sharing your favorite memories together.
        </p>
        <div className="grid grid-cols-3 gap-2 opacity-10 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-xl border border-white/10" style={{ background: 'rgba(200,169,126,0.15)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

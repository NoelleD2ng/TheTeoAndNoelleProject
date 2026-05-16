export default function MemoriesPage() {
  return (
    <div className="p-6 md:p-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-stone-800">Memories 📸</h1>
        <p className="text-stone-400 mt-1 text-sm">our favorite moments together</p>
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 p-8 text-center max-w-md">
        <p className="text-4xl mb-4">📸</p>
        <h2 className="font-medium text-stone-700 mb-2">Photo Gallery Coming Soon</h2>
        <p className="text-stone-400 text-sm mb-6 leading-relaxed">
          Set up Supabase Storage to start uploading and sharing your favorite memories
          together. Photos will appear in a beautiful gallery here.
        </p>
        <div className="grid grid-cols-3 gap-2 opacity-20 pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square bg-rose-100 rounded-xl" />
          ))}
        </div>
        <p className="text-xs text-stone-300 mt-4">
          See the README for Supabase setup instructions
        </p>
      </div>
    </div>
  )
}

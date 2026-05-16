'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type Memory } from '@/lib/supabase'

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2', '-rotate-1', 'rotate-2']

export default function MemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [caption, setCaption] = useState('')
  const [uploadedBy, setUploadedBy] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [lightbox, setLightbox] = useState<Memory | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchMemories() }, [])

  async function fetchMemories() {
    const { data } = await supabase.from('memories').select('*').order('created_at', { ascending: false })
    setMemories(data ?? [])
    setLoading(false)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(f.type === 'application/pdf' ? 'pdf' : URL.createObjectURL(f))
  }

  async function upload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('Memories').upload(path, file)
    if (uploadError) { alert('Upload failed: ' + uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('Memories').getPublicUrl(path)

    const { error: insertError } = await supabase.from('memories').insert({
      image_url: publicUrl,
      caption: caption.trim() || null,
      uploaded_by: uploadedBy.trim() || null,
    })
    if (insertError) { alert('Save failed: ' + insertError.message); setUploading(false); return }

    setFile(null); setPreview(null); setCaption('')
    if (fileRef.current) fileRef.current.value = ''
    await fetchMemories()
    setUploading(false)
  }

  async function deleteMemory(memory: Memory) {
    const path = memory.image_url.split('/Memories/')[1]
    await supabase.storage.from('Memories').remove([path])
    await supabase.from('memories').delete().eq('id', memory.id)
    setLightbox(null)
    setMemories(prev => prev.filter(m => m.id !== memory.id))
  }

  const inputCls = 'w-full px-3 py-2 rounded-xl text-sm text-[#2C1A0E] placeholder:text-[#AE9B8E] focus:outline-none bg-[#F5EFE8] border border-[#E8DDD4] focus:border-[#C4784A]/40 transition-colors'

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#C4784A]/70 mb-1">together</p>
        <h1 className="text-3xl font-semibold text-[#2C1A0E]">Memories 📸</h1>
        <p className="text-[#7A6155] mt-1 text-sm">our favorite moments together</p>
      </div>

      {/* Upload form */}
      <form
        onSubmit={upload}
        className="rounded-2xl border border-[#E8DDD4] bg-white p-5 mb-10 max-w-md"
        style={{ boxShadow: '0 2px 16px rgba(44,26,14,0.06)' }}
      >
        <p className="text-sm font-medium text-[#2C1A0E] mb-3">Add a memory</p>

        <div
          className="border-2 border-dashed border-[#E8DDD4] rounded-xl p-6 text-center cursor-pointer hover:border-[#C4784A]/40 transition-colors mb-3 bg-[#FDFAF7]"
          onClick={() => fileRef.current?.click()}
        >
          {preview === 'pdf' ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-4xl">📄</p>
              <p className="text-sm text-[#7A6155]">{file?.name}</p>
            </div>
          ) : preview ? (
            <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-cover" />
          ) : (
            <>
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-[#AE9B8E]">Click to choose a photo or PDF</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFileChange} className="hidden" />

        <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)" className={`${inputCls} mb-2`} />
        <input value={uploadedBy} onChange={e => setUploadedBy(e.target.value)} placeholder="Your name (Teo or Noelle)" className={`${inputCls} mb-3`} />

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-[#C4784A] hover:bg-[#B36840] disabled:opacity-40 text-white py-2 rounded-xl text-sm transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Memory'}
        </button>
      </form>

      {/* Gallery */}
      {loading ? (
        <div className="text-center py-12 text-[#AE9B8E]">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm">loading memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-12 text-[#AE9B8E]">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm">no memories yet — upload your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {memories.map((m, i) => {
            const isPdf = m.image_url.toLowerCase().includes('.pdf')
            const tilt = TILTS[i % TILTS.length]
            return isPdf ? (
              <div
                key={m.id}
                className={`polaroid ${tilt} relative group`}
              >
                <a href={m.image_url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 py-4">
                  <p className="text-3xl">📄</p>
                  <p className="text-xs text-[#7A6155] truncate w-full text-center">{m.caption ?? 'PDF'}</p>
                </a>
                <button
                  onClick={() => deleteMemory(m)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-xs text-[#AE9B8E] hover:text-[#C4784A] transition-all"
                >✕</button>
              </div>
            ) : (
              <div
                key={m.id}
                className={`polaroid ${tilt} cursor-pointer group`}
                onClick={() => setLightbox(m)}
              >
                <img
                  src={m.image_url}
                  alt={m.caption ?? 'memory'}
                  className="w-full aspect-square object-cover"
                />
                {m.caption && (
                  <p className="text-center text-xs mt-2 text-[#7A6155] font-light truncate">{m.caption}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full border border-[#E8DDD4]"
            style={{ boxShadow: '0 20px 60px rgba(44,26,14,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            <img src={lightbox.image_url} alt={lightbox.caption ?? ''} className="w-full object-cover max-h-[60vh]" />
            <div className="p-4 flex items-start justify-between gap-3 bg-white">
              <div>
                {lightbox.caption && <p className="text-sm text-[#2C1A0E] font-medium">{lightbox.caption}</p>}
                <p className="text-xs text-[#AE9B8E] mt-0.5">
                  {lightbox.uploaded_by && `${lightbox.uploaded_by} · `}
                  {new Date(lightbox.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => deleteMemory(lightbox)}
                className="text-xs text-[#AE9B8E] hover:text-[#C4784A] transition-colors shrink-0"
              >
                delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

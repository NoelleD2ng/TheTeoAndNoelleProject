'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase, type Memory } from '@/lib/supabase'

const cardStyle = { background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }

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

  useEffect(() => {
    fetchMemories()
  }, [])

  async function fetchMemories() {
    const { data } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false })
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

    const { error: uploadError } = await supabase.storage
      .from('memories')
      .upload(path, file)

    if (uploadError) {
      alert('Upload failed: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('memories')
      .getPublicUrl(path)

    await supabase.from('memories').insert({
      image_url: publicUrl,
      caption: caption.trim() || null,
      uploaded_by: uploadedBy.trim() || null,
    })

    setFile(null)
    setPreview(null)
    setCaption('')
    if (fileRef.current) fileRef.current.value = ''
    await fetchMemories()
    setUploading(false)
  }

  async function deleteMemory(memory: Memory) {
    const path = memory.image_url.split('/memories/')[1]
    await supabase.storage.from('memories').remove([path])
    await supabase.from('memories').delete().eq('id', memory.id)
    setLightbox(null)
    setMemories(prev => prev.filter(m => m.id !== memory.id))
  }

  return (
    <div className="pt-20 p-6 md:p-10">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-[#c8a97e]/60 mb-1">together</p>
        <h1 className="text-3xl font-bold text-white">Memories</h1>
        <p className="text-white/75 mt-1 text-sm">our favorite moments together</p>
      </div>

      {/* Upload form */}
      <form
        onSubmit={upload}
        className="rounded-2xl border border-white/[0.15] p-5 mb-8 max-w-md"
        style={cardStyle}
      >
        <p className="text-sm font-medium text-white mb-3">Add a memory</p>

        <div
          className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:border-white/40 transition-colors mb-3"
          onClick={() => fileRef.current?.click()}
        >
          {preview === 'pdf' ? (
            <div className="flex flex-col items-center gap-2">
              <p className="text-4xl">📄</p>
              <p className="text-sm text-white/60">{file?.name}</p>
            </div>
          ) : preview ? (
            <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-cover" />
          ) : (
            <>
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-white/50">Click to choose a photo</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFileChange} className="hidden" />

        <input
          value={caption}
          onChange={e => setCaption(e.target.value)}
          placeholder="Caption (optional)"
          className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40 mb-2"
        />
        <input
          value={uploadedBy}
          onChange={e => setUploadedBy(e.target.value)}
          placeholder="Your name (Teo or Noelle)"
          className="w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder-white/40 text-sm focus:outline-none focus:border-white/40 mb-3"
        />

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-[#c8a97e] hover:bg-[#b8996e] disabled:opacity-40 text-white py-2 rounded-xl text-sm transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Memory'}
        </button>
      </form>

      {/* Gallery */}
      {loading ? (
        <div className="text-center py-12 text-white/30">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm">loading memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="text-center py-12 text-white/30">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-sm">no memories yet — upload your first one!</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
          {memories.map(m => {
            const isPdf = m.image_url.endsWith('.pdf')
            return isPdf ? (
              <a
                key={m.id}
                href={m.image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="break-inside-avoid block rounded-2xl border border-white/[0.15] p-4 hover:border-white/30 transition-colors"
                style={cardStyle}
              >
                <p className="text-3xl mb-2">📄</p>
                <p className="text-sm text-white/80 truncate">{m.caption ?? 'PDF'}</p>
                {m.uploaded_by && <p className="text-xs text-white/40 mt-1">{m.uploaded_by}</p>}
              </a>
            ) : (
              <div
                key={m.id}
                className="break-inside-avoid cursor-pointer group relative"
                onClick={() => setLightbox(m)}
              >
                <img
                  src={m.image_url}
                  alt={m.caption ?? 'memory'}
                  className="w-full rounded-2xl object-cover group-hover:opacity-80 transition-opacity"
                />
                {m.caption && (
                  <p className="text-xs text-white/60 mt-1 px-1 truncate">{m.caption}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="rounded-2xl overflow-hidden max-w-lg w-full border border-white/[0.15]"
            style={cardStyle}
            onClick={e => e.stopPropagation()}
          >
            <img src={lightbox.image_url} alt={lightbox.caption ?? ''} className="w-full object-cover max-h-[60vh]" />
            <div className="p-4 flex items-start justify-between gap-3">
              <div>
                {lightbox.caption && <p className="text-sm text-white font-medium">{lightbox.caption}</p>}
                <p className="text-xs text-white/50 mt-0.5">
                  {lightbox.uploaded_by && `${lightbox.uploaded_by} · `}
                  {new Date(lightbox.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => deleteMemory(lightbox)}
                className="text-xs text-white/30 hover:text-white/70 transition-colors shrink-0"
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

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Video = {
  id: string
  title: string
  url: string
  channel: string | null
  created_at: string
}

function youtubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const parts = u.pathname.split('/')
      const i = parts.findIndex((p) => p === 'embed' || p === 'shorts')
      if (i >= 0 && parts[i + 1]) return parts[i + 1]
    }
  } catch {}
  return null
}

export default function VideosClient({
  esAdmin,
  userId,
}: {
  esAdmin: boolean
  userId: string
}) {
  const supabase = createClient()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [channel, setChannel] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  function toast(t: string) {
    setMsg(t)
    setTimeout(() => setMsg(null), 3000)
  }

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('videos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setVideos(data as Video[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function agregar() {
    if (!title.trim()) {
      toast('Poné un título')
      return
    }
    if (!url.trim().startsWith('http')) {
      toast('Pegá un enlace válido (que empiece con http)')
      return
    }
    setGuardando(true)
    const { error } = await supabase.from('videos').insert({
      title: title.trim(),
      url: url.trim(),
      channel: channel.trim() || null,
      created_by: userId,
    })
    setGuardando(false)
    if (error) {
      toast('No se pudo agregar')
      return
    }
    setModalOpen(false)
    setTitle('')
    setUrl('')
    setChannel('')
    toast('Video agregado ✓')
    cargar()
  }

  async function borrar(id: string) {
    if (!confirm('¿Borrar este video?')) return
    const { error } = await supabase.from('videos').delete().eq('id', id)
    if (error) {
      toast('No se pudo borrar')
      return
    }
    cargar()
  }

  return (
    <div>
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#12807d] mb-1">Videos con ideas</h1>
          <p className="text-slate-500">Ideas creativas en video. Se abren en YouTube.</p>
        </div>
        <div className="flex-1" />
        {esAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#e0559c] hover:bg-[#c53c82] text-white font-semibold rounded-xl px-4 py-2.5"
          >
            ＋ Agregar video
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Cargando…</div>
      ) : videos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-slate-400">
          Todavía no hay videos.
          {esAdmin && ' Tocá "Agregar video" para sumar el primero.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((v) => {
            const yid = youtubeId(v.url)
            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col"
              >
                <a
                  href={v.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative aspect-video group"
                  style={{ background: 'linear-gradient(135deg, #12807d, #0c6360)' }}
                >
                  {yid && (
                    <img
                      src={`https://img.youtube.com/vi/${yid}/hqdefault.jpg`}
                      alt={v.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="w-14 h-14 rounded-full bg-black/50 group-hover:bg-[#e0559c] text-white grid place-items-center text-xl transition-colors">
                      ▶
                    </span>
                  </span>
                </a>
                <div className="p-4 flex flex-col gap-1">
                  <h3 className="font-bold text-slate-800 leading-tight">{v.title}</h3>
                  {v.channel && <p className="text-xs text-slate-500">{v.channel}</p>}
                  {esAdmin && (
                    <button
                      onClick={() => borrar(v.id)}
                      className="text-xs font-semibold text-slate-400 hover:text-[#b0344f] self-start mt-1"
                    >
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-5"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-[#12807d] mb-1">Agregar video</h3>
            <p className="text-sm text-slate-500 mb-5">
              Pegá el enlace de YouTube o Vimeo. Se muestra como tarjeta.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Idea de manualidad para Pascua"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Enlace del video</label>
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Canal / fuente</label>
                <input
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  placeholder="Ej: Ideas para la Escuela"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 border border-slate-300 rounded-xl py-2.5 font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={agregar}
                disabled={guardando}
                className="flex-1 bg-[#12807d] hover:bg-[#0c6360] disabled:opacity-60 text-white rounded-xl py-2.5 font-semibold"
              >
                {guardando ? 'Guardando…' : 'Agregar video'}
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-[#0c6360] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg">
          {msg}
        </div>
      )}
    </div>
  )
}

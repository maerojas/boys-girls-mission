'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Recurso = {
  id: string
  title: string
  description: string | null
  category: string | null
  storage_path: string
  file_size: number | null
  created_at: string
}

const CATEGORIAS = ['Plan', 'Dinámicas', 'Manualidad', 'Música', 'Formación', 'Organización']

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export default function RecursosClient({ esAdmin }: { esAdmin: boolean }) {
  const supabase = createClient()
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Plan')
  const [file, setFile] = useState<File | null>(null)
  const [subiendo, setSubiendo] = useState(false)

  async function cargarRecursos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setRecursos(data as Recurso[])
    setLoading(false)
  }

  useEffect(() => {
    cargarRecursos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toast(t: string) {
    setMsg(t)
    setTimeout(() => setMsg(null), 3000)
  }

  async function descargar(r: Recurso) {
    const { data, error } = await supabase.storage
      .from('recursos')
      .createSignedUrl(r.storage_path, 60, { download: `${r.title}.pdf` })
    if (error || !data) {
      toast('No se pudo descargar el archivo')
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  async function subir() {
    if (!title.trim()) {
      toast('Poné un título')
      return
    }
    if (!file) {
      toast('Elegí un archivo PDF')
      return
    }
    setSubiendo(true)
    try {
      const path = `${crypto.randomUUID()}.pdf`
      const { error: upErr } = await supabase.storage
        .from('recursos')
        .upload(path, file)
      if (upErr) throw upErr

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: insErr } = await supabase.from('resources').insert({
        title: title.trim(),
        description: description.trim() || null,
        category,
        storage_path: path,
        file_size: file.size,
        created_by: user?.id ?? null,
      })
      if (insErr) throw insErr

      setModalOpen(false)
      setTitle('')
      setDescription('')
      setCategory('Plan')
      setFile(null)
      toast('Recurso publicado ✓')
      cargarRecursos()
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'no se pudo subir'
      toast('Error: ' + m)
    } finally {
      setSubiendo(false)
    }
  }

  async function borrar(r: Recurso) {
    if (!confirm('¿Borrar este recurso?')) return
    await supabase.storage.from('recursos').remove([r.storage_path])
    const { error } = await supabase.from('resources').delete().eq('id', r.id)
    if (error) {
      toast('No se pudo borrar')
      return
    }
    toast('Recurso borrado')
    cargarRecursos()
  }

  return (
    <div>
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#12807d] mb-1">Recursos</h1>
          <p className="text-slate-500">Material en PDF para descargar.</p>
        </div>
        <div className="flex-1" />
        {esAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#e0559c] hover:bg-[#c53c82] text-white font-semibold rounded-xl px-4 py-2.5"
          >
            ＋ Cargar recurso
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Cargando…</div>
      ) : recursos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-slate-400">
          Todavía no hay recursos cargados.
          {esAdmin && ' Tocá "Cargar recurso" para subir el primero.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {recursos.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 flex flex-col gap-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-14 shrink-0 rounded-lg bg-[#b0344f] text-white grid place-items-center text-[10px] font-extrabold">
                  PDF
                </div>
                <div className="min-w-0">
                  {r.category && (
                    <span className="inline-block text-[11px] font-bold uppercase tracking-wide text-[#c53c82] bg-[#fce6f1] rounded-full px-2 py-0.5 mb-1">
                      {r.category}
                    </span>
                  )}
                  <h3 className="font-bold text-slate-800 leading-tight">{r.title}</h3>
                  <div className="text-xs text-slate-500">{formatSize(r.file_size)}</div>
                </div>
              </div>
              {r.description && <p className="text-sm text-slate-500">{r.description}</p>}
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => descargar(r)}
                  className="bg-[#12807d] hover:bg-[#0c6360] text-white text-sm font-semibold rounded-lg px-3 py-2"
                >
                  ⤓ Descargar
                </button>
                {esAdmin && (
                  <button
                    onClick={() => borrar(r)}
                    className="text-sm font-semibold text-slate-500 hover:text-[#b0344f] border border-slate-200 rounded-lg px-3 py-2"
                  >
                    Borrar
                  </button>
                )}
              </div>
            </div>
          ))}
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
            <h3 className="text-xl font-bold text-[#12807d] mb-1">Cargar recurso</h3>
            <p className="text-sm text-slate-500 mb-5">
              El archivo queda disponible para que los maestros lo descarguen.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Título</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Plan de clase — El buen pastor"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Categoría</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                >
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Descripción</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Breve descripción del contenido"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Archivo PDF</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef8f7] file:px-3 file:py-2 file:text-[#12807d] file:font-semibold"
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
                onClick={subir}
                disabled={subiendo}
                className="flex-1 bg-[#12807d] hover:bg-[#0c6360] disabled:opacity-60 text-white rounded-xl py-2.5 font-semibold"
              >
                {subiendo ? 'Subiendo…' : 'Publicar recurso'}
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

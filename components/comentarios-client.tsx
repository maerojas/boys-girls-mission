'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Perfil = { full_name: string | null; role: string }
type Comentario = {
  id: string
  parent_id: string | null
  author_id: string
  body: string
  created_at: string
  profiles: Perfil | null
}

function iniciales(nombre: string | null) {
  if (!nombre) return '?'
  return nombre.trim()[0].toUpperCase()
}

function cuando(fecha: string) {
  const d = new Date(fecha)
  const diff = (Date.now() - d.getTime()) / 1000
  if (diff < 60) return 'recién'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

const COLORES = ['#12807d', '#e0559c', '#6f8b6a', '#b06a4f', '#0c6360']
function colorPara(id: string) {
  let s = 0
  for (let i = 0; i < id.length; i++) s += id.charCodeAt(i)
  return COLORES[s % COLORES.length]
}

export default function ComentariosClient({
  userId,
  esAdmin,
}: {
  userId: string
  esAdmin: boolean
}) {
  const supabase = createClient()
  const [comentarios, setComentarios] = useState<Comentario[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [respondiendo, setRespondiendo] = useState<string | null>(null)
  const [respuesta, setRespuesta] = useState('')
  const [msg, setMsg] = useState<string | null>(null)

  function toast(t: string) {
    setMsg(t)
    setTimeout(() => setMsg(null), 3000)
  }

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('comments')
      .select('id, parent_id, author_id, body, created_at, profiles(full_name, role)')
      .order('created_at', { ascending: false })
    if (data) setComentarios(data as unknown as Comentario[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function publicar() {
    if (!texto.trim()) return
    setEnviando(true)
    const { error } = await supabase
      .from('comments')
      .insert({ author_id: userId, body: texto.trim(), parent_id: null })
    setEnviando(false)
    if (error) {
      toast('No se pudo publicar')
      return
    }
    setTexto('')
    toast('Comentario publicado')
    cargar()
  }

  async function responder(parentId: string) {
    if (!respuesta.trim()) return
    const { error } = await supabase
      .from('comments')
      .insert({ author_id: userId, body: respuesta.trim(), parent_id: parentId })
    if (error) {
      toast('No se pudo responder')
      return
    }
    setRespuesta('')
    setRespondiendo(null)
    cargar()
  }

  async function borrar(id: string) {
    if (!confirm('¿Borrar este comentario?')) return
    const { error } = await supabase.from('comments').delete().eq('id', id)
    if (error) {
      toast('No se pudo borrar')
      return
    }
    cargar()
  }

  const raiz = comentarios
    .filter((c) => !c.parent_id)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  const respuestasDe = (id: string) =>
    comentarios
      .filter((c) => c.parent_id === id)
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#12807d] mb-1">Comentarios</h1>
        <p className="text-slate-500">
          Un espacio para coordinar, pedir ayuda y compartir cómo salió cada clase.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 mb-6">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Escribí un mensaje para el equipo…"
          rows={3}
          className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c] resize-y"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={publicar}
            disabled={enviando}
            className="bg-[#12807d] hover:bg-[#0c6360] disabled:opacity-60 text-white font-semibold rounded-xl px-4 py-2"
          >
            {enviando ? 'Publicando…' : 'Publicar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Cargando…</div>
      ) : raiz.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-slate-400">
          Todavía no hay comentarios. ¡Escribí el primero!
        </div>
      ) : (
        <div className="space-y-4">
          {raiz.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-black/5 shadow-sm p-4">
              <div className="flex gap-3">
                <div
                  className="w-10 h-10 shrink-0 rounded-full grid place-items-center text-white font-bold"
                  style={{ background: colorPara(c.author_id) }}
                >
                  {iniciales(c.profiles?.full_name ?? null)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-slate-800">
                      {c.profiles?.full_name ?? 'Alguien'}
                    </span>
                    {c.profiles?.role === 'admin' && (
                      <span className="text-[10px] font-bold uppercase text-[#c53c82] bg-[#fce6f1] rounded-full px-2 py-0.5">
                        Coordinación
                      </span>
                    )}
                    <span className="text-xs text-slate-400">{cuando(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{c.body}</p>

                  <div className="flex gap-3 mt-2">
                    {esAdmin && (
                      <button
                        onClick={() => {
                          setRespondiendo(respondiendo === c.id ? null : c.id)
                          setRespuesta('')
                        }}
                        className="text-xs font-semibold text-[#12807d] hover:underline"
                      >
                        Responder
                      </button>
                    )}
                    {(c.author_id === userId || esAdmin) && (
                      <button
                        onClick={() => borrar(c.id)}
                        className="text-xs font-semibold text-slate-400 hover:text-[#b0344f]"
                      >
                        Borrar
                      </button>
                    )}
                  </div>

                  {respondiendo === c.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={respuesta}
                        onChange={(e) => setRespuesta(e.target.value)}
                        placeholder="Tu respuesta…"
                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e0559c]"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') responder(c.id)
                        }}
                      />
                      <button
                        onClick={() => responder(c.id)}
                        className="bg-[#e0559c] text-white text-sm font-semibold rounded-lg px-3"
                      >
                        Enviar
                      </button>
                    </div>
                  )}

                  {respuestasDe(c.id).map((r) => (
                    <div
                      key={r.id}
                      className="mt-3 pl-3 border-l-2 border-[#e0559c] bg-[#fce6f1]/40 rounded-r-lg py-2 pr-2"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-[#c53c82]">
                          ↳ {r.profiles?.full_name ?? 'Alguien'}
                        </span>
                        <span className="text-xs text-slate-400">{cuando(r.created_at)}</span>
                        {(r.author_id === userId || esAdmin) && (
                          <button
                            onClick={() => borrar(r.id)}
                            className="text-[11px] font-semibold text-slate-400 hover:text-[#b0344f]"
                          >
                            Borrar
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-slate-700 mt-0.5 whitespace-pre-wrap">{r.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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

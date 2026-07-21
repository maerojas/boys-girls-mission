'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Maestro = { id: string; full_name: string | null }
type Mensaje = {
  id: string
  teacher_id: string
  sender_id: string
  body: string
  created_at: string
}

function cuando(fecha: string) {
  const d = new Date(fecha)
  return d.toLocaleString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MensajesClient({
  userId,
  esAdmin,
  fullName,
}: {
  userId: string
  esAdmin: boolean
  fullName: string
}) {
  const supabase = createClient()
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [teacherId, setTeacherId] = useState<string | null>(esAdmin ? null : userId)
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [loading, setLoading] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const finRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!esAdmin) {
      setLoading(false)
      return
    }
    ;(async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'maestro')
        .order('full_name')
      if (data) {
        setMaestros(data as Maestro[])
        if (data.length) setTeacherId((data[0] as Maestro).id)
      }
      setLoading(false)
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esAdmin])

  async function cargarMensajes(tid: string) {
    const { data } = await supabase
      .from('private_messages')
      .select('*')
      .eq('teacher_id', tid)
      .order('created_at')
    if (data) setMensajes(data as Mensaje[])
  }

  useEffect(() => {
    if (teacherId) cargarMensajes(teacherId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teacherId])

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  async function enviar() {
    if (!texto.trim() || !teacherId) return
    setEnviando(true)
    const { error } = await supabase.from('private_messages').insert({
      teacher_id: teacherId,
      sender_id: userId,
      body: texto.trim(),
    })
    setEnviando(false)
    if (error) return
    setTexto('')
    cargarMensajes(teacherId)
  }

  const nombreMaestro = esAdmin
    ? maestros.find((m) => m.id === teacherId)?.full_name ?? 'Maestro/a'
    : fullName

  const Chat = (
    <div className="bg-[#eef8f7] rounded-2xl border border-black/5 flex flex-col h-[460px]">
      <div className="px-4 py-3 border-b border-black/5 bg-white rounded-t-2xl flex items-center justify-between">
        <div className="font-bold text-slate-700 text-sm">
          {esAdmin ? `Conversación con ${nombreMaestro}` : 'Coordinación'}
        </div>
        <button
          onClick={() => teacherId && cargarMensajes(teacherId)}
          className="text-xs font-semibold text-[#12807d] hover:underline"
        >
          Actualizar
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {!teacherId ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            Elegí un maestro para ver la conversación.
          </div>
        ) : mensajes.length === 0 ? (
          <div className="text-center text-slate-400 text-sm mt-10">
            Todavía no hay mensajes. Escribí el primero.
          </div>
        ) : (
          mensajes.map((m) => {
            const derecha = esAdmin
              ? m.sender_id !== m.teacher_id
              : m.sender_id === m.teacher_id
            return (
              <div key={m.id} className={`flex ${derecha ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${
                    derecha
                      ? 'bg-[#12807d] text-white'
                      : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.body}</div>
                  <div className={`text-[10px] mt-1 ${derecha ? 'text-white/70' : 'text-slate-400'}`}>
                    {cuando(m.created_at)}
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={finRef} />
      </div>
      {teacherId && (
        <div className="p-3 border-t border-black/5 bg-white rounded-b-2xl flex gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') enviar()
            }}
            placeholder="Escribí un mensaje…"
            className="flex-1 border border-slate-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#e0559c]"
          />
          <button
            onClick={enviar}
            disabled={enviando}
            className="bg-[#e0559c] hover:bg-[#c53c82] disabled:opacity-60 text-white font-semibold rounded-xl px-4"
          >
            Enviar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-[#12807d] mb-1">
          {esAdmin ? 'Mensajes privados' : 'Mensajes con coordinación'}
        </h1>
        <p className="text-slate-500">
          {esAdmin
            ? 'Seguimiento privado con cada maestro/a.'
            : 'Un canal privado con la coordinación para el seguimiento de tus clases.'}
        </p>
      </div>

      {esAdmin ? (
        loading ? (
          <div className="text-slate-400 py-10 text-center">Cargando…</div>
        ) : maestros.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-slate-400">
            Todavía no hay maestros registrados.
          </div>
        ) : (
          <div className="grid md:grid-cols-[240px_1fr] gap-4">
            <div className="bg-white rounded-2xl border border-black/5 p-2 max-h-[460px] overflow-auto">
              {maestros.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTeacherId(m.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold mb-1 flex items-center gap-2 ${
                    teacherId === m.id ? 'bg-[#12807d] text-white' : 'text-slate-600 hover:bg-[#eef8f7]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full grid place-items-center text-xs ${
                      teacherId === m.id ? 'bg-white/20' : 'bg-[#fce6f1] text-[#12807d]'
                    }`}
                  >
                    {(m.full_name?.trim()?.[0] ?? '?').toUpperCase()}
                  </span>
                  <span className="truncate">{m.full_name ?? 'Maestro/a'}</span>
                </button>
              ))}
            </div>
            {Chat}
          </div>
        )
      ) : (
        Chat
      )}
    </div>
  )
}

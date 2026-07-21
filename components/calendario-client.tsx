'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Evento = {
  id: string
  title: string
  description: string | null
  event_date: string
  event_time: string | null
  category: string
  remind_email: boolean
  remind_push: boolean
  remind_offset: string
  created_at: string
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const DOW = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const CATS: Record<string, { label: string; bg: string; fg: string }> = {
  clase: { label: 'Clase', bg: 'rgba(18,128,125,.14)', fg: '#12807d' },
  reunion: { label: 'Reunión', bg: 'rgba(111,139,106,.18)', fg: '#4a6a45' },
  preparacion: { label: 'Preparación', bg: 'rgba(224,85,156,.16)', fg: '#c53c82' },
  ensayo: { label: 'Ensayo', bg: 'rgba(176,106,79,.16)', fg: '#8a4a30' },
}
const OFFSETS: Record<string, string> = {
  '1_hour': '1 hora antes',
  '1_day': '1 día antes',
  '3_days': '3 días antes',
}

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export default function CalendarioClient({ esAdmin, userId }: { esAdmin: boolean; userId: string }) {
  const supabase = createClient()
  const hoy = new Date()
  const [ref, setRef] = useState({ y: hoy.getFullYear(), m: hoy.getMonth() })
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string | null>(null)

  const [modalDia, setModalDia] = useState<string | null>(null)
  const [modalCrear, setModalCrear] = useState(false)
  const [fecha, setFecha] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('clase')
  const [remEmail, setRemEmail] = useState(true)
  const [remPush, setRemPush] = useState(true)
  const [offset, setOffset] = useState('1_day')
  const [guardando, setGuardando] = useState(false)

  function toast(t: string) {
    setMsg(t)
    setTimeout(() => setMsg(null), 3000)
  }

  async function cargar() {
    setLoading(true)
    const { data } = await supabase.from('events').select('*').order('event_date')
    if (data) setEventos(data as Evento[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function shift(n: number) {
    setRef((r) => {
      const nm = r.m + n
      return { y: r.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 }
    })
  }

  const primerDia = new Date(ref.y, ref.m, 1).getDay()
  const diasEnMes = new Date(ref.y, ref.m + 1, 0).getDate()
  const hoyStr = ymd(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
  const eventosDe = (ds: string) => eventos.filter((e) => e.event_date === ds)

  function abrirCrear(ds?: string) {
    const f = ds || modalDia || hoyStr
    setFecha(f)
    setTitle('')
    setDescription('')
    setCategory('clase')
    setRemEmail(true)
    setRemPush(true)
    setOffset('1_day')
    setModalDia(null)
    setModalCrear(true)
  }

  async function guardar() {
    if (!title.trim()) {
      toast('Poné un nombre a la actividad')
      return
    }
    setGuardando(true)
    const { error } = await supabase.from('events').insert({
      title: title.trim(),
      description: description.trim() || null,
      event_date: fecha,
      category,
      remind_email: remEmail,
      remind_push: remPush,
      remind_offset: offset,
      created_by: userId,
    })
    setGuardando(false)
    if (error) {
      toast('No se pudo guardar')
      return
    }
    setModalCrear(false)
    toast('Actividad guardada' + (remEmail || remPush ? ' · recordatorio activo' : ''))
    cargar()
  }

  async function borrar(id: string) {
    if (!confirm('¿Borrar esta actividad?')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      toast('No se pudo borrar')
      return
    }
    setModalDia(null)
    cargar()
  }

  const celdas: (number | null)[] = []
  for (let i = 0; i < primerDia; i++) celdas.push(null)
  for (let d = 1; d <= diasEnMes; d++) celdas.push(d)

  const proximos = [...eventos]
    .filter((e) => e.event_date >= hoyStr)
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 4)

  return (
    <div>
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#12807d] mb-1">Calendario</h1>
          <p className="text-slate-500">Actividades y recordatorios del equipo.</p>
        </div>
        <div className="flex-1" />
        {esAdmin && (
          <button
            onClick={() => abrirCrear(hoyStr)}
            className="bg-[#e0559c] hover:bg-[#c53c82] text-white font-semibold rounded-xl px-4 py-2.5"
          >
            ＋ Nueva actividad
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => shift(-1)} className="w-9 h-9 rounded-lg border border-slate-300 bg-white hover:border-[#e0559c]">‹</button>
        <div className="font-bold text-lg text-slate-700 min-w-[180px]">{MESES[ref.m]} {ref.y}</div>
        <button onClick={() => shift(1)} className="w-9 h-9 rounded-lg border border-slate-300 bg-white hover:border-[#e0559c]">›</button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden mb-6">
        <div className="grid grid-cols-7 bg-[#12807d] text-white">
          {DOW.map((d) => (
            <div key={d} className="py-2 text-center text-xs font-bold uppercase tracking-wide">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {celdas.map((d, i) => {
            if (d === null) return <div key={i} className="min-h-[84px] bg-slate-50/60 border-t border-r border-slate-100" />
            const ds = ymd(ref.y, ref.m, d)
            const evs = eventosDe(ds)
            const esHoy = ds === hoyStr
            return (
              <button
                key={i}
                onClick={() => setModalDia(ds)}
                className="min-h-[84px] text-left p-1.5 border-t border-r border-slate-100 hover:bg-[#eef8f7] transition-colors align-top"
              >
                <span className={`text-xs font-semibold inline-grid place-items-center ${esHoy ? 'bg-[#12807d] text-white w-6 h-6 rounded-full' : 'text-slate-500'}`}>{d}</span>
                <div className="mt-1 space-y-1">
                  {evs.slice(0, 3).map((e) => {
                    const c = CATS[e.category] ?? CATS.clase
                    return (
                      <div key={e.id} className="text-[10px] font-semibold px-1.5 py-0.5 rounded truncate" style={{ background: c.bg, color: c.fg }}>
                        {(e.remind_email || e.remind_push) ? '🔔 ' : ''}{e.title}
                      </div>
                    )
                  })}
                  {evs.length > 3 && <div className="text-[10px] text-slate-400 px-1.5">+{evs.length - 3} más</div>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5">
        <h3 className="font-bold text-slate-700 mb-3">Próximas actividades</h3>
        {loading ? (
          <div className="text-slate-400 text-sm">Cargando…</div>
        ) : proximos.length === 0 ? (
          <div className="text-slate-400 text-sm">No hay actividades próximas.</div>
        ) : (
          <div className="space-y-2">
            {proximos.map((e) => {
              const c = CATS[e.category] ?? CATS.clase
              const dd = new Date(e.event_date + 'T00:00')
              return (
                <div key={e.id} className="flex items-center gap-3 py-2 border-t border-slate-100 first:border-t-0">
                  <div className="w-11 h-11 shrink-0 rounded-lg grid place-items-center text-center leading-none" style={{ background: c.bg, color: c.fg }}>
                    <div className="font-bold text-sm">{dd.getDate()}</div>
                    <div className="text-[9px] uppercase">{MESES[dd.getMonth()].slice(0, 3)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm text-slate-800 truncate">{e.title}</div>
                    <div className="text-xs text-slate-500">
                      {c.label}{(e.remind_email || e.remind_push) ? ' · 🔔 recordatorio' : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modalDia && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-5" onClick={(e) => { if (e.target === e.currentTarget) setModalDia(null) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-[#12807d] mb-1">
              {new Date(modalDia + 'T00:00').getDate()} de {MESES[new Date(modalDia + 'T00:00').getMonth()]}
            </h3>
            <p className="text-sm text-slate-500 mb-4">Actividades del día</p>
            {eventosDe(modalDia).length === 0 ? (
              <p className="text-slate-400 text-sm mb-4">No hay actividades este día.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {eventosDe(modalDia).map((e) => {
                  const c = CATS[e.category] ?? CATS.clase
                  return (
                    <div key={e.id} className="border border-slate-200 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: c.bg, color: c.fg }}>{c.label}</span>
                        <span className="font-semibold text-slate-800">{e.title}</span>
                      </div>
                      {e.description && <p className="text-sm text-slate-500 mt-1">{e.description}</p>}
                      {(e.remind_email || e.remind_push) && (
                        <p className="text-xs text-slate-500 mt-1">
                          🔔 Recordatorio {OFFSETS[e.remind_offset]}
                          {e.remind_email && e.remind_push ? ' · email + push' : e.remind_email ? ' · email' : ' · push'}
                        </p>
                      )}
                      {esAdmin && (
                        <button onClick={() => borrar(e.id)} className="text-xs font-semibold text-slate-400 hover:text-[#b0344f] mt-2">Borrar</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            <div className="flex gap-2">
              {esAdmin ? (
                <>
                  <button onClick={() => abrirCrear(modalDia)} className="flex-1 bg-[#e0559c] hover:bg-[#c53c82] text-white rounded-xl py-2.5 font-semibold">＋ Agregar acá</button>
                  <button onClick={() => setModalDia(null)} className="flex-1 border border-slate-300 rounded-xl py-2.5 font-semibold text-slate-600">Cerrar</button>
                </>
              ) : (
                <button onClick={() => setModalDia(null)} className="flex-1 bg-[#12807d] text-white rounded-xl py-2.5 font-semibold">Listo</button>
              )}
            </div>
          </div>
        </div>
      )}

      {modalCrear && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-5" onClick={(e) => { if (e.target === e.currentTarget) setModalCrear(false) }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[92vh] overflow-auto">
            <h3 className="text-xl font-bold text-[#12807d] mb-1">Nueva actividad</h3>
            <p className="text-sm text-slate-500 mb-4">Se agrega al calendario del equipo.</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Nombre</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Clase dominical" className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Fecha</label>
                <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Categoría</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]">
                  <option value="clase">Clase</option>
                  <option value="reunion">Reunión</option>
                  <option value="preparacion">Preparación</option>
                  <option value="ensayo">Ensayo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1 text-slate-700">Descripción (opcional)</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">Recordatorio</label>
                <button type="button" onClick={() => setRemEmail((v) => !v)} className={`w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 mb-2 ${remEmail ? 'border-[#e0559c] bg-[#fce6f1]' : 'border-slate-300'}`}>
                  <span>✉</span><span className="flex-1 text-left text-sm font-semibold text-slate-700">Por email</span>
                  <span className={`w-5 h-5 rounded grid place-items-center text-white text-xs ${remEmail ? 'bg-[#e0559c]' : 'bg-slate-300'}`}>{remEmail ? '✓' : ''}</span>
                </button>
                <button type="button" onClick={() => setRemPush((v) => !v)} className={`w-full flex items-center gap-3 border rounded-xl px-3 py-2.5 mb-2 ${remPush ? 'border-[#e0559c] bg-[#fce6f1]' : 'border-slate-300'}`}>
                  <span>🔔</span><span className="flex-1 text-left text-sm font-semibold text-slate-700">Notificación push</span>
                  <span className={`w-5 h-5 rounded grid place-items-center text-white text-xs ${remPush ? 'bg-[#e0559c]' : 'bg-slate-300'}`}>{remPush ? '✓' : ''}</span>
                </button>
                {(remEmail || remPush) && (
                  <select value={offset} onChange={(e) => setOffset(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]">
                    <option value="1_hour">1 hora antes</option>
                    <option value="1_day">1 día antes</option>
                    <option value="3_days">3 días antes</option>
                  </select>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalCrear(false)} className="flex-1 border border-slate-300 rounded-xl py-2.5 font-semibold text-slate-600">Cancelar</button>
              <button onClick={guardar} disabled={guardando} className="flex-1 bg-[#12807d] hover:bg-[#0c6360] disabled:opacity-60 text-white rounded-xl py-2.5 font-semibold">{guardando ? 'Guardando…' : 'Guardar'}</button>
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

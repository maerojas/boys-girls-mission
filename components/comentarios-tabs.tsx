'use client'

import { useState } from 'react'
import ComentariosClient from './comentarios-client'
import MensajesClient from './mensajes-client'

export default function ComentariosTabs({
  userId,
  esAdmin,
  fullName,
}: {
  userId: string
  esAdmin: boolean
  fullName: string
}) {
  const [tab, setTab] = useState<'muro' | 'privado'>('muro')
  return (
    <div>
      <div className="flex gap-1 mb-5 bg-white rounded-xl border border-black/5 p-1 w-fit">
        <button
          onClick={() => setTab('muro')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'muro' ? 'bg-[#12807d] text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Muro del equipo
        </button>
        <button
          onClick={() => setTab('privado')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'privado' ? 'bg-[#12807d] text-white' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {esAdmin ? 'Mensajes privados' : 'Coordinación'}
        </button>
      </div>
      {tab === 'muro' ? (
        <ComentariosClient userId={userId} esAdmin={esAdmin} />
      ) : (
        <MensajesClient userId={userId} esAdmin={esAdmin} fullName={fullName} />
      )}
    </div>
  )
}

import Link from 'next/link'

const SECCIONES = [
  { href: '/calendario', label: 'Calendario', icon: '📅', desc: 'Actividades y recordatorios del equipo' },
  { href: '/recursos', label: 'Recursos', icon: '📄', desc: 'Material en PDF para descargar' },
  { href: '/videos', label: 'Videos', icon: '🎬', desc: 'Ideas creativas en video' },
  { href: '/versiculos', label: 'Versículos', icon: '✨', desc: 'Láminas para imprimir' },
  { href: '/comentarios', label: 'Comentarios', icon: '💬', desc: 'El foro del equipo' },
]

export default function Inicio() {
  return (
    <div>
      <div
        className="rounded-2xl text-white p-7 mb-6"
        style={{ background: 'linear-gradient(135deg, #12807d, #0c6360)' }}
      >
        <p className="text-[#f4a9cf] font-semibold text-xs uppercase tracking-wider">
          Escuela Bíblica
        </p>
        <h1 className="text-2xl font-bold mt-1">Buen día, equipo 🌱</h1>
        <p className="text-white/80 mt-1 max-w-lg">
          Todo lo que necesitás para organizar la escuela bíblica, en un solo lugar.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {SECCIONES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="font-bold text-slate-800">{s.label}</div>
            <div className="text-sm text-slate-500">{s.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

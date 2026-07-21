'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signout } from '@/app/login/actions'

const NAV = [
  { href: '/', label: 'Inicio', icon: '🏠' },
  { href: '/calendario', label: 'Calendario', icon: '📅' },
  { href: '/recursos', label: 'Recursos', icon: '📄' },
  { href: '/videos', label: 'Videos', icon: '🎬' },
  { href: '/versiculos', label: 'Versículos', icon: '✨' },
  { href: '/comentarios', label: 'Comentarios', icon: '💬' },
]

const TITLES: Record<string, string> = {
  '/': 'Inicio',
  '/calendario': 'Calendario',
  '/recursos': 'Recursos',
  '/videos': 'Videos con ideas',
  '/versiculos': 'Versículos',
  '/comentarios': 'Comentarios',
}

export default function AppShell({
  fullName,
  role,
  children,
}: {
  fullName: string
  role: 'admin' | 'maestro'
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const title = TITLES[pathname] ?? 'Boys & Girls in Mission'
  const esAdmin = role === 'admin'
  const inicial = (fullName?.trim()?.[0] ?? '?').toUpperCase()

  return (
    <div className="min-h-screen md:grid md:grid-cols-[250px_1fr] bg-[#eef8f7]">
      <aside className="hidden md:flex flex-col bg-[#0c6360] text-white p-4 sticky top-0 h-screen">
        <div className="bg-white rounded-xl p-3 mb-4">
          <img src="/bgm-logo.jpg" alt="Boys & Girls in Mission" className="w-full h-auto rounded" />
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                  active
                    ? 'bg-[#e0559c] text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span>{item.icon}</span> {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="mt-auto pt-4 border-t border-white/15 text-xs text-white/70">
          Sesión: {fullName}
          {esAdmin ? ' · Admin' : ''}
        </div>
      </aside>

      <div className="flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-[#eef8f7]/85 backdrop-blur border-b border-black/10 px-5 py-3 flex items-center gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500">Boys &amp; Girls in Mission</div>
            <h2 className="text-xl font-bold text-[#12807d]">{title}</h2>
          </div>
          <div className="flex-1" />
          <div className="hidden sm:block text-right leading-tight">
            <div className="text-sm font-bold text-slate-700">{fullName}</div>
            <div className="text-xs text-slate-500">{esAdmin ? 'Administrador' : 'Maestro/a'}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-[#fce6f1] text-[#12807d] grid place-items-center font-bold border border-[#f4a9cf]">
            {inicial}
          </div>
          <form>
            <button
              formAction={signout}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-semibold text-slate-600 hover:border-[#b0344f] hover:text-[#b0344f]"
            >
              Salir
            </button>
          </form>
        </header>

        <main className="p-5 pb-24 md:pb-8 max-w-5xl w-full mx-auto">{children}</main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0c6360] grid grid-cols-6 px-1 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 text-[10px] font-semibold rounded-lg ${
                  active ? 'text-[#f4a9cf]' : 'text-white/70'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

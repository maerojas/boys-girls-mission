'use client'

import { useState } from 'react'
import { login, signup } from './actions'

export default function LoginForm({ error }: { error?: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-[#eef8f7] to-[#d6efed]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#12807d]">Boys &amp; Girls in Mission</h1>
          <p className="text-sm text-slate-500 mt-1">Escuela Bíblica · Equipo de maestros</p>
        </div>

        {error && (
          <div className="mb-4 text-sm font-medium text-[#b0344f] bg-[#fce6ec] rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <form className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-700">Nombre y apellido</label>
              <input name="full_name" type="text" required placeholder="Ej: Ana Gómez"
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]" />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Email</label>
            <input name="email" type="email" required placeholder="tu@correo.com"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-700">Contraseña</label>
            <input name="password" type="password" required placeholder="••••••••" minLength={6}
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]" />
          </div>

          <button
            formAction={mode === 'login' ? login : signup}
            className="w-full bg-[#12807d] hover:bg-[#0c6360] text-white font-semibold rounded-xl py-3 transition-colors">
            {mode === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        </form>

        <div className="text-center text-sm text-slate-500 mt-5">
          {mode === 'login' ? (
            <>¿No tenés cuenta?{' '}
              <button type="button" onClick={() => setMode('register')} className="text-[#e0559c] font-semibold hover:underline">Registrate</button>
            </>
          ) : (
            <>¿Ya tenés cuenta?{' '}
              <button type="button" onClick={() => setMode('login')} className="text-[#e0559c] font-semibold hover:underline">Ingresá</button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

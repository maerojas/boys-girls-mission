'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Verse = {
  id: string
  reference: string
  text: string | null
  theme: string | null
  font: string | null
  storage_path: string | null
  created_at: string
}

const THEMES = [
  { id: 'teal', label: 'Turquesa', bg: '#12807d', fg: '#ffffff', ref: '#f4a9cf' },
  { id: 'pink', label: 'Rosa', bg: '#e0559c', fg: '#ffffff', ref: '#ffe4f1' },
  { id: 'cream', label: 'Crema', bg: '#f6efe0', fg: '#1b2a2a', ref: '#c53c82' },
  { id: 'sage', label: 'Verde', bg: '#6f8b6a', fg: '#ffffff', ref: '#eef3ec' },
  { id: 'night', label: 'Noche', bg: '#17233a', fg: '#ffffff', ref: '#e3c987' },
  { id: 'sunset', label: 'Atardecer', bg: 'linear-gradient(135deg,#f6a35c,#e0559c)', fg: '#ffffff', ref: '#fff3e0' },
  { id: 'ocean', label: 'Oceano', bg: 'linear-gradient(135deg,#12807d,#1b4a8a)', fg: '#ffffff', ref: '#bfe9e6' },
  { id: 'lavender', label: 'Lavanda', bg: 'linear-gradient(135deg,#8b7fd4,#e0559c)', fg: '#ffffff', ref: '#efe9ff' },
]
const FONTS = [
  { id: 'playfair', label: 'Playfair', css: "'Playfair Display', serif" },
  { id: 'lora', label: 'Lora', css: "'Lora', serif" },
  { id: 'cormorant', label: 'Cormorant', css: "'Cormorant Garamond', serif" },
  { id: 'montserrat', label: 'Montserrat', css: "'Montserrat', sans-serif" },
  { id: 'dancing', label: 'Manuscrita', css: "'Dancing Script', cursive" },
  { id: 'caveat', label: 'Casual', css: "'Caveat', cursive" },
]
const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Cormorant+Garamond:wght@500;600;700&family=Dancing+Script:wght@600;700&family=Lora:wght@500;600;700&family=Montserrat:wght@500;600;700&family=Playfair+Display:wght@500;600;700&display=swap'

const themeById = (id: string | null) => THEMES.find((t) => t.id === id) ?? THEMES[0]
const fontById = (id: string | null) => FONTS.find((f) => f.id === id) ?? FONTS[0]

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[c])
  )
}

function Lamina({
  reference,
  text,
  theme,
  font,
  imageUrl,
}: {
  reference: string
  text: string
  theme: string | null
  font: string | null
  imageUrl: string | null
}) {
  const t = themeById(theme)
  const f = fontById(font)
  const hasImg = !!imageUrl
  return (
    <div
      className="relative aspect-[4/5] w-full flex flex-col items-center justify-center text-center p-6 overflow-hidden"
      style={{ background: hasImg ? '#000' : t.bg }}
    >
      {hasImg && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl!} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.42)' }} />
        </>
      )}
      <div className="relative" style={{ color: hasImg ? '#ffffff' : t.fg }}>
        <div className="text-2xl opacity-60 mb-2">❦</div>
        <div
          className="text-[11px] font-bold tracking-widest uppercase mb-3"
          style={{ color: hasImg ? '#ffffff' : t.ref, fontFamily: 'Arial, sans-serif' }}
        >
          {reference || 'Cita del versículo'}
        </div>
        <div className="text-lg leading-relaxed" style={{ fontFamily: f.css }}>
          {text || 'El texto del versículo aparecerá acá…'}
        </div>
      </div>
    </div>
  )
}

export default function VersiculosClient({ esAdmin, userId }: { esAdmin: boolean; userId: string }) {
  const supabase = createClient()
  const [verses, setVerses] = useState<Verse[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  const [reference, setReference] = useState('')
  const [text, setText] = useState('')
  const [theme, setTheme] = useState('teal')
  const [font, setFont] = useState('playfair')
  const [file, setFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function toast(t: string) {
    setMsg(t)
    setTimeout(() => setMsg(null), 3000)
  }

  function publicUrl(path: string | null) {
    if (!path) return null
    return supabase.storage.from('versiculos').getPublicUrl(path).data.publicUrl
  }

  async function cargar() {
    setLoading(true)
    const { data } = await supabase
      .from('verses')
      .select('id, reference, text, theme, font, storage_path, created_at')
      .order('created_at', { ascending: false })
    if (data) setVerses(data as Verse[])
    setLoading(false)
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function elegirArchivo(f: File | null) {
    setFile(f)
    if (filePreview) URL.revokeObjectURL(filePreview)
    setFilePreview(f ? URL.createObjectURL(f) : null)
  }

  function resetForm() {
    setReference('')
    setText('')
    setTheme('teal')
    setFont('playfair')
    elegirArchivo(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function crear() {
    if (!reference.trim()) {
      toast('Poné la cita (ej: Salmos 119:105)')
      return
    }
    if (!text.trim()) {
      toast('Escribí el texto del versículo')
      return
    }
    setGuardando(true)
    try {
      let storage_path: string | null = null
      if (file) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
        const path = `${crypto.randomUUID()}.${ext}`
        const { error: upErr } = await supabase.storage.from('versiculos').upload(path, file)
        if (upErr) throw upErr
        storage_path = path
      }
      const { error } = await supabase.from('verses').insert({
        reference: reference.trim(),
        text: text.trim(),
        theme,
        font,
        storage_path,
        created_by: userId,
      })
      if (error) throw error
      setModalOpen(false)
      resetForm()
      toast('Lámina creada ✓')
      cargar()
    } catch (e: unknown) {
      const m = e instanceof Error ? e.message : 'no se pudo guardar'
      toast('Error: ' + m)
    } finally {
      setGuardando(false)
    }
  }

  async function borrar(v: Verse) {
    if (!confirm('¿Borrar esta lámina?')) return
    if (v.storage_path) await supabase.storage.from('versiculos').remove([v.storage_path])
    const { error } = await supabase.from('verses').delete().eq('id', v.id)
    if (error) {
      toast('No se pudo borrar')
      return
    }
    cargar()
  }

  function imprimir(v: Verse) {
    const t = themeById(v.theme)
    const f = fontById(v.font)
    const img = publicUrl(v.storage_path)
    const hasImg = !!img
    const w = window.open('', '_blank', 'width=800,height=1000')
    if (!w) {
      toast('Permití las ventanas emergentes para imprimir')
      return
    }
    w.document.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        '<title>' + escapeHtml(v.reference) + '</title>' +
        '<link href="' + FONTS_URL + '" rel="stylesheet">' +
        '<style>' +
        '@page{margin:0}' +
        'html,body{margin:0;padding:0;height:100%}' +
        '.lam{position:relative;width:100%;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:8%;box-sizing:border-box;background:' + (hasImg ? '#000' : t.bg) + ';color:' + (hasImg ? '#fff' : t.fg) + '}' +
        '.bgimg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}' +
        '.ov{position:absolute;inset:0;background:rgba(0,0,0,.42)}' +
        '.content{position:relative}' +
        '.orn{font-size:2.6rem;opacity:.55;margin-bottom:1rem}' +
        '.ref{font-size:.9rem;letter-spacing:.22em;text-transform:uppercase;font-family:Arial,Helvetica,sans-serif;margin-bottom:1.6rem;color:' + (hasImg ? '#fff' : t.ref) + '}' +
        '.txt{font-size:2.2rem;line-height:1.5;max-width:84%;margin:0 auto;font-family:' + f.css + '}' +
        '</style></head><body>' +
        '<div class="lam">' +
        (hasImg ? '<img class="bgimg" src="' + img + '"><div class="ov"></div>' : '') +
        '<div class="content"><div class="orn">&#10086;</div>' +
        '<div class="ref">' + escapeHtml(v.reference) + '</div>' +
        '<div class="txt">' + escapeHtml(v.text || '') + '</div></div>' +
        '</div>' +
        '<script>function go(){setTimeout(function(){window.print()},250)}' +
        'if(document.fonts&&document.fonts.ready){document.fonts.ready.then(go)}else{setTimeout(go,700)}<\/script>' +
        '</body></html>'
    )
    w.document.close()
  }

  return (
    <div>
      <div className="flex items-end gap-3 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#12807d] mb-1">Versículos</h1>
          <p className="text-slate-500">Láminas listas para imprimir para el aula.</p>
        </div>
        <div className="flex-1" />
        {esAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="bg-[#e0559c] hover:bg-[#c53c82] text-white font-semibold rounded-xl px-4 py-2.5"
          >
            ＋ Crear lámina
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-slate-400 py-12">Cargando…</div>
      ) : verses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 p-10 text-center text-slate-400">
          Todavía no hay láminas.
          {esAdmin && ' Tocá "Crear lámina" para hacer la primera.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {verses.map((v) => (
            <div key={v.id} className="rounded-2xl shadow-sm border border-black/5 overflow-hidden flex flex-col">
              <Lamina
                reference={v.reference}
                text={v.text || ''}
                theme={v.theme}
                font={v.font}
                imageUrl={publicUrl(v.storage_path)}
              />
              <div className="p-3 flex gap-2 bg-white">
                <button
                  onClick={() => imprimir(v)}
                  className="bg-[#12807d] hover:bg-[#0c6360] text-white text-sm font-semibold rounded-lg px-3 py-2"
                >
                  🖶 Imprimir
                </button>
                {esAdmin && (
                  <button
                    onClick={() => borrar(v)}
                    className="text-sm font-semibold text-slate-400 hover:text-[#b0344f] border border-slate-200 rounded-lg px-3 py-2"
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
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false)
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[92vh] overflow-auto">
            <div className="p-5 md:p-6 grid md:grid-cols-[1fr_300px] gap-6">
              <div className="space-y-4 order-2 md:order-1">
                <div>
                  <h3 className="text-xl font-bold text-[#12807d] mb-1">Crear lámina</h3>
                  <p className="text-sm text-slate-500">Diseñala a tu gusto. La vista previa se actualiza sola.</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Cita</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ej: Salmos 119:105"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Texto del versículo</label>
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="Escribí el versículo…"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-[#e0559c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">Fondo</label>
                  <div className="grid grid-cols-4 gap-2">
                    {THEMES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTheme(t.id)
                          elegirArchivo(null)
                          if (fileRef.current) fileRef.current.value = ''
                        }}
                        title={t.label}
                        className={`h-10 rounded-lg border-2 ${
                          theme === t.id && !file ? 'border-[#12807d]' : 'border-transparent'
                        }`}
                        style={{ background: t.bg }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-700">Tipografía</label>
                  <div className="grid grid-cols-3 gap-2">
                    {FONTS.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setFont(f.id)}
                        className={`py-2 px-2 rounded-lg border text-sm ${
                          font === f.id
                            ? 'border-[#12807d] bg-[#eef8f7] text-[#12807d] font-semibold'
                            : 'border-slate-300 text-slate-600'
                        }`}
                        style={{ fontFamily: f.css }}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1 text-slate-700">Imagen de fondo (opcional)</label>
                  <p className="text-xs text-slate-400 mb-2">Si subís una imagen, se usa en lugar del color.</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
                    className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#eef8f7] file:px-3 file:py-2 file:text-[#12807d] file:font-semibold"
                  />
                  {file && (
                    <button
                      type="button"
                      onClick={() => {
                        elegirArchivo(null)
                        if (fileRef.current) fileRef.current.value = ''
                      }}
                      className="text-xs font-semibold text-[#b0344f] mt-2"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setModalOpen(false)}
                    className="flex-1 border border-slate-300 rounded-xl py-2.5 font-semibold text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={crear}
                    disabled={guardando}
                    className="flex-1 bg-[#12807d] hover:bg-[#0c6360] disabled:opacity-60 text-white rounded-xl py-2.5 font-semibold"
                  >
                    {guardando ? 'Guardando…' : 'Crear lámina'}
                  </button>
                </div>
              </div>

              <div className="order-1 md:order-2">
                <div className="md:sticky md:top-0">
                  <div className="text-xs font-semibold text-slate-400 mb-2 text-center">Vista previa</div>
                  <div className="rounded-xl overflow-hidden shadow-md">
                    <Lamina
                      reference={reference}
                      text={text}
                      theme={theme}
                      font={font}
                      imageUrl={file ? filePreview : null}
                    />
                  </div>
                </div>
              </div>
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

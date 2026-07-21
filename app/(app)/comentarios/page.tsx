import { createClient } from '@/lib/supabase/server'
import ComentariosTabs from '@/components/comentarios-tabs'

export default async function ComentariosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user!.id)
    .single()

  return (
    <ComentariosTabs
      userId={user!.id}
      esAdmin={profile?.role === 'admin'}
      fullName={profile?.full_name ?? 'Maestro/a'}
    />
  )
}

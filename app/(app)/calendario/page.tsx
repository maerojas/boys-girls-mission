import { createClient } from '@/lib/supabase/server'
import CalendarioClient from '@/components/calendario-client'

export default async function CalendarioPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  return <CalendarioClient esAdmin={profile?.role === 'admin'} userId={user!.id} />
}

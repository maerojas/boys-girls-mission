import { createClient } from '@/lib/supabase/server'
import RecursosClient from '@/components/recursos-client'

export default async function RecursosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  const esAdmin = profile?.role === 'admin'

  return <RecursosClient esAdmin={esAdmin} />
}

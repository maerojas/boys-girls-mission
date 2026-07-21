import { createClient } from '@/lib/supabase/server'
import VersiculosClient from '@/components/versiculos-client'

export default async function VersiculosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  return <VersiculosClient esAdmin={profile?.role === 'admin'} userId={user!.id} />
}

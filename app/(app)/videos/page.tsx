import { createClient } from '@/lib/supabase/server'
import VideosClient from '@/components/videos-client'

export default async function VideosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  return <VideosClient esAdmin={profile?.role === 'admin'} userId={user!.id} />
}

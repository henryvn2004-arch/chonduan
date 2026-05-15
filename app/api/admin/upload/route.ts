import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const projectId = formData.get('project_id') as string | null

  if (!file || !projectId) {
    return NextResponse.json({ error: 'Missing file or project_id' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${projectId}/${Date.now()}.${ext}`

  const serviceClient = await createServiceClient()
  const { error } = await serviceClient.storage
    .from('projects-media')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[admin upload]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = serviceClient.storage
    .from('projects-media')
    .getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}

import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST /api/agencies/[id]/approve — admin approve or reject agency
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const { action } = await req.json() // 'approve' | 'reject'

  const service = await createServiceClient()

  if (action === 'approve') {
    await service.from('agencies')
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq('id', id)
  } else if (action === 'reject') {
    // Revert user_type and delete agency
    const { data: agency } = await service
      .from('agencies').select('admin_user_id').eq('id', id).single()
    if (agency?.admin_user_id) {
      await service.from('user_profiles')
        .update({ user_type: 'buyer', updated_at: new Date().toISOString() })
        .eq('id', agency.admin_user_id)
    }
    await service.from('wallets').delete()
      .eq('owner_type', 'agency').eq('owner_id', id)
    await service.from('agencies').delete().eq('id', id)
  } else {
    return NextResponse.json({ error: 'action phải là approve hoặc reject' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

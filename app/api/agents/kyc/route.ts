import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('user_profiles').select('user_type').eq('id', user.id).single()
  return data?.user_type === 'admin'
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  if (!await requireAdmin(supabase)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { agent_id, action, reason } = await req.json()
  if (!agent_id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid params' }, { status: 400 })
  }

  if (action === 'approve') {
    const { error } = await supabase.from('agents').update({
      kyc_status: 'approved',
      kyc_approved_at: new Date().toISOString(),
      published: true,
      tier: 'verified',
      verified_badge_active: true,
    }).eq('id', agent_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { error } = await supabase.from('agents').update({
      kyc_status: 'rejected',
      kyc_rejected_reason: reason ?? null,
      published: false,
    }).eq('id', agent_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

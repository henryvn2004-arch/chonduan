import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/leads/[id]/flag
// Admin only — mark lead as suspicious fraud
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

  const { data: lead } = await supabase
    .from('leads')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.status === 'refunded') return NextResponse.json({ error: 'Lead đã được hoàn' }, { status: 400 })

  const { error } = await supabase
    .from('leads')
    .update({ status: 'flagged', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

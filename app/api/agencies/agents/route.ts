import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

async function getAgency(userId: string) {
  const service = await createServiceClient()
  const { data } = await service
    .from('agencies')
    .select('id, subscription_tier, subscription_expires_at')
    .eq('admin_user_id', userId)
    .single()
  return data
}

// GET /api/agencies/agents — list agents in agency
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agency = await getAgency(user.id)
  if (!agency) return NextResponse.json({ error: 'Không tìm thấy sàn' }, { status: 404 })

  const service = await createServiceClient()
  const { data: agents } = await service
    .from('agents')
    .select('id, slug, display_name, phone, email, avatar_url, kyc_status, tier, specialty_types, leads_received_count, deals_closed_count, avg_rating')
    .eq('agency_id', agency.id)
    .order('display_name')

  return NextResponse.json({ agents: agents ?? [] })
}

// POST /api/agencies/agents — invite agent by phone
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agency = await getAgency(user.id)
  if (!agency) return NextResponse.json({ error: 'Không tìm thấy sàn' }, { status: 404 })
  if (!agency.subscription_tier || agency.subscription_tier === 'free') {
    return NextResponse.json({ error: 'Cần đăng ký gói trả phí để thêm nhân viên' }, { status: 403 })
  }

  // Enforce agent limits per tier
  const service = await createServiceClient()
  const { count } = await service
    .from('agents')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', agency.id)

  const LIMITS: Record<string, number> = { basic: 10, pro: 30, top: 100, agency: 100 }
  const limit = LIMITS[agency.subscription_tier] ?? 10
  if ((count ?? 0) >= limit) {
    return NextResponse.json({ error: `Gói của bạn tối đa ${limit} nhân viên` }, { status: 403 })
  }

  const { phone } = await req.json()
  if (!phone?.trim()) return NextResponse.json({ error: 'Thiếu số điện thoại' }, { status: 400 })

  // Find agent by phone (stored in agents table directly)
  const { data: agent } = await service
    .from('agents')
    .select('id, display_name, agency_id')
    .eq('phone', phone.trim())
    .single()

  if (!agent) return NextResponse.json({ error: 'Không tìm thấy môi giới với số điện thoại này' }, { status: 404 })
  if (agent.agency_id) return NextResponse.json({ error: 'Môi giới này đã thuộc sàn khác' }, { status: 409 })

  await service.from('agents')
    .update({ agency_id: agency.id, updated_at: new Date().toISOString() })
    .eq('id', agent.id)

  // Sync agents_count
  await service.from('agencies')
    .update({ agents_count: (count ?? 0) + 1, updated_at: new Date().toISOString() })
    .eq('id', agency.id)

  return NextResponse.json({ ok: true, agent_name: agent.display_name })
}

// DELETE /api/agencies/agents — remove agent from agency
export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agency = await getAgency(user.id)
  if (!agency) return NextResponse.json({ error: 'Không tìm thấy sàn' }, { status: 404 })

  const { agent_id } = await req.json()
  if (!agent_id) return NextResponse.json({ error: 'Thiếu agent_id' }, { status: 400 })

  const service = await createServiceClient()

  // Verify agent belongs to this agency
  const { data: agent } = await service
    .from('agents').select('id, agency_id').eq('id', agent_id).single()
  if (agent?.agency_id !== agency.id) {
    return NextResponse.json({ error: 'Môi giới không thuộc sàn này' }, { status: 403 })
  }

  await service.from('agents')
    .update({ agency_id: null, updated_at: new Date().toISOString() })
    .eq('id', agent_id)

  const { count } = await service
    .from('agents').select('id', { count: 'exact', head: true }).eq('agency_id', agency.id)
  await service.from('agencies')
    .update({ agents_count: count ?? 0, updated_at: new Date().toISOString() })
    .eq('id', agency.id)

  return NextResponse.json({ ok: true })
}

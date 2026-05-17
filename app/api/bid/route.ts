import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const FLOOR: Record<string, number> = {
  sale: 100,
  rent_long: 50,
  rent_short: 30,
}

// POST /api/bid — place a bid
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status, specialty_types, suspended')
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })
  if (agent.kyc_status !== 'approved') return NextResponse.json({ error: 'KYC not approved' }, { status: 403 })
  if (agent.suspended) return NextResponse.json({ error: 'Account suspended' }, { status: 403 })

  const body = await req.json()
  const { project_id, slot_type, bid_amount_weekly_credits, auto_renew = true } = body

  if (!project_id || !slot_type || !bid_amount_weekly_credits) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const floor = FLOOR[slot_type]
  if (!floor) return NextResponse.json({ error: 'Invalid slot_type' }, { status: 400 })

  if (bid_amount_weekly_credits < floor) {
    return NextResponse.json({ error: `Minimum bid for ${slot_type} is ${floor} credits/week` }, { status: 400 })
  }

  // Check agent has this specialty
  const specialties: string[] = agent.specialty_types ?? []
  if (!specialties.includes(slot_type)) {
    return NextResponse.json({ error: `Agent does not have ${slot_type} specialty` }, { status: 403 })
  }

  // Check wallet balance (must have at least 1 week worth)
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance_credits')
    .eq('owner_type', 'agent')
    .eq('owner_id', agent.id)
    .single()

  if (!wallet || wallet.balance_credits < bid_amount_weekly_credits) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })
  }

  // Upsert bid — one active bid per agent+project+slot_type
  // Cancel any existing active bid first
  await supabase
    .from('agent_bids')
    .update({ status: 'cancelled' })
    .eq('agent_id', agent.id)
    .eq('project_id', project_id)
    .eq('slot_type', slot_type)
    .eq('status', 'active')

  const endsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: bid, error } = await supabase
    .from('agent_bids')
    .insert({
      agent_id: agent.id,
      project_id,
      slot_type,
      bid_amount_weekly_credits,
      auto_renew,
      ends_at: endsAt,
      status: 'active',
    })
    .select('id, slot_rank')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Resolve slots immediately so agent sees their rank
  await supabase.rpc('resolve_bidding_slots', {
    p_project_id: project_id,
    p_slot_type: slot_type,
  })

  return NextResponse.json({ ok: true, bid_id: bid.id })
}

// DELETE /api/bid — cancel a bid
export async function DELETE(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })

  const { bid_id } = await req.json()
  if (!bid_id) return NextResponse.json({ error: 'Missing bid_id' }, { status: 400 })

  const { data: bid } = await supabase
    .from('agent_bids')
    .select('id, project_id, slot_type, status')
    .eq('id', bid_id)
    .eq('agent_id', agent.id)
    .single()

  if (!bid) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
  if (bid.status !== 'active') return NextResponse.json({ error: 'Bid is not active' }, { status: 400 })

  const { error } = await supabase
    .from('agent_bids')
    .update({ status: 'cancelled' })
    .eq('id', bid_id)
    .eq('agent_id', agent.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Re-resolve slots after cancellation
  await supabase.rpc('resolve_bidding_slots', {
    p_project_id: bid.project_id,
    p_slot_type: bid.slot_type,
  })

  return NextResponse.json({ ok: true })
}

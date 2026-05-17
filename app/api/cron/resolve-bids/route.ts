import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Vercel cron: runs every hour
// Resolves slot rankings for all projects that have active bids
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()

  // Get distinct project IDs with active bids
  const { data: activeBids, error } = await supabase
    .from('agent_bids')
    .select('project_id')
    .eq('status', 'active')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const projectIds = [...new Set((activeBids ?? []).map(b => b.project_id))]

  let resolved = 0
  for (const projectId of projectIds) {
    await supabase.rpc('resolve_all_bidding_slots', { p_project_id: projectId })
    resolved++
  }

  // Mark expired bids
  await supabase
    .from('agent_bids')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('ends_at', new Date().toISOString())

  return NextResponse.json({ ok: true, resolved_projects: resolved })
}

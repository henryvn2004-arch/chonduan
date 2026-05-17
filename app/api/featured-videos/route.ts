import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const COST_CREDITS = 250      // 250 Cr/month ≈ $10
const DURATION_DAYS = 31

function detectVideoType(url: string): 'youtube' | 'tiktok' | null {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube'
  if (/tiktok\.com/.test(url)) return 'tiktok'
  return null
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

// POST /api/featured-videos
// Create or renew a featured video for agent+project, charge credits from wallet
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!agent || agent.kyc_status !== 'approved') {
    return NextResponse.json({ error: 'Agent not approved' }, { status: 403 })
  }

  const { project_id, video_url } = await req.json()
  if (!project_id || !video_url) {
    return NextResponse.json({ error: 'Thiếu project_id hoặc video_url' }, { status: 400 })
  }

  const videoType = detectVideoType(video_url)
  if (!videoType) {
    return NextResponse.json({ error: 'Chỉ hỗ trợ YouTube và TikTok' }, { status: 400 })
  }
  if (videoType === 'youtube' && !extractYouTubeId(video_url)) {
    return NextResponse.json({ error: 'YouTube URL không hợp lệ' }, { status: 400 })
  }

  // Check project exists
  const { data: project } = await supabase
    .from('projects')
    .select('id, name_official')
    .eq('id', project_id)
    .single()

  if (!project) return NextResponse.json({ error: 'Dự án không tồn tại' }, { status: 404 })

  // Check agent has an active bid on this project (must be bidding to feature video)
  const { data: bid } = await supabase
    .from('agent_bids')
    .select('id')
    .eq('agent_id', agent.id)
    .eq('project_id', project_id)
    .eq('status', 'active')
    .limit(1)
    .single()

  if (!bid) {
    return NextResponse.json({
      error: 'Phải có bid slot đang hoạt động trên dự án này để thêm featured video',
    }, { status: 403 })
  }

  // Check wallet balance
  const { data: wallet } = await supabase
    .from('wallets')
    .select('id, balance_credits, total_spent_credits')
    .eq('owner_type', 'agent')
    .eq('owner_id', agent.id)
    .single()

  if (!wallet || wallet.balance_credits < COST_CREDITS) {
    return NextResponse.json({
      error: `Không đủ credits. Cần ${COST_CREDITS} Cr, còn ${wallet?.balance_credits ?? 0} Cr`,
    }, { status: 402 })
  }

  const expiresAt = new Date(Date.now() + DURATION_DAYS * 86400_000).toISOString()

  // Deduct credits
  await supabase.from('wallets').update({
    balance_credits: wallet.balance_credits - COST_CREDITS,
    total_spent_credits: wallet.total_spent_credits + COST_CREDITS,
    updated_at: new Date().toISOString(),
  }).eq('id', wallet.id)

  await supabase.from('wallet_transactions').insert({
    wallet_id: wallet.id,
    type: 'feature_charge',
    amount_credits: -COST_CREDITS,
    balance_after_credits: wallet.balance_credits - COST_CREDITS,
    notes: `Featured video — ${project.name_official}`,
  })

  // Upsert featured video
  const { data: video, error } = await supabase
    .from('featured_videos')
    .upsert({
      agent_id: agent.id,
      project_id,
      video_url,
      video_type: videoType,
      credits_charged: COST_CREDITS,
      active: true,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'agent_id,project_id' })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, id: video.id, expires_at: expiresAt })
}

// DELETE /api/featured-videos?project_id=...
// Cancel featured video (no refund — expires at end of period)
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })

  const { error } = await supabase
    .from('featured_videos')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('agent_id', agent.id)
    .eq('project_id', projectId!)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

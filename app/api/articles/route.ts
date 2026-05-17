import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BOOST_COST_CREDITS = 500   // 500 Cr ≈ $20, visible 30 days
const BOOST_DURATION_DAYS = 30

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80) + '-' + Date.now().toString(36)
}

// POST /api/articles — agent submits article (optionally with boost)
export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id, display_name, kyc_status')
    .eq('user_id', user.id)
    .single()

  if (!agent || agent.kyc_status !== 'approved') {
    return NextResponse.json({ error: 'Agent not approved' }, { status: 403 })
  }

  const {
    title, excerpt, content_markdown,
    related_project_id,
    boost = false,
  } = await req.json()

  if (!title?.trim() || !content_markdown?.trim()) {
    return NextResponse.json({ error: 'Thiếu tiêu đề hoặc nội dung' }, { status: 400 })
  }
  if (title.length < 10) return NextResponse.json({ error: 'Tiêu đề quá ngắn (tối thiểu 10 ký tự)' }, { status: 400 })
  if (content_markdown.length < 200) return NextResponse.json({ error: 'Nội dung quá ngắn (tối thiểu 200 ký tự)' }, { status: 400 })

  let boostExpiresAt: string | null = null
  let boostCreditsCharged = 0

  if (boost) {
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id, balance_credits, total_spent_credits')
      .eq('owner_type', 'agent')
      .eq('owner_id', agent.id)
      .single()

    if (!wallet || wallet.balance_credits < BOOST_COST_CREDITS) {
      return NextResponse.json({
        error: `Không đủ credits để boost. Cần ${BOOST_COST_CREDITS} Cr, còn ${wallet?.balance_credits ?? 0} Cr`,
      }, { status: 402 })
    }

    boostExpiresAt = new Date(Date.now() + BOOST_DURATION_DAYS * 86400_000).toISOString()
    boostCreditsCharged = BOOST_COST_CREDITS

    await supabase.from('wallets').update({
      balance_credits: wallet.balance_credits - BOOST_COST_CREDITS,
      total_spent_credits: wallet.total_spent_credits + BOOST_COST_CREDITS,
      updated_at: new Date().toISOString(),
    }).eq('id', wallet.id)

    await supabase.from('wallet_transactions').insert({
      wallet_id: wallet.id,
      type: 'boost_charge',
      amount_credits: -BOOST_COST_CREDITS,
      balance_after_credits: wallet.balance_credits - BOOST_COST_CREDITS,
      notes: `Boost bài viết — ${title.slice(0, 50)}`,
    })
  }

  const slug = slugify(title)

  const { data: article, error } = await supabase
    .from('khao_luan')
    .insert({
      slug,
      title,
      excerpt: excerpt ?? content_markdown.slice(0, 200).replace(/\n/g, ' '),
      content_markdown,
      agent_id: agent.id,
      is_agent_authored: true,
      is_boosted: boost,
      boost_expires_at: boostExpiresAt,
      boost_credits_charged: boostCreditsCharged,
      related_project_id: related_project_id ?? null,
      tags: [],
      published: true,
      ai_model_used: null,
    })
    .select('id, slug')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, slug: article.slug }, { status: 201 })
}

// GET /api/articles?agent_id=... — list agent's articles
export async function GET(req: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(req.url)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: agent } = await supabase
    .from('agents')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!agent) return NextResponse.json({ error: 'Not an agent' }, { status: 403 })

  const { data: articles } = await supabase
    .from('khao_luan')
    .select('id, slug, title, is_boosted, boost_expires_at, published, generated_at, views_count, related_project_id, projects(name_official)')
    .eq('agent_id', agent.id)
    .order('generated_at', { ascending: false })
    .limit(50)

  return NextResponse.json(articles ?? [])
}

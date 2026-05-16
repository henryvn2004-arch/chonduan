import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      agent_id, project_id,
      transaction_type = 'sale',
      contact_name, contact_phone, contact_email, message,
      preferred_bedrooms, budget_monthly_vnd, budget_total_vnd,
      preferred_move_in_date, needs_furnished,
    } = body

    if (!contact_name || !contact_phone) {
      return NextResponse.json({ error: 'Thiếu tên hoặc số điện thoại' }, { status: 400 })
    }
    if (!agent_id) {
      return NextResponse.json({ error: 'Thiếu agent_id' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase.from('leads').insert({
      agent_id,
      project_id: project_id ?? null,
      user_id: user?.id ?? null,
      transaction_type,
      contact_name,
      contact_phone,
      contact_email: contact_email ?? null,
      message: message ?? null,
      preferred_bedrooms: preferred_bedrooms ?? null,
      budget_monthly_vnd: budget_monthly_vnd ?? null,
      budget_total_vnd: budget_total_vnd ?? null,
      preferred_move_in_date: preferred_move_in_date ?? null,
      needs_furnished: needs_furnished ?? null,
      source_url: req.headers.get('referer') ?? null,
      status: 'new',
    }).select('id').single()

    if (error) throw new Error(error.message)
    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Lỗi server' }, { status: 500 })
  }
}

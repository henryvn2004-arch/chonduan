import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/agencies — create new agency (pending admin approval)
export async function POST(req: Request) {
  const supabase = await createClient()
  const service = await createServiceClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check not already an agency admin
  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type === 'agency_admin') {
    return NextResponse.json({ error: 'Bạn đã có sàn rồi' }, { status: 400 })
  }

  const body = await req.json()
  const { name, description, phone, email, website, hq_province, hq_address, founded_year } = body

  if (!name?.trim() || !phone?.trim() || !hq_province?.trim()) {
    return NextResponse.json({ error: 'Thiếu thông tin bắt buộc' }, { status: 400 })
  }

  // Generate slug from name
  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-')
    + '-' + Date.now().toString(36)

  const { data: agency, error } = await service
    .from('agencies')
    .insert({
      slug,
      name: name.trim(),
      description: description?.trim() || null,
      phone: phone.trim(),
      email: email?.trim() || null,
      website: website?.trim() || null,
      hq_province: hq_province.trim(),
      hq_address: hq_address?.trim() || null,
      founded_year: founded_year ? parseInt(founded_year) : null,
      admin_user_id: user.id,
      verified: false,
      subscription_tier: 'free',
    })
    .select('id, slug')
    .single()

  if (error) {
    console.error('Create agency error:', error)
    return NextResponse.json({ error: 'Không thể tạo sàn' }, { status: 500 })
  }

  // Create agency wallet
  await service.from('wallets').upsert({
    owner_type: 'agency',
    owner_id: agency.id,
    balance_vnd: 0,
  }, { onConflict: 'owner_type,owner_id' })

  // Update user_type
  await service.from('user_profiles')
    .update({ user_type: 'agency_admin', updated_at: new Date().toISOString() })
    .eq('id', user.id)

  return NextResponse.json({ id: agency.id, slug: agency.slug })
}

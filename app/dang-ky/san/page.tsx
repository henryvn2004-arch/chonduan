import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import SanSignupClient from './SanSignupClient'

export const metadata: Metadata = { title: 'Đăng ký Sàn môi giới — ChonDuan' }

export default async function SanSignupPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap?next=/dang-ky/san')

  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type === 'agency_admin') redirect('/dashboard/san')

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-start justify-center py-10 px-4">
      <SanSignupClient />
    </div>
  )
}

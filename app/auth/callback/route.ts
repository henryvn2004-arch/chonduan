import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getRedirect(userType: string | null) {
  if (userType === 'admin') return '/dashboard/admin'
  if (userType === 'agent' || userType === 'agency_admin') return '/dashboard/moi-gioi'
  return '/'
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Ensure user_profiles row exists (safety net — DB trigger handles most cases)
      await supabase.from('user_profiles').upsert(
        {
          id: data.user.id,
          display_name: data.user.user_metadata?.full_name ?? data.user.user_metadata?.name ?? data.user.email?.split('@')[0],
          user_type: 'buyer',
        },
        { onConflict: 'id', ignoreDuplicates: true }
      )

      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('user_type')
        .eq('id', data.user.id)
        .single()
      return NextResponse.redirect(`${origin}${getRedirect(profile?.user_type ?? null)}`)
    }
  }

  return NextResponse.redirect(`${origin}/dang-nhap?error=auth`)
}

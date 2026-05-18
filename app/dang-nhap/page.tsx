'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function getRedirect(userType: string) {
  if (userType === 'admin') return '/dashboard/admin'
  if (userType === 'agent' || userType === 'agency_admin') return '/dashboard/moi-gioi'
  return '/'
}

export default function DangNhapPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError || !data.user) {
      setError(signInError?.message ?? 'Đăng nhập thất bại')
      setLoading(false)
      return
    }
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', data.user.id)
      .single()
    router.push(getRedirect(profile?.user_type ?? 'buyer'))
  }

  async function handleGoogleLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  async function handleFacebookLogin() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4 py-10">
      <div className="w-full max-w-sm space-y-4">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/">
            <Image src="/logo.png" alt="ChonDuAn" width={140} height={40} className="h-9 w-auto mx-auto" />
          </Link>
        </div>

        {/* Buyer section — OAuth */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-3">
          <div>
            <p className="text-xs font-semibold text-[#8A94A6] uppercase tracking-wide mb-0.5">Người mua / Người thuê</p>
            <p className="text-sm text-[#0D1B3D] font-medium">Đăng nhập nhanh</p>
          </div>
          <button
            onClick={handleGoogleLogin}
            className="w-full border border-[#E2E8F0] text-[#0D1B3D] rounded-xl py-2.5 text-sm font-medium hover:bg-[#F5F7FA] transition flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </button>
          <button
            onClick={handleFacebookLogin}
            className="w-full border border-[#E2E8F0] text-[#0D1B3D] rounded-xl py-2.5 text-sm font-medium hover:bg-[#F5F7FA] transition flex items-center justify-center gap-2"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Tiếp tục với Facebook
          </button>
        </div>

        {/* Agent / Admin section — email */}
        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#8A94A6] uppercase tracking-wide mb-0.5">Môi giới / Admin</p>
            <p className="text-sm text-[#0D1B3D] font-medium">Đăng nhập bằng email</p>
          </div>
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565FF] focus:ring-1 focus:ring-[#1565FF]"
            />
            <div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565FF] focus:ring-1 focus:ring-[#1565FF]"
              />
              <div className="text-right mt-1">
                <Link href="/quen-mat-khau" className="text-xs text-[#1565FF] hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1565FF] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0D4FCC] transition disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
          <p className="text-center text-xs text-[#8A94A6]">
            Chưa là môi giới?{' '}
            <Link href="/dang-ky/moi-gioi" className="text-[#1565FF] font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

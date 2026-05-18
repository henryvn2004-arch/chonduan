'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

export default function QuenMatKhauPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 space-y-6">
        <div className="text-center">
          <Link href="/">
            <Image src="/logo.png" alt="ChonDuAn" width={140} height={40} className="h-9 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0D1B3D]">Quên mật khẩu</h1>
          <p className="text-sm text-[#8A94A6] mt-1">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-[#0D1B3D]">
              Đã gửi link đặt lại mật khẩu tới <span className="font-medium">{email}</span>.<br />
              Kiểm tra hộp thư (kể cả thư mục spam).
            </p>
            <Link
              href="/dang-nhap"
              className="block w-full text-center bg-[#1565FF] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0D4FCC] transition"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1B3D] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565FF] focus:ring-1 focus:ring-[#1565FF]"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-[#1565FF] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0D4FCC] transition disabled:opacity-50"
            >
              {loading ? 'Đang gửi...' : 'Gửi link đặt lại'}
            </button>
            <p className="text-center text-xs text-[#8A94A6]">
              <Link href="/dang-nhap" className="text-[#1565FF] hover:underline">Quay lại đăng nhập</Link>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}

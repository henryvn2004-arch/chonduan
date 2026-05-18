'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase sets the session from the URL hash automatically
    const supabase = createClient()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
    } else {
      router.push('/dang-nhap?reset=success')
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-8 space-y-6">
        <div className="text-center">
          <Link href="/">
            <Image src="/logo.png" alt="ChonDuAn" width={140} height={40} className="h-9 w-auto mx-auto mb-4" />
          </Link>
          <h1 className="text-2xl font-bold text-[#0D1B3D]">Đặt lại mật khẩu</h1>
        </div>

        {!ready ? (
          <p className="text-sm text-center text-[#8A94A6]">Đang xác thực link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0D1B3D] mb-1">Mật khẩu mới</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565FF] focus:ring-1 focus:ring-[#1565FF]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D1B3D] mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Nhập lại mật khẩu"
                className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-[#1565FF] focus:ring-1 focus:ring-[#1565FF]"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full bg-[#1565FF] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#0D4FCC] transition disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}

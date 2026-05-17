import { Suspense } from 'react'
import type { Metadata } from 'next'
import SignupClient from './SignupClient'

export const metadata: Metadata = {
  title: 'Đăng ký môi giới — PhaplyDuan',
}

export default function DangKyMoiGioiPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center px-4 py-10">
      <Suspense>
        <SignupClient />
      </Suspense>
    </div>
  )
}

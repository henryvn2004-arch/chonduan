'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Home, Key, Building2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Tài khoản', 'Hồ sơ', 'KYC', 'Chuyên môn', 'Hoàn tất']

const SPECIALTY_OPTIONS = [
  { value: 'sale', label: 'Mua / Bán', Icon: Home },
  { value: 'rent_long', label: 'Cho thuê dài hạn', Icon: Key },
  { value: 'rent_short', label: 'Cho thuê ngắn hạn', Icon: Building2 },
]

function slugify(name: string) {
  return name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function SignupClient() {
  const router = useRouter()
  const supabase = createClient()

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0 — Account
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Step 1 — Profile
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [years, setYears] = useState('')

  // Step 2 — KYC files
  const [cmtFront, setCmtFront] = useState<File | null>(null)
  const [cmtBack, setCmtBack] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)

  // Step 3 — Specialty
  const [specialties, setSpecialties] = useState<string[]>(['sale'])
  const [servesExpat, setServesExpat] = useState(false)
  const [englishFluent, setEnglishFluent] = useState(false)

  // Stored after step 0
  const [userId, setUserId] = useState('')

  function toggleSpecialty(val: string) {
    setSpecialties(prev =>
      prev.includes(val) ? prev.filter(s => s !== val) : [...prev, val]
    )
  }

  async function handleStep0() {
    setError('')
    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
      if (signUpError) throw signUpError
      const uid = data.user?.id
      if (!uid) throw new Error('Không lấy được user ID')
      setUserId(uid)
      setStep(1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi đăng ký')
    } finally {
      setLoading(false)
    }
  }

  async function handleStep1() {
    setError('')
    setLoading(true)
    try {
      const slug = slugify(displayName) + '-' + Math.random().toString(36).slice(2, 6)
      const { error: insertError } = await supabase.from('agents').insert({
        user_id: userId,
        slug,
        display_name: displayName,
        phone,
        bio: bio || null,
        years_experience: years ? parseInt(years) : null,
        email,
        kyc_status: 'pending',
        published: false,
      })
      if (insertError) throw insertError
      setStep(2)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi lưu hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  async function handleStep2() {
    if (!cmtFront || !cmtBack || !selfie) {
      setError('Vui lòng upload đủ 3 ảnh')
      return
    }
    setError('')
    setLoading(true)
    try {
      async function upload(file: File, name: string) {
        const ext = file.name.split('.').pop()
        const path = `${userId}/${name}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('agents-kyc')
          .upload(path, file, { upsert: true })
        if (upErr) throw upErr
        return path
      }

      const [frontPath, backPath, selfiePath] = await Promise.all([
        upload(cmtFront, 'cmt_front'),
        upload(cmtBack, 'cmt_back'),
        upload(selfie, 'selfie'),
      ])

      const { error: updateErr } = await supabase
        .from('agents')
        .update({
          cmt_front_url: frontPath,
          cmt_back_url: backPath,
          selfie_url: selfiePath,
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
      if (updateErr) throw updateErr
      setStep(3)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi upload ảnh')
    } finally {
      setLoading(false)
    }
  }

  async function handleStep3() {
    if (specialties.length === 0) {
      setError('Chọn ít nhất 1 chuyên môn')
      return
    }
    setError('')
    setLoading(true)
    try {
      const { error: updateErr } = await supabase
        .from('agents')
        .update({ specialty_types: specialties, serves_expat: servesExpat, english_fluent: englishFluent })
        .eq('user_id', userId)
      if (updateErr) throw updateErr
      setStep(4)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lỗi cập nhật chuyên môn')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <Link href="/" className="text-xl font-bold text-[#1565FF]">PhaplyDuan</Link>
        <h1 className="text-2xl font-bold text-[#0D1B3D] mt-3">Đăng ký môi giới</h1>
        <p className="text-sm text-[#64748B] mt-1">Kết nối với hàng nghìn người mua và thuê</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex flex-col items-center gap-1 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
              i < step ? 'bg-[#1565FF] text-white' : i === step ? 'bg-[#1565FF] text-white ring-4 ring-[#1565FF]/20' : 'bg-[#E2E8F0] text-[#94A3B8]'
            }`}>
              {i < step ? '✓' : i + 1}
            </div>
            <span className={`text-[10px] text-center leading-tight hidden sm:block ${i === step ? 'text-[#1565FF] font-medium' : 'text-[#94A3B8]'}`}>{label}</span>
            {i < STEPS.length - 1 && (
              <div className={`absolute hidden`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
        {error && (
          <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">{error}</div>
        )}

        {/* Step 0 — Account */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0D1B3D] mb-4">Tạo tài khoản</h2>
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Email *</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Mật khẩu *</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF]"
              />
            </div>
            <button
              onClick={handleStep0}
              disabled={loading || !email || password.length < 8}
              className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Tiếp tục'}
            </button>
            <p className="text-center text-xs text-[#94A3B8]">
              Đã có tài khoản?{' '}
              <Link href="/dang-nhap" className="text-[#1565FF] hover:underline">Đăng nhập</Link>
            </p>
          </div>
        )}

        {/* Step 1 — Profile */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0D1B3D] mb-4">Thông tin cá nhân</h2>
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Tên hiển thị *</label>
              <input
                value={displayName} onChange={e => setDisplayName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Số điện thoại *</label>
              <input
                value={phone} onChange={e => setPhone(e.target.value)}
                placeholder="09xxxxxxxx"
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Số năm kinh nghiệm</label>
              <input
                type="number" min={0} max={50} value={years} onChange={e => setYears(e.target.value)}
                placeholder="3"
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-1 block">Giới thiệu bản thân</label>
              <textarea
                value={bio} onChange={e => setBio(e.target.value)}
                rows={3} placeholder="Tôi chuyên tư vấn BĐS tại HCMC..."
                className="w-full text-sm border border-[#E2E8F0] rounded-lg px-3 py-2.5 focus:outline-none focus:border-[#1565FF] resize-none"
              />
            </div>
            <button
              onClick={handleStep1}
              disabled={loading || !displayName || !phone}
              className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Tiếp tục'}
            </button>
          </div>
        )}

        {/* Step 2 — KYC */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0D1B3D] mb-1">Xác minh danh tính (KYC)</h2>
            <p className="text-xs text-[#64748B] mb-4">Upload ảnh CCCD/CMT để xác minh. Ảnh được lưu bảo mật.</p>
            {[
              { label: 'CCCD mặt trước *', state: cmtFront, set: setCmtFront },
              { label: 'CCCD mặt sau *', state: cmtBack, set: setCmtBack },
              { label: 'Ảnh selfie cầm CCCD *', state: selfie, set: setSelfie },
            ].map(({ label, state, set }) => (
              <div key={label}>
                <label className="text-xs font-medium text-[#64748B] mb-1 block">{label}</label>
                <label className={`flex items-center gap-3 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${state ? 'border-[#1565FF] bg-[#F0F5FF]' : 'border-[#E2E8F0] hover:border-[#1565FF]'}`}>
                  <input type="file" accept="image/*" className="hidden" onChange={e => set(e.target.files?.[0] ?? null)} />
                  <svg className={`w-5 h-5 shrink-0 ${state ? 'text-[#1565FF]' : 'text-[#94A3B8]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-[#64748B] truncate">{state ? state.name : 'Chọn ảnh...'}</span>
                </label>
              </div>
            ))}
            <button
              onClick={handleStep2}
              disabled={loading}
              className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang upload...' : 'Tiếp tục'}
            </button>
          </div>
        )}

        {/* Step 3 — Specialty */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-[#0D1B3D] mb-4">Chuyên môn của bạn</h2>
            <div>
              <label className="text-xs font-medium text-[#64748B] mb-2 block">Loại giao dịch *</label>
              <div className="space-y-2">
                {SPECIALTY_OPTIONS.map(opt => (
                  <label key={opt.value} className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors ${specialties.includes(opt.value) ? 'border-[#1565FF] bg-[#F0F5FF]' : 'border-[#E2E8F0] hover:border-[#1565FF]'}`}>
                    <input type="checkbox" checked={specialties.includes(opt.value)} onChange={() => toggleSpecialty(opt.value)} className="accent-[#1565FF]" />
                    <opt.Icon className="w-4 h-4 text-[#1565FF] shrink-0" strokeWidth={2} />
                    <span className="text-sm font-medium text-[#0D1B3D]">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={servesExpat} onChange={e => setServesExpat(e.target.checked)} className="accent-[#1565FF]" />
                <span className="text-sm text-[#0D1B3D]">Phục vụ khách nước ngoài (expat)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={englishFluent} onChange={e => setEnglishFluent(e.target.checked)} className="accent-[#1565FF]" />
                <span className="text-sm text-[#0D1B3D]">Giao tiếp tiếng Anh tốt</span>
              </label>
            </div>
            <button
              onClick={handleStep3}
              disabled={loading}
              className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang lưu...' : 'Hoàn thành đăng ký'}
            </button>
          </div>
        )}

        {/* Step 4 — Done */}
        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-[#0D1B3D]">Đăng ký thành công!</h2>
            <p className="text-sm text-[#64748B]">
              Hồ sơ của bạn đang chờ xét duyệt KYC. Chúng tôi sẽ thông báo trong vòng 1-2 ngày làm việc.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors"
            >
              Về trang chủ
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

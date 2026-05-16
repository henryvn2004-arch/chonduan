import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import KycQueueClient from './KycQueueClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'KYC Queue — Admin' }

export default async function KycQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap')

  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'admin') redirect('/')

  const { data: agents } = await supabase
    .from('agents')
    .select('id, slug, display_name, phone, email, kyc_status, kyc_submitted_at, kyc_rejected_reason, cmt_front_url, cmt_back_url, selfie_url, specialty_types, serves_expat, english_fluent, bio, years_experience')
    .eq('kyc_status', 'pending')
    .order('kyc_submitted_at', { ascending: true })

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-[#0D1B3D] mb-6">
          KYC Queue <span className="text-[#64748B] font-normal text-base">({agents?.length ?? 0} chờ duyệt)</span>
        </h1>

        {!agents?.length ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <p className="text-[#64748B]">Không có hồ sơ nào chờ duyệt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agents.map(agent => (
              <div key={agent.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className="font-semibold text-[#0D1B3D]">{agent.display_name}</h2>
                    <p className="text-sm text-[#64748B]">{agent.phone} · {agent.email}</p>
                    {agent.bio && <p className="text-sm text-[#64748B] mt-1 line-clamp-2">{agent.bio}</p>}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(agent.specialty_types ?? []).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-[#F1F5F9] text-xs rounded-full text-[#0D1B3D]">{s}</span>
                      ))}
                      {agent.serves_expat && <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">Expat</span>}
                      {agent.english_fluent && <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full">English</span>}
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-2">
                      Nộp: {agent.kyc_submitted_at ? new Date(agent.kyc_submitted_at).toLocaleDateString('vi-VN') : '—'}
                    </p>
                  </div>
                  <KycQueueClient agentId={agent.id} />
                </div>

                {/* KYC Images */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { url: agent.cmt_front_url, label: 'CCCD mặt trước' },
                    { url: agent.cmt_back_url, label: 'CCCD mặt sau' },
                    { url: agent.selfie_url, label: 'Selfie' },
                  ].map(({ url, label }) => (
                    <div key={label} className="aspect-[4/3] relative bg-[#F1F5F9] rounded-lg overflow-hidden">
                      {url ? (
                        <a href={url} target="_blank" rel="noopener">
                          <Image src={url} alt={label} fill className="object-cover hover:opacity-90 transition-opacity" />
                        </a>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-[#94A3B8]">Chưa có ảnh</div>
                      )}
                      <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[10px] py-1 px-2">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

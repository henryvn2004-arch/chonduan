import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { Globe, Languages } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import Nav from '@/components/nav/Nav'
import AgentProfileClient from './AgentProfileClient'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('agents').select('display_name, bio').eq('slug', slug).single()
  if (!data) return { title: 'Môi giới' }
  return {
    title: `${data.display_name} — Môi giới BĐS | PhaplyDuan`,
    description: data.bio ?? undefined,
  }
}

const SPECIALTY_LABEL: Record<string, string> = {
  sale: 'Mua/Bán',
  rent_long: 'Cho thuê dài hạn',
  rent_short: 'Cho thuê ngắn hạn',
}

export default async function AgentProfilePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: agent } = await supabase
    .from('agents')
    .select(`
      id, slug, display_name, avatar_url, cover_url, bio,
      years_experience, deals_closed_count, rental_deals_closed_count,
      phone, zalo, email,
      specialty_types, serves_expat, english_fluent,
      social_facebook, social_tiktok, social_youtube, social_instagram,
      social_threads, social_linkedin,
      avg_rating, reviews_count, response_time_avg_minutes,
      tier, verified_badge_active, published, kyc_status
    `)
    .eq('slug', slug)
    .single()

  if (!agent || !agent.published) notFound()

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <Nav mode="sale" />
      <div className="pt-14">
        {/* Cover */}
        <div className="relative h-40 bg-gradient-to-r from-[#1565FF] to-[#3D8BFF]">
          {agent.cover_url && (
            <Image src={agent.cover_url} alt="cover" fill className="object-cover" />
          )}
        </div>

        <div className="max-w-3xl mx-auto px-4">
          {/* Avatar + name */}
          <div className="relative -mt-12 flex items-end gap-4 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-[#E2E8F0] overflow-hidden shrink-0 shadow-md">
              {agent.avatar_url ? (
                <Image src={agent.avatar_url} alt={agent.display_name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-[#94A3B8]">
                  {agent.display_name.charAt(0)}
                </div>
              )}
            </div>
            <div className="pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-[#0D1B3D]">{agent.display_name}</h1>
                {agent.verified_badge_active && (
                  <span className="px-2 py-0.5 bg-[#1565FF] text-white text-xs font-semibold rounded-full">✓ Đã xác minh</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {(agent.specialty_types ?? []).map((s: string) => (
                  <span key={s} className="px-2 py-0.5 bg-[#F1F5F9] text-[#0D1B3D] text-xs rounded-full">{SPECIALTY_LABEL[s] ?? s}</span>
                ))}
                {agent.serves_expat && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full"><Globe className="w-3 h-3" strokeWidth={2} /> Expat</span>}
                {agent.english_fluent && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded-full"><Languages className="w-3 h-3" strokeWidth={2} /> English</span>}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Main content */}
            <div className="md:col-span-2 space-y-4">
              {/* Stats */}
              <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-[#1565FF]">{agent.years_experience ?? '—'}</div>
                  <div className="text-xs text-[#64748B]">Năm kinh nghiệm</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#1565FF]">{(agent.deals_closed_count ?? 0) + (agent.rental_deals_closed_count ?? 0)}</div>
                  <div className="text-xs text-[#64748B]">Giao dịch</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-[#1565FF]">{agent.avg_rating ? agent.avg_rating.toFixed(1) : '—'}</div>
                  <div className="text-xs text-[#64748B]">Đánh giá ({agent.reviews_count ?? 0})</div>
                </div>
              </div>

              {/* Bio */}
              {agent.bio && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                  <h2 className="text-sm font-semibold text-[#0D1B3D] mb-2">Giới thiệu</h2>
                  <p className="text-sm text-[#64748B] whitespace-pre-line">{agent.bio}</p>
                </div>
              )}

              {/* Social */}
              {(agent.social_facebook || agent.social_tiktok || agent.social_youtube || agent.social_instagram) && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
                  <h2 className="text-sm font-semibold text-[#0D1B3D] mb-3">Mạng xã hội</h2>
                  <div className="flex flex-wrap gap-2">
                    {agent.social_facebook && (
                      <a href={agent.social_facebook} target="_blank" rel="noopener" className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0D1B3D] hover:border-[#1565FF] transition-colors">Facebook</a>
                    )}
                    {agent.social_tiktok && (
                      <a href={agent.social_tiktok} target="_blank" rel="noopener" className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0D1B3D] hover:border-[#1565FF] transition-colors">TikTok</a>
                    )}
                    {agent.social_youtube && (
                      <a href={agent.social_youtube} target="_blank" rel="noopener" className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0D1B3D] hover:border-[#1565FF] transition-colors">YouTube</a>
                    )}
                    {agent.social_instagram && (
                      <a href={agent.social_instagram} target="_blank" rel="noopener" className="px-3 py-1.5 border border-[#E2E8F0] rounded-lg text-xs text-[#0D1B3D] hover:border-[#1565FF] transition-colors">Instagram</a>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar — Contact (client) */}
            <div className="space-y-3">
              <AgentProfileClient agent={{ id: agent.id, display_name: agent.display_name, phone: agent.phone }} />

              {agent.response_time_avg_minutes && (
                <div className="bg-white rounded-xl border border-[#E2E8F0] p-3 text-center">
                  <div className="text-xs text-[#64748B]">Thời gian phản hồi TB</div>
                  <div className="text-sm font-semibold text-[#0D1B3D] mt-0.5">
                    {agent.response_time_avg_minutes < 60
                      ? `${agent.response_time_avg_minutes} phút`
                      : `${Math.round(agent.response_time_avg_minutes / 60)} giờ`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

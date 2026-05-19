import { createClient, createServiceClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, MapPin, Phone, Globe, Calendar } from 'lucide-react'
import AgencyQueueClient from './AgencyQueueClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Agency Queue — Admin' }

export default async function AgencyQueuePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap')

  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'admin') redirect('/')

  const service = await createServiceClient()
  const { data: agencies } = await service
    .from('agencies')
    .select('id, name, slug, description, phone, email, website, hq_province, hq_address, founded_year, agents_count, created_at')
    .eq('verified', false)
    .order('created_at', { ascending: true })

  return (
    <div className="min-h-screen bg-[#F5F7FA] p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-xl font-bold text-[#0D1B3D] mb-6">
          Duyệt Sàn môi giới <span className="text-[#64748B] font-normal text-base">({agencies?.length ?? 0} chờ duyệt)</span>
        </h1>

        {!agencies?.length ? (
          <div className="bg-white rounded-xl border border-[#E2E8F0] p-12 text-center">
            <p className="text-[#64748B]">Không có sàn nào chờ duyệt</p>
          </div>
        ) : (
          <div className="space-y-4">
            {agencies.map(agency => (
              <div key={agency.id} className="bg-white rounded-xl border border-[#E2E8F0] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#1565FF] shrink-0" strokeWidth={1.5} />
                      <h2 className="font-semibold text-[#0D1B3D]">{agency.name}</h2>
                    </div>
                    {agency.description && (
                      <p className="text-sm text-[#64748B] mt-1 line-clamp-2">{agency.description}</p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                      <span className="flex items-center gap-1 text-xs text-[#64748B]">
                        <MapPin className="w-3 h-3" />{agency.hq_province}{agency.hq_address ? ` — ${agency.hq_address}` : ''}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#64748B]">
                        <Phone className="w-3 h-3" />{agency.phone}
                      </span>
                      {agency.email && (
                        <span className="text-xs text-[#64748B]">{agency.email}</span>
                      )}
                      {agency.website && (
                        <span className="flex items-center gap-1 text-xs text-[#64748B]">
                          <Globe className="w-3 h-3" />{agency.website}
                        </span>
                      )}
                      {agency.founded_year && (
                        <span className="flex items-center gap-1 text-xs text-[#64748B]">
                          <Calendar className="w-3 h-3" />Est. {agency.founded_year}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-2">
                      Nộp: {new Date(agency.created_at).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  <AgencyQueueClient agencyId={agency.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

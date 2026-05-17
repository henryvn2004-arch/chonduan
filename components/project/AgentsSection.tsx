import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Home, Key, BadgeCheck, Play, Music, Star } from 'lucide-react'
import AgentContactButton from './AgentContactButton'

interface AgentRow {
  agent_id: string
  slug: string
  display_name: string
  avatar_url: string | null
  tier: string | null
  verified_badge_active: boolean | null
  phone: string
  avg_rating: number | null
  deals_closed_count: number | null
  rental_deals_closed_count: number | null
  years_experience: number | null
  bid_amount: number
  slot_rank: number | null
  featured_video_url?: string | null
  featured_video_type?: string | null
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  return m ? m[1] : null
}

function VideoEmbed({ url, type }: { url: string; type: string }) {
  if (type === 'youtube') {
    const id = getYouTubeId(url)
    if (!id) return null
    return (
      <div className="mt-3 rounded-lg overflow-hidden aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${id}`}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title="Featured video"
        />
      </div>
    )
  }
  if (type === 'tiktok') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 text-xs text-[#1565FF] font-medium hover:underline"
      >
        <Music className="w-3.5 h-3.5" strokeWidth={2} />
        Xem video TikTok giới thiệu →
      </a>
    )
  }
  return null
}

async function fetchTopAgents(projectId: string, slotType: 'sale' | 'rent_long'): Promise<AgentRow[]> {
  const supabase = await createClient()
  const { data: agents } = await supabase.rpc('get_top_agents', {
    p_project_id: projectId,
    p_slot_type: slotType,
  })
  if (!agents?.length) return []

  // Fetch featured videos for these agents on this project
  const agentIds = agents.map((a: AgentRow) => a.agent_id)
  const { data: videos } = await supabase
    .from('featured_videos')
    .select('agent_id, video_url, video_type')
    .eq('project_id', projectId)
    .eq('active', true)
    .gt('expires_at', new Date().toISOString())
    .in('agent_id', agentIds)

  const videoMap = Object.fromEntries((videos ?? []).map(v => [v.agent_id, v]))

  return agents.map((a: AgentRow) => ({
    ...a,
    featured_video_url: videoMap[a.agent_id]?.video_url ?? null,
    featured_video_type: videoMap[a.agent_id]?.video_type ?? null,
  }))
}

const TIER_BADGE: Record<string, string> = {
  verified:    'bg-[#EFF6FF] text-[#1565FF]',
  top:         'bg-[#FFF7ED] text-[#C2410C]',
  premium:     'bg-[#F5F3FF] text-[#6D28D9]',
  unverified:  'bg-[#F8FAFC] text-[#94A3B8]',
}

const TIER_LABEL: Record<string, string> = {
  verified:   'Đã xác minh',
  top:        'Top Agent',
  premium:    'Premium',
  unverified: '',
}

function AgentCard({ agent, type, projectId }: { agent: AgentRow; type: 'sale' | 'rent_long'; projectId: string }) {
  const dealCount = type === 'rent_long'
    ? (agent.rental_deals_closed_count ?? 0)
    : (agent.deals_closed_count ?? 0)
  const tierBadge = agent.tier ? TIER_BADGE[agent.tier] : null
  const tierLabel = agent.tier ? TIER_LABEL[agent.tier] : null

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
    <div className="flex gap-3">
      <Link href={`/moi-gioi/${agent.slug}`} className="shrink-0">
        {agent.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={agent.avatar_url}
            alt={agent.display_name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1565FF] to-[#0D4FCC] flex items-center justify-center text-white font-bold text-lg">
            {agent.display_name[0]}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link href={`/moi-gioi/${agent.slug}`} className="font-semibold text-[#0D1B3D] text-sm hover:text-[#1565FF] transition-colors">
            {agent.display_name}
          </Link>
          {agent.verified_badge_active && (
            <BadgeCheck className="w-3.5 h-3.5 text-[#1565FF] shrink-0" strokeWidth={2.5} />
          )}
          {tierBadge && tierLabel && (
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ${tierBadge}`}>
              {tierLabel}
            </span>
          )}
          {agent.featured_video_url && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-red-50 text-red-600">
              <Play className="w-2.5 h-2.5" strokeWidth={2} />
              Video
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 mt-1">
          {agent.avg_rating != null && (
            <span className="inline-flex items-center gap-0.5 text-xs text-yellow-600">
              <Star className="w-3 h-3 fill-yellow-400 stroke-yellow-500" strokeWidth={1.5} />
              {agent.avg_rating.toFixed(1)}
            </span>
          )}
          {dealCount > 0 && (
            <span className="text-xs text-[#94A3B8]">{dealCount} giao dịch</span>
          )}
          {agent.years_experience != null && (
            <span className="text-xs text-[#94A3B8]">{agent.years_experience} năm KN</span>
          )}
        </div>
      </div>

      <AgentContactButton
        agent={{ id: agent.agent_id, display_name: agent.display_name, phone: agent.phone }}
        projectId={projectId}
        mode={type}
        className={`shrink-0 self-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          type === 'sale'
            ? 'bg-[#1565FF] text-white hover:bg-[#0D4FCC]'
            : 'bg-[#0D1B3D] text-white hover:bg-[#1a2f5e]'
        }`}
      />
    </div>
    {agent.featured_video_url && agent.featured_video_type && (
      <VideoEmbed url={agent.featured_video_url} type={agent.featured_video_type} />
    )}
  </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="bg-[#F8FAFC] rounded-xl border border-dashed border-[#E2E8F0] p-5 text-center">
      <p className="text-sm text-[#94A3B8]">Chưa có môi giới {label} cho dự án này.</p>
      <Link
        href="/dang-ky/moi-gioi"
        className="inline-block mt-2 text-xs text-[#1565FF] font-medium hover:underline"
      >
        Đăng ký trở thành môi giới →
      </Link>
    </div>
  )
}

export default async function AgentsSection({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
  province: string
}) {
  const [saleAgents, rentAgents] = await Promise.all([
    fetchTopAgents(projectId, 'sale'),
    fetchTopAgents(projectId, 'rent_long'),
  ])

  return (
    <section id="moi-gioi" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Môi giới {projectName}</h2>

      <div className="space-y-6">
        {/* Sale agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D1B3D]"><Home className="w-4 h-4 text-[#1565FF]" strokeWidth={2} /> Mua / Bán</span>
            {saleAgents.length > 0 && (
              <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Top {saleAgents.length} đấu thầu slot</span>
            )}
          </div>
          {saleAgents.length > 0 ? (
            <div className="space-y-2">
              {saleAgents.map(a => <AgentCard key={a.agent_id} agent={a} type="sale" projectId={projectId} />)}
            </div>
          ) : (
            <EmptyState label="mua/bán" />
          )}
        </div>

        {/* Rent agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0D1B3D]"><Key className="w-4 h-4 text-[#1565FF]" strokeWidth={2} /> Cho thuê</span>
            {rentAgents.length > 0 && (
              <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Top {rentAgents.length} đấu thầu slot</span>
            )}
          </div>
          {rentAgents.length > 0 ? (
            <div className="space-y-2">
              {rentAgents.map(a => <AgentCard key={a.agent_id} agent={a} type="rent_long" projectId={projectId} />)}
            </div>
          ) : (
            <EmptyState label="cho thuê" />
          )}
        </div>

        <p className="text-xs text-[#94A3B8] text-center">
          Danh sách môi giới được cập nhật theo hệ thống đấu thầu slot.{' '}
          <Link href="/dang-ky/moi-gioi" className="text-[#1565FF] hover:underline">
            Đăng ký ngay →
          </Link>
        </p>
      </div>
    </section>
  )
}

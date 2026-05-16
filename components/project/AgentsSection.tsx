// Sprint S05: Mock agents — real bidding data in Sprint S07+

interface MockAgent {
  name: string
  phone: string
  specialty: string
  rating: number
  deals: number
}

const MOCK_SALE_AGENTS: MockAgent[] = [
  { name: 'Nguyễn Minh Tuấn', phone: '0901 234 567', specialty: 'Chuyên mua/bán căn hộ cao cấp', rating: 4.9, deals: 87 },
  { name: 'Trần Thị Lan', phone: '0912 345 678', specialty: 'Đầu tư bất động sản dự án', rating: 4.8, deals: 64 },
  { name: 'Lê Văn Hùng', phone: '0923 456 789', specialty: 'Tư vấn pháp lý mua nhà', rating: 4.7, deals: 51 },
]

const MOCK_RENT_AGENTS: MockAgent[] = [
  { name: 'Phạm Thu Hà', phone: '0934 567 890', specialty: 'Cho thuê căn hộ cao cấp, expat', rating: 4.9, deals: 120 },
  { name: 'Hoàng Đức Mạnh', phone: '0945 678 901', specialty: 'Quản lý vận hành cho thuê', rating: 4.8, deals: 95 },
  { name: 'Võ Thị Kim Anh', phone: '0956 789 012', specialty: 'Cho thuê ngắn hạn, Airbnb', rating: 4.7, deals: 78 },
]

function AgentCard({ agent, type }: { agent: MockAgent; type: 'sale' | 'rent' }) {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex gap-3">
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1565FF] to-[#0D4FCC] flex items-center justify-center text-white font-bold text-lg shrink-0">
        {agent.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-[#0D1B3D] text-sm">{agent.name}</div>
        <div className="text-xs text-[#64748B] mt-0.5 truncate">{agent.specialty}</div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-yellow-600">★ {agent.rating}</span>
          <span className="text-xs text-[#94A3B8]">{agent.deals} giao dịch</span>
        </div>
      </div>
      <a
        href={`tel:${agent.phone.replace(/\s/g, '')}`}
        className={`shrink-0 self-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          type === 'sale'
            ? 'bg-[#1565FF] text-white hover:bg-[#0D4FCC]'
            : 'bg-[#0D1B3D] text-white hover:bg-[#1a2f5e]'
        }`}
      >
        Liên hệ
      </a>
    </div>
  )
}

export default function AgentsSection({
  projectId,
  projectName,
  province,
}: {
  projectId: string
  projectName: string
  province: string
}) {
  void projectId
  void province

  return (
    <section id="moi-gioi" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Môi giới {projectName}</h2>

      <div className="space-y-6">
        {/* Sale agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-[#0D1B3D]">🏠 Mua / Bán</span>
            <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Top 3 được bình chọn</span>
          </div>
          <div className="space-y-2">
            {MOCK_SALE_AGENTS.map((a) => (
              <AgentCard key={a.phone} agent={a} type="sale" />
            ))}
          </div>
        </div>

        {/* Rent agents */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-[#0D1B3D]">🔑 Cho thuê</span>
            <span className="text-xs text-[#64748B] bg-[#F1F5F9] px-2 py-0.5 rounded-full">Top 3 được bình chọn</span>
          </div>
          <div className="space-y-2">
            {MOCK_RENT_AGENTS.map((a) => (
              <AgentCard key={a.phone} agent={a} type="rent" />
            ))}
          </div>
        </div>

        <p className="text-xs text-[#94A3B8] text-center">
          Danh sách môi giới được cập nhật dựa trên hệ thống đấu thầu slot. Đăng ký trở thành môi giới →
        </p>
      </div>
    </section>
  )
}

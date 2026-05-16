export default function NewsSection({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  // Phase 2: fetch từ khao_luan table theo project tag
  // Hiện tại hiển thị placeholder state
  void projectId

  return (
    <section id="tin-tuc" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Tin tức & Khảo luận</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
        <div className="text-4xl mb-3">📰</div>
        <div className="text-sm font-medium text-[#0D1B3D] mb-1">
          Tin tức về {projectName}
        </div>
        <p className="text-sm text-[#94A3B8]">
          Cập nhật tin tức và phân tích thị trường sẽ xuất hiện tại đây.
        </p>
      </div>
    </section>
  )
}

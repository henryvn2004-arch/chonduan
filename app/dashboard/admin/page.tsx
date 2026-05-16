import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

const DATA_QUALITY_LABEL: Record<string, string> = {
  auto: 'Auto',
  ai_filled: 'AI Filled',
  verified: 'Verified',
  gold: 'Gold',
}

const DATA_QUALITY_COLOR: Record<string, string> = {
  auto: 'bg-gray-100 text-gray-600',
  ai_filled: 'bg-blue-100 text-blue-700',
  verified: 'bg-green-100 text-green-700',
  gold: 'bg-yellow-100 text-yellow-700',
}

export default async function AdminProjectListPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dang-nhap')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_type')
    .eq('id', user.id)
    .single()

  if (profile?.user_type !== 'admin') redirect('/dang-nhap')

  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name_official, province, data_quality, published, updated_at')
    .order('data_quality', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) redirect('/dang-nhap')

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0D1B3D]">Admin — Dự án</h1>
          <p className="text-xs text-[#8A94A6] mt-0.5">{projects?.length ?? 0} dự án</p>
        </div>
        <LogoutButton />
      </header>

      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Tên dự án</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Tỉnh/TP</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Chất lượng data</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Published</th>
                <th className="text-left px-4 py-3 font-medium text-[#8A94A6]">Cập nhật</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {projects?.map(project => (
                <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-[#0D1B3D]">{project.name_official}</td>
                  <td className="px-4 py-3 text-[#8A94A6]">{project.province}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${DATA_QUALITY_COLOR[project.data_quality ?? 'auto']}`}>
                      {DATA_QUALITY_LABEL[project.data_quality ?? 'auto']}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${project.published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {project.published ? 'Live' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8A94A6] text-xs">
                    {new Date(project.updated_at).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/admin/projects/${project.id}`}
                      className="text-[#1565FF] hover:text-[#3D8BFF] font-medium text-xs"
                    >
                      Chỉnh sửa
                    </Link>
                  </td>
                </tr>
              ))}
              {(!projects || projects.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-[#8A94A6] text-sm">
                    Chưa có dự án nào. Hãy thêm dữ liệu vào database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function LogoutButton() {
  return (
    <form action="/api/admin/logout" method="POST">
      <button
        type="submit"
        className="text-sm text-[#8A94A6] hover:text-[#0D1B3D] transition"
      >
        Đăng xuất
      </button>
    </form>
  )
}

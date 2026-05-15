'use client'

import { useState, useRef } from 'react'

type Project = {
  id: string
  name_official: string
  land_origin_type: string | null
  red_book_status: string | null
  ownership_term: string | null
  construction_permit_no: string | null
  investment_approval_no: string | null
  legal_issues_text: string | null
  legal_score: number | null
  legal_last_verified: string | null
  flood_risk_level: number | null
  tide_risk_level: number | null
  air_pollution_score: number | null
  noise_level: string | null
  drama_history: unknown
  upcoming_infrastructure: unknown
  investment_score: number | null
  outlook_text: string | null
  logo_url: string | null
  banner_url: string | null
  gallery_urls: string[] | null
  video_tour_url: string | null
  floor_plan_url: string | null
  master_plan_url: string | null
  main_direction: string | null
  compatible_can_chi: string[] | null
  incompatible_can_chi: string[] | null
  fengshui_notes: string | null
  data_quality: string | null
  published: boolean
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[#8A94A6] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, type = 'text', placeholder }: {
  value: string | number | null | undefined
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565FF] bg-white"
    />
  )
}

function Select({ value, onChange, options }: {
  value: string | null | undefined
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565FF] bg-white"
    >
      <option value="">— Chọn —</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function Textarea({ value, onChange, rows = 3 }: {
  value: string | null | undefined
  onChange: (v: string) => void
  rows?: number
}) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      rows={rows}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565FF] bg-white resize-none"
    />
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-base font-bold text-[#0D1B3D] pt-2 border-t border-gray-100 mt-6 first:mt-0 first:border-0 first:pt-0">
      {children}
    </h2>
  )
}

export default function ProjectEditForm({ project }: { project: Project }) {
  const [form, setForm] = useState({
    // Nhóm 5
    land_origin_type: project.land_origin_type,
    red_book_status: project.red_book_status,
    ownership_term: project.ownership_term,
    construction_permit_no: project.construction_permit_no,
    investment_approval_no: project.investment_approval_no,
    legal_issues_text: project.legal_issues_text,
    legal_score: project.legal_score,
    legal_last_verified: project.legal_last_verified,
    // Nhóm 10
    flood_risk_level: project.flood_risk_level,
    tide_risk_level: project.tide_risk_level,
    air_pollution_score: project.air_pollution_score,
    noise_level: project.noise_level,
    drama_history: project.drama_history ? JSON.stringify(project.drama_history, null, 2) : '[]',
    // Nhóm 11
    upcoming_infrastructure: project.upcoming_infrastructure ? JSON.stringify(project.upcoming_infrastructure, null, 2) : '[]',
    investment_score: project.investment_score,
    outlook_text: project.outlook_text,
    // Nhóm 12
    logo_url: project.logo_url,
    banner_url: project.banner_url,
    gallery_urls: (project.gallery_urls ?? []).join('\n'),
    video_tour_url: project.video_tour_url,
    floor_plan_url: project.floor_plan_url,
    master_plan_url: project.master_plan_url,
    // Nhóm 13
    main_direction: project.main_direction,
    compatible_can_chi: (project.compatible_can_chi ?? []).join(', '),
    incompatible_can_chi: (project.incompatible_can_chi ?? []).join(', '),
    fengshui_notes: project.fengshui_notes,
    // Meta
    data_quality: project.data_quality,
    published: project.published,
  })

  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [uploadingField, setUploadingField] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingUploadField, setPendingUploadField] = useState<string | null>(null)

  function set(key: string, value: unknown) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setSaveStatus('idle')

    let dramaHistoryJson: unknown = []
    let upcomingJson: unknown = []
    try { dramaHistoryJson = JSON.parse(form.drama_history as string) } catch {}
    try { upcomingJson = JSON.parse(form.upcoming_infrastructure as string) } catch {}

    const payload = {
      land_origin_type: form.land_origin_type || null,
      red_book_status: form.red_book_status || null,
      ownership_term: form.ownership_term || null,
      construction_permit_no: form.construction_permit_no || null,
      investment_approval_no: form.investment_approval_no || null,
      legal_issues_text: form.legal_issues_text || null,
      legal_score: form.legal_score ? Number(form.legal_score) : null,
      legal_last_verified: form.legal_last_verified || null,
      flood_risk_level: form.flood_risk_level !== null && form.flood_risk_level !== undefined ? Number(form.flood_risk_level) : null,
      tide_risk_level: form.tide_risk_level !== null && form.tide_risk_level !== undefined ? Number(form.tide_risk_level) : null,
      air_pollution_score: form.air_pollution_score !== null && form.air_pollution_score !== undefined ? Number(form.air_pollution_score) : null,
      noise_level: form.noise_level || null,
      drama_history: dramaHistoryJson,
      upcoming_infrastructure: upcomingJson,
      investment_score: form.investment_score ? Number(form.investment_score) : null,
      outlook_text: form.outlook_text || null,
      logo_url: form.logo_url || null,
      banner_url: form.banner_url || null,
      gallery_urls: (form.gallery_urls as string).split('\n').map(s => s.trim()).filter(Boolean),
      video_tour_url: form.video_tour_url || null,
      floor_plan_url: form.floor_plan_url || null,
      master_plan_url: form.master_plan_url || null,
      main_direction: form.main_direction || null,
      compatible_can_chi: (form.compatible_can_chi as string).split(',').map(s => s.trim()).filter(Boolean),
      incompatible_can_chi: (form.incompatible_can_chi as string).split(',').map(s => s.trim()).filter(Boolean),
      fengshui_notes: form.fengshui_notes || null,
      data_quality: form.data_quality || null,
      published: form.published,
    }

    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    setSaveStatus(res.ok ? 'ok' : 'error')
    setTimeout(() => setSaveStatus('idle'), 3000)
  }

  function triggerUpload(fieldName: string) {
    setPendingUploadField(fieldName)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !pendingUploadField) return
    setUploadingField(pendingUploadField)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('project_id', project.id)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (res.ok && json.url) {
      set(pendingUploadField, json.url)
    }
    setUploadingField(null)
    setPendingUploadField(null)
    e.target.value = ''
  }

  function UrlField({ fieldKey, label }: { fieldKey: string; label: string }) {
    return (
      <Field label={label}>
        <div className="flex gap-2">
          <Input
            value={form[fieldKey as keyof typeof form] as string}
            onChange={v => set(fieldKey, v)}
            placeholder="https://..."
          />
          <button
            type="button"
            onClick={() => triggerUpload(fieldKey)}
            disabled={uploadingField === fieldKey}
            className="shrink-0 px-3 py-2 border border-gray-200 rounded-lg text-xs text-[#1565FF] hover:bg-blue-50 transition disabled:opacity-50"
          >
            {uploadingField === fieldKey ? 'Đang tải...' : 'Upload'}
          </button>
        </div>
      </Field>
    )
  }

  return (
    <div className="space-y-6">
      <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />

      {/* Nhóm 5 — Pháp lý */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <SectionTitle>Nhóm 5 — Pháp lý</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nguồn gốc đất">
            <Select value={form.land_origin_type} onChange={v => set('land_origin_type', v)} options={[
              { value: 'dat_o', label: 'Đất ở' },
              { value: 'dat_thuong_mai', label: 'Đất thương mại' },
              { value: 'dat_chuyen_doi', label: 'Đất chuyển đổi' },
              { value: 'khac', label: 'Khác' },
            ]} />
          </Field>
          <Field label="Tình trạng sổ đỏ">
            <Select value={form.red_book_status} onChange={v => set('red_book_status', v)} options={[
              { value: 'da_cap', label: 'Đã cấp' },
              { value: 'chua_cap', label: 'Chưa cấp' },
              { value: 'dang_lam', label: 'Đang làm' },
              { value: 'vuong_mac', label: 'Vướng mắc' },
            ]} />
          </Field>
          <Field label="Thời hạn sở hữu">
            <Select value={form.ownership_term} onChange={v => set('ownership_term', v)} options={[
              { value: 'lau_dai', label: 'Lâu dài' },
              { value: 'nam_50', label: '50 năm' },
              { value: 'nam_70', label: '70 năm' },
              { value: 'khac', label: 'Khác' },
            ]} />
          </Field>
          <Field label="Điểm pháp lý (1-10)">
            <Input type="number" value={form.legal_score} onChange={v => set('legal_score', v)} />
          </Field>
          <Field label="Số giấy phép xây dựng">
            <Input value={form.construction_permit_no} onChange={v => set('construction_permit_no', v)} />
          </Field>
          <Field label="Số quyết định đầu tư">
            <Input value={form.investment_approval_no} onChange={v => set('investment_approval_no', v)} />
          </Field>
          <Field label="Ngày xác minh gần nhất">
            <Input type="date" value={form.legal_last_verified} onChange={v => set('legal_last_verified', v)} />
          </Field>
        </div>
        <Field label="Ghi chú pháp lý">
          <Textarea value={form.legal_issues_text} onChange={v => set('legal_issues_text', v)} />
        </Field>
      </div>

      {/* Nhóm 10 — Risk */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <SectionTitle>Nhóm 10 — Rủi ro</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Rủi ro ngập lụt (0-3)">
            <Input type="number" value={form.flood_risk_level} onChange={v => set('flood_risk_level', v)} />
          </Field>
          <Field label="Rủi ro triều cường (0-3)">
            <Input type="number" value={form.tide_risk_level} onChange={v => set('tide_risk_level', v)} />
          </Field>
          <Field label="Ô nhiễm không khí (0-100)">
            <Input type="number" value={form.air_pollution_score} onChange={v => set('air_pollution_score', v)} />
          </Field>
          <Field label="Mức độ ồn">
            <Select value={form.noise_level} onChange={v => set('noise_level', v)} options={[
              { value: 'quiet', label: 'Yên tĩnh' },
              { value: 'moderate', label: 'Trung bình' },
              { value: 'noisy', label: 'Ồn ào' },
            ]} />
          </Field>
        </div>
        <Field label="Lịch sử drama (JSON)">
          <Textarea value={form.drama_history as string} onChange={v => set('drama_history', v)} rows={4} />
        </Field>
      </div>

      {/* Nhóm 11 — Triển vọng */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <SectionTitle>Nhóm 11 — Triển vọng đầu tư</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Điểm đầu tư (1-10)">
            <Input type="number" value={form.investment_score} onChange={v => set('investment_score', v)} />
          </Field>
        </div>
        <Field label="Hạ tầng sắp tới (JSON)">
          <Textarea value={form.upcoming_infrastructure as string} onChange={v => set('upcoming_infrastructure', v)} rows={4} />
        </Field>
        <Field label="Nhận định chuyên gia">
          <Textarea value={form.outlook_text} onChange={v => set('outlook_text', v)} rows={3} />
        </Field>
      </div>

      {/* Nhóm 12 — Media */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <SectionTitle>Nhóm 12 — Media</SectionTitle>
        <div className="grid grid-cols-1 gap-4">
          <UrlField fieldKey="logo_url" label="Logo URL" />
          <UrlField fieldKey="banner_url" label="Banner URL" />
          <UrlField fieldKey="floor_plan_url" label="Mặt bằng (floor plan)" />
          <UrlField fieldKey="master_plan_url" label="Tổng thể (master plan)" />
          <Field label="URL video tour">
            <Input value={form.video_tour_url} onChange={v => set('video_tour_url', v)} placeholder="https://youtube.com/..." />
          </Field>
          <Field label="Gallery URLs (mỗi dòng 1 URL)">
            <Textarea value={form.gallery_urls as string} onChange={v => set('gallery_urls', v)} rows={5} />
          </Field>
        </div>
      </div>

      {/* Nhóm 13 — Phong thủy */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <SectionTitle>Nhóm 13 — Phong thủy</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Hướng chính">
            <Select value={form.main_direction} onChange={v => set('main_direction', v)} options={[
              { value: 'dong', label: 'Đông' },
              { value: 'tay', label: 'Tây' },
              { value: 'nam', label: 'Nam' },
              { value: 'bac', label: 'Bắc' },
              { value: 'dong_bac', label: 'Đông Bắc' },
              { value: 'dong_nam', label: 'Đông Nam' },
              { value: 'tay_bac', label: 'Tây Bắc' },
              { value: 'tay_nam', label: 'Tây Nam' },
            ]} />
          </Field>
        </div>
        <Field label="Can chi hợp (phân cách bằng dấu phẩy)">
          <Input value={form.compatible_can_chi as string} onChange={v => set('compatible_can_chi', v)} placeholder="Giáp Tý, Ất Sửu, ..." />
        </Field>
        <Field label="Can chi không hợp (phân cách bằng dấu phẩy)">
          <Input value={form.incompatible_can_chi as string} onChange={v => set('incompatible_can_chi', v)} placeholder="Bính Dần, ..." />
        </Field>
        <Field label="Ghi chú phong thủy">
          <Textarea value={form.fengshui_notes} onChange={v => set('fengshui_notes', v)} />
        </Field>
      </div>

      {/* Meta */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <SectionTitle>Trạng thái</SectionTitle>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Chất lượng data">
            <Select value={form.data_quality} onChange={v => set('data_quality', v)} options={[
              { value: 'auto', label: 'Auto' },
              { value: 'ai_filled', label: 'AI Filled' },
              { value: 'verified', label: 'Verified' },
              { value: 'gold', label: 'Gold' },
            ]} />
          </Field>
          <Field label="Published">
            <Select
              value={form.published ? 'true' : 'false'}
              onChange={v => set('published', v === 'true')}
              options={[
                { value: 'false', label: 'Draft' },
                { value: 'true', label: 'Live' },
              ]}
            />
          </Field>
        </div>
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-sm p-4">
        {saveStatus === 'ok' && <span className="text-green-600 text-sm">Đã lưu thành công</span>}
        {saveStatus === 'error' && <span className="text-red-500 text-sm">Lưu thất bại — kiểm tra console</span>}
        {saveStatus === 'idle' && <span />}
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#1565FF] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#3D8BFF] transition disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Lưu dự án'}
        </button>
      </div>
    </div>
  )
}

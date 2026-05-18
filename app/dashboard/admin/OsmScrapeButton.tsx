'use client'

import { useState } from 'react'

const OSM_TYPES = [
  { value: 'van_phong',       label: 'Văn phòng' },
  { value: 'nha_xuong_cn',    label: 'Nhà xưởng CN' },
  { value: 'khu_cong_nghiep', label: 'Khu công nghiệp' },
  { value: 'dat_nong_nghiep', label: 'Đất nông nghiệp' },
  { value: 'dat_rung',        label: 'Đất rừng' },
  { value: 'khu_nghi_duong',  label: 'Khu nghỉ dưỡng' },
  { value: 'nha_o_xa_hoi',    label: 'Nhà ở xã hội' },
]

export default function OsmScrapeButton() {
  const [type, setType] = useState(OSM_TYPES[0].value)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  async function run() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/scrape-osm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      })
      const data = await res.json()
      setResult(data.message ?? JSON.stringify(data))
    } catch (e) {
      setResult(`Lỗi: ${String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
      <h3 className="font-semibold text-sm text-gray-700">Scrape dữ liệu từ OSM</h3>
      <div className="flex gap-2">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          disabled={loading}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:border-blue-500"
        >
          {OSM_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={loading}
          className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Đang chạy...' : 'Chạy scrape'}
        </button>
      </div>
      {result && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded px-3 py-2">{result}</p>
      )}
      <p className="text-[11px] text-gray-400">
        Mỗi lần chạy 1 loại. Dữ liệu OSM thêm vào với published=false để review trước.
      </p>
    </div>
  )
}

'use client'
import { useState } from 'react'

export default function GeocodeBatchButton() {
  const [status, setStatus] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  async function runBatch() {
    setRunning(true)
    setStatus('Đang geocode 50 dự án...')
    try {
      const res = await fetch('/api/admin/geocode-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      })
      const data = await res.json()
      if (data.remaining === 0) {
        setStatus(`✓ Xong! Đã geocode ${data.updated} dự án. Tất cả có tọa độ rồi.`)
      } else {
        setStatus(`✓ Batch xong: +${data.updated} geocoded, còn lại ${data.remaining} — bấm tiếp.`)
      }
    } catch (e) {
      setStatus('Lỗi — thử lại.')
    }
    setRunning(false)
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={runBatch}
        disabled={running}
        className="text-xs px-3 py-1.5 rounded-lg bg-[#1565FF] text-white font-medium hover:bg-[#3D8BFF] disabled:opacity-50 transition"
      >
        {running ? 'Đang chạy...' : '📍 Geocode batch (50)'}
      </button>
      {status && <span className="text-xs text-[#64748B]">{status}</span>}
    </div>
  )
}

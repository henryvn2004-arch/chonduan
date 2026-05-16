'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import ContactForm from '@/components/agent/ContactForm'

interface Agent {
  id: string
  display_name: string
  phone: string
}

export default function AgentProfileClient({ agent }: { agent: Agent }) {
  const [showForm, setShowForm] = useState(false)
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') === 'rent_long' ? 'rent_long' : 'sale'

  return (
    <>
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-2">
        <button
          onClick={() => setShowForm(true)}
          className="w-full bg-[#1565FF] text-white font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors text-sm"
        >
          Liên hệ môi giới
        </button>
        <a
          href={`tel:${agent.phone}`}
          className="flex items-center justify-center gap-2 w-full border border-[#E2E8F0] text-[#0D1B3D] font-medium py-2.5 rounded-xl hover:bg-[#F8FAFC] transition-colors text-sm"
        >
          <svg className="w-4 h-4 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          Gọi ngay
        </a>
      </div>

      {showForm && (
        <ContactForm agent={agent} mode={mode} onClose={() => setShowForm(false)} />
      )}
    </>
  )
}

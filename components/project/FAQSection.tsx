'use client'

import { useState } from 'react'
import type { ProjectDetail } from '@/types/project'

function AudioPlayer({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-[#F0F6FF] rounded-xl border border-[#DBEAFE]">
      <svg className="w-5 h-5 text-[#1565FF] shrink-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-[#1565FF]">Audio tour dự án</div>
        <audio controls className="w-full mt-1 h-8" src={url} />
      </div>
    </div>
  )
}

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#F1F5F9] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-3"
      >
        <span className="text-sm font-medium text-[#0D1B3D]">{q}</span>
        <svg
          className={`w-4 h-4 text-[#64748B] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <p className="text-sm text-[#475569] pb-4 leading-relaxed">{a}</p>}
    </div>
  )
}

export default function FAQSection({ project }: { project: ProjectDetail }) {
  const faqs = project.ai_faq ?? []

  return (
    <section id="hoi-dap" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Hỏi đáp thường gặp</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        {/* Audio tour */}
        {project.ai_audio_url && <AudioPlayer url={project.ai_audio_url} />}

        {/* FAQ list */}
        {faqs.length > 0 ? (
          <div>
            {faqs.map((item, i) => (
              <FAQItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-4xl mb-3">🤖</div>
            <p className="text-sm text-[#94A3B8]">
              AI FAQ sẽ được tạo tự động từ dữ liệu dự án.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

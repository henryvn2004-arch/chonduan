'use client'

import { useEffect, useRef, useState } from 'react'

const TABS = [
  { id: 'tong-quan', label: 'Tổng quan' },
  { id: 'gia', label: 'Giá' },
  { id: 'phap-ly', label: 'Pháp lý' },
  { id: 'tien-ich', label: 'Tiện ích' },
  { id: 'quy-hoach', label: 'Quy hoạch' },
  { id: 'phong-thuy', label: 'Phong thủy' },
  { id: 'review', label: 'Review' },
  { id: 'rui-ro', label: 'Rủi ro' },
  { id: 'trien-vong', label: 'Triển vọng' },
  { id: 'tin-tuc', label: 'Tin tức' },
  { id: 'hoi-dap', label: 'Hỏi đáp' },
  { id: 'moi-gioi', label: 'Môi giới' },
]

export default function StickyTabs() {
  const [active, setActive] = useState(TABS[0].id)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id)
          }
        }
      },
      { rootMargin: '-56px 0px -60% 0px', threshold: 0 }
    )

    TABS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  function scrollTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - 104
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="sticky top-14 z-40 bg-white border-b border-[#E2E8F0] shadow-sm">
      <div
        ref={scrollRef}
        className="flex gap-0 overflow-x-auto scrollbar-hide max-w-5xl mx-auto px-2"
        style={{ scrollbarWidth: 'none' }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => scrollTo(tab.id)}
            className={`shrink-0 px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              active === tab.id
                ? 'border-[#1565FF] text-[#1565FF]'
                : 'border-transparent text-[#64748B] hover:text-[#0D1B3D]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

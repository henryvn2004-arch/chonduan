'use client'

import { useState } from 'react'
import ContactForm from '@/components/agent/ContactForm'

interface Props {
  agent: { id: string; display_name: string; phone: string }
  projectId?: string
  mode: 'sale' | 'rent_long'
  className?: string
}

export default function AgentContactButton({ agent, projectId, mode, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className}
      >
        Liên hệ
      </button>

      {open && (
        <ContactForm
          agent={agent}
          projectId={projectId}
          mode={mode}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

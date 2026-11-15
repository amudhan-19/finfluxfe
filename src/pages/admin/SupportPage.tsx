// @author  veera
// @file    pages/admin/SupportPage.tsx

import { LifeBuoy } from 'lucide-react'
import { PageHeader } from '@/components/ui/PageHeader'
import { AISupportChat } from '@/features/admin-support/components/AISupportChat'
import { SupportChannels } from '@/features/admin-support/components/SupportChannels'
import { TicketForm } from '@/features/admin-support/components/TicketForm'

export default function SupportPage() {
  return (
    <div className="admin-support-page">
      <PageHeader
        title="Support"
        subtitle="Raise a ticket · AI assistant · Direct contact"
        icon={<LifeBuoy size={22} strokeWidth={2} />}
      />

      <SupportChannels />

      <div className="support-main">
        <div className="support-main__panel">
          <TicketForm />
        </div>
        <div className="support-main__panel">
          <AISupportChat variant="embedded" />
        </div>
      </div>
    </div>
  )
}

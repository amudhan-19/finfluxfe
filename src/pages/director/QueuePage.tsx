// @author  veera
// @file    pages/director/QueuePage.tsx

import { CheckCircle2 } from 'lucide-react'
import { useDirectorQueue, useApprove, useReject } from '@/features/workflow/hooks'
import { useUiStore } from '@/store/useUiStore'
import { PageHeader } from '@/components/ui/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { X } from '@/constants/theme'

export default function DirectorQueuePage() {
  const { data: rows = [], isLoading } = useDirectorQueue()
  const approve = useApprove()
  const reject  = useReject()
  const { toast } = useUiStore()

  return (
    <div className="app-page__section">
      <PageHeader
        title="Final Approval Queue"
        subtitle="Entities awaiting your final approval after supervisor review."
        icon={<CheckCircle2 size={22} strokeWidth={2} />}
      />

      {isLoading && <div style={{ color: X.textM }}>{`Loading\u2026`}</div>}
      {!isLoading && rows.length === 0 && (
        <div style={{ background: 'var(--x-card)', padding: 24, borderRadius: 10,
                      border: `1px solid ${X.border}`, color: X.textM, fontSize: 12 }}>
          Nothing awaiting approval right now. Nice work.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
        {rows.map((r) => (
          <div key={r.id} style={{
            background: 'var(--x-card)', borderRadius: 10, border: `1px solid ${X.border}`,
            padding: '14px 16px', borderLeft: `4px solid ${X.purple}`,
            boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{r.name}</div>
                <div style={{ fontSize: 10, color: X.textM }}>{`${r.region} \u00B7 ${r.id}`}</div>
              </div>
              <span style={{ padding: '3px 8px', borderRadius: 5,
                             background: '#ede9fe', color: X.purple,
                             fontSize: 9, fontWeight: 700 }}>Pending</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <AppButton
                variant="danger"
                size="sm"
                onClick={() => {
                  const note = window.prompt('Reason?') || ''
                  reject.mutate({ id: r.id, note }, { onSuccess: () => toast('Rejected') })
                }}
              >
                Reject
              </AppButton>
              <AppButton
                variant="primary"
                size="sm"
                onClick={() => approve.mutate({ id: r.id }, {
                  onSuccess: () => toast('Approved'),
                  onError: (e: any) => toast(e?.response?.data?.detail || 'Cannot approve'),
                })}
              >
                Final Approve
              </AppButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


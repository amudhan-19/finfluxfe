// @author  veera
// @file    features/admin-flux-generate/QbFluxGenerateBar.tsx
//
// QuickBooks → Flux generation toolbar on the Ontology Mapping page.

import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { generateFluxFromQb } from '@/features/admin-flux-generate/api'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import { AppButton } from '@/components/ui'
import type { FluxGenerateResponse, FluxPreviewRow } from '@/types/models'
import { formatCurrency, formatPercent } from '@/utils/aiText'

interface Props {
  entityId: string
  statement: 'pl' | 'bs'
  disabled?: boolean
}

export function QbFluxGenerateBar({ entityId, statement, disabled = false }: Props) {
  const qc = useQueryClient()
  const { toast } = useUiStore()
  const [overwrite, setOverwrite] = useState(true)
  const [preview, setPreview] = useState<FluxGenerateResponse | null>(null)

  const previewMutation = useMutation({
    mutationFn: () => generateFluxFromQb(entityId, {
      statement, mode: 'preview', source: 'quickbooks',
    }),
    onSuccess: (data) => {
      setPreview(data)
      toast(`Previewed ${data.rowsGenerated ?? data.rows_previewed} caption(s)`)
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Preview failed')),
  })

  const commitMutation = useMutation({
    mutationFn: () => generateFluxFromQb(entityId, {
      statement, mode: 'commit', overwriteExisting: overwrite, source: 'quickbooks',
    }),
    onSuccess: (data) => {
      toast(`Flux generated — ${data.rows_inserted + data.rows_updated} row(s) updated`)
      void qc.invalidateQueries({ queryKey: ['flux'] })
      setPreview(data)
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Generate failed')),
  })

  const previewRows = useMemo<FluxPreviewRow[]>(() => preview?.preview_rows ?? [], [preview])

  return (
    <div className="ont-generate">
      <div className="ont-generate__top">
        <div className="ont-generate__intro">
          <div className="ont-generate__title">Generate Flux data from QuickBooks</div>
          <div className="ont-generate__subtitle">
            Uses manually saved ontology GL mappings · P&amp;L net change · BS balance at date
          </div>
          <label className="ont-generate__overwrite">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={disabled}
            />
            <span>Overwrite existing rows</span>
          </label>
        </div>

        <div className="ont-generate__side">
          <div className="ont-generate__actions">
            <AppButton
              variant="outline"
              size="sm"
              disabled={disabled || previewMutation.isPending}
              loading={previewMutation.isPending}
              onClick={() => previewMutation.mutate()}
            >
              {previewMutation.isPending ? 'Previewing…' : 'Preview'}
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              disabled={disabled || commitMutation.isPending}
              loading={commitMutation.isPending}
              onClick={() => commitMutation.mutate()}
            >
              {commitMutation.isPending ? 'Generating…' : 'Generate Flux'}
            </AppButton>
          </div>
        </div>
      </div>

      {previewRows.length > 0 && (
        <div className="ont-generate__preview">
          <div className="ont-generate__ptable-wrap">
            <table className="ont-generate__ptable">
              <thead>
                <tr>
                  <th>Caption</th>
                  <th className="ont-generate__ptable--num">Current</th>
                  <th className="ont-generate__ptable--num">Comp</th>
                  <th className="ont-generate__ptable--num">Var %</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.slice(0, 8).map((row) => (
                  <tr key={row.caption}>
                    <td>{row.caption}</td>
                    <td className="ont-generate__ptable--num">{formatCurrency(row.current_value)}</td>
                    <td className="ont-generate__ptable--num">{formatCurrency(row.comp_value)}</td>
                    <td className="ont-generate__ptable--num">{formatPercent(row.pct_variance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

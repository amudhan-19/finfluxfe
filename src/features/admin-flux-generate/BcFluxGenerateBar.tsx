// @author  veera
// @file    features/admin-flux-generate/BcFluxGenerateBar.tsx
//
// Compact toolbar shown on the Ontology Mapping admin page. Lets the
// operator preview or commit a BC → Flux regeneration for the active
// entity + statement, and surfaces the diagnostics that explain why a
// preview might be empty.
//
// Pure presentation: it never knows about the underlying SQL or BC API.

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  generateFluxFromBc,
  getBcFluxDiagnostics,
} from '@/features/admin-flux-generate/api'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import { AppButton } from '@/components/ui'
import type {
  BcFluxDiagnostics,
  FluxGenerateResponse,
  FluxPreviewRow,
  FluxStatementCalculation,
} from '@/types/models'
import { formatCurrency, formatPercent } from '@/utils/aiText'

interface Props {
  entityId: string
  statement: 'pl' | 'bs'
  /** Disabled when ontology is locked / not API-ready. */
  disabled?: boolean
}

function describeSkip(reason: string | null | undefined): string {
  if (!reason) return ''
  return reason
}

export function BcFluxGenerateBar({ entityId, statement, disabled = false }: Props) {
  const qc = useQueryClient()
  const { toast } = useUiStore()
  const [overwrite, setOverwrite] = useState(true)
  const [preview, setPreview] = useState<FluxGenerateResponse | null>(null)

  const diagQuery = useQuery({
    queryKey: ['bc-flux-diagnostics', entityId],
    queryFn: () => getBcFluxDiagnostics(entityId),
    enabled: !!entityId && !disabled,
  })
  const diag = diagQuery.data

  const previewMutation = useMutation({
    mutationFn: () => generateFluxFromBc(entityId, {
      statement, mode: 'preview', source: 'business_central',
    }),
    onSuccess: (data) => {
      setPreview(data)
      const generated = data.rowsGenerated ?? data.rows_previewed
      toast(`Previewed ${generated} caption${generated === 1 ? '' : 's'}`)
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Preview failed')),
  })

  const commitMutation = useMutation({
    mutationFn: () => generateFluxFromBc(entityId, {
      statement, mode: 'commit',
      overwriteExisting: overwrite,
      source: 'business_central',
    }),
    onSuccess: (data) => {
      const generated = data.rowsGenerated ?? (data.rows_inserted + data.rows_updated)
      const matched = data.matchedTransactions ?? data.matched_transaction_total
      toast(
        `Flux generated — ${generated} row${generated === 1 ? '' : 's'}, ` +
        `${matched} transaction${matched === 1 ? '' : 's'} matched`,
      )
      void qc.invalidateQueries({ queryKey: ['flux'] })
      void qc.invalidateQueries({ queryKey: ['bc-flux-diagnostics', entityId] })
      setPreview(data)
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Generate failed')),
  })

  const previewRows = useMemo<FluxPreviewRow[]>(
    () => preview?.preview_rows ?? [],
    [preview],
  )

  return (
    <div className="ont-generate">
      <div className="ont-generate__top">
        <div className="ont-generate__intro">
          <div className="ont-generate__title">Generate Flux data from Business Central</div>
          <div className="ont-generate__subtitle">
            Uses manually saved ontology GL mappings only. Preview is read-only.
          </div>
          <label className="ont-generate__overwrite">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              disabled={disabled}
            />
            <span>Overwrite existing rows for this period</span>
          </label>
        </div>

        <div className="ont-generate__side">
          <DiagnosticsChips diag={diag} loading={diagQuery.isLoading} />
          <div className="ont-generate__actions">
            <AppButton
              variant="outline"
              size="sm"
              disabled={disabled || previewMutation.isPending}
              loading={previewMutation.isPending}
              onClick={() => previewMutation.mutate()}
            >
              {previewMutation.isPending ? 'Previewing…' : 'Preview from BC'}
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              disabled={disabled || commitMutation.isPending}
              loading={commitMutation.isPending}
              onClick={() => commitMutation.mutate()}
            >
              {commitMutation.isPending ? 'Generating…' : 'Generate Flux from BC'}
            </AppButton>
          </div>
        </div>
      </div>

      {preview && (
        <PreviewSummary preview={preview} previewRows={previewRows} />
      )}
    </div>
  )
}


function StatementCalculationsBlock({ calcs }: { calcs: FluxStatementCalculation[] }) {
  return (
    <div className="ont-generate__calc">
      {calcs.map((c) => (
        <div key={c.statement} className="ont-generate__calc-row">
          {c.statement.toUpperCase()}: {c.calculationLabel}
          {' · '}
          {c.currentStartDate} → {c.currentEndDate}
          {' vs '}
          {c.comparisonStartDate} → {c.comparisonEndDate}
          {' · '}
          {c.mappedGlAccountsCount} GL mapped
          {c.selectedSubledgerCount > 0 && ` · ${c.selectedSubledgerCount} sub-ledger`}
          {' · '}
          {c.matchedTransactions} txns · {c.rowsGenerated} rows
          {c.warnings.length > 0 && (
            <div className="ont-generate__calc-warn">
              {c.warnings.join(' ')}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────
function DiagnosticsChips({
  diag, loading,
}: { diag: BcFluxDiagnostics | undefined; loading: boolean }) {
  if (loading) return <span className="ont-generate__chips-loading">Loading diagnostics…</span>
  if (!diag) return null
  const seedFlag = diag.flux_rows_seed > 0 && diag.flux_rows_bc_generated === 0
  return (
    <div className="ont-generate__chips">
      <Chip label="Mappings" value={`${diag.ontology_mappings_total}`} />
      <Chip label="GL accts" value={`${diag.erp_gl_accounts_synced}`} />
      <Chip label="GL entries" value={`${diag.erp_gl_entries_synced}`} />
      <Chip
        label="Flux rows"
        value={`${diag.flux_rows_bc_generated} BC / ${diag.flux_rows_seed} seed`}
        tone={seedFlag ? 'warn' : 'ok'}
      />
    </div>
  )
}

function Chip({
  label, value, tone = 'neutral',
}: { label: string; value: string; tone?: 'ok' | 'warn' | 'neutral' }) {
  const cls = [
    'ont-generate__chip',
    tone === 'ok' ? 'ont-generate__chip--ok' : '',
    tone === 'warn' ? 'ont-generate__chip--warn' : '',
  ].filter(Boolean).join(' ')
  return (
    <span className={cls}>
      <span className="ont-generate__chip-label">{label}</span>
      <span className="ont-generate__chip-value">{value}</span>
    </span>
  )
}

function PreviewSummary({
  preview, previewRows,
}: { preview: FluxGenerateResponse; previewRows: FluxPreviewRow[] }) {
  const unmapped = preview.unmappedCaptions ?? preview.captions_without_mappings
  const noTxns = preview.captionsWithNoTransactions ?? preview.captions_with_zero_transactions
  const matchedTxns = preview.matchedTransactions ?? preview.matched_transaction_total
  const rowsGenerated = preview.rowsGenerated ?? (
    preview.mode === 'commit'
      ? preview.rows_inserted + preview.rows_updated
      : previewRows.filter((r) => !r.skipped_reason).length
  )
  const skippedCaptions = preview.skippedCaptions ?? previewRows
    .filter((r) => r.skipped_reason)
    .map((r) => ({ caption: r.caption, reason: r.skipped_reason || '' }))

  const matchedRows = previewRows.filter((r) => !r.skipped_reason)
  const skippedRows = previewRows.filter((r) => r.skipped_reason)

  return (
    <div className="ont-generate__preview">
      {(preview.statementCalculations ?? []).length > 0 && (
        <StatementCalculationsBlock calcs={preview.statementCalculations!} />
      )}
      <div className="ont-generate__preview-stats">
        <span><strong>{rowsGenerated}</strong> rows generated</span>
        <span><strong>{matchedTxns}</strong> transactions matched</span>
        <span><strong>{preview.captions_with_mappings}</strong> / {preview.captions_total} captions mapped</span>
        {preview.mode === 'commit' && (
          <span className="ont-generate__preview-commit">
            +{preview.rows_inserted} new · ~{preview.rows_updated} updated · {preview.rows_skipped} preserved
          </span>
        )}
      </div>
      {unmapped.length > 0 && (
        <div className="ont-generate__warn">
          Unmapped captions (no manual GL mapping):&nbsp;{unmapped.join(', ')}
        </div>
      )}
      {noTxns.length > 0 && (
        <div className="ont-generate__warn">
          Mapped but no transactions in this period:&nbsp;{noTxns.join(', ')}
        </div>
      )}
      {matchedRows.length > 0 && (
        <div className="ont-generate__ptable-wrap">
          <table className="ont-generate__ptable">
            <thead>
              <tr>
                <th>Caption</th>
                <th>GL accounts</th>
                <th className="ont-generate__ptable--num">Current</th>
                <th className="ont-generate__ptable--num">Comparison</th>
                <th className="ont-generate__ptable--num">%</th>
                <th className="ont-generate__ptable--num">Txns</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {matchedRows.map((r) => (
                <tr key={`${r.statement}-${r.caption}`}>
                  <td>{r.caption}</td>
                  <td>{(r.selectedGlAccounts ?? []).join(', ') || '—'}</td>
                  <td className="ont-generate__ptable--num">{formatCurrency(r.current_value)}</td>
                  <td className="ont-generate__ptable--num">{formatCurrency(r.comp_value)}</td>
                  <td className="ont-generate__ptable--num">{formatPercent(r.pct_variance ?? 0)}</td>
                  <td className="ont-generate__ptable--num">{r.matched_transaction_count}</td>
                  <td>
                    {r.is_material
                      ? <span className="ont-generate__ptable-material">Material</span>
                      : <span className="ont-generate__ptable-muted">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(skippedCaptions.length > 0 || skippedRows.length > 0) && (
        <div className="ont-generate__skipped">
          Skipped: {(skippedCaptions.length > 0 ? skippedCaptions : skippedRows.map((r) => ({
            caption: r.caption,
            reason: r.skipped_reason || '',
          }))).map((s) => `${s.caption} (${describeSkip(s.reason)})`).join('; ')}
        </div>
      )}
    </div>
  )
}

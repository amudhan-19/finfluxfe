// @author  veera
// @file    pages/supervisor/FluxSettingsPage.tsx

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined'
import BusinessOutlined from '@mui/icons-material/BusinessOutlined'
import CalendarMonthOutlined from '@mui/icons-material/CalendarMonthOutlined'
import EventNoteOutlined from '@mui/icons-material/EventNoteOutlined'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import LocalOfferOutlined from '@mui/icons-material/LocalOfferOutlined'
import LockOutlined from '@mui/icons-material/LockOutlined'
import SaveOutlined from '@mui/icons-material/SaveOutlined'
import TuneOutlined from '@mui/icons-material/TuneOutlined'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'
import PeriodSelector from '@/components/shared/PeriodSelector'
import {
  AppBadge,
  AppButton,
  AppCard,
  FilterSelect,
  FormSelect,
  FormTextarea,
  FormTextField,
  PageHeader,
  SettingsCard,
  SettingsTabs,
} from '@/components/ui'
import {
  useProfile, usePutProfile,
  useThresholds, usePutThresholds, usePutPeriods,
} from '@/features/profile/hooks'
import { useMacroFactors, useAddMacro, useDeleteMacro } from '@/features/macro/hooks'
import {
  getFluxGenerationDiagnostics,
  savePeriodAndGenerate,
} from '@/features/flux-period/api'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useEntities } from '@/features/entities/hooks'
import { useUiStore } from '@/store/useUiStore'
import { U } from '@/constants/uiText'
import {
  buildPeriodRangeKey,
  parsePeriodRange,
  parsePeriodRangeKey,
} from '@/utils/periodRange'
import { fmtD } from '@/utils/helpers'
import type {
  EntityListItem,
  FluxGenerationDiagnostics,
  Threshold,
} from '@/types/models'

const TABS = [
  { id: 'company', l: 'Company', icon: <BusinessOutlined fontSize="small" /> },
  { id: 'thresholds', l: 'Thresholds', icon: <TuneOutlined fontSize="small" /> },
  { id: 'assign', l: 'Assign & Dates', icon: <EventNoteOutlined fontSize="small" /> },
  { id: 'periods', l: 'Period Config', icon: <CalendarMonthOutlined fontSize="small" /> },
  { id: 'ai_insights', l: 'AI Insights', icon: <AutoAwesomeOutlined fontSize="small" /> },
  { id: 'tags', l: 'Tags', icon: <LocalOfferOutlined fontSize="small" /> },
] as const
type TabKey = (typeof TABS)[number]['id']

const PERIOD_TYPE_OPTIONS = [
  { value: 'YoY', label: 'Year over Year' },
  { value: 'MoM', label: 'Month over Month' },
  { value: 'QoQ', label: 'Quarter over Quarter' },
  { value: 'Custom', label: 'Custom' },
]

const CAT_ICONS: Record<string, string> = {
  Geopolitical: 'GP',
  Energy: 'EN',
  Monetary: '$',
  Regulatory: 'RG',
  Industry: 'IN',
  FX: 'FX',
  Conflict: 'CF',
  Other: 'OT',
}
const REVENUE_OPTS = ['<$10M', '$10M–$50M', '$50M–$100M', '$100M–$500M', '$500M+']
const ENTITY_TYPE_OPTS = ['Public', 'Private', 'Subsidiary', 'JV / Partnership', 'PE-Backed', 'Non-Profit']


export default function SupFluxSettingsPage() {
  const { selCo, setSelCo, toast } = useUiStore()
  const { data: entities = [] } = useEntities()
  const entityId = selCo || entities[0]?.id || null
  const ent = entities.find((e) => e.id === entityId) || null
  const [tab, setTab] = useState<TabKey>('company')

  const entityOptions = entities.map((e) => ({ value: e.id, label: e.name }))

  return (
    <div className="flux-settings">
      <div className="flux-settings__header">
        <PageHeader
          title="Flux Settings"
          actions={(
            <div className="flux-settings__entity-field">
              <label className="flux-settings__entity-label" htmlFor="flux-settings-entity">
                Entity
              </label>
              <FilterSelect
                id="flux-settings-entity"
                className="flux-settings-entity-select"
                value={entityId || ''}
                onChange={(v) => setSelCo(v || null)}
                placeholder="Select entity…"
                options={entityOptions}
                aria-label="Select entity"
              />
            </div>
          )}
        />
      </div>

      <div className="flux-settings__tabs-wrap">
        <SettingsTabs
          tabs={TABS.map((t) => ({ id: t.id, label: t.l, icon: t.icon }))}
          active={tab}
          onChange={(id) => setTab(id as TabKey)}
        />
      </div>

      <div
        className="flux-settings__panel"
        role="tabpanel"
        id={`settings-panel-${tab}`}
        aria-labelledby={`settings-tab-${tab}`}
      >
        {entityId && tab === 'company' && <CompanyTab entityId={entityId} toast={toast} />}
        {entityId && tab === 'thresholds' && <ThresholdsTab entityId={entityId} toast={toast} />}
        {entityId && tab === 'assign' && ent && <AssignTab ent={ent} />}
        {entityId && tab === 'periods' && ent && (
          <PeriodsTab entityId={entityId} ent={ent} toast={toast} />
        )}
        {entityId && tab === 'ai_insights' && <AiInsightsTab entityId={entityId} toast={toast} />}
        {entityId && tab === 'tags' && ent && <TagsTab ent={ent} />}
      </div>
    </div>
  )
}


function CompanyTab({ entityId, toast }: { entityId: string; toast: (m: string) => void }) {
  const { data: p } = useProfile(entityId)
  const put = usePutProfile()
  const [draft, setDraft] = useState({
    industry: '', geography: '', revenue_range: '', entity_type: '', brief: '',
  })

  useEffect(() => {
    if (p) {
      setDraft({
        industry: p.industry || '',
        geography: p.geography || '',
        revenue_range: p.revenue_range || '',
        entity_type: p.entity_type || '',
        brief: p.brief || '',
      })
    }
  }, [p])

  const filled = draft.industry || draft.geography || draft.brief

  return (
    <div className="flux-settings__stack">
      <SettingsCard
        icon={<BusinessOutlined />}
        description="Company details help AI generate relevant macro & geopolitical insights. The more context you provide, the better the AI commentary."
      >
        <div className="flux-settings-form-grid">
          <FormTextField
            id="company-industry"
            fieldLabel="Industry / Sector"
            value={draft.industry}
            onChange={(e) => setDraft({ ...draft, industry: e.target.value })}
            placeholder="e.g. Technology / SaaS"
          />
          <FormTextField
            id="company-geography"
            fieldLabel="Geography / Region"
            value={draft.geography}
            onChange={(e) => setDraft({ ...draft, geography: e.target.value })}
            placeholder="e.g. United States, EMEA"
          />
          <FormSelect
            id="company-revenue"
            fieldLabel="Revenue Range"
            value={draft.revenue_range}
            onChange={(e) => setDraft({ ...draft, revenue_range: e.target.value as string })}
            placeholder="Select…"
            options={REVENUE_OPTS.map((o) => ({ value: o, label: o }))}
          />
          <FormSelect
            id="company-entity-type"
            fieldLabel="Entity Type"
            value={draft.entity_type}
            onChange={(e) => setDraft({ ...draft, entity_type: e.target.value as string })}
            placeholder="Select…"
            options={ENTITY_TYPE_OPTS.map((o) => ({ value: o, label: o }))}
          />
        </div>

        <FormTextarea
          id="company-brief"
          fieldLabel="Company Brief"
          value={draft.brief || ''}
          onChange={(e) => setDraft({ ...draft, brief: e.target.value })}
          rows={4}
          placeholder="Key business context — products, clients, market position, risk factors…"
        />

        <div className="flux-settings-form-actions flux-settings-form-actions--start">
          <AppButton
            variant="primary"
            iconLeft={<SaveOutlined fontSize="small" />}
            onClick={() => put.mutate(
              { entityId, body: draft },
              { onSuccess: () => toast('Profile saved') },
            )}
          >
            Save Profile
          </AppButton>
        </div>
      </SettingsCard>

      {filled && (
        <AppCard>
          <div className="flux-settings-summary">
            <h3 className="flux-settings-summary__heading">
              Profile Summary — used by AI
            </h3>
            <div className="flux-settings-summary__grid">
              {[
                { l: 'Industry', v: draft.industry },
                { l: 'Region', v: draft.geography },
                { l: 'Revenue', v: draft.revenue_range },
                { l: 'Type', v: draft.entity_type },
              ].filter((x) => x.v).map((x) => (
                <div key={x.l} className="flux-settings-summary__chip">
                  <div className="flux-settings-summary__chip-label">{x.l}</div>
                  <div className="flux-settings-summary__chip-value">{x.v}</div>
                </div>
              ))}
            </div>
            {draft.brief && (
              <div className="flux-settings-summary__brief">{draft.brief}</div>
            )}
            <p className="flux-settings-summary__hint">
              This profile is used by AI Insights to surface relevant macro factors.
            </p>
          </div>
        </AppCard>
      )}
    </div>
  )
}


function ThresholdsTab({ entityId, toast }: { entityId: string; toast: (m: string) => void }) {
  const { data: ths = [] } = useThresholds(entityId)
  const put = usePutThresholds()

  return (
    <SettingsCard
      icon={<TuneOutlined />}
      title="Variance Thresholds"
      description="Configure percentage and absolute thresholds for P&L and Balance Sheet flux review."
    >
      {(['pl', 'bs'] as const).map((stmt) => {
        const t = ths.find((x) => x.statement === stmt) || {
          statement: stmt, mode: 'both', pct_value: stmt === 'pl' ? 10 : 5,
          abs_value: stmt === 'pl' ? 100000 : 75000, logic: 'or', apply_all: true,
        } as Threshold
        return (
          <ThresholdRow
            key={stmt}
            t={t}
            onSave={(b) => put.mutate(
              { entityId, body: b },
              { onSuccess: () => toast(`${stmt.toUpperCase()} thresholds saved`) },
            )}
          />
        )
      })}
    </SettingsCard>
  )
}


function ThresholdRow({ t, onSave }: { t: Threshold; onSave: (t: Threshold) => void }) {
  const [d, setD] = useState<Threshold>(t)
  useEffect(() => setD(t), [t])

  return (
    <div className="flux-settings-threshold">
      <div className="flux-settings-threshold__grid">
        <div className="flux-settings-threshold__stmt">{d.statement.toUpperCase()}</div>
        <FormSelect
          id={`threshold-mode-${d.statement}`}
          fieldLabel="Mode"
          value={d.mode}
          onChange={(e) => setD({ ...d, mode: e.target.value as Threshold['mode'] })}
          options={['pct', 'abs', 'both'].map((m) => ({ value: m, label: m }))}
        />
        <FormTextField
          id={`threshold-pct-${d.statement}`}
          fieldLabel="%"
          type="number"
          value={d.pct_value}
          onChange={(e) => setD({ ...d, pct_value: Number(e.target.value) })}
        />
        <FormTextField
          id={`threshold-abs-${d.statement}`}
          fieldLabel="$"
          type="number"
          value={d.abs_value}
          onChange={(e) => setD({ ...d, abs_value: Number(e.target.value) })}
        />
        <FormSelect
          id={`threshold-logic-${d.statement}`}
          fieldLabel="Logic"
          value={d.logic}
          onChange={(e) => setD({ ...d, logic: e.target.value as Threshold['logic'] })}
          options={['or', 'and'].map((l) => ({ value: l, label: l }))}
        />
        <div className="flux-settings-threshold__actions">
          <AppButton
            variant="primary"
            size="sm"
            iconLeft={<SaveOutlined fontSize="small" />}
            onClick={() => onSave(d)}
          >
            Save
          </AppButton>
        </div>
      </div>
    </div>
  )
}


function AssignTab({ ent }: { ent: EntityListItem }) {
  return (
    <SettingsCard
      icon={<EventNoteOutlined />}
      title="Assignment & Dates"
      description="View submission deadlines and team assignments for this entity."
    >
      <div className="settings-alert settings-alert--warning">
        <span className="settings-alert__icon" aria-hidden>
          <LockOutlined fontSize="small" />
        </span>
        <p className="settings-alert__text">
          Team and submission/review dates are managed by your <strong>Admin</strong>.
          Reach out via the Admin Console to make changes.
        </p>
      </div>

      <div className="flux-settings-detail-grid">
        <div className="flux-settings-subcard">
          <div className="flux-settings-subcard__label">Submission Due</div>
          <div className="flux-settings-subcard__value">{fmtD(ent.sub_due_date)}</div>
        </div>
        <div className="flux-settings-subcard">
          <div className="flux-settings-subcard__label">Review Due</div>
          <div className="flux-settings-subcard__value">{fmtD(ent.rev_due_date)}</div>
        </div>
      </div>

      <div className="flux-settings-subcard">
        <div className="flux-settings-subcard__label">Approval Path</div>
        <div className="flux-settings-approval">
          <SettingsAvatar u={ent.supervisor} />
          <span className="flux-settings-approval__name">{ent.supervisor.name}</span>
          <span className="flux-settings-approval__role">(Supervisor)</span>
          {ent.approval_level === 'director' && ent.director && (
            <>
              <span className="flux-settings-approval__arrow" aria-hidden>{U.arr}</span>
              <SettingsAvatar u={ent.director} />
              <span className="flux-settings-approval__name">{ent.director.name}</span>
              <AppBadge variant="primary">Director</AppBadge>
            </>
          )}
        </div>
      </div>

      <div className="flux-settings-subcard">
        <div className="flux-settings-subcard__label">
          Analysts ({ent.assignees?.length || 0})
        </div>
        {(ent.assignees || []).length === 0 ? (
          <p className="settings-alert__text">No analysts assigned.</p>
        ) : (
          <div className="flux-settings-assignees">
            {(ent.assignees || []).map((a) => (
              <span key={a.id} className="flux-settings-assignee">
                <SettingsAvatar u={a} sm />
                {a.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </SettingsCard>
  )
}


function loadPeriodMonths(stored?: string | null): string[] {
  return parsePeriodRangeKey(stored)
}

function PeriodsTab({
  entityId,
  ent,
  toast,
}: {
  entityId: string
  ent: EntityListItem
  toast: (m: string) => void
}) {
  const put = usePutPeriods()
  const qc = useQueryClient()

  const [periodType, setPeriodType] = useState<string>(ent.period_type)
  const [from, setFrom] = useState<string[]>(loadPeriodMonths(ent.period_from))
  const [to, setTo] = useState<string[]>(loadPeriodMonths(ent.period_to))

  useEffect(() => {
    setPeriodType(ent.period_type)
    setFrom(loadPeriodMonths(ent.period_from))
    setTo(loadPeriodMonths(ent.period_to))
  }, [ent.id, ent.period_type, ent.period_from, ent.period_to])

  const fromKey = buildPeriodRangeKey(from)
  const toKey   = buildPeriodRangeKey(to)

  const dirty = (
    periodType !== ent.period_type ||
    fromKey !== buildPeriodRangeKey(loadPeriodMonths(ent.period_from)) ||
    toKey !== buildPeriodRangeKey(loadPeriodMonths(ent.period_to))
  )

  const diagQuery = useQuery({
    queryKey: ['flux-generation-diagnostics', entityId],
    queryFn: () => getFluxGenerationDiagnostics(entityId),
    enabled: !!entityId,
  })
  const diag = diagQuery.data

  const saveOnly = () => {
    if (!fromKey || !toKey) {
      toast('Select at least one month for current and comparison.')
      return
    }
    put.mutate(
      { entityId, body: { period_type: periodType, period_from: fromKey, period_to: toKey } },
      {
        onSuccess: () => {
          toast('Periods saved')
          void qc.invalidateQueries({ queryKey: ['flux-generation-diagnostics', entityId] })
          void qc.invalidateQueries({ queryKey: ['entities'] })
        },
      },
    )
  }

  const generateMutation = useMutation({
    mutationFn: () => {
      if (!fromKey || !toKey) {
        return Promise.reject(new Error('Select at least one month for current and comparison.'))
      }
      return savePeriodAndGenerate(entityId, {
      period_type: periodType as 'YoY' | 'MoM' | 'QoQ' | 'Custom',
      period_from: fromKey,
      period_to:   toKey,
      statement:   'both',
      overwriteExisting: true,
    })
    },
    onSuccess: (data) => {
      // Toast wording prioritises the safe_error_code so the supervisor sees
      // the precise reason — "no matching transactions", "ontology missing"
      // etc. — without having to dig into the diagnostics panel.
      if (data.safe_error_code) {
        toast(
          data.safe_error_message ||
            'Period saved but Flux data could not be generated.',
        )
      } else if (data.rows_generated === 0) {
        toast(
          'No Flux rows generated. Check ontology mapping and transaction matching.',
        )
      } else {
        // Per-statement breakdown like "PL: 3, BS: 5" so a partial success
        // (PL empty while BS regenerated cleanly) is immediately visible.
        const pl = data.statements?.pl
        const bs = data.statements?.bs
        const parts: string[] = []
        if (pl) parts.push(`PL: ${pl.rows_generated}`)
        if (bs) parts.push(`BS: ${bs.rows_generated}`)
        const breakdown = parts.length > 0 ? ` (${parts.join(', ')})` : ''
        toast(
          `Flux data generated from Business Central. `
          + `${data.rows_generated} row${data.rows_generated === 1 ? '' : 's'}, `
          + `${data.matched_transaction_total} transactions matched${breakdown}.`,
        )
      }
      // Refresh anything Analyst & Supervisor read so the new rows show
      // immediately without a manual reload.
      void qc.invalidateQueries({ queryKey: ['flux'] })
      void qc.invalidateQueries({ queryKey: ['ai-commentary'] })
      void qc.invalidateQueries({ queryKey: ['flux-generation-diagnostics', entityId] })
      void qc.invalidateQueries({ queryKey: ['entities'] })
    },
    onError: (e: unknown) => {
      toast(getApiErrorMessage(e, 'Save & Generate failed'))
    },
  })

  const generating = generateMutation.isPending

  // --- Derived UI state (frontend only — no impact on stored payload) -------
  const currentRange = parsePeriodRange(fromKey)
  const comparisonRange = parsePeriodRange(toKey)
  const fluxRows = diag?.flux_rows_for_selected_period ?? 0
  const bcAvailable = !!diag && diag.bc_entry_count > 0

  const hasCurrent = from.length > 0
  const hasComparison = to.length > 0
  const blocking: string[] = []
  if (!hasCurrent) blocking.push('Select at least one month for the current period.')
  if (!hasComparison) blocking.push('Select at least one month for the comparison period.')

  const warnings: string[] = []
  if (periodType === 'YoY' && fromKey && toKey && fromKey === toKey) {
    warnings.push('Current and comparison periods are identical — Year over Year usually compares different years.')
  }
  if (diag && bcAvailable && !diag.is_selected_range_within_bc_data) {
    warnings.push('Selected period is outside the synced Business Central range.')
  }
  if (diag && hasCurrent && hasComparison && fluxRows === 0) {
    warnings.push('No Flux rows for the selected period yet — use Save & Generate to build them from ERP data.')
  }

  const invalid = blocking.length > 0
  const validationStatus = invalid
    ? 'Incomplete'
    : warnings.length > 0
      ? 'Ready with warnings'
      : 'Ready'

  const saveDisabled = !dirty || put.isPending || invalid
  const generateDisabled = generating || invalid

  return (
    <SettingsCard icon={<CalendarMonthOutlined />}>
      <div className="flux-period-config">
        <div className="flux-period-config__header">
          <div className="flux-period-config__header-text">
            <h2 className="flux-period-config__title">Period Config</h2>
            <p className="flux-period-config__subtitle">
              Define current and comparison periods for Flux Review generation.
            </p>
          </div>
          <div className="flux-period-config__badges">
            {bcAvailable && (
              <AppBadge variant="info">Business Central range available</AppBadge>
            )}
            {fluxRows > 0 && (
              <AppBadge variant="success">{fluxRows} Flux rows available</AppBadge>
            )}
          </div>
        </div>

        <div className="flux-period-config__layout">
          <div className="flux-period-config__type-card">
            <FormSelect
              id="period-type"
              fieldLabel="Period Type"
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value as string)}
              options={PERIOD_TYPE_OPTIONS}
            />
            <p className="flux-period-config__type-helper">
              Choose how current and comparison periods should be paired. Month selection
              stays manual so you can fine-tune the exact flux window.
            </p>
          </div>

          <PeriodSelector
            title="Current Period"
            tone="current"
            value={from}
            onChange={setFrom}
            idBase="current"
          />
          <PeriodSelector
            title="Comparison Period"
            tone="comparison"
            value={to}
            onChange={setTo}
            idBase="comparison"
          />
        </div>

        {(blocking.length > 0 || warnings.length > 0) && (
          <div className="flux-period-config__alerts">
            {blocking.map((m) => (
              <div key={m} className="settings-alert settings-alert--warning">
                <span className="settings-alert__icon" aria-hidden>
                  <InfoOutlined fontSize="small" />
                </span>
                <p className="settings-alert__text">{m}</p>
              </div>
            ))}
            {warnings.map((m) => (
              <div key={m} className="settings-alert settings-alert--warning">
                <span className="settings-alert__icon" aria-hidden>
                  <WarningAmberOutlined fontSize="small" />
                </span>
                <p className="settings-alert__text">{m}</p>
              </div>
            ))}
          </div>
        )}

        <BcRangeWarnings diag={diag} />

        <div className="flux-period-config__summary">
          <div className="flux-period-config__summary-grid">
            <div className="flux-period-config__summary-item">
              <span className="flux-period-config__summary-label">Current range</span>
              <span className="flux-period-config__summary-value">
                {currentRange ? currentRange.label : '—'}
              </span>
              {currentRange && (
                <span className="flux-period-config__summary-sub">
                  {currentRange.startDate} {U.arr} {currentRange.endDate}
                </span>
              )}
            </div>
            <div className="flux-period-config__summary-item">
              <span className="flux-period-config__summary-label">Comparison range</span>
              <span className="flux-period-config__summary-value">
                {comparisonRange ? comparisonRange.label : '—'}
              </span>
              {comparisonRange && (
                <span className="flux-period-config__summary-sub">
                  {comparisonRange.startDate} {U.arr} {comparisonRange.endDate}
                </span>
              )}
            </div>
            <div className="flux-period-config__summary-item">
              <span className="flux-period-config__summary-label">BC range</span>
              <span className="flux-period-config__summary-value">
                {diag
                  ? `${diag.bc_oldest_posting_date || '—'} ${U.arr} ${diag.bc_latest_posting_date || '—'}`
                  : diagQuery.isLoading ? 'Loading…' : '—'}
              </span>
            </div>
            <div className="flux-period-config__summary-item">
              <span className="flux-period-config__summary-label">Flux rows</span>
              <span className="flux-period-config__summary-value">{fluxRows}</span>
            </div>
            <div className="flux-period-config__summary-item">
              <span className="flux-period-config__summary-label">Validation</span>
              <span
                className={[
                  'flux-period-config__status',
                  `flux-period-config__status--${invalid ? 'error' : warnings.length > 0 ? 'warn' : 'ok'}`,
                ].join(' ')}
              >
                {validationStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="flux-period-config__footer">
          <p className="flux-period-config__footer-helper">
            <InfoOutlined fontSize="inherit" aria-hidden />
            Pick one or more months to define multi-period flux ranges. Save &amp; Generate
            updates Flux Review with ERP data for the selected window.
          </p>
          <div className="flux-period-config__footer-actions">
            <AppButton
              variant={dirty && !invalid ? 'primary' : 'secondary'}
              disabled={saveDisabled}
              iconLeft={dirty && !invalid ? <SaveOutlined fontSize="small" /> : undefined}
              onClick={saveOnly}
              aria-label={dirty ? 'Save period configuration' : 'No changes to save'}
            >
              {put.isPending ? 'Saving…' : !dirty ? 'No changes' : 'Save'}
            </AppButton>
            <AppButton
              variant="primary"
              disabled={generateDisabled}
              loading={generating}
              iconLeft={<SaveOutlined fontSize="small" />}
              onClick={() => generateMutation.mutate()}
            >
              {generating ? 'Generating…' : 'Save & Generate'}
            </AppButton>
          </div>
        </div>
      </div>
    </SettingsCard>
  )
}


function BcRangeWarnings({ diag }: { diag: FluxGenerationDiagnostics | undefined }) {
  if (!diag) return null
  const messages: string[] = []
  if (diag.bc_entry_count === 0) {
    messages.push('No Business Central transactions are synced for this entity yet.')
  } else if (!diag.is_selected_range_within_bc_data) {
    messages.push('Selected period is outside the synced BC data range.')
  }
  if (diag.ontology_mappings_total === 0) {
    messages.push('No ontology mappings yet. Add captions in Admin → Ontology Mapping.')
  } else if (diag.captions_with_mapped_gl === 0) {
    messages.push('Ontology mappings exist but none have GL accounts assigned.')
  }
  if (
    messages.length === 0
    && diag.gl_entries_in_current_range === 0
    && diag.gl_entries_in_comparison_range === 0
  ) {
    messages.push('Mapped GL accounts have no transactions in the selected period.')
  }
  if (messages.length === 0) return null
  return (
    <div className="settings-alert settings-alert--warning">
      <span className="settings-alert__icon" aria-hidden>
        <WarningAmberOutlined fontSize="small" />
      </span>
      <div className="settings-alert__body">
        {messages.map((m) => (
          <p key={m} className="settings-alert__text">{m}</p>
        ))}
      </div>
    </div>
  )
}

function AiInsightsTab({ entityId, toast }: { entityId: string; toast: (m: string) => void }) {
  const { data: macros = [] } = useMacroFactors(entityId)
  const { data: p } = useProfile(entityId)
  const add = useAddMacro()
  const del = useDeleteMacro()

  const [cat, setCat] = useState('Industry')
  const [text, setText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [draft, setDraft] = useState('')

  const grouped = useMemo(() => {
    const out: Record<string, typeof macros> = {}
    macros.forEach((m) => {
      if (!out[m.category]) out[m.category] = []
      out[m.category].push(m)
    })
    return out
  }, [macros])

  const generate = () => {
    if (!text.trim()) return
    setGenerating(true)
    setDraft('')
    setTimeout(() => {
      const t = text.trim().replace(/\.$/, '')
      setDraft(`${t}${U.mdash} likely impacts the entity's ${cat.toLowerCase()} exposure. Track variance closely; if material, escalate via supervisor sign-off.`)
      setGenerating(false)
    }, 600)
  }

  const accept = () => {
    if (!draft) return
    add.mutate({ entityId, body: { category: cat, icon: CAT_ICONS[cat] || 'OT', text: draft } }, {
      onSuccess: () => { setDraft(''); setText(''); toast('Factor added with AI commentary') },
    })
  }

  const hasProfile = p && (p.industry || p.geography)

  return (
    <div className="flux-settings__stack">
      {hasProfile ? (
        <div className="settings-alert settings-alert--profile">
          <span className="settings-alert__icon" aria-hidden>
            <BusinessOutlined fontSize="small" />
          </span>
          <div className="settings-alert__body">
            <p className="settings-alert__title">{p.industry || ''}</p>
            <p className="settings-alert__text">
              {[p.geography, p.revenue_range, p.entity_type].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      ) : (
        <div className="settings-alert settings-alert--warning">
          <span className="settings-alert__icon" aria-hidden>
            <WarningAmberOutlined fontSize="small" />
          </span>
          <div className="settings-alert__body">
            <p className="settings-alert__title">No company profile configured</p>
            <p className="settings-alert__text">
              Add company details in the Company tab to get more relevant AI insights.
            </p>
          </div>
        </div>
      )}

      <SettingsCard
        icon={<AutoAwesomeOutlined />}
        title="AI Macro Insights"
        description={`${macros.length} factor${macros.length === 1 ? '' : 's'} configured for this entity.`}
      >
        {Object.keys(grouped).length === 0 && (
          <p className="settings-alert__text">No macro factors yet.</p>
        )}

        <div className="flux-settings-macro">
          {Object.entries(grouped).map(([category, list]) => (
              <div
                key={category}
                className="flux-settings-macro__category"
                data-category={category.toLowerCase()}
              >
                <div className="flux-settings-macro__category-header">
                  <span aria-hidden>{CAT_ICONS[category] || 'OT'}</span>
                  <strong className="flux-settings-macro__category-title">
                    {category}
                  </strong>
                  <span className="flux-settings-macro__category-count">{list.length}</span>
                </div>
                {list.map((m) => (
                  <div key={m.id} className="flux-settings-macro__item">
                    <span className="flux-settings-macro__text">{m.text}</span>
                    {m.is_custom && (
                      <AppBadge variant="info">Custom</AppBadge>
                    )}
                    {m.is_custom && (
                      <AppButton
                        variant="ghost"
                        size="sm"
                        onClick={() => del.mutate({ entityId, id: m.id })}
                        aria-label="Remove factor"
                      >
                        {U.times}
                      </AppButton>
                    )}
                  </div>
                ))}
              </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard title="+ Add Custom Factor (AI generated)">
        <div className="flux-settings-macro__add-grid">
          <FormSelect
            id="macro-category"
            fieldLabel="Category"
            value={cat}
            onChange={(e) => { setCat(e.target.value as string); setDraft('') }}
            options={['Geopolitical', 'Energy', 'Monetary', 'Regulatory', 'Industry', 'FX', 'Conflict', 'Other'].map((c) => ({
              value: c,
              label: c,
            }))}
          />
          <FormTextField
            id="macro-text"
            fieldLabel="Describe the factor briefly"
            value={text}
            onChange={(e) => { setText(e.target.value); setDraft('') }}
            placeholder={`e.g. Supply chain delays, tariff policy${U.ellip}`}
          />
          <AppButton
            variant="outline"
            disabled={!text.trim() || generating}
            loading={generating}
            iconLeft={<AutoAwesomeOutlined fontSize="small" />}
            onClick={generate}
          >
            {generating ? `Generating${U.ellip}` : 'AI Generate'}
          </AppButton>
        </div>

        {draft && (
          <div className="flux-settings-macro__preview">
            <div className="flux-settings-macro__preview-label">
              AI commentary preview
            </div>
            <div className="flux-settings-macro__preview-text">{draft}</div>
            <div className="flux-settings-macro__preview-actions">
              <AppButton variant="ghost" onClick={() => setDraft('')}>Discard</AppButton>
              <AppButton
                variant="primary"
                iconLeft={<SaveOutlined fontSize="small" />}
                onClick={accept}
              >
                Add to Factors
              </AppButton>
            </div>
          </div>
        )}
      </SettingsCard>
    </div>
  )
}


function TagsTab({ ent }: { ent: EntityListItem }) {
  const tags = ent.tags || []

  return (
    <SettingsCard
      icon={<LocalOfferOutlined />}
      title="Entity Tags"
      description={`Tags assigned to ${ent.name}.`}
    >
      <div className="settings-alert settings-alert--warning">
        <span className="settings-alert__icon" aria-hidden>
          <LockOutlined fontSize="small" />
        </span>
        <p className="settings-alert__text">
          Tags are managed by your <strong>Admin</strong> in the Admin Console &gt; Entities.
        </p>
      </div>

      <div className="flux-settings-subcard">
        <div className="flux-settings-subcard__label">Tags on {ent.name}</div>
        {tags.length === 0 ? (
          <p className="settings-alert__text">No tags assigned.</p>
        ) : (
          <div className="flux-settings-tags">
            {tags.map((t) => (
              <AppBadge key={t} variant="neutral">{t}</AppBadge>
            ))}
          </div>
        )}
      </div>
    </SettingsCard>
  )
}


function SettingsAvatar({
  u,
  sm,
}: {
  u: { initials: string; color?: string; name: string }
  sm?: boolean
}) {
  const avatarStyle = u.color
    ? ({ '--avatar-bg': u.color } as CSSProperties)
    : undefined

  return (
    <span
      title={u.name}
      className={[
        'settings-avatar',
        sm ? 'settings-avatar--sm' : 'settings-avatar--md',
        u.color ? '' : 'settings-avatar--default',
      ].filter(Boolean).join(' ')}
      style={avatarStyle}
    >
      {u.initials}
    </span>
  )
}

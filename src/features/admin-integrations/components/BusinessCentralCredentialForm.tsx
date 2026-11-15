// @author  veera
// @file    features/admin-integrations/components/BusinessCentralCredentialForm.tsx
//
// Business Central Credential Setup card.
//
// Renders inside the existing Admin Integrations API panel (only when the
// selected ERP is Business Central). Keeps the surrounding admin UI/design
// untouched and never displays a saved client secret in plaintext.
//
// Strict rules:
//   - tenant_id, client_id and client_secret are write-only on update — once
//     stored they are never echoed back; the form shows a masked tail only.
//   - Show/Hide on the Client Secret field affects the EDITABLE input only
//     (not the saved masked value).
//   - Status pill mirrors backend lifecycle: not_configured / saved / testing
//     / verified / failed / syncing / synced.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import {
  BC_DEFAULT_BASE_URL,
  BC_DEFAULT_SCOPE,
  deleteBcCredentials,
  fetchBcCompanies,
  getBcCredentials,
  getBcReadiness,
  listBcCompanies,
  saveBcCredentials,
  setBcCompany,
  syncBcCustomers,
  syncBcDimensions,
  syncBcGlAccounts,
  syncBcGlEntries,
  syncBcVendors,
  testBcConnection,
  type BcCredentialUpsert,
} from '@/features/admin-integrations/businessCentralApi'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import { AppBadge, AppButton, FormSelect, FormTextField, SettingsCard } from '@/components/ui'
import type { AppBadgeVariant } from '@/components/ui/AppBadge'
import type {
  BcCompanyOut,
  BcCredentialOut,
  BcCredentialStatus,
  BcReadinessOut,
} from '@/types/models'

type FormState = {
  tenantId: string
  clientId: string
  clientSecret: string
  environmentName: string
  scope: string
  baseUrl: string
}

const EMPTY_FORM: FormState = {
  tenantId: '',
  clientId: '',
  clientSecret: '',
  environmentName: 'Production',
  scope: BC_DEFAULT_SCOPE,
  baseUrl: BC_DEFAULT_BASE_URL,
}

const STATUS_TONE: Record<BcCredentialStatus, { variant: AppBadgeVariant; label: string }> = {
  not_configured: { variant: 'neutral', label: 'Not Configured' },
  saved:          { variant: 'warning', label: 'Saved' },
  testing:        { variant: 'info', label: 'Testing' },
  verified:       { variant: 'success', label: 'Verified' },
  failed:         { variant: 'danger', label: 'Failed' },
  syncing:        { variant: 'info', label: 'Syncing' },
  synced:         { variant: 'success', label: 'Synced' },
}

const GUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
const INVALID_CONFIG_CODE = 'INVALID_CONFIG'

function isGuid(v: string): boolean {
  return GUID_RE.test(v.trim())
}

/** Saved row exists but the server can't read it back (encryption key
 *  rotated, ciphertext corrupt). UI must force a full re-entry / reset. */
function isInvalidConfig(cred: BcCredentialOut | null): boolean {
  return !!cred
    && cred.status === 'failed'
    && cred.last_safe_error_code === INVALID_CONFIG_CODE
}

function effectiveStatus(cred: BcCredentialOut | null): {
  status: BcCredentialStatus; label: string
} {
  const status: BcCredentialStatus = cred?.status ?? 'not_configured'
  const label = isInvalidConfig(cred)
    ? 'Invalid Config — Re-enter'
    : STATUS_TONE[status].label
  return { status, label }
}

function statusPill(cred: BcCredentialOut | null) {
  const { status, label } = effectiveStatus(cred)
  const tone = STATUS_TONE[status]
  return <AppBadge variant={tone.variant}>{label}</AppBadge>
}

export function BusinessCentralCredentialForm({ entityId }: { entityId: string }) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useUiStore()

  const credQuery = useQuery({
    queryKey: ['bc-credentials', entityId],
    queryFn: () => getBcCredentials(entityId),
  })
  const companiesQuery = useQuery({
    queryKey: ['bc-companies', entityId],
    queryFn: () => listBcCompanies(entityId),
    enabled: !!credQuery.data,
  })
  const readinessQuery = useQuery({
    queryKey: ['bc-readiness', entityId],
    queryFn: () => getBcReadiness(entityId),
    enabled: !!credQuery.data,
  })

  const cred: BcCredentialOut | null = credQuery.data ?? null
  const invalidConfig = isInvalidConfig(cred)
  // The form treats both "first save" and "row is unreadable" as "all fields
  // required" because the backend will refuse a partial update in either case.
  const isCreate = !cred || invalidConfig

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showSecret, setShowSecret] = useState(false)
  const [companyId, setCompanyId] = useState<string>('')

  // When the saved credential loads, mirror its public fields into the form.
  // Tenant/client/secret stay blank — admin must re-type to change them.
  useEffect(() => {
    if (!cred) return
    setForm((prev) => ({
      ...prev,
      tenantId: '',
      clientId: '',
      clientSecret: '',
      environmentName: cred.environment_name || prev.environmentName,
      scope: cred.scope || prev.scope,
      baseUrl: cred.base_url || prev.baseUrl,
    }))
    setCompanyId(cred.company_id || '')
  }, [cred])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['bc-credentials', entityId] })
    void qc.invalidateQueries({ queryKey: ['bc-companies', entityId] })
    void qc.invalidateQueries({ queryKey: ['bc-readiness', entityId] })
    // Anything keyed by entities-ready / api-complete must refresh too —
    // a successful sync can flip ontology unlock state for this entity.
    void qc.invalidateQueries({ queryKey: ['ontology-entities-ready'] })
    void qc.invalidateQueries({ queryKey: ['api-complete', entityId] })
  }

  const invalidateSubledger = () => {
    invalidate()
    void qc.invalidateQueries({ queryKey: ['subledger-options', entityId] })
  }

  const saveMut = useMutation({
    mutationFn: (body: BcCredentialUpsert) => saveBcCredentials(body),
    onSuccess: () => { toast('Business Central credentials saved'); invalidate() },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Save failed')),
  })

  const testMut = useMutation({
    mutationFn: () => testBcConnection(entityId),
    onSuccess: (resp) => {
      if (resp.ok) toast(`Connection verified · ${resp.companies.length} companies`)
      else toast(resp.safe_error_message || 'Connection failed')
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Test failed')),
  })

  const fetchMut = useMutation({
    mutationFn: () => fetchBcCompanies(entityId),
    onSuccess: (resp) => {
      if (resp.ok) toast(`Fetched ${resp.companies.length} companies`)
      else toast(resp.safe_error_message || 'Fetch failed')
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Fetch failed')),
  })

  const setCompanyMut = useMutation({
    mutationFn: (c: BcCompanyOut) => setBcCompany(entityId, c.company_id, c.company_name),
    onSuccess: () => { toast('Active company set'); invalidate() },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Could not set company')),
  })

  const deleteMut = useMutation({
    mutationFn: () => deleteBcCredentials(entityId),
    onSuccess: () => {
      toast('Stored credentials cleared. Re-enter to continue.')
      setForm(EMPTY_FORM)
      setCompanyId('')
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Could not reset credentials')),
  })

  const syncAccountsMut = useMutation({
    mutationFn: () => syncBcGlAccounts(entityId, companyId || undefined),
    onSuccess: (resp) => {
      if (resp.ok) toast(`Synced ${resp.records_processed ?? 0} GL accounts`)
      else toast(resp.safe_error_message || 'GL accounts sync failed')
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'GL accounts sync failed')),
  })

  const syncDimensionsMut = useMutation({
    mutationFn: () => syncBcDimensions(entityId, companyId || undefined),
    onSuccess: (resp) => {
      if (resp.ok) toast(`Synced ${resp.records_processed ?? 0} dimension values`)
      else toast(resp.safe_error_message || 'Dimensions sync failed')
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Dimensions sync failed')),
  })

  const syncEntriesMut = useMutation({
    mutationFn: () => syncBcGlEntries(entityId, companyId || undefined),
    onSuccess: (resp) => {
      if (resp.ok) toast(`Synced ${resp.records_processed ?? 0} GL entries`)
      else toast(resp.safe_error_message || 'GL entries sync failed')
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'GL entries sync failed')),
  })

  const syncCustomersMut = useMutation({
    mutationFn: () => syncBcCustomers(entityId, companyId || undefined),
    onSuccess: (resp) => {
      if (resp.ok) toast(`Synced ${resp.records_processed ?? 0} customers`)
      else toast(resp.safe_error_message || 'Customer sync failed')
      invalidateSubledger()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Customer sync failed')),
  })

  const syncVendorsMut = useMutation({
    mutationFn: () => syncBcVendors(entityId, companyId || undefined),
    onSuccess: (resp) => {
      if (resp.ok) toast(`Synced ${resp.records_processed ?? 0} vendors`)
      else toast(resp.safe_error_message || 'Vendor sync failed')
      invalidateSubledger()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Vendor sync failed')),
  })

  const validation = useMemo(() => validateForm(form, isCreate), [form, isCreate])
  const busy =
    saveMut.isPending || testMut.isPending || fetchMut.isPending ||
    syncAccountsMut.isPending || syncDimensionsMut.isPending ||
    syncEntriesMut.isPending ||
    syncCustomersMut.isPending || syncVendorsMut.isPending ||
    setCompanyMut.isPending || deleteMut.isPending
  // Test / Fetch / Sync only make sense when the saved row is readable.
  // While invalid_config we expose Save (fresh values) and Reset only.
  const canConnect = !!cred && !invalidConfig
  const readiness = readinessQuery.data ?? null

  if (credQuery.isLoading) {
    return (
      <SettingsCard className="integrations-page__credential-card">
        <div className="integrations-page__empty">Loading Business Central credentials…</div>
      </SettingsCard>
    )
  }

  if (credQuery.isError) {
    return (
      <SettingsCard className="integrations-page__credential-card">
        <p className="integrations-page__alert integrations-page__alert--danger">
          {getApiErrorMessage(credQuery.error, 'Could not load Business Central credentials.')}
        </p>
        <AppButton variant="secondary" size="sm" onClick={() => void credQuery.refetch()}>Retry</AppButton>
      </SettingsCard>
    )
  }

  const onSave = () => {
    const body: BcCredentialUpsert = { entity_id: entityId }
    if (form.tenantId)        body.tenant_id        = form.tenantId.trim()
    if (form.clientId)        body.client_id        = form.clientId.trim()
    if (form.clientSecret)    body.client_secret    = form.clientSecret
    if (form.environmentName) body.environment_name = form.environmentName.trim()
    if (form.scope)           body.scope            = form.scope.trim()
    if (form.baseUrl)         body.base_url         = form.baseUrl.trim()
    saveMut.mutate(body)
  }

  const companies = companiesQuery.data ?? []

  return (
    <SettingsCard
      className="integrations-page__credential-card"
      title="Business Central — Credential Setup"
      description="OAuth 2.0 client_credentials. Secrets are encrypted at rest; only a masked tail is returned."
    >
      <div className="integrations-page__credential-header">
        <div />
        {statusPill(cred)}
      </div>

      {invalidConfig && (
        <div className="integrations-page__alert integrations-page__alert--danger">
          <div>
            Stored credentials cannot be decrypted. Re-enter all fields below and Save, or click Reset to clear them.
          </div>
          <AppButton variant="secondary" size="sm" onClick={() => deleteMut.mutate()} disabled={busy} loading={deleteMut.isPending}>
            Reset Credentials
          </AppButton>
        </div>
      )}

      {cred?.last_safe_error_message && cred.status === 'failed' && !invalidConfig && (
        <div className="integrations-page__alert integrations-page__alert--danger">
          {cred.last_safe_error_code ? `[${cred.last_safe_error_code}] ` : ''}
          {cred.last_safe_error_message}
        </div>
      )}

      <div className="integrations-page__form-grid">
        <FormTextField
          id="bc-tenant-id"
          fieldLabel="Tenant ID"
          placeholder={isCreate ? '00000000-0000-0000-0000-000000000000' : '(stored — re-enter to change)'}
          value={form.tenantId}
          onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
          disabled={busy}
          helperText={isCreate ? 'GUID — required' : 'Leave blank to keep saved value'}
          error={!!form.tenantId && !!guidError(form.tenantId, 'Tenant ID')}
        />
        <FormTextField
          id="bc-environment"
          fieldLabel="Environment Name"
          placeholder="Production"
          value={form.environmentName}
          onChange={(e) => setForm({ ...form, environmentName: e.target.value })}
          disabled={busy}
          helperText="Production / Sandbox / custom"
          error={isCreate && !form.environmentName}
        />
        <FormTextField
          id="bc-client-id"
          fieldLabel="Client ID"
          placeholder={cred?.masked_client_id ? cred.masked_client_id : '00000000-0000-0000-0000-000000000000'}
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          disabled={busy}
          helperText={isCreate ? 'GUID — required' : 'Leave blank to keep saved value'}
          error={!!form.clientId && !!guidError(form.clientId, 'Client ID')}
        />
        <div>
          <FormTextField
            id="bc-client-secret"
            fieldLabel="Client Secret"
            type={showSecret ? 'text' : 'password'}
            placeholder={cred?.masked_client_secret || 'Paste client secret'}
            value={form.clientSecret}
            onChange={(e) => setForm({ ...form, clientSecret: e.target.value })}
            disabled={busy}
            autoComplete="new-password"
            helperText={
              cred?.masked_client_secret
                ? `Saved value: ${cred.masked_client_secret} — leave blank to keep`
                : 'Required on first save'
            }
            error={isCreate && !form.clientSecret}
          />
          <AppButton
            variant="ghost"
            size="sm"
            onClick={() => setShowSecret((v) => !v)}
            aria-label={showSecret ? 'Hide client secret' : 'Show client secret'}
            disabled={busy}
            style={{ marginTop: 4 }}
          >
            {showSecret ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
          </AppButton>
        </div>
        <FormTextField
          id="bc-scope"
          fieldLabel="Scope"
          placeholder={BC_DEFAULT_SCOPE}
          value={form.scope}
          onChange={(e) => setForm({ ...form, scope: e.target.value })}
          disabled={busy}
          helperText="OAuth resource scope"
        />
        <FormTextField
          id="bc-base-url"
          fieldLabel="Base URL"
          placeholder={BC_DEFAULT_BASE_URL}
          value={form.baseUrl}
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          disabled={busy}
          helperText="Business Central API root"
        />
      </div>

      {validation.firstError && (
        <div className="integrations-page__alert integrations-page__alert--warning">{validation.firstError}</div>
      )}

      <div className="integrations-page__form-actions">
        <AppButton variant="primary" onClick={onSave} disabled={busy || !validation.canSave} loading={saveMut.isPending}>
          {isCreate ? 'Save Credentials' : 'Update Credentials'}
        </AppButton>
        <AppButton
          variant="secondary"
          onClick={() => testMut.mutate()}
          disabled={busy || !canConnect}
          loading={testMut.isPending}
          title={connectButtonTitle(canConnect, invalidConfig, 'Calls /companies')}
        >
          Test Connection
        </AppButton>
        <AppButton
          variant="secondary"
          onClick={() => fetchMut.mutate()}
          disabled={busy || !canConnect}
          loading={fetchMut.isPending}
          title={connectButtonTitle(canConnect, invalidConfig)}
        >
          Fetch Companies
        </AppButton>
        {cred && !invalidConfig && (
          <AppButton variant="ghost" onClick={() => deleteMut.mutate()} disabled={busy} loading={deleteMut.isPending}>
            Reset Credentials
          </AppButton>
        )}
      </div>

      <div className="integrations-page__company-row">
        <FormSelect
          id="bc-active-company"
          fieldLabel="Active Company"
          value={companyId}
          onChange={(e) => setCompanyId(String(e.target.value))}
          disabled={busy || companies.length === 0}
          placeholder="— Select company —"
          options={companies.map((c) => ({
            value: c.company_id,
            label: `${c.company_name} · ${c.company_id}`,
          }))}
        />
        <AppButton
          variant="secondary"
          size="sm"
          disabled={busy || !companyId}
          loading={setCompanyMut.isPending}
          onClick={() => {
            const c = companies.find((x) => x.company_id === companyId)
            if (c) setCompanyMut.mutate(c)
          }}
        >
          Set as Active
        </AppButton>
      </div>
      {companies.length === 0 && (
        <p className="integrations-page__sync-helper">Run Test Connection or Fetch Companies first.</p>
      )}

      <SyncLayerCards
        canSync={canConnect && !!companyId}
        disabledReason={syncDisabledReason(canConnect, invalidConfig, companyId)}
        readiness={readiness}
        onSyncGl={() => syncAccountsMut.mutate()}
        onSyncTxn={() => syncEntriesMut.mutate()}
        onSyncCustomers={() => syncCustomersMut.mutate()}
        onSyncVendors={() => syncVendorsMut.mutate()}
        glPending={syncAccountsMut.isPending}
        txnPending={syncEntriesMut.isPending}
        customersPending={syncCustomersMut.isPending}
        vendorsPending={syncVendorsMut.isPending}
        anyBusy={busy}
      />

      {readiness?.api_complete && (
        <div className="integrations-page__unlock-banner">
          <div>
            <h4 className="integrations-page__unlock-title">Required layers ready · Ontology Mapping unlocked</h4>
            <p className="integrations-page__unlock-desc">
              Map T-Flux captions to BC GL accounts. Customer/Vendor master is optional.
            </p>
          </div>
          <AppButton
            variant="primary"
            iconRight={<ArrowRight size={14} strokeWidth={2} />}
            onClick={() => navigate('/admin/ontology')}
          >
            Open Ontology Mapping
          </AppButton>
        </div>
      )}

      {cred && (
        <div className="integrations-page__meta-block">
          <div>credential_id: {cred.credential_id}</div>
          <div>masked_client_id: {cred.masked_client_id ?? '—'}</div>
          <div>masked_client_secret: {cred.masked_client_secret ?? '—'}</div>
          <div>last_tested_at: {cred.last_tested_at ? new Date(cred.last_tested_at).toLocaleString() : '—'}</div>
          <div>last_verified_at: {cred.last_verified_at ? new Date(cred.last_verified_at).toLocaleString() : '—'}</div>
        </div>
      )}
    </SettingsCard>
  )
}


// ──────────────────────────────────────────────────────────────────────
// Per-layer sync cards.  Each card describes one Business Central layer,
// owns its own Sync button, and reflects status / record count / last
// synced time from the readiness payload.
// ──────────────────────────────────────────────────────────────────────
type LayerCardConfig = {
  key: 'gl' | 'transaction' | 'customers' | 'vendors'
  label: string
  description: string
  buttonLabel: string
  ready: boolean
  optionalUnavailable?: boolean
  optionalMessage?: string | null
  count?: number | null
  syncedAt?: string | null
  pending: boolean
  onSync: () => void
}

function SyncLayerCards({
  canSync, disabledReason, readiness, anyBusy,
  onSyncGl, onSyncTxn, onSyncCustomers, onSyncVendors,
  glPending, txnPending, customersPending, vendorsPending,
}: {
  canSync: boolean
  disabledReason: string
  readiness: BcReadinessOut | null
  anyBusy: boolean
  onSyncGl: () => void
  onSyncTxn: () => void
  onSyncCustomers: () => void
  onSyncVendors: () => void
  glPending: boolean
  txnPending: boolean
  customersPending: boolean
  vendorsPending: boolean
}) {
  const r = readiness
  const cards: LayerCardConfig[] = [
    {
      key: 'gl', label: 'GL Accounts',
      description: 'Required — chart of accounts for ontology GL mapping.',
      buttonLabel: 'Sync GL Accounts',
      ready: !!r?.gl_ready, count: r?.gl_account_count,
      syncedAt: r?.gl_last_synced_at, pending: glPending, onSync: onSyncGl,
    },
    {
      key: 'transaction', label: 'General Ledger Entries',
      description: 'Required — posted GL entries for Flux generation.',
      buttonLabel: 'Sync General Ledger Entries',
      ready: !!r?.transaction_ready, count: r?.general_ledger_entry_count,
      syncedAt: r?.entries_last_synced_at, pending: txnPending, onSync: onSyncTxn,
    },
    {
      key: 'customers', label: 'Customers',
      description: 'Optional — customer master for ontology Customer/Vendor mapping.',
      buttonLabel: 'Sync Customers',
      ready: !!r?.customers_ready,
      count: r?.customers_count,
      syncedAt: r?.customers_last_synced_at, pending: customersPending,
      onSync: onSyncCustomers,
    },
    {
      key: 'vendors', label: 'Vendors',
      description: 'Optional — vendor master for ontology Customer/Vendor mapping.',
      buttonLabel: 'Sync Vendors',
      ready: !!r?.vendors_ready,
      count: r?.vendors_count,
      syncedAt: r?.vendors_last_synced_at, pending: vendorsPending,
      onSync: onSyncVendors,
    },
  ]
  const apiComplete = !!r?.api_complete
  const reqCount = r?.required_ready_count ?? r?.ready_count ?? 0
  const reqTotal = r?.required_ready_total ?? 2

  return (
    <div className="integrations-page__sync-section">
      <div className="integrations-page__sync-header">
        <h4 className="integrations-page__sync-title">Sync layers</h4>
        <AppBadge variant={apiComplete ? 'success' : 'warning'}>
          {apiComplete ? 'API Ready' : `Required ${reqCount}/${reqTotal}`}
        </AppBadge>
      </div>
      <p className="integrations-page__sync-helper">
        GL Accounts and General Ledger Entries are required for Ontology Mapping.
        Customers and Vendors (master) are optional enrichment for sub-ledger mapping.
      </p>
      <p className="integrations-page__sync-helper">
        Customer/Vendor ledger entries are not exposed in this Business Central API.
        Custom API pages are required for ledger-level details.
      </p>
      {(r?.optional_warnings?.length ?? 0) > 0 && (
        <div className="integrations-page__alert integrations-page__alert--warning">
          {r!.optional_warnings!.join(' ')}
        </div>
      )}

      <div className="integrations-page__sync-grid">
        {cards.map((c) => (
          <SyncLayerCard
            key={c.key}
            cfg={c}
            canSync={canSync}
            anyBusy={anyBusy}
            disabledReason={disabledReason}
          />
        ))}
      </div>

      {!canSync && (
        <div className="integrations-page__alert integrations-page__alert--warning">{disabledReason}</div>
      )}
    </div>
  )
}


function SyncLayerCard({ cfg, canSync, anyBusy, disabledReason }: {
  cfg: LayerCardConfig; canSync: boolean; anyBusy: boolean; disabledReason: string
}) {
  const disabled = anyBusy || !canSync
  const isRequired = cfg.key === 'gl' || cfg.key === 'transaction'
  const statusLabel = cfg.pending
    ? 'Syncing'
    : (cfg.ready
      ? 'Synced'
      : (cfg.optionalUnavailable ? 'Not Available' : 'Not synced'))
  const badgeVariant: AppBadgeVariant = cfg.ready
    ? 'success'
    : (cfg.optionalUnavailable ? 'warning' : 'neutral')
  const cardClass = [
    'integrations-page__sync-card',
    cfg.ready ? 'integrations-page__sync-card--ready' : '',
    cfg.optionalUnavailable ? 'integrations-page__sync-card--optional' : '',
  ].filter(Boolean).join(' ')

  return (
    <article className={cardClass}>
      <div className="integrations-page__sync-card-head">
        <div>
          <div className="integrations-page__sync-card-tag">{isRequired ? 'Required' : 'Optional'}</div>
          <div className="integrations-page__sync-card-title">{cfg.label}</div>
        </div>
        <AppBadge variant={badgeVariant}>{statusLabel}</AppBadge>
      </div>
      <p className="integrations-page__sync-card-desc">{cfg.description}</p>
      {cfg.optionalUnavailable && cfg.optionalMessage && (
        <p className="integrations-page__sync-card-msg">{cfg.optionalMessage}</p>
      )}
      <div className="integrations-page__sync-card-count">
        {cfg.ready ? `${cfg.count ?? 0} records` : '—'}
      </div>
      <div className="integrations-page__sync-card-time">
        {cfg.syncedAt ? `Last synced: ${new Date(cfg.syncedAt).toLocaleString()}` : ''}
      </div>
      <AppButton
        variant="primary"
        size="sm"
        onClick={cfg.onSync}
        disabled={disabled}
        loading={cfg.pending}
        title={!canSync ? disabledReason : ''}
      >
        {cfg.buttonLabel}
      </AppButton>
    </article>
  )
}


function validateForm(form: FormState, isCreate: boolean): { canSave: boolean; firstError: string | null } {
  const errors: string[] = []
  if (form.tenantId && !isGuid(form.tenantId)) errors.push('Tenant ID must be a GUID.')
  if (form.clientId && !isGuid(form.clientId)) errors.push('Client ID must be a GUID.')
  if (isCreate) {
    if (!form.tenantId)        errors.push('Tenant ID is required.')
    if (!form.clientId)        errors.push('Client ID is required.')
    if (!form.clientSecret)    errors.push('Client Secret is required on first save.')
    if (!form.environmentName) errors.push('Environment Name is required.')
    if (!form.scope)           errors.push('Scope is required.')
    if (!form.baseUrl)         errors.push('Base URL is required.')
  }
  return { canSave: errors.length === 0, firstError: errors[0] ?? null }
}

function guidError(v: string, label: string): string | null {
  return isGuid(v) ? null : `${label} must be a GUID.`
}

function connectButtonTitle(
  canConnect: boolean, invalid: boolean, fallback?: string,
): string {
  if (invalid) return 'Re-enter and save credentials first.'
  if (!canConnect) return 'Save credentials first.'
  return fallback ?? ''
}

function syncDisabledReason(
  canConnect: boolean, invalid: boolean, companyId: string,
): string {
  if (invalid) return 'Re-enter and save Business Central credentials first.'
  if (!canConnect) return 'Save and verify Business Central credentials first.'
  if (!companyId) return 'Select an active Business Central company first.'
  return ''
}

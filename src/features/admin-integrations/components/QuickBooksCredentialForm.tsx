// @author  veera
// @file    features/admin-integrations/components/QuickBooksCredentialForm.tsx
//
// QuickBooks Online setup card — app credentials from Integrations tab + OAuth 2.0.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowRight, Eye, EyeOff } from 'lucide-react'
import {
  QB_DEFAULT_API_BASE_PRODUCTION,
  QB_DEFAULT_API_BASE_SANDBOX,
  QB_DEFAULT_AUTH_URL,
  QB_DEFAULT_REDIRECT_URI,
  QB_DEFAULT_SCOPE,
  QB_DEFAULT_TOKEN_URL,
  disconnectQb,
  getQbCredentials,
  getQbReadiness,
  getQbStatus,
  saveQbCredentials,
  startQbConnect,
  syncQbAccounts,
  syncQbCustomers,
  syncQbGeneralLedger,
  syncQbVendors,
  testQbConnection,
  type QbCredentialOut,
  type QbCredentialUpsert,
} from '@/features/admin-integrations/quickBooksApi'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import { AppBadge, AppButton, FormSelect, FormTextField, SettingsCard } from '@/components/ui'
import type { AppBadgeVariant } from '@/components/ui/AppBadge'

type FormState = {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
  scopes: string
  authUrl: string
  tokenUrl: string
  apiBaseSandbox: string
  apiBaseProduction: string
}

const EMPTY_FORM: FormState = {
  clientId: '',
  clientSecret: '',
  redirectUri: QB_DEFAULT_REDIRECT_URI,
  environment: 'sandbox',
  scopes: QB_DEFAULT_SCOPE,
  authUrl: QB_DEFAULT_AUTH_URL,
  tokenUrl: QB_DEFAULT_TOKEN_URL,
  apiBaseSandbox: QB_DEFAULT_API_BASE_SANDBOX,
  apiBaseProduction: QB_DEFAULT_API_BASE_PRODUCTION,
}

const CONNECTION_TONE: Record<string, { variant: AppBadgeVariant; label: string }> = {
  not_configured: { variant: 'neutral', label: 'Not Configured' },
  saved:          { variant: 'warning', label: 'Saved' },
  connected:      { variant: 'success', label: 'Connected' },
  token_expired:  { variant: 'danger', label: 'Token Expired' },
  error:          { variant: 'danger', label: 'Error' },
  connecting:     { variant: 'info', label: 'Connecting' },
}

function SyncCard({
  title, description, ready, count, syncedAt, onSync, syncing, disabled, required = false,
}: {
  title: string
  description?: string
  ready?: boolean
  count?: number | null
  syncedAt?: string | null
  onSync: () => void
  syncing: boolean
  disabled?: boolean
  required?: boolean
}) {
  return (
    <article className={`integrations-page__sync-card${ready ? ' integrations-page__sync-card--ready' : ''}`}>
      <div className="integrations-page__sync-card-head">
        <div>
          <div className="integrations-page__sync-card-tag">{required ? 'Required' : 'Optional'}</div>
          <div className="integrations-page__sync-card-title">{title}</div>
        </div>
        <AppBadge variant={ready ? 'success' : 'neutral'}>{ready ? 'Synced' : 'Not synced'}</AppBadge>
      </div>
      {description ? <p className="integrations-page__sync-card-desc">{description}</p> : null}
      <div className="integrations-page__sync-card-count">
        {ready ? `${count ?? 0} records` : '—'}
      </div>
      <div className="integrations-page__sync-card-time">
        {syncedAt ? `Last synced: ${new Date(syncedAt).toLocaleString()}` : ''}
      </div>
      <AppButton variant="primary" size="sm" disabled={disabled || syncing} loading={syncing} onClick={onSync}>
        Sync
      </AppButton>
    </article>
  )
}

export function QuickBooksCredentialForm({
  entityId,
  periodFrom,
  periodTo,
}: {
  entityId: string
  periodFrom?: string
  periodTo?: string
}) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { toast } = useUiStore()

  const credQuery = useQuery({
    queryKey: ['qb-credentials', entityId],
    queryFn: () => getQbCredentials(entityId),
  })
  const statusQ = useQuery({
    queryKey: ['qb-status', entityId],
    queryFn: () => getQbStatus(entityId),
  })
  const readinessQ = useQuery({
    queryKey: ['qb-readiness', entityId],
    queryFn: () => getQbReadiness(entityId),
    enabled: !!statusQ.data?.connected,
  })

  const cred: QbCredentialOut | null = credQuery.data ?? null
  const status = statusQ.data
  const readiness = readinessQ.data
  const isCreate = !cred?.credential_id
  const connectionKey = cred?.connection_status ?? status?.connection_status ?? 'not_configured'
  const tone = CONNECTION_TONE[connectionKey] ?? CONNECTION_TONE.not_configured

  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    if (!cred?.credential_id) return
    setForm((prev) => ({
      ...prev,
      clientId: '',
      clientSecret: '',
      redirectUri: cred.redirect_uri || prev.redirectUri,
      environment: (cred.environment === 'production' ? 'production' : 'sandbox'),
      scopes: cred.scopes || prev.scopes,
      authUrl: cred.auth_url || prev.authUrl,
      tokenUrl: cred.token_url || prev.tokenUrl,
      apiBaseSandbox: cred.api_base_sandbox || prev.apiBaseSandbox,
      apiBaseProduction: cred.api_base_production || prev.apiBaseProduction,
    }))
  }, [cred])

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['qb-credentials', entityId] })
    void qc.invalidateQueries({ queryKey: ['qb-status', entityId] })
    void qc.invalidateQueries({ queryKey: ['qb-readiness', entityId] })
    void qc.invalidateQueries({ queryKey: ['ontology-entities-ready'] })
    void qc.invalidateQueries({ queryKey: ['api-complete', entityId] })
    void qc.invalidateQueries({ queryKey: ['subledger-options', entityId] })
  }

  const saveMut = useMutation({
    mutationFn: (body: QbCredentialUpsert) => saveQbCredentials(body),
    onSuccess: () => { toast('QuickBooks credentials saved'); invalidate() },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Save failed')),
  })

  const connectMut = useMutation({
    mutationFn: () => startQbConnect(entityId),
    onSuccess: (data) => { window.location.href = data.authorization_url },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Connect failed')),
  })

  const testMut = useMutation({
    mutationFn: () => testQbConnection(entityId),
    onSuccess: (r) => {
      toast(r.ok ? `Connected · ${r.company_name ?? r.realm_id ?? 'OK'}` : (r.safe_error_message ?? 'Test failed'))
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Test failed')),
  })

  const disconnectMut = useMutation({
    mutationFn: () => disconnectQb(entityId),
    onSuccess: () => { toast('QuickBooks disconnected'); invalidate() },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Disconnect failed')),
  })

  const syncAccountsMut = useMutation({
    mutationFn: () => syncQbAccounts(entityId),
    onSuccess: (r) => {
      toast(r.ok ? `Accounts synced · ${r.records_processed ?? 0} rows` : (r.safe_error_message ?? 'Sync failed'))
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Accounts sync failed')),
  })

  const syncGlMut = useMutation({
    mutationFn: () => syncQbGeneralLedger(entityId, periodFrom, periodTo),
    onSuccess: (r) => {
      if (!r.ok) {
        toast(r.safe_error_message ?? 'GL sync failed')
      } else if ((r.records_processed ?? 0) === 0 && r.safe_error_message) {
        toast(r.safe_error_message)
      } else {
        toast(`GL synced · ${r.records_processed ?? 0} rows`)
      }
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'GL sync failed')),
  })

  const syncCustMut = useMutation({
    mutationFn: () => syncQbCustomers(entityId),
    onSuccess: (r) => {
      toast(r.ok ? `Customers synced · ${r.records_processed ?? 0}` : (r.safe_error_message ?? 'Sync failed'))
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Customers sync failed')),
  })

  const syncVendMut = useMutation({
    mutationFn: () => syncQbVendors(entityId),
    onSuccess: (r) => {
      toast(r.ok ? `Vendors synced · ${r.records_processed ?? 0}` : (r.safe_error_message ?? 'Sync failed'))
      invalidate()
    },
    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Vendors sync failed')),
  })

  const credentialsSaved = !!status?.credentials_saved || !!cred?.credential_id
  const connected = !!status?.connected
  const apiReady = !!readiness?.api_complete

  const handleSave = () => {
    const body: QbCredentialUpsert = {
      entity_id: entityId,
      redirect_uri: form.redirectUri.trim(),
      environment: form.environment,
      scopes: form.scopes.trim(),
      auth_url: form.authUrl.trim(),
      token_url: form.tokenUrl.trim(),
      api_base_sandbox: form.apiBaseSandbox.trim(),
      api_base_production: form.apiBaseProduction.trim(),
    }
    if (form.clientId.trim()) body.client_id = form.clientId.trim()
    if (form.clientSecret.trim()) body.client_secret = form.clientSecret.trim()

    if (isCreate) {
      if (!body.client_id || !body.client_secret) {
        toast('Client ID and Client Secret are required on first save')
        return
      }
      if (!body.redirect_uri || !body.auth_url || !body.token_url) {
        toast('Redirect URI, Auth URL, and Token URL are required')
        return
      }
      if (form.environment === 'sandbox' && !body.api_base_sandbox) {
        toast('Sandbox API Base URL is required')
        return
      }
      if (form.environment === 'production' && !body.api_base_production) {
        toast('Production API Base URL is required')
        return
      }
    } else if (!body.client_id && !body.client_secret) {
      // partial update of non-secret fields only
    }

    saveMut.mutate(body)
  }

  const set = (key: keyof FormState, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  return (
    <SettingsCard
      className="integrations-page__credential-card integrations-page__qb-accent"
      title="QuickBooks Online — Credential Setup"
      description="QuickBooks uses OAuth 2.0. Do not enter QuickBooks username/password here."
    >
      <div className="integrations-page__credential-header">
        <div />
        <AppBadge variant={tone.variant}>{tone.label}</AppBadge>
      </div>

      {(cred?.last_safe_error_message || status?.last_safe_error_message) && (
        <div className="integrations-page__alert integrations-page__alert--danger">
          {cred?.last_safe_error_message || status?.last_safe_error_message}
        </div>
      )}

      <div className="integrations-page__form-grid integrations-page__form-grid--wide">
        <FormTextField
          id="qb-client-id"
          fieldLabel="Client ID"
          value={form.clientId}
          onChange={(e) => set('clientId', e.target.value)}
          placeholder={cred?.masked_client_id ? `Saved ${cred.masked_client_id}` : 'Intuit app Client ID'}
        />
        <div>
          <FormTextField
            id="qb-client-secret"
            fieldLabel="Client Secret"
            type={showSecret ? 'text' : 'password'}
            value={form.clientSecret}
            onChange={(e) => set('clientSecret', e.target.value)}
            placeholder={
              cred?.client_secret_last4
                ? `Saved ·•••${cred.client_secret_last4}`
                : 'Intuit app Client Secret'
            }
          />
          <AppButton variant="ghost" size="sm" onClick={() => setShowSecret((v) => !v)} style={{ marginTop: 4 }}>
            {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
          </AppButton>
        </div>
        <FormTextField
          id="qb-redirect-uri"
          fieldLabel="Redirect URI"
          value={form.redirectUri}
          onChange={(e) => set('redirectUri', e.target.value)}
        />
        <FormSelect
          id="qb-environment"
          fieldLabel="Environment"
          value={form.environment}
          onChange={(e) => set('environment', e.target.value as 'sandbox' | 'production')}
          options={[
            { value: 'sandbox', label: 'sandbox' },
            { value: 'production', label: 'production' },
          ]}
        />
        <FormTextField
          id="qb-scopes"
          fieldLabel="Scopes"
          value={form.scopes}
          onChange={(e) => set('scopes', e.target.value)}
          sx={{ gridColumn: '1 / -1' }}
        />
        <FormTextField
          id="qb-auth-url"
          fieldLabel="Auth URL"
          value={form.authUrl}
          onChange={(e) => set('authUrl', e.target.value)}
        />
        <FormTextField
          id="qb-token-url"
          fieldLabel="Token URL"
          value={form.tokenUrl}
          onChange={(e) => set('tokenUrl', e.target.value)}
        />
        <FormTextField
          id="qb-api-sandbox"
          fieldLabel="Sandbox API Base URL"
          value={form.apiBaseSandbox}
          onChange={(e) => set('apiBaseSandbox', e.target.value)}
        />
        <FormTextField
          id="qb-api-production"
          fieldLabel="Production API Base URL"
          value={form.apiBaseProduction}
          onChange={(e) => set('apiBaseProduction', e.target.value)}
        />
      </div>

      <div className="integrations-page__form-actions">
        <AppButton variant="primary" onClick={handleSave} loading={saveMut.isPending}>
          Save Credentials
        </AppButton>
        <AppButton
          variant="primary"
          className="integrations-page__qb-connect-btn"
          onClick={() => connectMut.mutate()}
          disabled={
            !credentialsSaved
            || connectMut.isPending
            || (connected && status?.token_status === 'valid')
          }
          loading={connectMut.isPending}
          title={!credentialsSaved ? 'Save credentials first' : undefined}
        >
          Connect QuickBooks
        </AppButton>
        {connected && (
          <>
            <AppButton variant="secondary" onClick={() => testMut.mutate()} loading={testMut.isPending}>
              Test Connection
            </AppButton>
            <AppButton variant="danger" onClick={() => disconnectMut.mutate()} loading={disconnectMut.isPending}>
              Disconnect
            </AppButton>
          </>
        )}
        {apiReady && (
          <AppButton
            variant="primary"
            iconRight={<ArrowRight size={14} />}
            onClick={() => navigate('/admin/ontology')}
          >
            Open Ontology Mapping
          </AppButton>
        )}
      </div>

      {connected && (
        <p className="integrations-page__sync-helper">
          {status?.company_name ? `${status.company_name}` : ''}
          {status?.realm_id ? ` · realm ${status.realm_id}` : ''}
          {status?.environment ? ` · ${status.environment}` : ''}
        </p>
      )}

      {connected && (
        <div className="integrations-page__sync-section">
          <div className="integrations-page__sync-header">
            <h4 className="integrations-page__sync-title">Sync layers</h4>
            <AppBadge variant={apiReady ? 'success' : 'warning'}>
              {apiReady ? 'API Ready' : 'Sync required layers'}
            </AppBadge>
          </div>
          <div className="integrations-page__sync-grid">
            <SyncCard
              title="GL Accounts"
              description="Required — chart of accounts for ontology GL mapping."
              ready={readiness?.gl_ready}
              count={readiness?.gl_account_count}
              syncedAt={readiness?.gl_last_synced_at}
              onSync={() => syncAccountsMut.mutate()}
              syncing={syncAccountsMut.isPending}
              required
            />
            <SyncCard
              title="General Ledger Entries"
              description="Required — posted GL entries for Flux generation."
              ready={readiness?.transaction_ready}
              count={readiness?.general_ledger_entry_count}
              syncedAt={readiness?.entries_last_synced_at}
              onSync={() => syncGlMut.mutate()}
              syncing={syncGlMut.isPending}
              required
            />
            <SyncCard
              title="Customers"
              description="Optional — customer master enrichment."
              ready={readiness?.customers_ready}
              count={readiness?.customers_count}
              syncedAt={readiness?.customers_last_synced_at}
              onSync={() => syncCustMut.mutate()}
              syncing={syncCustMut.isPending}
            />
            <SyncCard
              title="Vendors"
              description="Optional — vendor master enrichment."
              ready={readiness?.vendors_ready}
              count={readiness?.vendors_count}
              syncedAt={readiness?.vendors_last_synced_at}
              onSync={() => syncVendMut.mutate()}
              syncing={syncVendMut.isPending}
            />
          </div>
        </div>
      )}

      {apiReady && (
        <div className="integrations-page__unlock-banner">
          <div>
            <h4 className="integrations-page__unlock-title">Required layers ready · Ontology Mapping unlocked</h4>
            <p className="integrations-page__unlock-desc">Map T-Flux captions to QuickBooks GL accounts.</p>
          </div>
          <AppButton variant="primary" iconRight={<ArrowRight size={14} />} onClick={() => navigate('/admin/ontology')}>
            Open Ontology Mapping
          </AppButton>
        </div>
      )}
    </SettingsCard>
  )
}

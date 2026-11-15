// @author  veera
// @file    pages/admin/IntegrationsPage.tsx
//
// Admin Integrations — ERP catalog, entity mappings, API credentials.
// Backend API integration unchanged — every fetch/mutate uses existing endpoints.

import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Circle,
  RefreshCw,
  Settings,
  X as CloseIcon,
} from 'lucide-react'
import * as ints from '@/features/admin-integrations/api'
import {
  apiMappingLabel,
  apiMappingTone,
  countVerifiedInLayer,
  layerHealthTone,
  type HealthTone,
} from '@/features/admin-integrations/layerStatus'
import { BusinessCentralCredentialForm } from '@/features/admin-integrations/components/BusinessCentralCredentialForm'
import { QuickBooksCredentialForm } from '@/features/admin-integrations/components/QuickBooksCredentialForm'
import { useEntities } from '@/features/entities/hooks'
import { useAdminUsers } from '@/features/admin-users/hooks'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import {
  AppBadge,
  AppButton,
  AppModal,
  FormSelect,
  PageHeader,
  SettingsCard,
} from '@/components/ui'
import type { AppBadgeVariant } from '@/components/ui/AppBadge'
import type { ApiCredential, ApiLayer, Entity, EntityErpMapping, ErpCatalogItem } from '@/types/models'

const REAL_CONNECTOR_ERP_KEYS = new Set<string>(['bc', 'quickbooks'])

const ERP_MARKS: Record<string, string> = {
  sap_s4: 'SAP',
  oracle_cloud: 'ORA',
  netsuite: 'NS',
  dynamics365: 'D365',
  bc: 'BC',
  quickbooks: 'QB',
  workday: 'WD',
}

const ERP_ACCENT: Record<string, string> = {
  bc: '#4338ca',
  quickbooks: '#2ca01c',
  sap_s4: '#0891b2',
  oracle_cloud: '#d97706',
  netsuite: '#0891b2',
  dynamics365: '#2563eb',
  workday: '#7c3aed',
}

const LAYER_LABEL: Record<ApiLayer, string> = { gl: 'GL', sub_gl: 'Sub-GL', transaction: 'Transaction' }

function erpMark(key: string): string {
  return ERP_MARKS[key] ?? ((key || '?').replace(/_/g, '').slice(0, 3).toUpperCase() || '?')
}

function erpMarkClass(key: string, sm = false): string {
  const base = `integrations-page__erp-mark integrations-page__erp-mark--${key}`
  return sm ? `${base} integrations-page__erp-mark--sm` : base
}

function erpAccentStyle(key: string): CSSProperties {
  const accent = ERP_ACCENT[key]
  return accent ? ({ '--erp-accent': accent } as CSSProperties) : {}
}

function healthBadgeVariant(tone: HealthTone): AppBadgeVariant {
  if (tone === 'success') return 'success'
  if (tone === 'warning') return 'warning'
  return 'neutral'
}

function connectionBadge(status: EntityErpMapping['status']): {
  variant: AppBadgeVariant
  label: string
  pulse: boolean
} {
  switch (status) {
    case 'connected':
      return { variant: 'success', label: 'Connected', pulse: false }
    case 'connecting':
      return { variant: 'warning', label: 'Syncing', pulse: true }
    case 'error':
      return { variant: 'danger', label: 'Error', pulse: false }
    default:
      return { variant: 'danger', label: 'Disconnected', pulse: false }
  }
}

function credStatusBadge(status: string): { variant: AppBadgeVariant; Icon: typeof Check } {
  switch (status) {
    case 'verified':
      return { variant: 'success', Icon: Check }
    case 'unverified':
      return { variant: 'warning', Icon: Circle }
    case 'error':
      return { variant: 'danger', Icon: AlertCircle }
    default:
      return { variant: 'neutral', Icon: Circle }
  }
}


export default function IntegrationsPage() {
  const { data: entities = [] } = useEntities()
  const catalogQ = useQuery({ queryKey: ['erp-catalog'], queryFn: () => ints.getCatalog() })
  const mappingsQ = useQuery({ queryKey: ['erp-mappings'], queryFn: () => ints.getMappings() })
  const catalog = catalogQ.data ?? []
  const mappings = mappingsQ.data ?? []
  const qc = useQueryClient()
  const { toast } = useUiStore()

  const [connectOpen, setConnectOpen] = useState(false)
  const [selectedApiEntity, setSelectedApiEntity] = useState<string | null>(null)
  const apiPanelRef = useRef<HTMLDivElement | null>(null)

  const focusApi = (entityId: string) => {
    setSelectedApiEntity(entityId)
    setTimeout(() => apiPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }

  const connect = useMutation({
    mutationFn: ({ entity_id, erp_key }: { entity_id: string; erp_key: string }) => ints.connectErp(entity_id, erp_key),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-mappings'] }),
  })
  const disconnect = useMutation({
    mutationFn: (id: number) => ints.disconnectErp(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-mappings'] }),
  })
  const resync = useMutation({
    mutationFn: (id: number) => ints.resyncMapping(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['erp-mappings'] }),
  })

  const refetchIntegrations = () => {
    void catalogQ.refetch()
    void mappingsQ.refetch()
  }

  if (catalogQ.isLoading || mappingsQ.isLoading) {
    return (
      <div className="integrations-page">
        <div className="integrations-page__loading">Loading integrations…</div>
      </div>
    )
  }

  if (catalogQ.isError || mappingsQ.isError) {
    const err = catalogQ.isError ? catalogQ.error : mappingsQ.error
    return (
      <div className="integrations-page">
        <div className="integrations-page__error-banner">
          {getApiErrorMessage(err, 'Could not load catalog or mappings.')}
        </div>
        <AppButton variant="secondary" onClick={() => refetchIntegrations()}>Retry</AppButton>
      </div>
    )
  }

  const entityOptions = mappings.map((m) => {
    const ent = entities.find((e) => e.id === m.entity_id)
    return { value: m.entity_id, label: `${m.entity_id} · ${ent?.name || ''}` }
  })

  return (
    <div className="integrations-page">
      <div className="integrations-page__header">
        <PageHeader
          title="Integrations"
          subtitle="Connect entities to their ERP systems, verify credentials, sync data layers, and unlock ontology mapping."
          actions={(
            <AppButton variant="primary" onClick={() => setConnectOpen(true)}>
              + Connect ERP
            </AppButton>
          )}
        />
      </div>

      <div className="integrations-page__stack">
        <SettingsCard
          className="integrations-page__section"
          title="Supported ERPs"
          description="Pick a system from the catalog and link it to an entity."
        >
          <div className="integrations-page__erp-grid">
            {catalog.map((c) => (
              <article key={c.key} className="integrations-page__erp-card">
                <div className={erpMarkClass(c.key)} aria-hidden>{erpMark(c.key)}</div>
                <div className="integrations-page__erp-info">
                  <div className="integrations-page__erp-name">{c.name}</div>
                  <div className="integrations-page__erp-desc">{c.description}</div>
                </div>
              </article>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard
          className="integrations-page__section"
          title="Entity ↔ ERP mappings"
          description={`${mappings.length} connection${mappings.length === 1 ? '' : 's'}`}
        >
          <div className="integrations-page__mapping-wrap">
            <table className="integrations-page__mapping-table">
              <thead>
                <tr>
                  <th className="integrations-page__mapping-th" style={{ width: 32 }} aria-hidden />
                  <th className="integrations-page__mapping-th">Entity</th>
                  <th className="integrations-page__mapping-th">ERP System</th>
                  <th className="integrations-page__mapping-th">Connection</th>
                  <th className="integrations-page__mapping-th">API Mapping</th>
                  <th className="integrations-page__mapping-th">Last Sync</th>
                  <th className="integrations-page__mapping-th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <ExpandableRow
                    key={m.id}
                    m={m}
                    catalog={catalog}
                    entities={entities}
                    onResync={() => resync.mutate(m.id, {
                      onSuccess: () => toast('Re-synced'),
                      onError: (e: unknown) => toast(getApiErrorMessage(e, 'Resync failed')),
                    })}
                    onDisconnect={() => {
                      if (window.confirm('Disconnect ERP from this entity?')) {
                        disconnect.mutate(m.id, {
                          onSuccess: () => toast('Disconnected'),
                          onError: (e: unknown) => toast(getApiErrorMessage(e, 'Disconnect failed')),
                        })
                      }
                    }}
                    onConfigureApi={() => focusApi(m.entity_id)}
                  />
                ))}
                {mappings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="integrations-page__empty">
                      No ERPs connected yet. Click <strong>Connect ERP</strong> above to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SettingsCard>

        <div ref={apiPanelRef}>
          <SettingsCard className="integrations-page__section" title="API Integration">
            <div className="integrations-page__section-header">
              <p className="integrations-page__section-subtitle">
                GL · Sub-GL · Transaction. Keys are encrypted; only last 4 chars displayed.
              </p>
              <div className="integrations-page__entity-select">
                <FormSelect
                  id="integrations-api-entity"
                  fieldLabel="Active entity"
                  uppercaseLabel={false}
                  value={selectedApiEntity || ''}
                  onChange={(e) => setSelectedApiEntity(String(e.target.value) || null)}
                  placeholder="— Pick entity —"
                  options={entityOptions}
                />
              </div>
            </div>

            {selectedApiEntity ? (() => {
              const rowMapping = mappings.find((row) => row.entity_id === selectedApiEntity)
              if (!rowMapping) {
                return (
                  <div className="integrations-page__empty">
                    No ERP mapping for this entity. Connect an ERP first.
                  </div>
                )
              }
              return (
                <ApiPanel
                  entityId={selectedApiEntity}
                  entities={entities}
                  mapping={rowMapping}
                  catalog={catalog}
                />
              )
            })() : (
              <div className="integrations-page__empty">
                Select an entity above (or click &quot;Configure API&quot; on a row) to manage credentials.
              </div>
            )}
          </SettingsCard>
        </div>
      </div>

      <ConnectErpModal
        open={connectOpen}
        entities={entities.filter((e) => !mappings.some((m) => m.entity_id === e.id))}
        catalog={catalog}
        onClose={() => setConnectOpen(false)}
        onConnect={(entity_id, erp_key) => {
          connect.mutate({ entity_id, erp_key }, {
            onSuccess: () => { toast('Connected'); setConnectOpen(false); focusApi(entity_id) },
            onError: (e: unknown) => toast(getApiErrorMessage(e, 'Connect failed')),
          })
        }}
      />
    </div>
  )
}


function ExpandableRow({
  m, catalog, entities, onResync, onDisconnect, onConfigureApi,
}: {
  m: EntityErpMapping
  catalog: ErpCatalogItem[]
  entities: Entity[]
  onResync: () => void
  onDisconnect: () => void
  onConfigureApi: () => void
}) {
  const [open, setOpen] = useState(false)
  const erp = catalog.find((c) => c.key === m.erp_key)
  const ent = entities.find((e) => e.id === m.entity_id)
  const isQb = m.erp_key === 'quickbooks'

  const { data: users = [] } = useAdminUsers()
  const accessUsers = useMemo(
    () => users.filter((u) => u.entity_codes.includes(m.entity_id)),
    [users, m.entity_id],
  )

  const {
    data: creds = [],
    isLoading: credsLoading,
    isError: credsError,
    refetch: refetchCreds,
  } = useQuery({
    queryKey: ['api-creds', m.entity_id],
    queryFn: () => ints.getApiMap(m.entity_id),
  })
  const { data: complete } = useQuery({
    queryKey: ['api-complete', m.entity_id],
    queryFn: () => ints.apiComplete(m.entity_id),
  })

  const mapTone = apiMappingTone(complete?.complete, creds.length)
  const mapLabel = apiMappingLabel(complete?.complete, creds.length)
  const conn = connectionBadge(m.status)

  return (
    <>
      <tr
        className={`integrations-page__mapping-row${open ? ' integrations-page__mapping-row--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <td className="integrations-page__mapping-td">
          <div className={`integrations-page__mapping-chevron${open ? ' integrations-page__mapping-chevron--open' : ''}`}>
            <ChevronRight size={14} strokeWidth={2.5} />
          </div>
        </td>
        <td className="integrations-page__mapping-td">
          <div className="integrations-page__entity-name">{ent?.name || m.entity_id}</div>
          <div className="integrations-page__entity-tags">
            <AppBadge variant="success" className="integrations-page__entity-code">{m.entity_id}</AppBadge>
            {ent?.region ? <AppBadge variant="neutral">{ent.region}</AppBadge> : null}
          </div>
        </td>
        <td className="integrations-page__mapping-td">
          {erp && (
            <div className={`integrations-page__erp-inline${isQb ? ' integrations-page__qb-accent' : ''}`}>
              <div className={erpMarkClass(m.erp_key, true)} aria-hidden>{erpMark(m.erp_key)}</div>
              <div>
                <div className="integrations-page__erp-name">{erp.name}</div>
                <div className="integrations-page__erp-desc">{erp.description}</div>
              </div>
            </div>
          )}
        </td>
        <td className="integrations-page__mapping-td">
          <AppBadge variant={conn.variant} className="integrations-page__live-badge">
            <span className={`integrations-page__status-dot${conn.pulse ? ' integrations-page__status-dot--pulse' : ''}`} />
            {conn.label}
          </AppBadge>
        </td>
        <td className="integrations-page__mapping-td">
          <AppBadge variant={healthBadgeVariant(mapTone)}>
            {complete?.complete ? <Check size={12} strokeWidth={3} style={{ marginRight: 4 }} /> : null}
            {mapLabel}
          </AppBadge>
        </td>
        <td className="integrations-page__mapping-td integrations-page__mono">
          {m.last_sync_at ? new Date(m.last_sync_at).toLocaleString() : '—'}
        </td>
        <td className="integrations-page__mapping-td" onClick={(e) => e.stopPropagation()}>
          <div className="integrations-page__row-actions">
            <button type="button" className="integrations-page__icon-btn integrations-page__icon-btn--blue" onClick={onConfigureApi} title="Configure API">
              <Settings size={14} strokeWidth={2} />
            </button>
            <button type="button" className="integrations-page__icon-btn integrations-page__icon-btn--amber" onClick={onResync} title="Re-sync">
              <RefreshCw size={14} strokeWidth={2} />
            </button>
            <button type="button" className="integrations-page__icon-btn integrations-page__icon-btn--danger" onClick={onDisconnect} title="Disconnect">
              <CloseIcon size={14} strokeWidth={2} />
            </button>
          </div>
        </td>
      </tr>

      {open && (
        <tr className="integrations-page__mapping-expanded">
          <td colSpan={7}>
            <div className="integrations-page__mapping-panel-grid">
              <div className="integrations-page__mapping-panel">
                <div className="integrations-page__panel-title">Users with access ({accessUsers.length})</div>
                {accessUsers.length === 0 ? (
                  <p className="integrations-page__sync-helper">
                    No analysts have direct access to this entity. Supervisors and admins always have visibility.
                  </p>
                ) : (
                  <div className="integrations-page__user-chips">
                    {accessUsers.slice(0, 8).map((u) => (
                      <span key={u.id} className="integrations-page__user-chip">
                        <span className="integrations-page__user-avatar" style={{ background: u.color }}>{u.initials}</span>
                        {u.name}
                        <span className="integrations-page__mono"> · {u.role}</span>
                      </span>
                    ))}
                    {accessUsers.length > 8 && (
                      <AppBadge variant="neutral">+{accessUsers.length - 8} more</AppBadge>
                    )}
                  </div>
                )}
              </div>

              <div className="integrations-page__mapping-panel">
                <div className="integrations-page__panel-title">API pipeline</div>
                {credsLoading && (
                  <p className="integrations-page__sync-helper">Loading API map…</p>
                )}
                {credsError && !credsLoading && (
                  <div>
                    <p className="integrations-page__alert integrations-page__alert--danger">
                      Could not load API credentials for this row.
                    </p>
                    <AppButton variant="secondary" size="sm" onClick={() => void refetchCreds()}>Retry</AppButton>
                  </div>
                )}
                {!credsLoading && !credsError && (
                  <>
                    <div className="integrations-page__pipeline">
                      {(['gl', 'sub_gl', 'transaction'] as ApiLayer[]).map((layer) => {
                        const { verified, total } = countVerifiedInLayer(creds, layer)
                        const tone = layerHealthTone(verified, total)
                        const stateLabel = total === 0 ? 'not started' : verified === total ? 'verified' : 'in progress'
                        const panelClass = tone === 'success'
                          ? 'integrations-page__pipeline-card--success'
                          : tone === 'warning'
                            ? 'integrations-page__pipeline-card--warning'
                            : 'integrations-page__pipeline-card--neutral'
                        return (
                          <div key={layer} className={`integrations-page__pipeline-card ${panelClass}`}>
                            <div className="integrations-page__pipeline-label">{LAYER_LABEL[layer]}</div>
                            <div className="integrations-page__pipeline-count">{verified}/{total}</div>
                            <div className="integrations-page__pipeline-state">{stateLabel}</div>
                          </div>
                        )
                      })}
                    </div>
                    <AppButton
                      variant="primary"
                      size="sm"
                      iconRight={<ArrowRight size={14} strokeWidth={2} />}
                      onClick={onConfigureApi}
                      style={{ marginTop: 10 }}
                    >
                      Configure API endpoints
                    </AppButton>
                  </>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}


function ConnectErpModal({
  open, entities, catalog, onClose, onConnect,
}: {
  open: boolean
  entities: Entity[]
  catalog: ErpCatalogItem[]
  onClose: () => void
  onConnect: (entity_id: string, erp_key: string) => void
}) {
  const [entity, setEntity] = useState('')
  const [erp, setErp] = useState('')
  const ready = !!(entity && erp)

  const entityOptions = entities.map((e) => ({ value: e.id, label: `${e.id} — ${e.name}` }))

  return (
    <AppModal
      open={open}
      size="lg"
      title="Connect ERP to Entity"
      subtitle="Link an entity with its ERP system to start pulling financial data."
      onClose={onClose}
      footer={(
        <>
          <AppButton variant="secondary" onClick={onClose}>Cancel</AppButton>
          <AppButton variant="primary" disabled={!ready} onClick={() => { if (ready) onConnect(entity, erp) }}>
            Connect
          </AppButton>
        </>
      )}
    >
      <div className="integrations-connect-modal">
        <div className="integrations-connect-modal__field">
          <FormSelect
            id="connect-erp-entity"
            fieldLabel="Entity"
            value={entity}
            onChange={(e) => setEntity(String(e.target.value))}
            placeholder="Select entity…"
            options={entityOptions}
          />
        </div>

        <div className="integrations-connect-modal__field">
          <div className="integrations-connect-modal__field-label">ERP System</div>
          <div className="integrations-connect-modal__erp-grid">
            {catalog.map((c) => {
              const active = erp === c.key
              return (
                <button
                  key={c.key}
                  type="button"
                  className={`integrations-connect-modal__erp-card${active ? ' integrations-connect-modal__erp-card--selected' : ''}`}
                  style={erpAccentStyle(c.key)}
                  onClick={() => setErp(c.key)}
                >
                  <div className={erpMarkClass(c.key)} aria-hidden>{erpMark(c.key)}</div>
                  <div>
                    <div className="integrations-connect-modal__erp-name">{c.name}</div>
                    <div className="integrations-connect-modal__erp-desc">{c.description}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="integrations-page__note-box integrations-connect-modal__note">
          After connecting, open the <strong>API Integration</strong> panel to configure credentials.
          Ontology Mapping unlocks once required sync layers are ready.
        </div>
      </div>
    </AppModal>
  )
}


function ApiPanel({
  entityId, entities, mapping, catalog,
}: {
  entityId: string
  entities: Entity[]
  mapping: EntityErpMapping
  catalog: ErpCatalogItem[]
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const ent = entities.find((e) => e.id === entityId)
  const erp = catalog.find((c) => c.key === mapping?.erp_key)
  const isQb = mapping.erp_key === 'quickbooks'

  const {
    data: creds = [],
    isLoading: credsLoading,
    isError: credsError,
    refetch,
  } = useQuery({
    queryKey: ['api-creds', entityId],
    queryFn: () => ints.getApiMap(entityId),
  })
  const { data: complete, refetch: refetchComplete } = useQuery({
    queryKey: ['api-complete', entityId],
    queryFn: () => ints.apiComplete(entityId),
  })

  const invalidateApi = () => {
    void refetch()
    void refetchComplete()
    void qc.invalidateQueries({ queryKey: ['api-complete', entityId] })
    void qc.invalidateQueries({ queryKey: ['api-creds', entityId] })
  }

  const upsert = useMutation({
    mutationFn: (body: ints.UpsertCred) => ints.upsertCred(entityId, body),
    onSuccess: () => invalidateApi(),
  })
  const test = useMutation({
    mutationFn: (id: number) => ints.testCred(entityId, id),
    onSuccess: () => invalidateApi(),
  })
  const sync = useMutation({
    mutationFn: (id: number) => ints.syncCred(entityId, id),
    onSuccess: () => invalidateApi(),
  })
  const del = useMutation({
    mutationFn: (id: number) => ints.deleteCred(entityId, id),
    onSuccess: () => invalidateApi(),
  })
  const { toast } = useUiStore()

  const verifiedCount = creds.filter((c) => c.status === 'verified').length
  const allVerified = !!complete?.complete

  const latestSync = useMemo(() => {
    let latest: string | null = null
    for (const c of creds) {
      if (c.last_synced_at && (!latest || c.last_synced_at > latest)) latest = c.last_synced_at
    }
    return latest
  }, [creds])

  if (credsLoading) {
    return <div className="integrations-page__empty">Loading API map…</div>
  }

  if (credsError) {
    return (
      <div>
        <p className="integrations-page__alert integrations-page__alert--danger">
          Could not load API credentials for this entity.
        </p>
        <AppButton variant="secondary" size="sm" onClick={() => void refetch()}>Retry</AppButton>
      </div>
    )
  }

  return (
    <div className="integrations-page__api-panel">
      <div className={`integrations-page__api-summary${isQb ? ' integrations-page__qb-accent' : ''}`} style={erpAccentStyle(mapping.erp_key)}>
        <div className="integrations-page__api-summary-head">
          {ent && erp && (
            <>
              <AppBadge variant="primary">
                {ent.id} · {erp.name}
              </AppBadge>
              {allVerified && (
                <AppBadge variant="success" className="integrations-page__live-badge">
                  <span className="integrations-page__live-dot" />
                  LIVE · ALL VERIFIED
                </AppBadge>
              )}
            </>
          )}
          <div style={{ flex: 1 }} />
          {allVerified && (
            <AppButton
              variant="primary"
              size="sm"
              iconRight={<ArrowRight size={14} strokeWidth={2} />}
              onClick={() => navigate('/admin/ontology')}
            >
              Map ontology
            </AppButton>
          )}
        </div>
        <p className="integrations-page__api-summary-meta">
          {creds.length === 0 ? '0 endpoints' : `${verifiedCount} of ${creds.length} endpoints active`}
          {' · '}
          last sync: {latestSync ? new Date(latestSync).toLocaleString() : '—'}
        </p>
      </div>

      {mapping.erp_key === 'bc' && (
        <BusinessCentralCredentialForm entityId={entityId} />
      )}
      {mapping.erp_key === 'quickbooks' && (
        <QuickBooksCredentialForm
          entityId={entityId}
          periodFrom={ent?.period_from}
          periodTo={ent?.period_to}
        />
      )}

      {!REAL_CONNECTOR_ERP_KEYS.has(mapping.erp_key)
        ? (['gl', 'sub_gl', 'transaction'] as ApiLayer[]).map((layer) => (
          <LayerSection
            key={layer}
            layer={layer}
            erpKey={mapping.erp_key}
            creds={creds.filter((c) => c.layer === layer)}
            onUpsert={(b) => upsert.mutate(b, {
              onSuccess: () => toast(`${LAYER_LABEL[layer]} saved`),
              onError: (e: unknown) => toast(getApiErrorMessage(e, 'Save failed')),
            })}
            onTest={(id) => test.mutate(id, {
              onSuccess: () => toast('Test OK'),
              onError: (e: unknown) => toast(getApiErrorMessage(e, 'Test failed')),
            })}
            onSync={(id) => sync.mutate(id, {
              onSuccess: () => toast('Synced'),
              onError: (e: unknown) => toast(getApiErrorMessage(e, 'Sync failed')),
            })}
            onDelete={(id) => del.mutate(id, {
              onSuccess: () => toast('Removed'),
              onError: (e: unknown) => toast(getApiErrorMessage(e, 'Remove failed')),
            })}
          />
        ))
        : null}
    </div>
  )
}


const AUTH_TYPE_OPTIONS = [
  { value: 'api_key', label: 'API key' },
  { value: 'oauth2', label: 'OAuth 2.0' },
  { value: 'basic', label: 'Basic' },
] as const

function LayerSection({
  layer, erpKey, creds, onUpsert, onTest, onSync, onDelete,
}: {
  layer: ApiLayer
  erpKey: string
  creds: ApiCredential[]
  onUpsert: (b: ints.UpsertCred) => void
  onTest: (id: number) => void
  onSync: (id: number) => void
  onDelete: (id: number) => void
}) {
  const usesSharedOAuth = REAL_CONNECTOR_ERP_KEYS.has(erpKey)
  const [draft, setDraft] = useState<ints.UpsertCred>({
    layer, item_name: '', endpoint: '',
    auth_type: usesSharedOAuth ? 'oauth2' : 'api_key',
    secret: '',
  })
  const allowsMultiple = layer !== 'gl'
  const verifiedCount = creds.filter((c) => c.status === 'verified').length
  const layerTone = creds.length === 0 ? 'neutral' : layerHealthTone(verifiedCount, creds.length)

  return (
    <div className="integrations-page__layer-section">
      <div className="integrations-page__layer-header">
        <AppBadge variant={healthBadgeVariant(layerTone as HealthTone)}>{LAYER_LABEL[layer]}</AppBadge>
        {creds.length > 0 && (
          <span className="integrations-page__sync-helper">{verifiedCount}/{creds.length} verified</span>
        )}
        {allowsMultiple && (
          <span className="integrations-page__sync-helper" style={{ marginLeft: 'auto' }}>
            multiple endpoints allowed
          </span>
        )}
      </div>

      {usesSharedOAuth && (
        <div className="integrations-page__hint-box">
          Business Central uses the saved OAuth credential above. Separate API keys are not required for GL / Sub-GL / Transaction sync.
        </div>
      )}

      {creds.map((c) => {
        const { variant, Icon } = credStatusBadge(c.status)
        return (
          <div key={c.id} className="integrations-page__cred-row">
            <div className="integrations-page__cred-detail">
              <div className="integrations-page__cred-name">{c.item_name || LAYER_LABEL[layer]}</div>
              <div className="integrations-page__cred-endpoint">
                {c.endpoint}
                {c.auth_type && !usesSharedOAuth ? ` · Auth: ${c.auth_type}` : ''}
                {c.last4 ? ` · ****${c.last4}` : ''}
              </div>
            </div>
            <AppBadge variant={variant}>
              <Icon size={11} strokeWidth={2.5} style={{ marginRight: 4 }} />
              {c.status}
            </AppBadge>
            <AppButton variant="outline" size="sm" onClick={() => onTest(c.id)}>Test</AppButton>
            <AppButton variant="secondary" size="sm" onClick={() => onSync(c.id)}>Sync</AppButton>
            <AppButton variant="ghost" size="sm" onClick={() => onDelete(c.id)} title="Remove">
              <CloseIcon size={12} strokeWidth={2} />
            </AppButton>
          </div>
        )
      })}

      <div
        className="integrations-page__add-row"
        style={{ gridTemplateColumns: addRowGridColumns(allowsMultiple, usesSharedOAuth) }}
      >
        {allowsMultiple && (
          <input
            className="integrations-page__inline-input"
            value={draft.item_name || ''}
            onChange={(e) => setDraft({ ...draft, item_name: e.target.value })}
            placeholder="Name (e.g. Cost Centre Sub-GL)"
            aria-label={`${LAYER_LABEL[layer]} item name`}
          />
        )}
        <input
          className="integrations-page__inline-input"
          value={draft.endpoint}
          onChange={(e) => setDraft({ ...draft, endpoint: e.target.value })}
          placeholder="Endpoint URL or path"
          aria-label={`${LAYER_LABEL[layer]} endpoint`}
        />
        {!usesSharedOAuth && (
          <select
            className="integrations-page__inline-select"
            value={draft.auth_type || 'api_key'}
            onChange={(e) => setDraft({ ...draft, auth_type: e.target.value })}
            aria-label={`${LAYER_LABEL[layer]} auth type`}
          >
            {AUTH_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        )}
        {!usesSharedOAuth && (
          <input
            type="password"
            className="integrations-page__inline-input"
            value={draft.secret || ''}
            onChange={(e) => setDraft({ ...draft, secret: e.target.value })}
            placeholder="API key / secret"
            aria-label={`${LAYER_LABEL[layer]} api key or secret`}
            autoComplete="new-password"
          />
        )}
        <AppButton
          variant="primary"
          size="sm"
          disabled={!draft.endpoint}
          onClick={() => {
            const payload = usesSharedOAuth
              ? { ...draft, auth_type: 'oauth2', secret: '' }
              : draft
            onUpsert(payload)
            setDraft({
              layer, item_name: '', endpoint: '',
              auth_type: usesSharedOAuth ? 'oauth2' : draft.auth_type,
              secret: '',
            })
          }}
        >
          + Add
        </AppButton>
      </div>
    </div>
  )
}

function addRowGridColumns(allowsMultiple: boolean, usesSharedOAuth: boolean): string {
  const name = allowsMultiple ? 'minmax(0,1fr)' : ''
  const endpoint = allowsMultiple ? 'minmax(0,1.4fr)' : 'minmax(0,1.6fr)'
  const cols = [name, endpoint]
  if (!usesSharedOAuth) {
    cols.push('minmax(0,0.9fr)')
    cols.push('minmax(0,1fr)')
  }
  cols.push('auto')
  return cols.filter(Boolean).join(' ')
}

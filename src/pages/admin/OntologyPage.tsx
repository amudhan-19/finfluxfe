// @author  veera
// @file    pages/admin/OntologyPage.tsx
//
// Admin Ontology Mapping: API readiness gate, ready-entity selector, P&L/BS,
// display column, search + filters, legend, mapping table, custom captions,
// resync + authenticated CSV export.

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, ArrowRight, Check, Lock, Search } from 'lucide-react'
import * as ontApi from '@/features/admin-ontology/api'
import {
  findNonPostingGlAccounts,
  isBoldCaption,
  isDuplicateCustomName,
  isReservedCoreCaption,
  splitCommaList,
} from '@/features/admin-ontology/captionHelpers'
import * as intsApi from '@/features/admin-integrations/api'
import { getBcGlAccounts } from '@/features/admin-integrations/businessCentralApi'
import { getQbGlAccounts } from '@/features/admin-integrations/quickBooksApi'
import { useEntities } from '@/features/entities/hooks'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import { PL_CAPTIONS, BS_CAPTIONS } from '@/constants/theme'
import { AppButton, FilterSelect } from '@/components/ui'
import type { ErpAccountOut, OntologyMapping } from '@/types/models'
import { OntologyMultiSelect } from '@/components/admin/OntologyMultiSelect'
import { BcFluxGenerateBar } from '@/features/admin-flux-generate/BcFluxGenerateBar'
import { QbFluxGenerateBar } from '@/features/admin-flux-generate/QbFluxGenerateBar'

type DisplayCol = ontApi.OntologyDisplayColumn
type CapFilter = 'all' | 'core' | 'custom' | 'hidden'

function emptyOntologyMessage(filter: CapFilter, hasSearch: boolean): string {
  if (filter === 'custom') return 'No custom captions yet — add one below'
  if (filter === 'hidden') return 'No captions are hidden for this entity'
  if (hasSearch) return 'No rows match your search'
  return 'No captions to display'
}

function ontologyDisplayLabel(col: DisplayCol): string {
  if (col === 'tflux') return 'T-Flux'
  if (col === 'erp') return 'ERP'
  return 'Custom'
}

export default function OntologyPage() {
  const navigate = useNavigate()
  const { data: entities = [] } = useEntities()
  const { data: readyIds = [], isLoading: readyLoading, isError: readyError, refetch: refetchReady } = useQuery({
    queryKey: ['ontology-entities-ready'],
    queryFn: () => ontApi.getEntitiesReady(),
  })
  const [entityId, setEntityId] = useState<string | null>(null)
  const [stmt, setStmt] = useState<'pl' | 'bs'>('pl')
  const [filter, setFilter] = useState<CapFilter>('all')
  const [display, setDisplay] = useState<DisplayCol>('tflux')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (readyLoading) return
    if (!readyIds.length) {
      setEntityId(null)
      return
    }
    if (!entityId || !readyIds.includes(entityId)) {
      setEntityId(readyIds[0])
    }
  }, [readyLoading, readyIds, entityId])

  const { data: apiC } = useQuery({
    queryKey: ['api-complete', entityId],
    queryFn: () => intsApi.apiComplete(entityId!),
    enabled: !!entityId,
  })
  const locked = !apiC?.complete
  const isBc = apiC?.erp_type === 'business_central'
  const isQb = apiC?.erp_type === 'quickbooks'

  const bcGlQuery = useQuery({
    queryKey: ['bc-gl-options', entityId],
    queryFn: () => getBcGlAccounts(entityId!),
    enabled: !!entityId && isBc,
  })
  const qbGlQuery = useQuery({
    queryKey: ['qb-gl-options', entityId],
    queryFn: () => getQbGlAccounts(entityId!),
    enabled: !!entityId && isQb,
  })
  const bcGlOptions = isBc ? (bcGlQuery.data ?? []) : []
  const qbGlOptions = isQb ? (qbGlQuery.data ?? []) : []
  const erpGlOptions = isBc ? bcGlOptions : qbGlOptions

  const { data: rows = [] } = useQuery({
    queryKey: ['ontology', entityId, stmt],
    queryFn: () => ontApi.getMapping(entityId!, stmt),
    enabled: !!entityId,
  })
  const { data: customs = [] } = useQuery({
    queryKey: ['ontology-custom', entityId],
    queryFn: () => ontApi.getCustomCaptions(entityId!),
    enabled: !!entityId,
  })

  useEffect(() => {
    if (!rows.length) return
    const d = rows[0].display_column
    if (d === 'tflux' || d === 'erp' || d === 'custom') setDisplay(d)
  }, [entityId, rows])

  const qc = useQueryClient()
  const upsert = useMutation({
    mutationFn: (body: Parameters<typeof ontApi.upsertMapping>[1]) =>
      ontApi.upsertMapping(entityId!, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ontology', entityId] }),
  })
  const setDisplayCol = useMutation({
    mutationFn: (col: DisplayCol) => ontApi.setDisplayColumn(entityId!, col),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ontology', entityId] }),
  })
  const toggleVisible = useMutation({
    mutationFn: ({ caption, hidden }: { caption: string; hidden: boolean }) =>
      ontApi.toggleVisibility(entityId!, stmt, caption, hidden),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ontology', entityId] }),
  })
  const addCustom = useMutation({
    mutationFn: (body: Parameters<typeof ontApi.addCustomCaption>[1]) =>
      ontApi.addCustomCaption(entityId!, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ontology-custom', entityId] }),
  })
  const delCustom = useMutation({
    mutationFn: (id: number) => ontApi.deleteCustomCaption(entityId!, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ontology-custom', entityId] }),
  })
  const { toast } = useUiStore()
  const resync = useMutation({
    mutationFn: () => ontApi.resyncOntology(entityId!),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ontology', entityId] })
      toast('ERP caption resync recorded')
    },
  })

  const byCap = useMemo(
    () => Object.fromEntries(rows.map((r) => [r.tflux_caption, r])) as Record<string, OntologyMapping>,
    [rows],
  )

  const captions = stmt === 'pl' ? PL_CAPTIONS : BS_CAPTIONS

  const visibleCaptions = useMemo(() => {
    return captions.filter((cap) => {
      const r = byCap[cap]
      const hidden = !!r?.is_hidden
      if (filter === 'hidden') return hidden
      if (filter === 'core') return !hidden
      if (filter === 'custom') return false
      return true
    })
  }, [captions, byCap, filter])

  const searchLc = search.trim().toLowerCase()
  const searchFilteredCaptions = useMemo(() => {
    if (!searchLc) return visibleCaptions
    return visibleCaptions.filter((cap) => {
      if (cap.toLowerCase().includes(searchLc)) return true
      const r = byCap[cap]
      const gl = (r?.erp_gl_json || []).join(' ').toLowerCase()
      const cu = (r?.custom_caption || '').toLowerCase()
      return gl.includes(searchLc) || cu.includes(searchLc)
    })
  }, [visibleCaptions, byCap, searchLc])

  const customsForStmt = useMemo(
    () => customs.filter((c) => c.statement === stmt),
    [customs, stmt],
  )

  const customsSearchFiltered = useMemo(() => {
    if (!searchLc) return customsForStmt
    return customsForStmt.filter((c) => {
      if (c.name.toLowerCase().includes(searchLc)) return true
      const gl = (c.erp_gl_json || []).join(' ').toLowerCase()
      return c.name.toLowerCase().includes(searchLc) || gl.includes(searchLc)
    })
  }, [customsForStmt, searchLc])

  const showCustomRows = filter === 'all' || filter === 'custom'

  const reset = async () => {
    if (!entityId) return
    if (!window.confirm(
      'Reset ontology for this entity? Clears all GL/dimension mappings for the current statement, removes custom captions, and un-hides core captions. Synced BC data is not deleted.',
    )) return
    try {
      await ontApi.resetMappings(entityId, stmt)
    } catch (e: unknown) {
      toast(getApiErrorMessage(e, 'Could not clear mappings'))
      return
    }
    for (const c of customsForStmt) {
      try {
        await ontApi.deleteCustomCaption(entityId, c.id)
      } catch {
        /* continue */
      }
    }
    for (const cap of captions) {
      const r = byCap[cap]
      if (r?.is_hidden) {
        try {
          await ontApi.toggleVisibility(entityId, stmt, cap, false)
        } catch {
          /* continue */
        }
      }
    }
    await qc.invalidateQueries({ queryKey: ['ontology', entityId] })
    await qc.invalidateQueries({ queryKey: ['ontology-custom', entityId] })
    toast('Entity ontology reset — re-map GL accounts manually')
  }

  const onExportCsv = () => {
    if (!entityId || locked) return
    void ontApi.downloadOntologyCsv(entityId).catch((e: unknown) => {
      toast(getApiErrorMessage(e, 'Export failed'))
    })
  }

  const readyEntityOptions = useMemo(
    () => readyIds.map((id) => entities.find((e) => e.id === id)).filter(Boolean) as typeof entities,
    [readyIds, entities],
  )

  const entitySelectOptions = useMemo(
    () => readyEntityOptions.map((e) => ({ value: e.id, label: `${e.id} — ${e.name}` })),
    [readyEntityOptions],
  )

  if (readyError) {
    return (
      <div className="ont">
        <div className="ont__error">
          {getApiErrorMessage(readyError, 'Could not load API-ready entities.')}
        </div>
        <AppButton variant="outline" onClick={() => void refetchReady()}>
          Retry
        </AppButton>
      </div>
    )
  }

  if (!readyLoading && readyIds.length === 0) {
    return (
      <div className="ont">
        <div className="ont__header">
          <div className="ont__header-main">
            <div className="ont__title-row">
              <h2 className="ont__title">Ontology Mapping</h2>
            </div>
            <p className="ont__subtitle">
              Map T-Flux captions to ERP GL accounts — unlocks when GL + GL entries are synced (see below).
            </p>
          </div>
        </div>
        <div className="ont__state">
          <span className="ont__state-icon">
            <Lock size={36} strokeWidth={2} />
          </span>
          <div className="ont__state-title">No entities are API-ready yet</div>
          <div className="ont__state-text">
            <strong>Business Central:</strong> under Integrations, sync <strong>GL Accounts</strong> and{' '}
            <strong>General Ledger Entries</strong> (required). Customer/Vendor ledger sync is optional.
            <strong> Other ERPs:</strong> verify GL and Transaction API credentials. Then return here.
          </div>
          <AppButton
            variant="primary"
            iconRight={<ArrowRight size={16} strokeWidth={2} />}
            onClick={() => navigate('/admin/integrations')}
          >
            Open Integrations
          </AppButton>
        </div>
      </div>
    )
  }

  return (
    <div className="ont">
      {/* Header */}
      <div className="ont__header">
        <div className="ont__header-main">
          <div className="ont__title-row">
            <h2 className="ont__title">Ontology Mapping</h2>
            {entityId && (locked
              ? (
                <span className="ont__status-badge ont__status-badge--locked">
                  <Lock size={12} strokeWidth={2.5} />
                  LOCKED
                </span>
              )
              : (
                <span className="ont__status-badge ont__status-badge--ready">
                  <Check size={12} strokeWidth={3} />
                  API READY
                </span>
              ))}
          </div>
          <p className="ont__subtitle">
            Reconcile T-Flux taxonomy with ERP captions · Add custom captions, hide unused rows, set Flux Review display
          </p>
        </div>

        <div className="ont__header-actions">
          <FilterSelect
            id="ontology-entity"
            className="ont__entity-select"
            value={entityId || ''}
            onChange={(v) => setEntityId(v || null)}
            placeholder="Select entity…"
            options={entitySelectOptions}
            fullWidth={false}
            aria-label="Entity for ontology mapping"
          />
          <Segmented values={[['pl', 'P&L'], ['bs', 'BS']]} active={stmt} onChange={(v) => setStmt(v as 'pl' | 'bs')} />
          <AppButton
            variant="outline"
            size="sm"
            disabled={!entityId || locked || resync.isPending}
            onClick={() => resync.mutate(undefined, {
              onError: (e: unknown) => toast(getApiErrorMessage(e, 'Resync failed')),
            })}
          >
            Resync ERP captions
          </AppButton>
          <AppButton
            variant="outline"
            size="sm"
            disabled={!entityId || locked}
            onClick={onExportCsv}
          >
            Export CSV
          </AppButton>
        </div>
      </div>

      {/* Locked banner with CTA */}
      {entityId && locked && (
        <div className="ont-locked">
          <div>
            <div className="ont-locked__title">
              <Lock size={16} strokeWidth={2} />
              Ontology editing is locked
            </div>
            <div className="ont-locked__text">
              {entityId} needs synced GL Accounts and General Ledger Entries under Integrations.
              Customer/Vendor ledger is optional.
            </div>
          </div>
          <AppButton
            variant="primary"
            size="sm"
            iconRight={<ArrowRight size={14} strokeWidth={2} />}
            onClick={() => navigate('/admin/integrations')}
          >
            Open Integrations
          </AppButton>
        </div>
      )}

      {/* Generate Flux from BC — admin-only, requires API-ready entity */}
      {entityId && !locked && isBc && (
        <BcFluxGenerateBar
          entityId={entityId}
          statement={stmt}
          disabled={locked}
        />
      )}
      {entityId && !locked && isQb && (
        <QbFluxGenerateBar
          entityId={entityId}
          statement={stmt}
          disabled={locked}
        />
      )}

      {/* Display column + search + filter + legend */}
      <div className="ont-toolbar">
        <div className="ont-toolbar__row">
          <div className="ont-toolbar__group">
            <span className="ont-toolbar__group-label">Flux Review shows</span>
            <Segmented
              values={[['tflux', 'T-Flux'], ['erp', 'ERP'], ['custom', 'Custom']]}
              active={display}
              disabled={locked}
              onChange={(v) => {
                const col = v as DisplayCol
                setDisplay(col)
                if (!entityId || locked) return
                setDisplayCol.mutate(col, {
                  onSuccess: () => toast(`Display mode: ${ontologyDisplayLabel(col)}`),
                  onError: (e: unknown) => {
                    toast(getApiErrorMessage(e, 'Could not save display mode'))
                    void qc.invalidateQueries({ queryKey: ['ontology', entityId] })
                  },
                })
              }}
            />
          </div>

          <div className="ont-toolbar__divider" />

          <div className="ont-toolbar__search">
            <Search size={14} strokeWidth={2} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search captions or GL accounts…"
              aria-label="Search ontology captions and GL codes"
            />
          </div>

          <FilterPills value={filter} onChange={setFilter} />

          <div className="ont-toolbar__spacer" />

          <AppButton
            variant="danger"
            size="sm"
            disabled={locked}
            iconLeft={<AlertTriangle size={14} strokeWidth={2} />}
            onClick={reset}
          >
            Reset entity
          </AppButton>
        </div>

        <div className="ont-toolbar__legend">
          <span className="ont-toolbar__legend-title">Legend</span>
          <span className="ont-toolbar__legend-item">
            <span className="ont-toolbar__legend-dot ont-toolbar__legend-dot--core" />
            Core (fixed T-Flux)
          </span>
          <span className="ont-toolbar__legend-item">
            <span className="ont-toolbar__legend-dot ont-toolbar__legend-dot--custom" />
            Custom row
          </span>
          <span className="ont-toolbar__legend-item">
            <span className="ont-toolbar__legend-dot ont-toolbar__legend-dot--hidden" />
            Hidden
          </span>
        </div>
      </div>

      {(isBc || isQb) && !locked && erpGlOptions.length === 0 && (
        <div className="ont-generate__warn ont-generate__warn--standalone">
          {isQb
            ? 'No synced QuickBooks GL accounts found. Go to Integrations → QuickBooks and sync Accounts and General Ledger first.'
            : 'No synced GL accounts found for this entity. Go to Integrations → Business Central and sync GL Accounts and General Ledger Entries first.'}
        </div>
      )}

      {/* Mapping table */}
      <div className="ont-table">
        <div className="ont-table__scroll">
          <table className="ont-table__table">
            <thead>
              <tr>
                <th className="ont-table__th ont-table__th--idx">#</th>
                <th className="ont-table__th">Caption</th>
                <th className="ont-table__th">ERP GL Mapping</th>
                <th className="ont-table__th">Custom Caption</th>
                <th className="ont-table__th ont-table__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filter !== 'custom' && searchFilteredCaptions.map((cap, i) => (
                <CaptionRow
                  key={cap}
                  index={i + 1}
                  cap={cap}
                  statement={stmt}
                  row={byCap[cap]}
                  disabled={locked}
                  display={display}
                  glOptions={erpGlOptions}
                  onSave={(b) => upsert.mutate(b, {
                    onSuccess: () => toast('Mapping saved'),
                    onError: (e: unknown) => toast(getApiErrorMessage(e, 'Save failed')),
                  })}
                  onToggleHidden={(hidden) =>
                    toggleVisible.mutate(
                      { caption: cap, hidden },
                      {
                        onSuccess: () => toast(hidden ? 'Caption hidden' : 'Caption restored'),
                        onError: (e: unknown) => toast(getApiErrorMessage(e, 'Visibility update failed')),
                      },
                    )}
                />
              ))}

              {showCustomRows && customsSearchFiltered.map((c) => (
                <tr key={`custom-${c.id}`} className="ont-table__row ont-table__row--custom">
                  <td className="ont-table__td ont-table__td--idx">—</td>
                  <td className="ont-table__td">
                    <div className="ont-table__caption">
                      <span className="ont-table__caption-text ont-table__caption-text--bold">{c.name}</span>
                      <span className="ont-table__tag ont-table__tag--custom">CUSTOM</span>
                      {c.is_subtotal ? (
                        <span className="ont-table__tag ont-table__tag--subtotal">SUBTOTAL</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="ont-table__td ont-table__td--top ont-table__gl-readonly">
                    {(c.erp_gl_json || []).length > 0
                      ? (c.erp_gl_json || []).join(', ')
                      : '—'}
                  </td>
                  <td className="ont-table__td">—</td>
                  <td className="ont-table__td ont-table__td--actions">
                    <div className="ont-table__actions">
                      <AppButton
                        variant="danger"
                        size="sm"
                        disabled={locked}
                        onClick={() => delCustom.mutate(c.id, {
                          onSuccess: () => toast('Removed'),
                          onError: (e: unknown) => toast(getApiErrorMessage(e, 'Remove failed')),
                        })}
                      >
                        Remove
                      </AppButton>
                    </div>
                  </td>
                </tr>
              ))}

              {(filter !== 'custom' ? searchFilteredCaptions.length : 0) +
                (showCustomRows ? customsSearchFiltered.length : 0) === 0 && (
                <tr>
                  <td colSpan={5} className="ont-table__empty">
                    {emptyOntologyMessage(filter, !!searchLc)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!locked && entityId && (
        <CustomCaptionAdder
          statement={stmt}
          existingCustomNames={customsForStmt.map((c) => c.name)}
          onAdd={(b) => {
            if (isReservedCoreCaption(b.name, stmt)) {
              toast('That name matches a core T-Flux caption — pick a different name.')
              return
            }
            if (isDuplicateCustomName(b.name, b.existingNames)) {
              toast('A custom caption with this name already exists.')
              return
            }
            const { existingNames: _e, ...payload } = b
            addCustom.mutate(payload, {
              onSuccess: () => toast('Custom caption added'),
              onError: (e: unknown) => toast(getApiErrorMessage(e, 'Add failed')),
            })
          }}
        />
      )}
    </div>
  )
}

type UpsertBody = Parameters<typeof ontApi.upsertMapping>[1]

function glLabel(a: ErpAccountOut): string {
  return `${a.account_no} — ${a.display_name || a.account_name || a.account_no}`
}

function CaptionRow({ index, cap, statement, row, disabled, display,
                     glOptions, onSave, onToggleHidden }: {
  index: number
  cap: string
  statement: 'pl' | 'bs'
  row: OntologyMapping | undefined
  disabled: boolean
  display: DisplayCol
  glOptions: ErpAccountOut[]
  onSave: (b: UpsertBody) => void
  onToggleHidden: (hidden: boolean) => void
}) {
  const isBcGl = glOptions.length > 0

  const [glSelected, setGlSelected] = useState<string[]>(row?.erp_gl_json || [])
  const [glText, setGlText] = useState((row?.erp_gl_json || []).join(', '))
  const [customCaption, setCustomCaption] = useState(row?.custom_caption || '')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setGlSelected(row?.erp_gl_json || [])
    setGlText((row?.erp_gl_json || []).join(', '))
    setCustomCaption(row?.custom_caption || '')
    setDirty(false)
  }, [row])

  const hidden = !!row?.is_hidden
  const bold   = isBoldCaption(cap)

  const glPayload = isBcGl ? glSelected : splitCommaList(glText)
  const showGlWarn = !hidden && glPayload.length === 0
  const { toast } = useUiStore()

  function handleSave() {
    const nonPosting = findNonPostingGlAccounts(glPayload, glOptions)
    if (nonPosting.length > 0) {
      toast(
        `Warning: ${nonPosting.join(', ')} ${nonPosting.length === 1 ? 'is' : 'are'} non-posting (heading/subtotal). Mapping saved.`,
      )
    }
    onSave({
      statement,
      tflux_caption: cap,
      erp_gl_json: glPayload,
      custom_caption: customCaption || null,
      is_hidden: hidden,
      display_column: display,
    })
    setDirty(false)
  }

  const rowClass = [
    'ont-table__row',
    disabled ? 'ont-table__row--disabled' : '',
    hidden ? 'ont-table__row--hidden' : '',
  ].filter(Boolean).join(' ')

  return (
    <tr className={rowClass}>
      <td className="ont-table__td ont-table__td--idx">{index}</td>

      <td className="ont-table__td">
        <div className="ont-table__caption">
          {bold ? <span className="ont-table__caption-arrow" aria-hidden>▸</span> : null}
          <span
            className={[
              'ont-table__caption-text',
              bold ? 'ont-table__caption-text--bold' : '',
              hidden ? 'ont-table__caption-text--struck' : '',
            ].filter(Boolean).join(' ')}
          >
            {cap}
          </span>
          {bold && (
            <span className="ont-table__tag ont-table__tag--subtotal">SUBTOTAL</span>
          )}
          {hidden && (
            <span className="ont-table__tag ont-table__tag--hidden">HIDDEN</span>
          )}
        </div>
      </td>

      <td className="ont-table__td ont-table__td--top ont-table__td--gl">
        <div className="ont-table__gl-head">
          <span className="ont-table__gl-label">GL Accounts</span>
          {showGlWarn && (
            <span className="ont-table__gl-warn" title="No GL account mapped">
              <AlertTriangle size={11} strokeWidth={2} />
              Unmapped
            </span>
          )}
        </div>
        {isBcGl ? (
          <OntologyMultiSelect<ErpAccountOut>
            options={glOptions}
            selectedValues={glSelected}
            onChange={(vals) => { setGlSelected(vals); setDirty(true) }}
            getOptionValue={(a) => a.account_no}
            getOptionLabel={glLabel}
            placeholder="Search GL accounts…"
            emptyText="No synced GL accounts found"
            disabled={disabled || hidden}
            ariaLabel={`${cap} GL accounts`}
          />
        ) : (
          <input
            className="ont-table__input"
            value={glText}
            onChange={(e) => { setGlText(e.target.value); setDirty(true) }}
            placeholder="GL codes, comma-sep"
            aria-label={`${cap} GL accounts`}
            disabled={disabled || hidden}
          />
        )}
      </td>

      {/* Custom Caption */}
      <td className="ont-table__td">
        <input
          className="ont-table__input"
          value={customCaption}
          onChange={(e) => { setCustomCaption(e.target.value); setDirty(true) }}
          placeholder="Display name"
          aria-label={`${cap} custom display caption`}
          disabled={disabled || hidden}
        />
      </td>

      {/* Actions */}
      <td className="ont-table__td ont-table__td--actions">
        <div className="ont-table__actions">
          {!hidden && (
            <AppButton
              variant="primary"
              size="sm"
              disabled={disabled || !dirty}
              onClick={handleSave}
            >
              Save
            </AppButton>
          )}
          <AppButton
            variant={hidden ? 'primary' : 'outline'}
            size="sm"
            disabled={disabled}
            onClick={() => onToggleHidden(!hidden)}
          >
            {hidden ? 'Restore' : 'Hide'}
          </AppButton>
        </div>
      </td>
    </tr>
  )
}

type CustomAddPayload = Parameters<typeof ontApi.addCustomCaption>[1] & { existingNames: readonly string[] }

function CustomCaptionAdder({ statement, existingCustomNames, onAdd }: {
  statement: 'pl' | 'bs'
  existingCustomNames: readonly string[]
  onAdd: (b: CustomAddPayload) => void
}) {
  const [name, setName] = useState('')
  const [gl, setGl] = useState('')
  const [subTotal, setSubTotal] = useState(false)

  return (
    <div className="ont-custom-add">
      <div className="ont-custom-add__title">Add Custom Caption</div>
      <div className="ont-custom-add__grid">
        <input
          className="ont-table__input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Caption name (shown in Flux Review)"
          aria-label="Custom caption name"
        />
        <input
          className="ont-table__input"
          value={gl}
          onChange={(e) => setGl(e.target.value)}
          placeholder="GL codes, comma-sep"
          aria-label="Custom caption GL codes"
        />
        <label className="ont-custom-add__subtotal">
          <input
            type="checkbox"
            checked={subTotal}
            onChange={(e) => setSubTotal(e.target.checked)}
            aria-label="Mark custom caption as subtotal row"
          />
          Subtotal
        </label>
        <AppButton
          variant="primary"
          size="sm"
          disabled={!name.trim()}
          onClick={() => {
            onAdd({
              statement,
              name: name.trim(),
              is_subtotal: subTotal,
              erp_gl_json: splitCommaList(gl),
              existingNames: existingCustomNames,
            })
            setName('')
            setGl('')
            setSubTotal(false)
          }}
        >
          + Add
        </AppButton>
      </div>
    </div>
  )
}

function FilterPills({ value, onChange }: { value: CapFilter; onChange: (v: CapFilter) => void }) {
  const opts: Array<{ id: CapFilter; label: string; tone?: 'green' | 'amber' }> = [
    { id: 'all', label: 'All' },
    { id: 'core', label: 'Core only' },
    { id: 'custom', label: 'Custom only', tone: 'green' },
    { id: 'hidden', label: 'Hidden', tone: 'amber' },
  ]
  return (
    <div className="ont-pills" role="group" aria-label="Caption filter">
      {opts.map((o) => {
        const active = value === o.id
        const cls = [
          'ont-pills__btn',
          o.tone ? `ont-pills__btn--${o.tone}` : '',
          active ? 'ont-pills__btn--active' : '',
        ].filter(Boolean).join(' ')
        return (
          <button
            key={o.id}
            type="button"
            className={cls}
            aria-pressed={active}
            onClick={() => onChange(o.id)}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function Segmented({ values, active, onChange, disabled }: {
  values: Array<[string, string]>
  active: string
  onChange: (v: string) => void
  disabled?: boolean
}) {
  return (
    <div className={['ont-seg', disabled ? 'ont-seg--disabled' : ''].filter(Boolean).join(' ')}>
      {values.map(([v, l]) => {
        const isActive = v === active
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(v)}
            aria-pressed={isActive}
            className={['ont-seg__btn', isActive ? 'ont-seg__btn--active' : ''].filter(Boolean).join(' ')}
          >
            {l}
          </button>
        )
      })}
    </div>
  )
}

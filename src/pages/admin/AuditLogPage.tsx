// @author  veera
// @file    pages/admin/AuditLogPage.tsx

import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Box } from '@mui/material'
import { FormTextField } from '@/components/ui/FormTextField'
import type { GridColDef } from '@mui/x-data-grid'
import { ScrollText } from 'lucide-react'
import * as auditApi from '@/features/admin-audit/api'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { PageHeader } from '@/components/ui/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { AppCard } from '@/components/ui/AppCard'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import type { AuditLogRow } from '@/types/models'
import { U } from '@/constants/uiText'

function AuditDetailsCell({ before, after }: { before?: unknown; after?: unknown }) {
  const [open, setOpen] = useState(false)
  if (!before && !after) return <span className="text-muted">{U.empt}</span>
  return (
    <>
      <AppButton variant="ghost" size="sm" onClick={() => setOpen(true)} aria-label="View audit change details">
        View
      </AppButton>
      {open && (
        <div
          role="presentation"
          className="app-modal-overlay"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            className="app-modal app-modal--lg"
            onClick={(e) => e.stopPropagation()}
            aria-labelledby="audit-detail-title"
          >
            <div className="app-modal__header">
              <h2 id="audit-detail-title" className="app-modal__title">Audit detail</h2>
              <button type="button" className="app-modal__close" onClick={() => setOpen(false)} aria-label="Close">
                ×
              </button>
            </div>
            <div className="app-modal__body">
              {before != null && (
                <div style={{ marginBottom: 12 }}>
                  <div className="text-helper" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Before</div>
                  <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, background: 'var(--color-bg-muted)', padding: 10, borderRadius: 8, overflow: 'auto', margin: 0 }}>
                    {JSON.stringify(before, null, 2)}
                  </pre>
                </div>
              )}
              {after != null && (
                <div>
                  <div className="text-helper" style={{ fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>After</div>
                  <pre style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, background: 'var(--color-bg-muted)', padding: 10, borderRadius: 8, overflow: 'auto', margin: 0 }}>
                    {JSON.stringify(after, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<auditApi.AuditFilters>({ limit: 100, offset: 0 })
  const { data: rows = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['audit', filters],
    queryFn: () => auditApi.listAudit(filters),
  })

  const columns: GridColDef<AuditLogRow>[] = useMemo(() => [
    {
      field: 'created_at',
      headerName: 'When',
      flex: 1,
      minWidth: 160,
      valueGetter: (_, row) => row.created_at,
      renderCell: ({ row }) => (
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
          {new Date(row.created_at).toLocaleString()}
        </span>
      ),
    },
    {
      field: 'actor',
      headerName: 'Actor',
      flex: 0.8,
      minWidth: 120,
      valueGetter: (_, row) => row.actor?.name || `#${row.actor_user_id}`,
    },
    {
      field: 'action',
      headerName: 'Action',
      flex: 1,
      minWidth: 140,
      renderCell: ({ row }) => (
        <code style={{ fontSize: '0.75rem', color: 'var(--color-primary)' }}>{row.action}</code>
      ),
    },
    { field: 'table_name', headerName: 'Table', width: 120 },
    {
      field: 'row_pk',
      headerName: 'Row',
      width: 100,
      renderCell: ({ row }) => (
        <code style={{ fontSize: '0.75rem' }}>{row.row_pk || U.empt}</code>
      ),
    },
    {
      field: 'ip_address',
      headerName: 'IP',
      width: 120,
      valueGetter: (_, row) => row.ip_address || U.empt,
    },
    {
      field: 'details',
      headerName: 'Details',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <AuditDetailsCell before={row.before_json} after={row.after_json} />
      ),
    },
  ], [])

  return (
    <div className="admin-audit-page">
      <PageHeader
        title="Audit Log"
        subtitle="System activity and change history"
        icon={<ScrollText size={22} strokeWidth={2} />}
      />

      <AppCard>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
            mb: 2,
          }}
        >
          <FormTextField
            fieldLabel="Action prefix"
            uppercaseLabel={false}
            placeholder="e.g. signoff."
            value={filters.action || ''}
            onChange={(e) => setFilters({ ...filters, action: e.target.value || undefined })}
            fullWidth
          />
          <FormTextField
            fieldLabel="Table"
            uppercaseLabel={false}
            placeholder="Table name"
            value={filters.table || ''}
            onChange={(e) => setFilters({ ...filters, table: e.target.value || undefined })}
            fullWidth
          />
          <FormTextField
            fieldLabel="From"
            uppercaseLabel={false}
            type="datetime-local"
            onChange={(e) => setFilters({ ...filters, from: e.target.value || undefined })}
            fullWidth
          />
          <FormTextField
            fieldLabel="To"
            uppercaseLabel={false}
            type="datetime-local"
            onChange={(e) => setFilters({ ...filters, to: e.target.value || undefined })}
            fullWidth
          />
        </Box>

        {isError && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={<AppButton variant="ghost" size="sm" onClick={() => refetch()}>Retry</AppButton>}
          >
            {getApiErrorMessage(error, 'Could not load audit log.')}
          </Alert>
        )}

        <AppDataGrid
          rows={rows}
          columns={columns}
          loading={isLoading}
          getRowId={(row) => row.id}
          autoHeight
          disableRowSelectionOnClick
          initialState={{
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          sx={{ minHeight: 320 }}
          slots={{
            noRowsOverlay: () => (
              <EmptyState title="No audit entries match these filters." />
            ),
          }}
        />
      </AppCard>
    </div>
  )
}

// @author  veera
// @file    pages/admin/UsersPage.tsx
//
// Admin → User Management — enterprise UI; same behaviour, APIs and RBAC.

import { useMemo, useState } from 'react'
import {
  useAdminUsers,
  useAdminLicenses,
  useInviteUser,
  useUpdateUser,
  useDeleteUser,
  useBulkRole,
  useResendInvite,
} from '@/features/admin-users/hooks'
import type { InviteInput, UpdateInput } from '@/features/admin-users/api'
import { useAuth } from '@/features/auth/AuthProvider'
import { useEntities } from '@/features/entities/hooks'
import { useCreateEntity } from '@/features/admin-entities/hooks'
import { AddEntityDialog } from '@/features/admin-entities/AddEntityDialog'
import type { CreateInput as EntityCreateInput } from '@/features/admin-entities/api'
import { PageHeader } from '@/components/ui/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { AppCard } from '@/components/ui/AppCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { LicenseUtilizationCard } from '@/features/admin-users/components/ui/LicenseUtilizationCard'
import { RoleChip } from '@/features/admin-users/components/ui/RoleChip'
import { UserStatusChip } from '@/features/admin-users/components/ui/UserStatusChip'
import { UserRowTableActions } from '@/features/admin-users/components/ui/UserRowTableActions'
import { ReusableDialog } from '@/features/admin-users/components/ui/ReusableDialog'
import { UserFilters } from '@/features/admin-users/components/UserFilters'
import { UserBulkRoleBar } from '@/features/admin-users/components/UserBulkRoleBar'
import { UserEntityChips } from '@/features/admin-users/components/UserEntityChips'
import { UserDetailsCell } from '@/features/admin-users/components/UserDetailsCell'
import { InviteUserDialog } from '@/features/admin-users/components/InviteUserDialog'
import { EditUserDialog } from '@/features/admin-users/components/EditUserDialog'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { adminUserDisplayId } from '@/features/admin-users/utils/adminUserDisplayId'
import { roleLabel } from '@/features/admin-users/utils/roleLabel'
import type { AdminUser, Role, UserStatus } from '@/types/models'
import { Alert, Box, Snackbar, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import type { GridColDef, GridRowId, GridRowSelectionModel } from '@mui/x-data-grid'
import {
  Building2,
  CircleDot,
  Download,
  Save,
  UserPlus,
  Users,
} from 'lucide-react'

function fmtRenewal(dt?: string): string {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return dt
  }
}

export default function UsersPage() {
  const theme = useTheme()
  const colorMode = theme.palette.mode
  const isCompact = useMediaQuery(theme.breakpoints.down('lg'))

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useAdminUsers()
  const { data: entities = [] } = useEntities()
  const { data: lic } = useAdminLicenses()

  const invite = useInviteUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const bulkRole = useBulkRole()
  const resend = useResendInvite()
  const createEntity = useCreateEntity()
  const { user: me } = useAuth()

  const [q, setQ] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | ''>('')
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('')
  const [entityFilter, setEntityFilter] = useState<string | ''>('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [inviteOpen, setInviteOpen] = useState(false)
  const [entityOpen, setEntityOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null)
  type SnackSeverity = 'success' | 'error' | 'info' | 'warning'
  const [snack, setSnack] = useState<{ msg: string; severity: SnackSeverity } | null>(null)

  const showSnack = (msg: string, severity: SnackSeverity = 'success') =>
    setSnack({ msg, severity })

  const filtered = useMemo(() => users.filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false
    if (statusFilter && u.status !== statusFilter) return false
    if (entityFilter && !(u.entity_codes || []).includes(entityFilter)) return false
    if (q) {
      const s = q.toLowerCase()
      const displayId = adminUserDisplayId(u.id).toLowerCase()
      const hay = [
        u.name,
        u.email,
        String(u.id),
        displayId,
        u.department || '',
        (u.entity_codes || []).join(','),
      ].join(' ').toLowerCase()
      if (!hay.includes(s)) return false
    }
    return true
  }), [users, q, roleFilter, statusFilter, entityFilter])

  const counts = useMemo(() => ({
    active: users.filter((u) => (u.status || 'active') === 'active').length,
    invited: users.filter((u) => u.status === 'invited').length,
    disabled: users.filter((u) => u.status === 'disabled').length,
  }), [users])

  const nonDisabledCount = useMemo(
    () => users.filter((u) => u.status !== 'disabled').length,
    [users],
  )
  const seatsUsed = lic?.seats_used ?? nonDisabledCount
  const seatsTotal = lic?.seats_total ?? 200
  const utilPct = seatsTotal ? Math.min(100, Math.round((seatsUsed / seatsTotal) * 100)) : 0
  const utilColor = utilPct > 85 ? 'error' : utilPct > 60 ? 'warning' : 'success'

  const applyBulkRole = (role: Role) => {
    if (selected.size === 0) return
    bulkRole.mutate({ user_ids: Array.from(selected), role }, {
      onSuccess: () => { showSnack(`Updated ${selected.size} user(s)`); setSelected(new Set()) },
      onError: (e: unknown) => showSnack(getApiErrorMessage(e, 'Bulk role update failed'), 'error'),
    })
  }

  const rowSelectionModel: GridRowSelectionModel = useMemo(
    () => Array.from(selected) as GridRowId[],
    [selected],
  )

  const supervisors = useMemo(
    () => users.filter((u) => u.role === 'supervisor' || u.role === 'director' || u.role === 'admin'),
    [users],
  )

  const columns: GridColDef<AdminUser>[] = useMemo(() => [
    {
      field: 'name',
      headerName: 'User',
      flex: 1.35,
      minWidth: 268,
      sortable: true,
      valueGetter: (_, row) => row.name,
      renderCell: ({ row }) => <UserDetailsCell user={row} />,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 146,
      valueGetter: (_, row) => row.role,
      renderCell: ({ row }) => <RoleChip label={roleLabel(row.role)} />,
    },
    {
      field: 'entity_codes',
      headerName: 'Entities',
      flex: 0.9,
      minWidth: 200,
      sortable: false,
      valueGetter: (_, row) => (row.entity_codes || []).join(','),
      renderCell: ({ row }) => <UserEntityChips codes={row.entity_codes || []} entities={entities} />,
    },
    {
      field: 'supervisor',
      headerName: 'Supervisor',
      flex: 0.85,
      minWidth: 188,
      sortable: true,
      valueGetter: (_, row) => row.supervisor?.name || '',
      renderCell: ({ row }) =>
        row.supervisor ? (
          <Stack spacing={0.375} sx={{ minWidth: 0, width: 1, py: 0.25, justifyContent: 'center' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em', lineHeight: 1.3 }} noWrap>
              {row.supervisor.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8125rem', opacity: 0.92, lineHeight: 1.35 }} noWrap>
              {row.supervisor.email}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.75 }}>—</Typography>
        ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 138,
      align: 'center',
      headerAlign: 'center',
      valueGetter: (_, row) => row.status || 'active',
      renderCell: ({ row }) => (
        <Box sx={{ display: 'flex', width: 1, height: 1, alignItems: 'center', justifyContent: 'center' }}>
          <UserStatusChip status={row.status || 'active'} />
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 148,
      sortable: false,
      filterable: false,
      disableColumnMenu: true,
      align: 'right',
      headerAlign: 'right',
      renderCell: ({ row }) => (
        <UserRowTableActions
          row={row}
          currentUserId={me?.id}
          onEdit={(id) => setEditingId(id)}
          onDelete={(u) => setDeleteTarget(u)}
          onResendInvite={(id) => resend.mutate(id, {
            onSuccess: (data) => showSnack(
              data.email_sent
                ? 'Invitation email re-sent successfully.'
                : (data.message || 'The invitation email could not be delivered. Please try again.'),
              data.email_sent ? 'success' : 'warning',
            ),
            onError: (e: unknown) => showSnack(getApiErrorMessage(e, 'Resend failed'), 'error'),
          })}
        />
      ),
    },
  ], [entities, me?.id, resend])

  const columnVisibilityModel = useMemo(
    () => ({ supervisor: !isCompact }),
    [isCompact],
  )

  const editingUser = editingId !== null ? users.find((u) => u.id === editingId) : undefined

  return (
    <div className="users-page admin-users-scope">
      <PageHeader
        title="User Management"
        subtitle={<>Manage users, multi-entity assignments &amp; roles</>}
        icon={<Users size={22} strokeWidth={2} />}
        actions={(
          <>
            <AppButton
              variant="outline"
              size="md"
              iconLeft={<Download size={16} strokeWidth={2} />}
              onClick={() => window.open('/api/admin/users/export.csv', '_blank')}
            >
              Export
            </AppButton>
            <AppButton
              variant="outline"
              size="md"
              iconLeft={<UserPlus size={16} strokeWidth={2} />}
              onClick={() => setInviteOpen(true)}
            >
              Add User
            </AppButton>
            <AppButton
              variant="outline"
              size="md"
              iconLeft={<Building2 size={16} strokeWidth={2} />}
              onClick={() => setEntityOpen(true)}
            >
              Add Entity
            </AppButton>
            <AppButton
              variant="primary"
              size="md"
              iconLeft={<Save size={16} strokeWidth={2} />}
              onClick={() => showSnack('All changes are saved automatically', 'info')}
            >
              Save
            </AppButton>
          </>
        )}
      />

      {isError && (
        <Alert severity="error" action={(
          <AppButton variant="ghost" size="sm" onClick={() => refetch()}>
            Retry
          </AppButton>
        )}
        >
          {getApiErrorMessage(error, 'Could not load users.')}
        </Alert>
      )}

      <LicenseUtilizationCard
        seatsUsed={seatsUsed}
        seatsTotal={seatsTotal}
        utilPct={utilPct}
        utilizationSemantic={utilColor}
        renewalLabel={fmtRenewal(lic?.renewal_date)}
        counts={counts}
        mode={colorMode}
      />

      <UserFilters
        search={q}
        onSearchChange={setQ}
        roleFilter={roleFilter}
        onRoleFilterChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        entityFilter={entityFilter}
        onEntityFilterChange={setEntityFilter}
        entities={entities}
      />

      <UserBulkRoleBar
        selectedCount={selected.size}
        onApplyRole={applyBulkRole}
        onClear={() => setSelected(new Set())}
        isPending={bulkRole.isPending}
      />

      <AppCard flush>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, width: '100%' }}>
          <AppDataGrid
            rows={filtered}
            columns={columns}
            loading={isLoading}
            getRowId={(row) => row.id}
            checkboxSelection
            disableRowSelectionOnClick
            isRowSelectable={(p) => p.id !== me?.id}
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={(model) => {
              setSelected(new Set(model.map(Number)))
            }}
            pagination
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
              sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
            }}
            pageSizeOptions={[10, 25, 50]}
            columnVisibilityModel={columnVisibilityModel}
            rowHeight={76}
            columnHeaderHeight={52}
            showColumnVerticalBorder
            hideFooterSelectedRowCount
            sx={{
              border: 'none',
              height: { xs: 'min(68vh, 520px)', sm: 'min(70vh, 580px)' },
              minHeight: 300,
            }}
            slots={{
              noRowsOverlay: () => (
                <EmptyState
                  icon={<CircleDot size={22} strokeWidth={2} />}
                  title="No users match these filters."
                />
              ),
            }}
          />
        </Box>
      </AppCard>

      <AddEntityDialog
        open={entityOpen}
        supervisors={supervisors}
        isPending={createEntity.isPending}
        onClose={() => setEntityOpen(false)}
        onCreate={(body: EntityCreateInput) => {
          createEntity.mutate(body, {
            onSuccess: () => { showSnack('Entity created'); setEntityOpen(false) },
            onError: (e: unknown) => showSnack(getApiErrorMessage(e, 'Could not create entity'), 'error'),
          })
        }}
      />

      <InviteUserDialog
        open={inviteOpen}
        entities={entities}
        supervisors={supervisors}
        isSubmitting={invite.isPending}
        onClose={() => setInviteOpen(false)}
        onInvite={(body) => {
          invite.mutate(body, {
            onSuccess: (data) => {
              setInviteOpen(false)
              showSnack(
                data.email_sent
                  ? 'User created and invitation email sent successfully.'
                  : (data.message
                    || 'User created, but the invitation email was not sent. You can resend it.'),
                data.email_sent ? 'success' : 'warning',
              )
            },
            onError: (e: unknown) => showSnack(getApiErrorMessage(e, 'Unable to create user.'), 'error'),
          })
        }}
      />

      {editingUser && (
        <EditUserDialog
          open
          user={editingUser}
          entities={entities}
          supervisors={supervisors}
          onClose={() => setEditingId(null)}
          onSave={(body) => {
            updateUser.mutate({ id: editingUser.id, body }, {
              onSuccess: () => { showSnack('User updated'); setEditingId(null) },
              onError: (e: unknown) => showSnack(getApiErrorMessage(e, 'Update failed'), 'error'),
            })
          }}
        />
      )}

      <ReusableDialog
        open={Boolean(deleteTarget)}
        title="Delete user"
        maxWidth="xs"
        onClose={() => setDeleteTarget(null)}
        footer={(
          <>
            <AppButton variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</AppButton>
            <AppButton
              variant="danger"
              disabled={!deleteTarget}
              onClick={() => {
                if (!deleteTarget) return
                deleteUser.mutate(deleteTarget.id, {
                  onSuccess: () => { showSnack('User deleted'); setDeleteTarget(null) },
                  onError: (e: unknown) => showSnack(getApiErrorMessage(e, 'Cannot delete'), 'error'),
                })
              }}
            >
              Delete
            </AppButton>
          </>
        )}
      >
        <Typography variant="body2" color="text.secondary">
          Remove <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})? This action cannot be undone.
        </Typography>
      </ReusableDialog>

      <Snackbar
        open={snack !== null}
        autoHideDuration={2400}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack?.severity ?? 'info'} variant="filled" onClose={() => setSnack(null)} sx={{ width: '100%' }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </div>
  )
}

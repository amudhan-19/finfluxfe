// @author  veera
// @file    features/admin-config/components/EntitiesAdminCard.tsx

import { useMemo, useState } from 'react'
import type { GridColDef } from '@mui/x-data-grid'
import { AppDataGrid } from '@/components/ui/AppDataGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Pencil, Trash2, X } from 'lucide-react'
import * as adminEntitiesApi from '@/features/admin-entities/api'
import { useAdminUsers } from '@/features/admin-users/hooks'
import { ENTITY_REGIONS, type ConfigEntityRegion } from '@/features/admin-config/constants'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import type { AdminUser, Entity } from '@/types/models'
import { X as Xcol } from '@/constants/theme'

type CreateDraft = adminEntitiesApi.CreateInput

type EditDraft = {
  name: string
  region: ConfigEntityRegion
  supervisor_id: number
  period_from: string
  period_to: string
  currency: string
  fiscal_year_end: string
  tax_id: string
}

function defaultCreateDraft(supId: number): CreateDraft {
  return {
    id: '',
    name: '',
    region: 'North America',
    supervisor_id: supId,
    period_type: 'YoY',
    period_from: 'Mar 2026',
    period_to: 'Mar 2025',
    currency: 'USD',
    fiscal_year_end: 'Dec 31',
    tax_id: '',
    tags: [],
  }
}

function entityToEditDraft(e: Entity): EditDraft {
  return {
    name: e.name,
    region: e.region,
    supervisor_id: e.supervisor.id,
    period_from: e.period_from,
    period_to: e.period_to,
    currency: e.currency || '',
    fiscal_year_end: e.fiscal_year_end || '',
    tax_id: e.tax_id || '',
  }
}

type EntityFormFieldsProps =
  | {
    mode: 'create'
    createDraft: CreateDraft
    setCreateDraft: React.Dispatch<React.SetStateAction<CreateDraft>>
    supervisors: AdminUser[]
  }
  | {
    mode: 'edit'
    editDraft: EditDraft
    setEditDraft: React.Dispatch<React.SetStateAction<EditDraft | null>>
    supervisors: AdminUser[]
  }

function EntityFormFields(props: EntityFormFieldsProps) {
  const { supervisors } = props
  if (props.mode === 'create') {
    const { createDraft: d, setCreateDraft: setD } = props
    return (
      <Stack spacing={2}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Code" required value={d.id} onChange={(e) => setD({ ...d, id: e.target.value.toUpperCase() })} placeholder="e.g. ACM-AU" fullWidth />
          <TextField label="Currency" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} fullWidth />
        </Stack>
        <TextField label="Name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} fullWidth />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Region"
            select
            fullWidth
            value={d.region}
            onChange={(e) => setD({ ...d, region: e.target.value as ConfigEntityRegion })}
          >
            {ENTITY_REGIONS.map((r) => (
              <MenuItem key={r} value={r}>{r}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Supervisor"
            select
            fullWidth
            required
            value={d.supervisor_id || ''}
            onChange={(e) => setD({ ...d, supervisor_id: Number(e.target.value) })}
          >
            {supervisors.map((s) => (
              <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
            ))}
          </TextField>
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Period from" value={d.period_from} onChange={(e) => setD({ ...d, period_from: e.target.value })} fullWidth />
          <TextField label="Period to" value={d.period_to} onChange={(e) => setD({ ...d, period_to: e.target.value })} fullWidth />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField label="Fiscal year end" value={d.fiscal_year_end} onChange={(e) => setD({ ...d, fiscal_year_end: e.target.value })} fullWidth />
          <TextField label="Tax ID" value={d.tax_id} onChange={(e) => setD({ ...d, tax_id: e.target.value })} fullWidth />
        </Stack>
      </Stack>
    )
  }
  const { editDraft: d, setEditDraft: setD } = props
  return (
    <Stack spacing={2}>
      <TextField label="Name" required value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} fullWidth />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField
          label="Region"
          select
          fullWidth
          value={d.region}
          onChange={(e) => setD({ ...d, region: e.target.value as ConfigEntityRegion })}
        >
          {ENTITY_REGIONS.map((r) => (
            <MenuItem key={r} value={r}>{r}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Supervisor"
          select
          fullWidth
          value={d.supervisor_id}
          onChange={(e) => setD({ ...d, supervisor_id: Number(e.target.value) })}
        >
          {supervisors.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </TextField>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Period from" value={d.period_from} onChange={(e) => setD({ ...d, period_from: e.target.value })} fullWidth />
        <TextField label="Period to" value={d.period_to} onChange={(e) => setD({ ...d, period_to: e.target.value })} fullWidth />
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Currency" value={d.currency} onChange={(e) => setD({ ...d, currency: e.target.value })} fullWidth />
        <TextField label="Fiscal year end" value={d.fiscal_year_end} onChange={(e) => setD({ ...d, fiscal_year_end: e.target.value })} fullWidth />
      </Stack>
      <TextField label="Tax ID" value={d.tax_id} onChange={(e) => setD({ ...d, tax_id: e.target.value })} fullWidth />
    </Stack>
  )
}

export function EntitiesAdminCard() {
  const qc = useQueryClient()
  const { toast } = useUiStore()
  const { data: entities = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-entities'],
    queryFn: () => adminEntitiesApi.adminListEntities(),
  })
  const { data: users = [] } = useAdminUsers()
  const supervisors = users.filter((u) => u.role === 'supervisor' || u.role === 'director' || u.role === 'admin')

  const create = useMutation({
    mutationFn: (body: adminEntitiesApi.CreateInput) => adminEntitiesApi.adminCreateEntity(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-entities'] }),
  })
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: adminEntitiesApi.UpdateInput }) =>
      adminEntitiesApi.adminUpdateEntity(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-entities'] }),
  })
  const remove = useMutation({
    mutationFn: (id: string) => adminEntitiesApi.adminDeleteEntity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-entities'] }),
  })

  const [openCreate, setOpenCreate] = useState(false)
  const [editing, setEditing] = useState<Entity | null>(null)

  const supId = supervisors[0]?.id ?? 0
  const [createDraft, setCreateDraft] = useState<CreateDraft>(() => defaultCreateDraft(supId))
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)

  const openCreateModal = () => {
    const sid = supervisors[0]?.id ?? 0
    setCreateDraft(defaultCreateDraft(sid))
    setOpenCreate(true)
  }

  const openEditModal = (e: Entity) => {
    setEditing(e)
    setEditDraft(entityToEditDraft(e))
  }

  const columns: GridColDef<Entity>[] = useMemo(() => [
    {
      field: 'id',
      headerName: 'Code',
      width: 120,
      renderCell: ({ row }) => (
        <Box
          component="code"
          sx={{
            px: 0.75,
            py: 0.25,
            bgcolor: 'var(--color-primary-soft)',
            color: 'var(--color-primary)',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: 11,
          }}
        >
          {row.id}
        </Box>
      ),
    },
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'region', headerName: 'Region', width: 130 },
    {
      field: 'currency',
      headerName: 'Currency',
      width: 90,
      valueGetter: (_, row) => row.currency || '—',
    },
    {
      field: 'fiscal_year_end',
      headerName: 'FYE',
      width: 90,
      valueGetter: (_, row) => row.fiscal_year_end || '—',
    },
    {
      field: 'supervisor',
      headerName: 'Supervisor',
      flex: 0.8,
      minWidth: 140,
      valueGetter: (_, row) => row.supervisor.name,
    },
    {
      field: 'is_active',
      headerName: 'Active',
      width: 90,
      align: 'center',
      headerAlign: 'center',
      renderCell: ({ row }) => (
        <Checkbox
          size="small"
          checked={row.is_active}
          disabled={update.isPending}
          onChange={(_, checked) => {
            update.mutate(
              { id: row.id, body: { is_active: checked } },
              {
                onSuccess: () => toast('Updated'),
                onError: (err: unknown) => toast(getApiErrorMessage(err, 'Update failed')),
              },
            )
          }}
          inputProps={{ 'aria-label': `Active ${row.id}` }}
        />
      ),
    },
    {
      field: 'actions',
      headerName: '',
      width: 100,
      sortable: false,
      filterable: false,
      renderCell: ({ row }) => (
        <>
          <IconButton size="small" aria-label={`Edit ${row.id}`} onClick={() => openEditModal(row)}>
            <Pencil size={16} />
          </IconButton>
          <IconButton
            size="small"
            aria-label={`Delete ${row.id}`}
            color="error"
            onClick={() => {
              if (window.confirm(`Delete entity ${row.id}?`)) {
                remove.mutate(row.id, {
                  onSuccess: () => toast('Entity deleted'),
                  onError: (err: unknown) => toast(getApiErrorMessage(err, 'Delete failed')),
                })
              }
            }}
          >
            <Trash2 size={16} />
          </IconButton>
        </>
      ),
    },
  ], [update, remove, toast])

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
        {getApiErrorMessage(error, 'Could not load entities.')}
      </Alert>
    )
  }

  const createDisabled =
    !createDraft.id.trim() ||
    !createDraft.name.trim() ||
    create.isPending ||
    supervisors.length === 0 ||
    !createDraft.supervisor_id

  return (
    <Box sx={{ mt: 2 }}>
      {supervisors.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Add at least one supervisor, director, or admin user before creating entities.
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: Xcol.textS }}>
          {entities.length} entit{entities.length === 1 ? 'y' : 'ies'}
        </Typography>
        <Button variant="contained" size="small" onClick={openCreateModal} sx={{ fontWeight: 700 }} disabled={supervisors.length === 0}>
          + Add entity
        </Button>
      </Stack>

      <AppDataGrid
        rows={entities}
        columns={columns}
        getRowId={(row) => row.id}
        autoHeight
        disableColumnMenu
        initialState={{ pagination: { paginationModel: { pageSize: 10, page: 0 } } }}
        sx={{ minHeight: 200 }}
        slots={{
          noRowsOverlay: () => <EmptyState title="No legal entities yet." />,
        }}
      />

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Add legal entity
          <IconButton aria-label="Close" onClick={() => setOpenCreate(false)} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <EntityFormFields
            mode="create"
            createDraft={createDraft}
            setCreateDraft={setCreateDraft}
            supervisors={supervisors}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => setOpenCreate(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={createDisabled}
            onClick={() => {
              create.mutate(
                { ...createDraft, id: createDraft.id.trim().toUpperCase(), tags: createDraft.tags ?? [] },
                {
                  onSuccess: () => { toast('Entity created'); setOpenCreate(false) },
                  onError: (err: unknown) => toast(getApiErrorMessage(err, 'Create failed')),
                },
              )
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editing && editDraft)} onClose={() => { setEditing(null); setEditDraft(null); }} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {editing ? `Edit ${editing.id}` : 'Edit entity'}
          <IconButton aria-label="Close" onClick={() => { setEditing(null); setEditDraft(null); }} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {editing && editDraft && (
            <EntityFormFields
              mode="edit"
              editDraft={editDraft}
              setEditDraft={setEditDraft}
              supervisors={supervisors}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button color="inherit" onClick={() => { setEditing(null); setEditDraft(null); }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!editDraft?.name.trim() || !editing || update.isPending}
            onClick={() => {
              if (!editing || !editDraft) return
              update.mutate(
                {
                  id: editing.id,
                  body: {
                    name: editDraft.name.trim(),
                    region: editDraft.region,
                    supervisor_id: editDraft.supervisor_id,
                    period_from: editDraft.period_from,
                    period_to: editDraft.period_to,
                    currency: editDraft.currency || undefined,
                    fiscal_year_end: editDraft.fiscal_year_end || undefined,
                    tax_id: editDraft.tax_id || undefined,
                  },
                },
                {
                  onSuccess: () => { toast('Entity updated'); setEditing(null); setEditDraft(null); },
                  onError: (err: unknown) => toast(getApiErrorMessage(err, 'Update failed')),
                },
              )
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

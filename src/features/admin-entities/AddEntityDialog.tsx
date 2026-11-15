// @author  veera
// @file    features/admin-entities/AddEntityDialog.tsx
//
// Admin → User Management — "Add Entity" dialog.
// Uses the existing ReusableDialog shell and POST /api/admin/entities.

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { ReusableDialog } from '@/features/admin-users/components/ui/ReusableDialog'
import type { AdminUser } from '@/types/models'
import type { CreateInput } from './api'

type Region = 'North America' | 'Europe' | 'APAC'
type PeriodType = 'YoY' | 'MoM' | 'QoQ' | 'Custom'
type ApprovalLevel = 'supervisor' | 'director'

interface FormState {
  id: string
  name: string
  region: Region | ''
  supervisor_id: number | ''
  director_id: number | ''
  approval_level: ApprovalLevel
  period_type: PeriodType
  period_from: string
  period_to: string
  sub_due_date: string
  rev_due_date: string
  currency: string
  fiscal_year_end: string
  tax_id: string
  is_active: boolean
}

const INITIAL: FormState = {
  id: '',
  name: '',
  region: '',
  supervisor_id: '',
  director_id: '',
  approval_level: 'supervisor',
  period_type: 'YoY',
  period_from: '',
  period_to: '',
  sub_due_date: '',
  rev_due_date: '',
  currency: '',
  fiscal_year_end: '',
  tax_id: '',
  is_active: true,
}

interface Errors {
  id?: string
  name?: string
  region?: string
  supervisor_id?: string
  period_from?: string
  period_to?: string
}

function validate(d: FormState): Errors {
  const e: Errors = {}
  if (!d.id.trim()) e.id = 'Entity Code is required'
  else if (d.id.trim().length < 2) e.id = 'Entity Code must be at least 2 characters'
  else if (d.id.trim().length > 20) e.id = 'Entity Code must be at most 20 characters'
  if (!d.name.trim()) e.name = 'Entity Name is required'
  if (!d.region) e.region = 'Region is required'
  if (d.supervisor_id === '') e.supervisor_id = 'Supervisor is required'
  if (!d.period_from) e.period_from = 'Period From is required'
  if (!d.period_to) e.period_to = 'Period To is required'
  return e
}

function toPayload(d: FormState): CreateInput {
  return {
    id: d.id.trim().toUpperCase(),
    name: d.name.trim(),
    region: d.region as Region,
    supervisor_id: d.supervisor_id as number,
    director_id: d.director_id !== '' ? (d.director_id as number) : undefined,
    approval_level: d.approval_level,
    period_type: d.period_type,
    period_from: d.period_from,
    period_to: d.period_to,
    sub_due_date: d.sub_due_date || undefined,
    rev_due_date: d.rev_due_date || undefined,
    currency: d.currency.trim() || undefined,
    fiscal_year_end: d.fiscal_year_end.trim() || undefined,
    tax_id: d.tax_id.trim() || undefined,
    is_active: d.is_active,
  }
}

export type AddEntityDialogProps = {
  open: boolean
  onClose: () => void
  onCreate: (body: CreateInput) => void
  supervisors: AdminUser[]
  isPending?: boolean
}

export function AddEntityDialog({
  open,
  onClose,
  onCreate,
  supervisors,
  isPending = false,
}: AddEntityDialogProps) {
  const [d, setD] = useState<FormState>(INITIAL)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (open) {
      setD(INITIAL)
      setSubmitted(false)
    }
  }, [open])

  const errors = useMemo(() => validate(d), [d])
  const hasErrors = Object.keys(errors).length > 0

  const directors = useMemo(
    () => supervisors.filter((u) => u.role === 'director' || u.role === 'admin'),
    [supervisors],
  )

  const set = (patch: Partial<FormState>) => setD((prev) => ({ ...prev, ...patch }))

  function handleSubmit() {
    setSubmitted(true)
    if (hasErrors) return
    onCreate(toPayload(d))
  }

  const err = submitted ? errors : {}

  return (
    <ReusableDialog
      open={open}
      onClose={onClose}
      title="Add Entity"
      maxWidth="md"
      scroll="paper"
      footer={(
        <>
          <Button color="secondary" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Creating…' : 'Create Entity'}
          </Button>
        </>
      )}
    >
      <Grid container spacing={2}>
        {/* Row 1: Entity Code + Entity Name */}
        <Grid item xs={12} sm={4}>
          <TextField
            label="Entity Code"
            value={d.id}
            onChange={(e) => set({ id: e.target.value })}
            fullWidth
            required
            inputProps={{ maxLength: 20 }}
            error={Boolean(err.id)}
            helperText={err.id ?? 'Unique identifier, e.g. US-NYC-01'}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} sm={8}>
          <TextField
            label="Entity Name"
            value={d.name}
            onChange={(e) => set({ name: e.target.value })}
            fullWidth
            required
            error={Boolean(err.name)}
            helperText={err.name}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>

        {/* Row 2: Region + Currency */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={Boolean(err.region)}>
            <InputLabel id="ae-region">Region</InputLabel>
            <Select
              labelId="ae-region"
              label="Region"
              value={d.region}
              onChange={(e) => set({ region: e.target.value as Region | '' })}
              sx={{ borderRadius: '10px' }}
            >
              {(['North America', 'Europe', 'APAC'] as Region[]).map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
            {err.region && <FormHelperText>{err.region}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Currency"
            value={d.currency}
            onChange={(e) => set({ currency: e.target.value })}
            fullWidth
            placeholder="e.g. USD"
            inputProps={{ maxLength: 10 }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>

        {/* Row 3: Fiscal Year End + Tax ID */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Fiscal Year End"
            value={d.fiscal_year_end}
            onChange={(e) => set({ fiscal_year_end: e.target.value })}
            fullWidth
            placeholder="e.g. Dec 31"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Tax ID"
            value={d.tax_id}
            onChange={(e) => set({ tax_id: e.target.value })}
            fullWidth
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>

        {/* Row 4: Supervisor + Director */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required error={Boolean(err.supervisor_id)}>
            <InputLabel id="ae-sup">Supervisor</InputLabel>
            <Select
              labelId="ae-sup"
              label="Supervisor"
              value={d.supervisor_id}
              onChange={(e) =>
                set({ supervisor_id: e.target.value === '' ? '' : Number(e.target.value) })
              }
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">Select supervisor</MenuItem>
              {supervisors.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
              ))}
            </Select>
            {err.supervisor_id && <FormHelperText>{err.supervisor_id}</FormHelperText>}
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="ae-dir">Director</InputLabel>
            <Select
              labelId="ae-dir"
              label="Director"
              value={d.director_id}
              onChange={(e) =>
                set({ director_id: e.target.value === '' ? '' : Number(e.target.value) })
              }
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">None</MenuItem>
              {directors.map((u) => (
                <MenuItem key={u.id} value={u.id}>{u.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Row 5: Approval Level + Period Type */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="ae-approval">Approval Level</InputLabel>
            <Select
              labelId="ae-approval"
              label="Approval Level"
              value={d.approval_level}
              onChange={(e) => set({ approval_level: e.target.value as ApprovalLevel })}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="supervisor">Supervisor</MenuItem>
              <MenuItem value="director">Director</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="ae-period-type">Period Type</InputLabel>
            <Select
              labelId="ae-period-type"
              label="Period Type"
              value={d.period_type}
              onChange={(e) => set({ period_type: e.target.value as PeriodType })}
              sx={{ borderRadius: '10px' }}
            >
              {(['YoY', 'MoM', 'QoQ', 'Custom'] as PeriodType[]).map((p) => (
                <MenuItem key={p} value={p}>{p}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Row 6: Period From + Period To */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Period From"
            type="date"
            value={d.period_from}
            onChange={(e) => set({ period_from: e.target.value })}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            error={Boolean(err.period_from)}
            helperText={err.period_from}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Period To"
            type="date"
            value={d.period_to}
            onChange={(e) => set({ period_to: e.target.value })}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
            error={Boolean(err.period_to)}
            helperText={err.period_to}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>

        {/* Row 7: Submission Due Date + Review Due Date */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Submission Due Date"
            type="date"
            value={d.sub_due_date}
            onChange={(e) => set({ sub_due_date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Review Due Date"
            type="date"
            value={d.rev_due_date}
            onChange={(e) => set({ rev_due_date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />
        </Grid>

        {/* Row 8: Status toggle */}
        <Grid item xs={12}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <FormControlLabel
              control={
                <Switch
                  checked={d.is_active}
                  onChange={(e) => set({ is_active: e.target.checked })}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color={d.is_active ? 'text.primary' : 'text.secondary'}>
                  {d.is_active ? 'Active' : 'Inactive'}
                </Typography>
              }
            />
          </Stack>
        </Grid>
      </Grid>
    </ReusableDialog>
  )
}

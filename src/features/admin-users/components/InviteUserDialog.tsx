// @author  veera
// @file    features/admin-users/components/InviteUserDialog.tsx

import { useEffect, useMemo, useState } from 'react'
import { Autocomplete, Button, Chip, Stack, TextField } from '@mui/material'
import type { InviteInput } from '@/features/admin-users/api'
import { FormField } from '@/components/ui/FormField'
import { FormSelect } from '@/components/ui/FormSelect'
import { FormTextField } from '@/components/ui/FormTextField'
import { inputControlSx } from '@/components/ui/inputStyles'
import { ADMIN_USER_ROLES } from '@/features/admin-users/adminUserRoles'
import { ReusableDialog } from '@/features/admin-users/components/ui/ReusableDialog'
import { roleLabel } from '@/features/admin-users/utils/roleLabel'
import type { AdminUser, Entity, Role } from '@/types/models'

type InviteFormState = Omit<InviteInput, 'department' | 'supervisor_user_id' | 'entity_ids'> & {
  department: string
  supervisor_user_id?: number
  entity_ids: string[]
}

function inviteFormValid(d: InviteFormState): boolean {
  if (!d.email.trim() || !d.first_name.trim() || !d.last_name.trim()) return false
  if (d.entity_ids.length === 0) return false
  if (d.role === 'analyst' && (d.supervisor_user_id == null || Number.isNaN(d.supervisor_user_id))) return false
  return true
}

export type InviteUserDialogProps = {
  open: boolean
  onClose: () => void
  onInvite: (body: InviteInput) => void
  entities: Entity[]
  supervisors: AdminUser[]
  isSubmitting?: boolean
}

export function InviteUserDialog({
  open,
  onClose,
  onInvite,
  entities,
  supervisors,
  isSubmitting = false,
}: InviteUserDialogProps) {
  const [d, setD] = useState<InviteFormState>({
    first_name: '', last_name: '', email: '', role: 'analyst', department: '',
    supervisor_user_id: undefined, entity_ids: [],
  })

  useEffect(() => {
    if (open) {
      setD({
        first_name: '', last_name: '', email: '', role: 'analyst', department: '',
        supervisor_user_id: undefined, entity_ids: [],
      })
    }
  }, [open])

  const entityValue = useMemo(
    () => entities.filter((e) => d.entity_ids.includes(e.id)),
    [entities, d.entity_ids],
  )

  const canSubmit = inviteFormValid(d)

  return (
    <ReusableDialog
      open={open}
      onClose={onClose}
      title="Invite New User"
      maxWidth="sm"
      footer={(
        <>
          <Button variant="outlined" color="primary" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!canSubmit || isSubmitting}
            onClick={() => {
              if (!canSubmit || isSubmitting) return
              onInvite({
                email: d.email.trim(),
                first_name: d.first_name.trim(),
                last_name: d.last_name.trim(),
                role: d.role,
                department: d.department.trim() || undefined,
                supervisor_user_id: d.role === 'analyst' ? d.supervisor_user_id : undefined,
                entity_ids: d.entity_ids.length ? d.entity_ids : undefined,
              })
            }}
          >
            {isSubmitting ? 'Sending…' : 'Send invitation'}
          </Button>
        </>
      )}
    >
      <>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ '& > *': { flex: '1 1 0', minWidth: 0 } }}
        >
          <FormTextField
            fieldLabel="First name"
            required
            placeholder="Enter first name"
            value={d.first_name}
            onChange={(e) => setD({ ...d, first_name: e.target.value })}
            fullWidth
          />
          <FormTextField
            fieldLabel="Last name"
            required
            placeholder="Enter last name"
            value={d.last_name}
            onChange={(e) => setD({ ...d, last_name: e.target.value })}
            fullWidth
          />
        </Stack>
        <FormTextField
          fieldLabel="Email"
          required
          type="email"
          placeholder="Enter email address"
          value={d.email}
          onChange={(e) => setD({ ...d, email: e.target.value })}
          fullWidth
        />
        <FormSelect
          fieldLabel="Role"
          required
          placeholder="Select role"
          value={d.role}
          onChange={(e) => setD({ ...d, role: e.target.value as Role, supervisor_user_id: undefined })}
          options={ADMIN_USER_ROLES.map((r) => ({ value: r, label: roleLabel(r) }))}
        />
        <FormTextField
          fieldLabel="Department"
          placeholder="Enter department"
          value={d.department}
          onChange={(e) => setD({ ...d, department: e.target.value })}
          fullWidth
        />
        {d.role === 'analyst' && (
          <FormSelect
            fieldLabel="Supervisor"
            required
            placeholder="Select supervisor"
            value={d.supervisor_user_id ?? ''}
            onChange={(e) => setD({
              ...d,
              supervisor_user_id: e.target.value === '' ? undefined : Number(e.target.value),
            })}
            options={[
              { value: '', label: 'Select supervisor' },
              ...supervisors.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        )}
        <FormField label="Assigned entities" required uppercase>
          <Autocomplete
            multiple
            options={entities}
            value={entityValue}
            onChange={(_, v) => setD({ ...d, entity_ids: v.map((e) => e.id) })}
            getOptionLabel={(o) => `${o.id} — ${o.name}`}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select one or more entities"
                className="app-input-control"
                sx={inputControlSx}
                slotProps={{
                  inputLabel: { sx: { display: 'none' } },
                }}
              />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, i) => (
                <Chip {...getTagProps({ index: i })} key={option.id} size="small" label={option.id} variant="outlined" />
              ))}
          />
        </FormField>
      </>
    </ReusableDialog>
  )
}

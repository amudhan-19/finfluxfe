// @author  veera
// @file    features/admin-users/components/EditUserDialog.tsx

import { useEffect, useMemo, useState } from 'react'
import { Autocomplete, Button, Chip, Stack, TextField } from '@mui/material'
import type { UpdateInput } from '@/features/admin-users/api'
import { FormField } from '@/components/ui/FormField'
import { FormSelect } from '@/components/ui/FormSelect'
import { FormTextField } from '@/components/ui/FormTextField'
import { inputControlSx } from '@/components/ui/inputStyles'
import { ADMIN_USER_ROLES, ADMIN_USER_STATUSES } from '@/features/admin-users/adminUserRoles'
import { ReusableDialog } from '@/features/admin-users/components/ui/ReusableDialog'
import { roleLabel } from '@/features/admin-users/utils/roleLabel'
import type { AdminUser, Entity, Role, UserStatus } from '@/types/models'

export type EditForm = {
  first_name: string
  last_name: string
  email: string
  role: Role
  status: UserStatus
  department: string
  supervisor_user_id?: number
  entity_ids: string[]
}

function splitName(name: string): { first: string; last: string } {
  const parts = name.trim().split(/\s+/)
  const first = parts[0] || ''
  const last = parts.slice(1).join(' ')
  return { first, last }
}

export type EditUserDialogProps = {
  open: boolean
  user: AdminUser
  onClose: () => void
  onSave: (body: UpdateInput) => void
  entities: Entity[]
  supervisors: AdminUser[]
}

export function EditUserDialog({
  open,
  user,
  onClose,
  onSave,
  entities,
  supervisors,
}: EditUserDialogProps) {
  const [d, setD] = useState<EditForm>(() => {
    const { first, last } = splitName(user.name)
    return {
      first_name: first,
      last_name: last,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      department: user.department || '',
      supervisor_user_id: user.supervisor?.id,
      entity_ids: user.entity_codes || [],
    }
  })

  useEffect(() => {
    const { first, last } = splitName(user.name)
    setD({
      first_name: first,
      last_name: last,
      email: user.email,
      role: user.role,
      status: user.status || 'active',
      department: user.department || '',
      supervisor_user_id: user.supervisor?.id,
      entity_ids: user.entity_codes || [],
    })
  }, [user])

  const entityValue = useMemo(
    () => entities.filter((e) => d.entity_ids.includes(e.id)),
    [entities, d.entity_ids],
  )

  return (
    <ReusableDialog
      open={open}
      onClose={onClose}
      title={`Edit user — ${user.name}`}
      maxWidth="sm"
      footer={(
        <>
          <Button variant="outlined" color="primary" onClick={onClose}>Cancel</Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => onSave({
              first_name: d.first_name,
              last_name: d.last_name,
              email: d.email,
              role: d.role,
              status: d.status,
              department: d.department.trim() || undefined,
              supervisor_user_id: d.role === 'analyst' ? d.supervisor_user_id : undefined,
              entity_ids: d.entity_ids,
            })}
          >
            Save changes
          </Button>
        </>
      )}
    >
      <>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormTextField
            fieldLabel="First name"
            placeholder="Enter first name"
            value={d.first_name}
            onChange={(e) => setD({ ...d, first_name: e.target.value })}
            fullWidth
          />
          <FormTextField
            fieldLabel="Last name"
            placeholder="Enter last name"
            value={d.last_name}
            onChange={(e) => setD({ ...d, last_name: e.target.value })}
            fullWidth
          />
        </Stack>
        <FormTextField
          fieldLabel="Email"
          type="email"
          placeholder="Enter email address"
          value={d.email}
          onChange={(e) => setD({ ...d, email: e.target.value })}
          fullWidth
        />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <FormSelect
            fieldLabel="Role"
            placeholder="Select role"
            value={d.role}
            onChange={(e) => {
              const r = e.target.value as Role
              setD({
                ...d,
                role: r,
                supervisor_user_id: r === 'analyst' ? d.supervisor_user_id : undefined,
              })
            }}
            options={ADMIN_USER_ROLES.map((r) => ({ value: r, label: roleLabel(r) }))}
          />
          <FormSelect
            fieldLabel="Status"
            placeholder="Select status"
            value={d.status}
            onChange={(e) => setD({ ...d, status: e.target.value as UserStatus })}
            options={ADMIN_USER_STATUSES.map((s) => ({ value: s, label: roleLabel(s) }))}
          />
        </Stack>
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
            placeholder="Select supervisor"
            value={d.supervisor_user_id ?? ''}
            onChange={(e) => setD({
              ...d,
              supervisor_user_id: e.target.value === '' ? undefined : Number(e.target.value),
            })}
            options={[
              { value: '', label: 'None' },
              ...supervisors.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />
        )}
        <FormField label="Entity access" uppercase>
          <Autocomplete
            multiple
            options={entities}
            value={entityValue}
            onChange={(_, v) => setD({ ...d, entity_ids: v.map((e) => e.id) })}
            getOptionLabel={(o) => `${o.id} — ${o.name}`}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="Select entities"
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

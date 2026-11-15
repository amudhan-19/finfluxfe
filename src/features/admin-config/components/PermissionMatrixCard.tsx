// @author  veera
// @file    features/admin-config/components/PermissionMatrixCard.tsx

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, CircularProgress, Typography } from '@mui/material'
import * as rbacApi from '@/features/admin-rbac/api'
import { sortPermissionGroups } from '@/features/admin-config/constants'
import { ConfigGroupTabs } from '@/features/admin-config/components/ConfigGroupTabs'
import { ConfigMatrixTable } from '@/features/admin-config/components/ConfigMatrixTable'
import { listIncludes, toggleKeyInList, type StringListByRole } from '@/features/admin-config/moduleAccessHelpers'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import type { PermissionRow, Role } from '@/types/models'

function groupPermissions(perms: PermissionRow[]): Record<string, PermissionRow[]> {
  return perms.reduce<Record<string, PermissionRow[]>>((acc, p) => {
    const g = p.group || 'Other'
    if (!acc[g]) acc[g] = []
    acc[g].push(p)
    return acc
  }, {})
}

export function PermissionMatrixCard() {
  const qc = useQueryClient()
  const { toast } = useUiStore()
  const [activeGroup, setActiveGroup] = useState<string>('')

  const { data: perms = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-perms'],
    queryFn: () => rbacApi.getPermissions(),
  })
  const { data: rp = {}, isLoading: rpLoading, isError: rpErr, error: rpError, refetch: refetchRp } = useQuery({
    queryKey: ['admin-rp'],
    queryFn: () => rbacApi.getRolePermissions(),
  })
  const typedRp = rp as StringListByRole

  const set = useMutation({
    mutationFn: ({ role_key, permission_keys }: { role_key: Role; permission_keys: string[] }) =>
      rbacApi.setRolePermissions(role_key, permission_keys),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-rp'] }),
  })

  const onToggle = (role: Role, permKey: string, checked: boolean) => {
    const next = toggleKeyInList(typedRp[role], permKey, checked)
    set.mutate(
      { role_key: role, permission_keys: next },
      {
        onSuccess: () => toast(`${role} permissions saved`),
        onError: (e: unknown) => toast(getApiErrorMessage(e, 'Save failed')),
      },
    )
  }

  const grouped = useMemo(() => groupPermissions(perms), [perms])
  const groupNames = useMemo(() => sortPermissionGroups(Object.keys(grouped)), [grouped])

  useEffect(() => {
    if (!groupNames.length) {
      setActiveGroup('')
      return
    }
    if (!activeGroup || !groupNames.includes(activeGroup)) {
      setActiveGroup(groupNames[0])
    }
  }, [groupNames, activeGroup])

  const activeItems = activeGroup ? grouped[activeGroup] ?? [] : []

  const loading = isLoading || rpLoading
  const failed = isError || rpErr
  const errObj = isError ? error : rpError

  if (loading) {
    return (
      <div className="config-matrix-loading">
        <CircularProgress size={28} color="primary" />
      </div>
    )
  }

  if (failed) {
    return (
      <div className="config-matrix-error">
        <Alert
          severity="error"
          action={(
            <Button color="inherit" size="small" onClick={() => { refetch(); refetchRp(); }}>
              Retry
            </Button>
          )}
        >
          {getApiErrorMessage(errObj, 'Could not load permissions matrix.')}
        </Alert>
      </div>
    )
  }

  if (perms.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
        No permissions defined.
      </Typography>
    )
  }

  return (
    <div className="config-perm-panel">
      <ConfigGroupTabs
        groups={groupNames}
        active={activeGroup}
        onChange={setActiveGroup}
      />
      {activeItems.length > 0 ? (
        <div
          className="config-perm-panel__content"
          role="tabpanel"
          aria-label={`${activeGroup} permissions`}
        >
          <ConfigMatrixTable
            firstColumnLabel="Permission"
            rows={activeItems.map((p) => ({ key: p.key, label: p.label }))}
            isChecked={(role, key) => listIncludes(typedRp[role], key)}
            onToggle={onToggle}
            disabled={set.isPending}
          />
        </div>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          No permissions in this category.
        </Typography>
      )}
    </div>
  )
}

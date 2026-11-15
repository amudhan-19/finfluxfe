// @author  veera
// @file    features/admin-config/components/ModuleAccessCard.tsx

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Alert, Button, CircularProgress } from '@mui/material'
import * as rbacApi from '@/features/admin-rbac/api'
import { CONFIG_MODULE_ROWS } from '@/features/admin-config/constants'
import { ConfigMatrixTable } from '@/features/admin-config/components/ConfigMatrixTable'
import { listIncludes, toggleKeyInList, type StringListByRole } from '@/features/admin-config/moduleAccessHelpers'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import type { Role } from '@/types/models'

export function ModuleAccessCard() {
  const qc = useQueryClient()
  const { toast } = useUiStore()
  const { data: ma = {}, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-modules'],
    queryFn: () => rbacApi.getModuleAccess(),
  })
  const typedMa = ma as StringListByRole

  const set = useMutation({
    mutationFn: ({ role_key, modules }: { role_key: Role; modules: string[] }) =>
      rbacApi.setModuleAccess(role_key, modules),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-modules'] }),
  })

  const onToggle = (role: Role, moduleKey: string, checked: boolean) => {
    const next = toggleKeyInList(typedMa[role], moduleKey, checked)
    set.mutate(
      { role_key: role, modules: next },
      {
        onSuccess: () => toast(`${role} module access updated`),
        onError: (e: unknown) => toast(getApiErrorMessage(e, 'Update failed')),
      },
    )
  }

  if (isLoading) {
    return (
      <div className="config-matrix-loading">
        <CircularProgress size={28} color="primary" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="config-matrix-error">
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
          {getApiErrorMessage(error, 'Could not load module access.')}
        </Alert>
      </div>
    )
  }

  return (
    <ConfigMatrixTable
      rows={CONFIG_MODULE_ROWS.map(({ key, label }) => ({ key, label }))}
      isChecked={(role, key) => listIncludes(typedMa[role], key)}
      onToggle={onToggle}
      disabled={set.isPending}
    />
  )
}

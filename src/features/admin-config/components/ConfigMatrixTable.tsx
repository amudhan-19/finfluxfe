// @author  veera
// @file    features/admin-config/components/ConfigMatrixTable.tsx

import { Checkbox } from '@mui/material'
import { roleLabel } from '@/features/admin-users/utils/roleLabel'
import type { Role } from '@/types/models'

const ROLES_NON_ADMIN: Role[] = ['analyst', 'supervisor', 'director']

export type ConfigMatrixRow = {
  key: string
  label: string
}

export type ConfigMatrixTableProps = {
  rows: ConfigMatrixRow[]
  isChecked: (role: Role, key: string) => boolean
  onToggle: (role: Role, key: string, checked: boolean) => void
  disabled?: boolean
  firstColumnLabel?: string
  adminColumnLabel?: string
}

export function ConfigMatrixTable({
  rows,
  isChecked,
  onToggle,
  disabled = false,
  firstColumnLabel = 'Module',
  adminColumnLabel = 'Admin (locked)',
}: ConfigMatrixTableProps) {
  return (
    <div className="config-matrix-wrap">
      <table className="config-matrix">
        <thead>
          <tr>
            <th className="config-matrix__th config-matrix__th--module">{firstColumnLabel}</th>
            {ROLES_NON_ADMIN.map((r) => (
              <th key={r} className="config-matrix__th config-matrix__th--role">
                {roleLabel(r)}
              </th>
            ))}
            <th className="config-matrix__th config-matrix__th--role config-matrix__th--locked">
              {adminColumnLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ key, label }) => (
            <tr key={key} className="config-matrix__row">
              <td className="config-matrix__td config-matrix__td--module">
                <span className="config-matrix__label">{label}</span>
                <span className="config-matrix__key">{key}</span>
              </td>
              {ROLES_NON_ADMIN.map((r) => (
                <td key={r} className="config-matrix__td config-matrix__td--check">
                  <Checkbox
                    size="small"
                    className="config-matrix__checkbox"
                    checked={isChecked(r, key)}
                    disabled={disabled}
                    onChange={(_, checked) => onToggle(r, key, checked)}
                    inputProps={{ 'aria-label': `${label} for ${roleLabel(r)}` }}
                  />
                </td>
              ))}
              <td className="config-matrix__td config-matrix__td--check">
                <Checkbox
                  size="small"
                  className="config-matrix__checkbox config-matrix__checkbox--locked"
                  checked
                  disabled
                  title="Admin always has full access"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

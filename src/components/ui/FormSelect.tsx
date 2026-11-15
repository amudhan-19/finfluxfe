import {
  Box,
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
  type SelectProps,
} from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { FormField } from './FormField'
import { inputControlSx, placeholderSx } from './inputStyles'

export type FormSelectOption = {
  value: string | number
  label: string
}

export type FormSelectProps = Omit<SelectProps, 'label'> & {
  fieldLabel?: string
  uppercaseLabel?: boolean
  required?: boolean
  placeholder?: string
  options: FormSelectOption[]
}

export function FormSelect({
  fieldLabel,
  uppercaseLabel = true,
  required,
  placeholder = 'Select…',
  options,
  value,
  onChange,
  fullWidth = true,
  sx,
  id,
  ...props
}: FormSelectProps) {
  const strValue = value === undefined || value === null ? '' : String(value)
  const selectedLabel = options.find((o) => String(o.value) === strValue)?.label

  const control = (
    <FormControl
      fullWidth={fullWidth}
      required={required}
      className="app-input-control"
      sx={sx ? ([inputControlSx, sx] as SxProps<Theme>) : inputControlSx}
    >
      <Select
        id={id}
        value={value ?? ''}
        onChange={onChange}
        displayEmpty={Boolean(placeholder)}
        input={<OutlinedInput notched={false} />}
        renderValue={(): ReactNode => {
          if (selectedLabel) return selectedLabel
          if (placeholder) {
            return <Box component="span" sx={placeholderSx}>{placeholder}</Box>
          }
          return ''
        }}
        {...props}
      >
        {options.map((o) => (
          <MenuItem key={String(o.value)} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )

  if (!fieldLabel) return control

  return (
    <FormField label={fieldLabel} required={required} htmlFor={id} uppercase={uppercaseLabel}>
      {control}
    </FormField>
  )
}

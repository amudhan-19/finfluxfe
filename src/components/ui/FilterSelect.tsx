import { Box, FormControl, MenuItem, OutlinedInput, Select, type SelectChangeEvent } from '@mui/material'
import type { SxProps, Theme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { inputControlSx, placeholderSx } from './inputStyles'

export type FilterSelectOption = {
  value: string
  label: string
}

export type FilterSelectProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  options: FilterSelectOption[]
  'aria-label': string
  id?: string
  className?: string
  fullWidth?: boolean
  sx?: SxProps<Theme>
}

/**
 * Filter bar select — placeholder only inside field, no floating label.
 */
export function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  'aria-label': ariaLabel,
  id,
  className = '',
  fullWidth = true,
  sx,
}: FilterSelectProps) {
  const handleChange = (e: SelectChangeEvent<string>) => {
    onChange(e.target.value)
  }

  const selectedLabel = options.find((o) => o.value === value)?.label
  const rootClass = ['app-filter-select', className].filter(Boolean).join(' ')

  return (
    <FormControl
      fullWidth={fullWidth}
      sx={sx ? ([inputControlSx, sx] as SxProps<Theme>) : inputControlSx}
      className={rootClass}
    >
      <Select
        id={id}
        value={value}
        onChange={handleChange}
        displayEmpty
        input={<OutlinedInput notched={false} />}
        renderValue={(): ReactNode => {
          if (selectedLabel) return selectedLabel
          return <Box component="span" sx={placeholderSx}>{placeholder}</Box>
        }}
        inputProps={{ 'aria-label': ariaLabel }}
      >
        {options.map((o) => (
          <MenuItem key={o.value || '__empty'} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
}

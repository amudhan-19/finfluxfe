import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import type { SxProps, Theme } from '@mui/material/styles'
import dayjs, { type Dayjs } from 'dayjs'
import { FormField } from './FormField'
import { inputControlSx } from './inputStyles'

export type FormDatePickerProps = {
  fieldLabel?: string
  uppercaseLabel?: boolean
  required?: boolean
  id?: string
  value: string
  onChange: (value: string) => void
  fullWidth?: boolean
  disabled?: boolean
  className?: string
  sx?: SxProps<Theme>
}

function parseDate(value: string): Dayjs | null {
  if (!value) return null
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : null
}

export function FormDatePicker({
  fieldLabel,
  uppercaseLabel = true,
  required,
  id,
  value,
  onChange,
  fullWidth = true,
  disabled,
  className = '',
  sx,
}: FormDatePickerProps) {
  const control = (
    <DatePicker
      value={parseDate(value)}
      onChange={(next) => onChange(next?.isValid() ? next.format('YYYY-MM-DD') : '')}
      disabled={disabled}
      className={['app-input-control', className].filter(Boolean).join(' ')}
      slotProps={{
        textField: {
          id,
          size: 'small',
          fullWidth,
          required,
        },
        openPickerButton: {
          'aria-label': 'Open calendar',
        },
      }}
      sx={sx ? ([inputControlSx, sx] as SxProps<Theme>) : inputControlSx}
    />
  )

  if (!fieldLabel) return control

  return (
    <FormField label={fieldLabel} required={required} htmlFor={id} uppercase={uppercaseLabel}>
      {control}
    </FormField>
  )
}

import { TimePicker } from '@mui/x-date-pickers/TimePicker'
import type { SxProps, Theme } from '@mui/material/styles'
import dayjs, { type Dayjs } from 'dayjs'
import { FormField } from './FormField'
import { inputControlSx } from './inputStyles'

export type FormTimePickerProps = {
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

function parseTime(value: string): Dayjs | null {
  if (!value) return null
  const parsed = dayjs(value, 'HH:mm', true)
  return parsed.isValid() ? parsed : null
}

export function FormTimePicker({
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
}: FormTimePickerProps) {
  const control = (
    <TimePicker
      value={parseTime(value)}
      onChange={(next) => onChange(next?.isValid() ? next.format('HH:mm') : '')}
      disabled={disabled}
      ampm={false}
      className={['app-input-control', className].filter(Boolean).join(' ')}
      slotProps={{
        textField: {
          id,
          size: 'small',
          fullWidth,
          required,
        },
        openPickerButton: {
          'aria-label': 'Open time picker',
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

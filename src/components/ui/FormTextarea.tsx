import { TextField, type TextFieldProps } from '@mui/material'
import { FormField } from './FormField'
import { inputControlSx } from './inputStyles'

export type FormTextareaProps = Omit<TextFieldProps, 'label' | 'variant' | 'multiline'> & {
  fieldLabel?: string
  uppercaseLabel?: boolean
  rows?: number
}

/**
 * Multiline text input with label above and placeholder inside only.
 */
export function FormTextarea({
  fieldLabel,
  uppercaseLabel = true,
  required,
  placeholder,
  rows = 4,
  sx,
  id,
  ...props
}: FormTextareaProps) {
  const field = (
    <TextField
      id={id}
      variant="outlined"
      size="small"
      multiline
      rows={rows}
      required={required}
      placeholder={placeholder}
      className="app-input-control app-textarea-control"
      sx={[inputControlSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
      slotProps={{
        inputLabel: { shrink: false, sx: { display: 'none' } },
      }}
      {...props}
    />
  )

  if (!fieldLabel) return field

  return (
    <FormField label={fieldLabel} required={required} htmlFor={id} uppercase={uppercaseLabel}>
      {field}
    </FormField>
  )
}

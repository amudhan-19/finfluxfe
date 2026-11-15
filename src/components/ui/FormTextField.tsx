import { TextField, type TextFieldProps } from '@mui/material'
import { FormField } from './FormField'
import { inputControlSx } from './inputStyles'

export type FormTextFieldProps = Omit<TextFieldProps, 'label' | 'variant'> & {
  /** Shown above the field — not inside the input */
  fieldLabel?: string
  uppercaseLabel?: boolean
}

/**
 * Text/number/email input with label above and placeholder inside only.
 */
export function FormTextField({
  fieldLabel,
  uppercaseLabel = true,
  required,
  placeholder,
  sx,
  id,
  ...props
}: FormTextFieldProps) {
  const field = (
    <TextField
      id={id}
      variant="outlined"
      size="small"
      required={required}
      placeholder={placeholder}
      className="app-input-control"
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

// @author  veera
// @file    features/admin-users/components/ui/SearchInput.tsx

import { InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { Search } from 'lucide-react'
import { useTheme } from '@mui/material/styles'
import { inputControlSx } from '@/components/ui/inputStyles'

type SearchInputProps = Omit<TextFieldProps, 'variant' | 'label'> & {
  'aria-label'?: string
}

export function SearchInput({
  InputProps,
  sx,
  inputProps: userInputProps,
  placeholder = 'Search by name or email',
  'aria-label': ariaLabel = 'Search',
  ...props
}: SearchInputProps) {
  const theme = useTheme()
  const { sx: inputSx, startAdornment, ...restInput } = InputProps ?? {}
  const defaultStart = (
    <InputAdornment position="start" sx={{ ml: 0.5, mr: 0 }}>
      <Search size={18} strokeWidth={2} color={theme.palette.text.secondary} aria-hidden />
    </InputAdornment>
  )
  return (
    <TextField
      variant="outlined"
      size="small"
      placeholder={placeholder}
      InputProps={{
        ...restInput,
        startAdornment: startAdornment ?? defaultStart,
        notched: false,
        sx: [
          ...(Array.isArray(inputSx) ? inputSx : inputSx ? [inputSx] : []),
        ],
      }}
      className="app-input-control"
      sx={[
        inputControlSx,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      slotProps={{
        inputLabel: { sx: { display: 'none' } },
      }}
      inputProps={{
        ...(userInputProps ?? {}),
        'aria-label': ariaLabel,
      }}
      {...props}
    />
  )
}

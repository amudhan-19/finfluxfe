import type { SxProps, Theme } from '@mui/material/styles'

/** Unified height & radius for text, number, and select controls */
export const INPUT_HEIGHT = 44
export const INPUT_RADIUS = 10

export const inputControlSx: SxProps<Theme> = {
  '& .MuiOutlinedInput-root': {
    minHeight: INPUT_HEIGHT,
    borderRadius: `${INPUT_RADIUS}px`,
    fontSize: '0.875rem',
    backgroundColor: 'background.paper',
    '& fieldset': {
      borderColor: 'divider',
    },
    '&:hover fieldset': {
      borderColor: 'text.disabled',
    },
    '&.Mui-focused fieldset': {
      borderWidth: 2,
      borderColor: 'primary.main',
    },
  },
  '& .MuiOutlinedInput-input': {
    py: '10px',
    px: '14px',
    boxSizing: 'border-box',
  },
  '& .MuiSelect-select': {
    minHeight: INPUT_HEIGHT,
    display: 'flex',
    alignItems: 'center',
    py: '10px',
    px: '14px',
    boxSizing: 'border-box',
  },
}

export const placeholderSx = {
  color: 'text.secondary',
  fontWeight: 400,
  opacity: 0.85,
} as const

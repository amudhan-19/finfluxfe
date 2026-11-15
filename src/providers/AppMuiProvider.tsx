import { useMemo } from 'react'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useAppColorMode } from '@/hooks/useAppColorMode'
import { createAppMuiTheme } from '@/theme/createAppMuiTheme'

export function AppMuiProvider({ children }: { children: React.ReactNode }) {
  const mode = useAppColorMode()
  const theme = useMemo(() => createAppMuiTheme(mode), [mode])

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <CssBaseline />
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  )
}

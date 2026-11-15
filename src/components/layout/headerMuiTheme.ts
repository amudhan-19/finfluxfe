// @author  veera
// @file    components/layout/headerMuiTheme.ts
//
// Dark top bar — primary + neutral; semantic greens only for brand accent / admin pill.

import { createTheme } from '@mui/material/styles'

export const headerBarTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6', light: '#60a5fa', dark: '#2563eb' },
    secondary: { main: '#94a3b8' },
    success: { main: '#22c55e', light: '#4ade80' },
    info: { main: '#38bdf8', light: '#7dd3fc', dark: '#0ea5e9' },
    background: { default: '#0f172a', paper: '#1e293b' },
    divider: 'rgba(148,163,184,0.22)',
    text: { primary: '#f8fafc', secondary: '#cbd5e1', disabled: 'rgba(248,250,252,0.45)' },
    action: {
      hover: 'rgba(255,255,255,0.06)',
      selected: 'rgba(59,130,246,0.16)',
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"DM Sans","Inter",system-ui,sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: '0.65rem', letterSpacing: '0.04em' },
      },
    },
  },
})

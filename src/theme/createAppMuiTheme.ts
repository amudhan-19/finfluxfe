// @author  veera
// @file    theme/createAppMuiTheme.ts
//
// Global MUI theme — Inter, brand green, DataGrid defaults.

import { createTheme } from '@mui/material/styles'

const FONT = 'Inter, sans-serif'

export function createAppMuiTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark'
  const bgDefault = isDark ? '#0b1418' : '#f4f6f8'
  const bgPaper = isDark ? '#112229' : '#ffffff'
  const modalBg = isDark ? '#06181D' : '#ffffff'
  const modalInputBg = isDark ? '#0a1f26' : '#ffffff'
  const border = isDark ? '#1e3a44' : 'rgba(15,23,42,0.10)'

  return createTheme({
    palette: {
      mode,
      primary: { main: '#03A850', light: '#22c55e', dark: '#028a44', contrastText: '#fff' },
      secondary: { main: '#475569', light: '#64748b', dark: '#334155', contrastText: '#fff' },
      success: { main: '#03A850', light: '#22c55e', dark: '#028a44' },
      warning: { main: '#d97706', light: '#f59e0b', dark: '#b45309' },
      error: { main: '#dc2626', light: '#ef4444', dark: '#b91c1c' },
      info: { main: '#0284c7', light: '#0ea5e9', dark: '#0369a1' },
      divider: border,
      background: { default: bgDefault, paper: bgPaper },
      text: {
        primary: isDark ? '#f1f5f9' : '#0f172a',
        secondary: isDark ? '#94a3b8' : '#64748b',
      },
      grey: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
      action: {
        hover: isDark ? 'rgba(248,250,252,0.06)' : 'rgba(15,23,42,0.04)',
        selected: isDark ? 'rgba(3,168,80,0.22)' : 'rgba(3,168,80,0.10)',
        disabled: isDark ? 'rgba(248,250,252,0.22)' : 'rgba(15,23,42,0.16)',
        disabledBackground: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)',
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: FONT,
      allVariants: { fontFamily: FONT },
      h5: { fontWeight: 700, letterSpacing: -0.02, fontSize: '1.35rem' },
      subtitle2: { fontWeight: 600 },
      caption: { letterSpacing: 0.015 },
      button: { textTransform: 'none', fontWeight: 600 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontFamily: FONT },
          '#root': { fontFamily: FONT },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: ({ theme }) => ({
            textTransform: 'none',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: 13,
            fontFamily: FONT,
            '&.Mui-disabled': {
              opacity: 0.55,
              ...(theme.palette.mode === 'light'
                ? { borderColor: theme.palette.grey[300] }
                : { borderColor: 'rgba(148,163,184,0.22)' }),
            },
          }),
          sizeMedium: { minHeight: 38 },
        },
      },
      MuiTextField: { defaultProps: { size: 'small', variant: 'outlined' } },
      MuiFormControl: {
        defaultProps: { size: 'small' },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            minHeight: 44,
            fontFamily: FONT,
            fontSize: '0.875rem',
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(15,23,42,0.45)' : '#ffffff',
            '& fieldset': {
              borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.12)',
            },
            '&:hover fieldset': {
              borderColor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.5)' : 'rgba(15,23,42,0.22)',
            },
            '&.Mui-focused fieldset': {
              borderWidth: 2,
              borderColor: theme.palette.primary.main,
            },
          }),
          input: {
            padding: '10px 14px',
            fontSize: '0.875rem',
            fontFamily: FONT,
            boxSizing: 'border-box',
          },
          notchedOutline: {
            legend: { display: 'none' },
          },
        },
      },
      MuiSelect: {
        defaultProps: { size: 'small' },
        styleOverrides: {
          select: {
            minHeight: 44,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            fontSize: '0.875rem',
            fontFamily: FONT,
            boxSizing: 'border-box',
          },
          icon: {
            right: 12,
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: '0.6875rem',
            fontWeight: 700,
            fontFamily: FONT,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            position: 'relative',
            transform: 'none',
            marginBottom: 6,
            '&.Mui-focused': { color: 'inherit' },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: ({ theme }) => ({
            borderRadius: 10,
            border: `1px solid ${theme.palette.divider}`,
            boxShadow:
              theme.palette.mode === 'dark'
                ? '0 2px 12px rgba(0,0,0,0.35)'
                : '0 2px 12px rgba(15,23,42,0.06)',
          }),
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: ({ theme }) => ({
            borderRadius: 10,
            border: `1px solid ${theme.palette.mode === 'dark' ? '#1e3a44' : theme.palette.divider}`,
            fontFamily: FONT,
            ...(theme.palette.mode === 'dark'
              ? {
                  backgroundColor: modalBg,
                  color: '#f1f5f9',
                }
              : {}),
          }),
        },
      },
    },
  })
}

/** @deprecated Use createAppMuiTheme */
export const createAdminUsersMuiTheme = createAppMuiTheme

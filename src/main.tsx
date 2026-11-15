// @author  veera
// @file    main.tsx

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

import './config/muiLicense'
import { queryClient } from './api/queryClient'
import { AuthProvider } from './features/auth/AuthProvider'
import { AppMuiProvider } from './providers/AppMuiProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import { router } from './routes/router'
import './styles/main.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AppMuiProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
          {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />} */}
        </QueryClientProvider>
      </AppMuiProvider>
    </ThemeProvider>
  </React.StrictMode>,
)

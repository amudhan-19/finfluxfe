// @author  veera
// @file    features/admin-users/components/EnterpriseDialog.tsx
//
// Reusable admin modal shell — consistent header / body / footer and close control.

import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from '@mui/material'
import type { Breakpoint } from '@mui/material/styles'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

type EnterpriseDialogProps = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  /** MUI max-width breakpoint for the dialog paper */
  maxWidth?: Breakpoint
  scroll?: 'paper' | 'body'
}

export function EnterpriseDialog({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'sm',
  scroll = 'paper',
}: EnterpriseDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      scroll={scroll}
      className="enterprise-dialog"
      aria-labelledby="enterprise-dialog-title"
    >
      <DialogTitle component="div" id="enterprise-dialog-title" sx={{ pr: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography component="span" className="enterprise-dialog__title" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            aria-label="Close dialog"
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { bgcolor: 'action.hover' },
            }}
          >
            <X size={18} strokeWidth={2} />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>{children}</Stack>
      </DialogContent>
      {footer != null ? (
        <DialogActions className="enterprise-dialog__actions" sx={{ flexWrap: 'wrap' }}>
          {footer}
        </DialogActions>
      ) : null}
    </Dialog>
  )
}

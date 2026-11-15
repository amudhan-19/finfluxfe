// @author  veera
// @file    features/admin-users/components/UserDetailsCell.tsx

import { Box, Stack, Typography } from '@mui/material'
import type { AdminUser } from '@/types/models'
import { adminUserDisplayId } from '@/features/admin-users/utils/adminUserDisplayId'

export function UserDetailsCell({ user }: { user: AdminUser }) {
  const displayId = adminUserDisplayId(user.id)
  const idLine = [displayId, user.department].filter(Boolean).join(' · ')
  return (
    <Stack direction="row" spacing={1.75} alignItems="center" sx={{ minWidth: 0, width: 1, py: 0.125 }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          bgcolor: user.color || 'primary.main',
          color: '#fff',
          fontSize: 14,
          fontWeight: 800,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '2px solid',
          borderColor: 'background.paper',
          boxShadow: (t) => (t.palette.mode === 'dark' ? '0 1px 6px rgba(0,0,0,0.5)' : '0 1px 4px rgba(15,23,42,0.12)'),
        }}
      >
        {user.initials}
      </Box>
      <Stack spacing={0.35} sx={{ minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9375rem', letterSpacing: '-0.02em', lineHeight: 1.35 }} noWrap>
          {user.name}
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, opacity: 0.9, lineHeight: 1.35 }}
          noWrap
        >
          {user.email}
        </Typography>
        {idLine && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontFamily: 'ui-monospace, monospace',
              fontWeight: 600,
              fontSize: '0.75rem',
              letterSpacing: '0.03em',
              opacity: 0.8,
              lineHeight: 1.35,
            }}
            noWrap
          >
            {idLine}
          </Typography>
        )}
      </Stack>
    </Stack>
  )
}

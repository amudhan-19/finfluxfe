// @author  veera
// @file    features/admin-users/components/UserEntityChips.tsx

import { Stack, Typography, Chip } from '@mui/material'
import { Building2 } from 'lucide-react'
import type { Entity } from '@/types/models'

const REGION_STYLE: Partial<Record<Entity['region'], { border: string; bg: string; color: string }>> = {
  'North America': { border: '#c4b5fd', bg: '#ede9fe', color: '#5b21b6' },
  Europe: { border: '#93c5fd', bg: '#dbeafe', color: '#1d4ed8' },
  APAC: { border: '#5eead4', bg: '#ccfbf1', color: '#0f766e' },
}

function styleForCode(code: string, entities: Entity[]) {
  const ent = entities.find((e) => e.id === code)
  const r = ent?.region
  return (r && REGION_STYLE[r]) || { border: 'divider', bg: 'action.hover', color: 'text.primary' }
}

type UserEntityChipsProps = {
  codes: string[]
  entities: Entity[]
}

export function UserEntityChips({ codes, entities }: UserEntityChipsProps) {
  const shown = codes.slice(0, 4)
  const extra = codes.length - shown.length
  if (codes.length === 0) {
    return <Typography variant="caption" color="text.secondary">—</Typography>
  }
  return (
    <Stack direction="row" flexWrap="wrap" gap={0.875} sx={{ py: 0.375, rowGap: 0.75 }}>
      {shown.map((c) => {
        const st = styleForCode(c, entities)
        return (
          <Chip
            key={c}
            icon={<Building2 size={14} />}
            label={c}
            size="small"
            variant="outlined"
            sx={{
              height: 28,
              fontSize: '0.8125rem',
              fontWeight: 700,
              fontFamily: 'ui-monospace, monospace',
              borderColor: st.border,
              bgcolor: st.bg,
              color: st.color,
              borderRadius: 2,
              pl: 0.25,
              '& .MuiChip-label': { px: 1 },
              '& .MuiChip-icon': { color: 'inherit', opacity: 0.85, ml: 0.5 },
            }}
          />
        )
      })}
      {extra > 0 && (
        <Chip
          label={`+${extra}`}
          size="small"
          variant="outlined"
          sx={{
            height: 28,
            fontSize: '0.8125rem',
            fontWeight: 800,
            borderRadius: 2,
            '& .MuiChip-label': { px: 1 },
          }}
        />
      )}
    </Stack>
  )
}

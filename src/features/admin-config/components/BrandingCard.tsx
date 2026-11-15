// @author  veera
// @file    features/admin-config/components/BrandingCard.tsx

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import * as brandingApi from '@/features/admin-branding/api'
import { MAX_LOGO_FILE_BYTES } from '@/features/admin-config/constants'
import { getApiErrorMessage } from '@/features/admin-users/utils/apiErrorMessage'
import { useUiStore } from '@/store/useUiStore'
import { X } from '@/constants/theme'

export function BrandingCard() {
  const qc = useQueryClient()
  const { toast } = useUiStore()
  const { data: b, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-branding'],
    queryFn: () => brandingApi.getBranding(),
  })
  const upload = useMutation({
    mutationFn: (file: File) => brandingApi.uploadLogo(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-branding'] }),
  })
  const setColor = useMutation({
    mutationFn: (c: string) => brandingApi.setPrimaryColor(c),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-branding'] }),
  })
  const [color, setColorVal] = useState('#16a34a')

  useEffect(() => {
    if (b?.primary_color) setColorVal(b.primary_color)
  }, [b])

  const onPickLogo = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('Please choose an image file.')
      return
    }
    if (file.size > MAX_LOGO_FILE_BYTES) {
      toast(`Image must be at most ${Math.round(MAX_LOGO_FILE_BYTES / (1024 * 1024))} MB.`)
      return
    }
    upload.mutate(file, {
      onSuccess: () => toast('Logo uploaded'),
      onError: (e: unknown) => toast(getApiErrorMessage(e, 'Upload failed')),
    })
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
        <CircularProgress size={28} />
      </Box>
    )
  }

  if (isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}>
        {getApiErrorMessage(error, 'Could not load branding.')}
      </Alert>
    )
  }

  return (
    <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.25 }}>
      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: X.textM, textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Logo
        </Typography>
        <Box
          sx={{
            p: 2.25,
            borderRadius: '10px',
            bgcolor: X.cardAlt,
            border: 1,
            borderStyle: 'dashed',
            borderColor: 'divider',
            textAlign: 'center',
          }}
        >
          {b?.logo_url ? (
            <Box component="img" src={b.logo_url} alt="Client logo" sx={{ height: 48, mb: 1.25, objectFit: 'contain', maxWidth: 1 }} />
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ minHeight: 48, mb: 1.25, display: 'grid', placeItems: 'center' }}>
              No logo uploaded
            </Typography>
          )}
          <Button variant="outlined" component="label" size="small" disabled={upload.isPending}>
            Choose file
            <input
              type="file"
              accept="image/*"
              hidden
              aria-label="Upload client logo image"
              onChange={(e) => {
                onPickLogo(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, lineHeight: 1.4 }}>
            PNG with transparent background recommended (max {Math.round(MAX_LOGO_FILE_BYTES / (1024 * 1024))} MB).
          </Typography>
        </Box>
      </Box>

      <Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: X.textM, textTransform: 'uppercase', display: 'block', mb: 1 }}>
          Primary color
        </Typography>
        <Box sx={{ p: 2.25, borderRadius: '10px', bgcolor: X.cardAlt, border: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1.25} useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColorVal(e.target.value)}
              aria-label="Pick primary brand color"
              style={{ width: 50, height: 38, padding: 0, border: `1px solid ${X.border}`, borderRadius: 6 }}
            />
            <input
              value={color}
              onChange={(e) => setColorVal(e.target.value)}
              aria-label="Primary color hex value"
              style={{
                padding: '8px 10px',
                borderRadius: 6,
                border: `1px solid ${X.border}`,
                fontSize: 12,
                width: 110,
                fontFamily: 'ui-monospace, monospace',
              }}
            />
            <Button
              variant="contained"
              size="small"
              disabled={setColor.isPending}
              onClick={() => {
                setColor.mutate(color, {
                  onSuccess: () => toast('Color saved'),
                  onError: (e: unknown) => toast(getApiErrorMessage(e, 'Save failed')),
                })
              }}
            >
              Save
            </Button>
          </Stack>
          <Box
            sx={{
              p: 1.75,
              borderRadius: '10px',
              bgcolor: 'var(--x-card)',
              border: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Typography variant="caption" color="text.secondary">Preview</Typography>
            <Button size="small" sx={{ bgcolor: color, color: '#fff', '&:hover': { bgcolor: color } }}>
              Primary action
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

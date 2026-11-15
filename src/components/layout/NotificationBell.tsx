// @author  veera
// @file    components/layout/NotificationBell.tsx
//
// In-app notification bell for the top header.
// Renders a badge with unread count; click opens a dropdown list.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material'
import { Bell } from 'lucide-react'
import type { AppNotification, NotificationType } from '@/types/models'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadNotificationCount,
} from '@/hooks/useNotifications'

// ── Icon map by notification type ─────────────────────────────────────
const TYPE_ICON: Record<NotificationType, string> = {
  flux_submitted:             '📤',
  flux_rejected:              '❌',
  flux_approved:              '✅',
  director_approval_required: '⏳',
  director_approved:          '✅',
  director_rejected:          '❌',
  comment_mention:            '💬',
  task_assigned:              '📋',
  task_reassigned:            '🔄',
  due_date_reminder:          '📅',
  bc_sync_failed:             '⚠️',
  ai_analysis_completed:      '🤖',
  ai_analysis_failed:         '🤖',
}

function notifIcon(type: NotificationType): string {
  return TYPE_ICON[type] ?? '🔔'
}

// ── Relative time helper ───────────────────────────────────────────────
function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Individual row ─────────────────────────────────────────────────────
function NotificationRow({
  notif,
  onRead,
}: {
  notif: AppNotification
  onRead: (n: AppNotification) => void
}) {
  return (
    <MenuItem
      onClick={() => onRead(notif)}
      sx={{
        alignItems: 'flex-start',
        gap: 1,
        py: 1.25,
        px: 2,
        opacity: notif.is_read ? 0.6 : 1,
        borderLeft: notif.is_read ? 'none' : '3px solid',
        borderColor: 'primary.main',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
      }}
    >
      <Box component="span" sx={{ fontSize: 16, flexShrink: 0, mt: '1px' }}>
        {notifIcon(notif.type)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={notif.is_read ? 400 : 700} noWrap>
          {notif.title}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: 'block', whiteSpace: 'normal', lineHeight: 1.35 }}
        >
          {notif.message}
        </Typography>
        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.6rem' }}>
          {timeAgo(notif.created_at)}
        </Typography>
      </Box>
    </MenuItem>
  )
}

// ── Main component ─────────────────────────────────────────────────────
export default function NotificationBell({ variant }: { variant?: 'header' | 'default' }) {
  const isHeader = variant === 'header'
  const [anchor, setAnchor] = useState<null | HTMLElement>(null)
  const open = Boolean(anchor)
  const navigate = useNavigate()

  const { data: countData } = useUnreadNotificationCount()
  const { data: notifications, isLoading, isError } = useNotifications({ limit: 25 })
  const markOne = useMarkNotificationRead()
  const markAll = useMarkAllNotificationsRead()

  const unreadCount = countData?.count ?? 0

  function handleOpen(e: React.MouseEvent<HTMLElement>) {
    setAnchor(e.currentTarget)
  }

  function handleClose() {
    setAnchor(null)
  }

  function handleNotifClick(notif: AppNotification) {
    markOne.mutate(notif.id)
    if (notif.link_url) {
      navigate(notif.link_url)
    }
    handleClose()
  }

  function handleMarkAll() {
    markAll.mutate()
  }

  return (
    <>
      {isHeader ? (
        <button
          type="button"
          className="app-topbar__icon-btn"
          onClick={handleOpen}
          aria-label="Open notifications"
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}
          style={{ position: 'relative' }}
        >
          <Bell size={16} strokeWidth={2} />
          {unreadCount > 0 ? (
            <span
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                minWidth: 14,
                height: 14,
                padding: '0 3px',
                fontSize: '0.55rem',
                fontWeight: 800,
                lineHeight: '14px',
                textAlign: 'center',
                borderRadius: 99,
                background: 'var(--color-danger)',
                color: '#fff',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          ) : null}
        </button>
      ) : (
        <Tooltip title="Notifications">
          <IconButton
            onClick={handleOpen}
            size="small"
            aria-label="Open notifications"
            aria-haspopup="true"
            aria-expanded={open ? 'true' : undefined}
            sx={{
              color: 'text.secondary',
              '&:hover': { color: 'text.primary' },
            }}
          >
            <Badge
              badgeContent={unreadCount > 0 ? unreadCount : undefined}
              color="error"
              max={99}
            >
              <Bell size={18} strokeWidth={2} />
            </Badge>
          </IconButton>
        </Tooltip>
      )}

      <Menu
        anchorEl={anchor}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 360,
              maxHeight: 480,
              borderRadius: 2,
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              overflowY: 'auto',
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.25,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 1,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="subtitle2" fontWeight={700}>
            Notifications
            {unreadCount > 0 && (
              <Box
                component="span"
                sx={{
                  ml: 1,
                  fontSize: '0.65rem',
                  bgcolor: 'error.main',
                  color: '#fff',
                  borderRadius: 10,
                  px: 0.75,
                  py: 0.15,
                  fontWeight: 700,
                  verticalAlign: 'middle',
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAll}
              disabled={markAll.isPending}
              sx={{ fontSize: '0.7rem', textTransform: 'none', py: 0.25 }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        {/* Body */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {isError && (
          <Box sx={{ px: 2, py: 2 }}>
            <Typography variant="body2" color="error">
              Failed to load notifications.
            </Typography>
          </Box>
        )}

        {!isLoading && !isError && (!notifications || notifications.length === 0) && (
          <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        )}

        {!isLoading && !isError && notifications && notifications.length > 0 && (
          <>
            {notifications.map((n, i) => (
              <Box key={n.id}>
                {i > 0 && <Divider sx={{ my: 0 }} />}
                <NotificationRow notif={n} onRead={handleNotifClick} />
              </Box>
            ))}
          </>
        )}
      </Menu>
    </>
  )
}

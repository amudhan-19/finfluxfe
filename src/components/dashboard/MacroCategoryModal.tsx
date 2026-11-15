// @author  veera
// @file    components/dashboard/MacroCategoryModal.tsx

import PublicOutlined from '@mui/icons-material/PublicOutlined'
import { Chip } from '@mui/material'
import { AppModal } from '@/components/ui/AppModal'
import type { MacroFactor } from '@/types/models'

export type MacroCategoryModalProps = {
  open: boolean
  category: string
  color: string
  factors: Array<MacroFactor & { entityName: string }>
  onClose: () => void
}

export function MacroCategoryModal({
  open,
  category,
  color,
  factors,
  onClose,
}: MacroCategoryModalProps) {
  return (
    <AppModal
      open={open}
      title={category}
      subtitle={`${factors.length} factor${factors.length === 1 ? '' : 's'}`}
      onClose={onClose}
      size="md"
    >
      <div className="dashboard-macro-modal">
        {factors.length === 0 ? (
          <p className="dashboard-macro-modal__empty">No factors in this category.</p>
        ) : (
          factors.map((f, i) => (
            <article
              key={`${f.entityName}-${i}`}
              className="dashboard-macro-modal__item"
              style={{ borderColor: `${color}33`, background: `${color}08` }}
            >
              <div className="dashboard-macro-modal__item-head">
                <PublicOutlined sx={{ fontSize: 18, color }} />
                <span className="dashboard-macro-modal__entity">{f.entityName}</span>
                {f.is_custom ? (
                  <Chip label="Custom" size="small" sx={{ height: 20, fontSize: '0.625rem' }} />
                ) : null}
              </div>
              <p className="dashboard-macro-modal__text">{f.text}</p>
            </article>
          ))
        )}
      </div>
    </AppModal>
  )
}

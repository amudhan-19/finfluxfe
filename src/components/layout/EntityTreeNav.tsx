// @author  veera
// @file    components/layout/EntityTreeNav.tsx

import { useNavigate } from 'react-router-dom'
import Folder from '@mui/icons-material/Folder'
import FolderOpenOutlined from '@mui/icons-material/FolderOpenOutlined'
import MenuOutlined from '@mui/icons-material/MenuOutlined'
import { IconButton } from '@mui/material'
import { useEntities } from '@/features/entities/hooks'
import { useUiStore } from '@/store/useUiStore'

const REGIONS = ['North America', 'Europe', 'APAC'] as const

function TreeNode({
  label,
  nodeKey,
  depth,
  children,
}: {
  label: string
  nodeKey: string
  depth: number
  children?: React.ReactNode
}) {
  const { treeOpen, toggleTree } = useUiStore()
  const open = treeOpen[nodeKey] ?? false
  const depthClass = `entity-tree__node-btn--depth-${Math.min(depth, 3)}`

  return (
    <div>
      <button
        type="button"
        className={`entity-tree__node-btn ${depthClass}${open ? ' entity-tree__node-btn--open' : ''}`}
        onClick={() => toggleTree(nodeKey)}
      >
        {open ? (
          <FolderOpenOutlined className="entity-tree__node-icon entity-tree__node-icon--open" />
        ) : (
          <Folder className="entity-tree__node-icon" />
        )}
        {label}
      </button>
      {open ? <div>{children}</div> : null}
    </div>
  )
}

export default function EntityTreeNav({ basePath }: { basePath: string }) {
  const { treeVisible, setTreeVisible, selCo, setSelCo } = useUiStore()
  const { data: entities = [] } = useEntities()
  const navigate = useNavigate()

  const openEntity = (id: string) => {
    setSelCo(id)
    navigate(`${basePath}/flux-review/${id}`)
  }

  if (!treeVisible) {
    return (
      <div className="entity-tree entity-tree--collapsed">
        <IconButton
          className="entity-tree__toggle"
          aria-label="Show entity tree"
          onClick={() => setTreeVisible(true)}
          size="small"
        >
          <MenuOutlined />
        </IconButton>
      </div>
    )
  }

  return (
    <aside className="entity-tree" aria-label="Entity folder tree">
      <div className="entity-tree__head">
        <IconButton
          className="entity-tree__toggle"
          aria-label="Hide entity tree"
          onClick={() => setTreeVisible(false)}
          size="small"
        >
          <MenuOutlined />
        </IconButton>
        <span className="entity-tree__title">Entities</span>
      </div>

      <div className="entity-tree__body">
        <TreeNode label="FY 2026" nodeKey="FY 2026" depth={0}>
          <TreeNode label="Q1 2026" nodeKey="Q1 2026" depth={1}>
            {REGIONS.map((r) => (
              <TreeNode key={r} label={r} nodeKey={r} depth={2}>
                {entities
                  .filter((c) => c.region === r)
                  .map((c) => {
                    const active = selCo === c.id
                    return (
                      <button
                        key={c.id}
                        type="button"
                        className={`entity-tree__entity-btn${active ? ' entity-tree__entity-btn--active' : ''}`}
                        onClick={() => openEntity(c.id)}
                      >
                        <span
                          className={`entity-tree__entity-dot entity-tree__entity-dot--${c.status}`}
                        />
                        <span className="entity-tree__entity-name">{c.name}</span>
                      </button>
                    )
                  })}
              </TreeNode>
            ))}
          </TreeNode>
        </TreeNode>
      </div>
    </aside>
  )
}

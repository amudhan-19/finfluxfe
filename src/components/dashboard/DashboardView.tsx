// @author  veera
// @file    components/dashboard/DashboardView.tsx
//
// Single Dashboard view shared by Analyst & Supervisor (entity scoping
// is enforced by the backend via JWT/UserEntityAccess).

import { useMemo, useState } from 'react'
import { useEntities } from '@/features/entities/hooks'
import { useQueries } from '@tanstack/react-query'
import { getMacroFactors } from '@/features/macro/api'
import { useUiStore } from '@/store/useUiStore'
import { X, WF } from '@/constants/theme'
import { U } from '@/constants/uiText'
import EntityGrid from './EntityGrid'
import type { EntityListItem, EntityStatus, MacroFactor } from '@/types/models'

const REGIONS = ['North America', 'Europe', 'APAC']

const STATUS_PROGRESS: Record<EntityStatus, number> = {
  approved: 100, under_review: 75, wip: 40, assigned: 10, rejected: 0, pending_director: 90,
}

const CAT_COLORS: Record<string, string> = {
  Geopolitical: X.purple,
  Energy:       X.amber,
  Monetary:     X.blue,
  Regulatory:   X.slate,
  Industry:     X.green,
  FX:           X.cyan,
  Conflict:     X.red,
}

export default function DashboardView({ basePath, roleLabel }:
  { basePath: string; roleLabel: string }) {
  const { filterTag, filterRegion, setFilterTag, setFilterRegion } = useUiStore()
  const { data: entities = [], isLoading } = useEntities()

  const allTags = useMemo(
    () => Array.from(new Set(entities.flatMap((c) => c.tags || []))),
    [entities],
  )

  const filtered = useMemo(() => {
    let l = entities
    if (filterRegion !== 'all') l = l.filter((c) => c.region === filterRegion)
    if (filterTag !== 'all')    l = l.filter((c) => (c.tags || []).includes(filterTag))
    return l
  }, [entities, filterRegion, filterTag])

  const stCounts = useMemo(() => {
    const c: Record<string, number> = {
      assigned: 0, wip: 0, under_review: 0, rejected: 0, approved: 0, pending_director: 0,
    }
    filtered.forEach((co) => { c[co.status] = (c[co.status] || 0) + 1 })
    return c
  }, [filtered])

  const approvedPct = filtered.length
    ? Math.round((stCounts.approved / filtered.length) * 100)
    : 0

  const pieData = useMemo(() => ([
    { l: 'Assigned',     v: stCounts.assigned,     c: X.slate  },
    { l: 'WIP',          v: stCounts.wip,          c: X.cyan   },
    { l: 'Under Review', v: stCounts.under_review, c: X.amber  },
    { l: 'Pending D.',   v: stCounts.pending_director, c: X.purple },
    { l: 'Approved',     v: stCounts.approved,     c: X.green  },
    { l: 'Rejected',     v: stCounts.rejected,     c: X.red    },
  ].filter((d) => d.v > 0)), [stCounts])

  const macroQueries = useQueries({
    queries: filtered.map((e) => ({
      queryKey: ['macro', e.id],
      queryFn:  () => getMacroFactors(e.id),
      staleTime: 30_000,
    })),
  })

  const allMacros = useMemo(() => {
    const out: Array<MacroFactor & { entityId: string; entityName: string }> = []
    filtered.forEach((e, i) => {
      const list = (macroQueries[i]?.data as MacroFactor[]) || []
      list.forEach((m) => out.push({ ...m, entityId: e.id, entityName: e.name }))
    })
    return out
  }, [filtered, macroQueries])

  const categories = useMemo(
    () => Array.from(new Set(allMacros.map((m) => m.category))),
    [allMacros],
  )

  const [modalCat, setModalCat] = useState<string | null>(null)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 800 }}>Dashboard</h2>
          <p style={{ fontSize: 11, color: X.textM }}>{filtered.length} entities {U.mid} {roleLabel}</p>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={ssStyle}>
            <option value="all">All Regions</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterTag} onChange={(e) => setFilterTag(e.target.value)} style={ssStyle}>
            <option value="all">All Tags</option>
            {allTags.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Status pie + KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 12, marginBottom: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8 }}>Status</div>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
            <div style={{ position: 'relative', width: 80, height: 80 }}>
              <Pie data={pieData} size={80} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{approvedPct}%</div>
                <div style={{ fontSize: 7, color: X.textM }}>approved</div>
              </div>
            </div>
          </div>
          {pieData.map((d, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.c }} />
              <span style={{ fontSize: 9, color: X.textS, flex: 1 }}>{d.l}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: d.c }}>{d.v}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { l: 'Assigned',   v: stCounts.assigned,          c: X.slate,  ic: WF.assigned.i },
            { l: 'WIP',        v: stCounts.wip,               c: X.cyan,   ic: WF.wip.i },
            { l: 'Review',     v: stCounts.under_review,      c: X.amber,  ic: WF.under_review.i },
            { l: 'Pending D.', v: stCounts.pending_director,  c: X.purple, ic: WF.pending_director.i },
            { l: 'Approved',   v: stCounts.approved,          c: X.green,  ic: WF.approved.i },
            { l: 'Rejected',   v: stCounts.rejected,          c: X.red,    ic: WF.rejected.i },
          ].map((k, i) => (
            <div key={i} style={{
              padding: '10px 12px', background: 'var(--x-card)',
              borderRadius: 10, border: `1px solid ${X.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,.04)',
            }}>
              <span style={{ fontSize: 18 }}>{k.ic}</span>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: k.c, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1 }}>{k.v}</div>
                <div style={{ fontSize: 8, fontWeight: 600, color: X.textM, textTransform: 'uppercase', marginTop: 2 }}>{k.l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700 }}>Timeline</div>
          <div style={{ fontSize: 10, color: X.green, fontWeight: 700 }}>{approvedPct}% approved</div>
        </div>
        {filtered.map((c, i) => {
          const wfi = WF[(c.status as keyof typeof WF) || 'assigned']
          const pct = STATUS_PROGRESS[c.status] || 0
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 600, width: 90,
                             overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {c.name}
              </span>
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: X.borderL, overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: wfi.c, width: pct + '%' }} />
              </div>
              <span style={{ padding: '1px 5px', borderRadius: 3,
                             background: wfi.bg, color: wfi.c,
                             fontSize: 7, fontWeight: 700 }}>{wfi.l}</span>
            </div>
          )
        })}
      </div>

      {/* Macro & Geopolitical pills */}
      {allMacros.length > 0 && (
        <div style={{ ...card, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 16 }}>{U.info}</span>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Macro &amp; Geopolitical Factors</span>
            </div>
            <span style={{ fontSize: 9, color: X.textM }}>
              {allMacros.length} factors {U.mid} Click to expand
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {categories.map((cat) => {
              const c = CAT_COLORS[cat] || X.text
              const count = allMacros.filter((m) => m.category === cat).length
              return (
                <button key={cat} onClick={() => setModalCat(cat)} style={{
                  padding: '5px 10px', borderRadius: 999,
                  background: `${c}10`, border: `1px solid ${c}40`,
                  color: c, fontSize: 10, fontWeight: 700,
                  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5,
                }}>
                  <span>{cat}</span>
                  <span style={{
                    background: c, color: '#fff', borderRadius: 999,
                    minWidth: 16, padding: '1px 5px', fontSize: 8, fontWeight: 800,
                  }}>{count}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Entities</div>
      {isLoading
        ? <div style={{ color: X.textM, fontSize: 12 }}>Loading{U.ellip}</div>
        : <EntityGrid entities={filtered as EntityListItem[]} basePath={basePath} />}

      {modalCat && (
        <CategoryModal
          category={modalCat}
          color={CAT_COLORS[modalCat] || X.text}
          factors={allMacros.filter((m) => m.category === modalCat)}
          onClose={() => setModalCat(null)}
        />
      )}
    </div>
  )
}


// Pie chart

function Pie({ data, size = 80 }: { data: { v: number; c: string }[]; size?: number }) {
  const total = data.reduce((a, d) => a + d.v, 0)
  const r = (size - 10) / 2
  const circ = Math.PI * 2 * r
  let off = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r}
              fill="none" stroke={X.borderL} strokeWidth="8" />
      {total > 0 && data.filter((d) => d.v > 0).map((d, i) => {
        const pct  = d.v / total
        const dash = pct * circ
        const gap  = circ - dash
        const el = (
          <circle key={i} cx={size / 2} cy={size / 2} r={r}
                  fill="none" stroke={d.c} strokeWidth="8"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={-off}
                  strokeLinecap="butt"
                  style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
        )
        off += dash
        return el
      })}
    </svg>
  )
}

// Category modal

function CategoryModal({ category, color, factors, onClose }: {
  category: string
  color: string
  factors: Array<MacroFactor & { entityName: string }>
  onClose: () => void
}) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      backdropFilter: 'blur(2px)',
      display: 'grid', placeItems: 'center', zIndex: 250,
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        background: 'var(--x-card)', width: 480, maxHeight: '80vh', borderRadius: 14,
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        boxShadow: '0 16px 48px rgba(0,0,0,.2)',
      }}>
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${X.border}`,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span style={{
            width: 10, height: 10, borderRadius: '50%', background: color,
          }} />
          <strong style={{ fontSize: 14 }}>{category}</strong>
          <span style={{ fontSize: 10, color: X.textM, marginLeft: 'auto' }}>
            {factors.length} factor{factors.length === 1 ? '' : 's'}
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: X.textM,
          }}>{U.times}</button>
        </div>
        <div style={{ overflow: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {factors.length === 0 && (
            <div style={{ color: X.textM, fontSize: 11, padding: 16, textAlign: 'center' }}>
              No factors in this category.
            </div>
          )}
          {factors.map((f, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 8, background: `${color}06`,
              border: `1px solid ${color}20`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{f.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: X.text }}>{f.entityName}</span>
                {f.is_custom && (
                  <span style={{
                    fontSize: 7, padding: '1px 5px', borderRadius: 3,
                    background: X.cyanL, color: X.cyan, fontWeight: 700,
                  }}>Custom</span>
                )}
              </div>
              <div style={{ fontSize: 11, color: X.textS, lineHeight: 1.4 }}>{f.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


const ssStyle: React.CSSProperties = {
  padding: '4px 18px 4px 6px', borderRadius: 5,
  border: '1px solid #e5e7eb', fontSize: 9,
  appearance: 'none', background: 'var(--x-card)', cursor: 'pointer',
}

const card: React.CSSProperties = {
  background: 'var(--x-card)', padding: '14px 16px', borderRadius: 10,
  border: `1px solid ${X.border}`, boxShadow: '0 1px 3px rgba(0,0,0,.04)',
}


// @author  veera
// @file    components/dashboard/useDashboardMetrics.ts

import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { useEntities } from '@/features/entities/hooks'
import { getMacroFactors } from '@/features/macro/api'
import { useUiStore } from '@/store/useUiStore'
import { X } from '@/constants/theme'
import type { EntityStatus, MacroFactor } from '@/types/models'

export const DASHBOARD_REGIONS = ['North America', 'Europe', 'APAC'] as const

export const STATUS_PROGRESS: Record<EntityStatus, number> = {
  assigned: 10,
  wip: 40,
  under_review: 75,
  rejected: 0,
  approved: 100,
  pending_director: 90,
}

export const MACRO_CAT_COLORS: Record<string, string> = {
  Geopolitical: X.purple,
  Energy: X.amber,
  Monetary: X.blue,
  Regulatory: X.slate,
  Industry: X.green,
  FX: X.cyan,
  Conflict: X.red,
}

export function useDashboardMetrics() {
  const { filterTag, filterRegion, setFilterTag, setFilterRegion } = useUiStore()
  const { data: entities = [], isLoading } = useEntities()
  const [modalCat, setModalCat] = useState<string | null>(null)

  const allTags = useMemo(
    () => Array.from(new Set(entities.flatMap((c) => c.tags || []))),
    [entities],
  )

  const filtered = useMemo(() => {
    let list = entities
    if (filterRegion !== 'all') list = list.filter((c) => c.region === filterRegion)
    if (filterTag !== 'all') list = list.filter((c) => (c.tags || []).includes(filterTag))
    return list
  }, [entities, filterRegion, filterTag])

  const stCounts = useMemo(() => {
    const c: Record<string, number> = {
      assigned: 0,
      wip: 0,
      under_review: 0,
      rejected: 0,
      approved: 0,
      pending_director: 0,
    }
    filtered.forEach((co) => {
      c[co.status] = (c[co.status] || 0) + 1
    })
    return c
  }, [filtered])

  const approvedPct = filtered.length
    ? Math.round((stCounts.approved / filtered.length) * 100)
    : 0

  const pieData = useMemo(
    () =>
      [
        { name: 'Assigned', value: stCounts.assigned, color: X.slate },
        { name: 'WIP', value: stCounts.wip, color: X.cyan },
        { name: 'Under Review', value: stCounts.under_review, color: X.amber },
        { name: 'Pending D.', value: stCounts.pending_director, color: X.purple },
        { name: 'Approved', value: stCounts.approved, color: X.green },
        { name: 'Rejected', value: stCounts.rejected, color: X.red },
      ].filter((d) => d.value > 0),
    [stCounts],
  )

  const macroQueries = useQueries({
    queries: filtered.map((e) => ({
      queryKey: ['macro', e.id],
      queryFn: () => getMacroFactors(e.id),
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

  return {
    filterTag,
    filterRegion,
    setFilterTag,
    setFilterRegion,
    isLoading,
    filtered,
    stCounts,
    approvedPct,
    pieData,
    allMacros,
    categories,
    allTags,
    modalCat,
    setModalCat,
  }
}

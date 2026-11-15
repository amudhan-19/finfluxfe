// @author  veera
// @file    store/useUiStore.ts
//
// Pure UI state — selected entity, tab, tree open/closed, chat visibility,
// dashboard filters, toast. Server data lives in React Query, role lives in auth.

import { create } from 'zustand'

interface UiState {
  selCo: string | null
  setSelCo: (id: string | null) => void

  plbs: 'pl' | 'bs'
  setPlbs: (v: 'pl' | 'bs') => void

  treeVisible: boolean
  setTreeVisible: (v: boolean) => void
  treeOpen: Record<string, boolean>
  toggleTree: (k: string) => void

  chatVisible: boolean
  setChatVisible: (v: boolean) => void

  aiMode: 'concise' | 'detailed'
  setAiMode: (v: 'concise' | 'detailed') => void

  finTalkOpen: boolean
  setFinTalkOpen: (v: boolean) => void

  toastMsg: string
  toastVis: boolean
  toast: (msg: string) => void

  filterTag: string
  filterRegion: string
  filterEntity: string
  setFilterTag: (v: string) => void
  setFilterRegion: (v: string) => void
  setFilterEntity: (v: string) => void
}

let _toastTimer: ReturnType<typeof setTimeout> | null = null

export const useUiStore = create<UiState>((set) => ({
  selCo: null,
  setSelCo: (id) => set({ selCo: id }),

  plbs: 'pl',
  setPlbs: (v) => set({ plbs: v }),

  treeVisible: true,
  setTreeVisible: (v) => set({ treeVisible: v }),
  treeOpen: {
    'FY 2026': true, 'Q1 2026': true,
    'North America': true, Europe: false, APAC: false,
  },
  toggleTree: (k) => set((s) => ({ treeOpen: { ...s.treeOpen, [k]: !s.treeOpen[k] } })),

  chatVisible: false,
  setChatVisible: (v) => set({ chatVisible: v }),

  aiMode: 'concise',
  setAiMode: (v) => set({ aiMode: v }),

  finTalkOpen: false,
  setFinTalkOpen: (v) => set({ finTalkOpen: v }),

  toastMsg: '',
  toastVis: false,
  toast: (msg) => {
    if (_toastTimer) clearTimeout(_toastTimer)
    set({ toastMsg: msg, toastVis: true })
    _toastTimer = setTimeout(() => set({ toastVis: false }), 2200)
  },

  filterTag: 'all',
  filterRegion: 'all',
  filterEntity: 'all',
  setFilterTag: (v) => set({ filterTag: v }),
  setFilterRegion: (v) => set({ filterRegion: v }),
  setFilterEntity: (v) => set({ filterEntity: v }),
}))


// ── Backwards-compat shim for legacy JSX components ──────────────────
// They import `useAppStore` and read role/tab/setTab/setRole. We expose a
// no-op compatible API that delegates state to useUiStore where possible.
//
// New TSX code should NOT import this — use useAuth() + useUiStore() directly.

export function useAppStoreShim() {
  // Just a thin object that JSX can read; real values are populated by
  // wrappers in layouts (TopBar, NavTabs, TreeNav have been replaced).
  return useUiStore.getState()
}

export default useUiStore

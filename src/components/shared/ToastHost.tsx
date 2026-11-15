// @author  veera
// @file    components/shared/ToastHost.tsx

import { useUiStore } from '@/store/useUiStore'

export default function ToastHost() {
  const { toastMsg, toastVis } = useUiStore()
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%',
      transform: `translateX(-50%) translateY(${toastVis ? 0 : 60}px)`,
      padding: '12px 24px', background: '#1e293b', color: '#fff',
      borderRadius: 12, fontSize: 13, fontWeight: 600,
      boxShadow: '0 8px 30px rgba(0,0,0,.18)', zIndex: 9999,
      opacity: toastVis ? 1 : 0, transition: 'all .3s', pointerEvents: 'none',
    }}>
      <span style={{ color: '#4ade80', marginRight: 8 }}>✓</span>{toastMsg}
    </div>
  )
}

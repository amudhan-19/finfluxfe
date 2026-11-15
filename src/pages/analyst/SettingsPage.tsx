// @author  veera
// @file    pages/analyst/SettingsPage.tsx
//
// Read-only thresholds for analysts (supervisor edits in Flux Settings).


import { useEntities } from '@/features/entities/hooks'
import { useThresholds } from '@/features/profile/hooks'
import { useUiStore } from '@/store/useUiStore'
import { X } from '@/constants/theme'

export default function AnalystSettingsPage() {
  const { selCo, setSelCo } = useUiStore()
  const { data: entities = [] } = useEntities()
  const entityId = selCo || entities[0]?.id || null
  const { data: thresholds = [] } = useThresholds(entityId)

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px' }}>
      <h2 style={{ fontSize: 18, fontWeight: 800 }}>Settings</h2>
      <div style={{ marginTop: 8 }}>
        <select value={entityId || ''} onChange={(e) => setSelCo(e.target.value || null)}
          style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${X.border}`, fontSize: 11 }}>
          {entities.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>

      <div style={{
        marginTop: 14, padding: '14px 18px', background: 'var(--x-card)',
        borderRadius: 10, border: `1px solid ${X.border}`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>Materiality Thresholds</span>
          <span style={{ fontSize: 9, padding: '2px 8px', background: X.amberL,
                         color: X.amber, borderRadius: 4, fontWeight: 700 }}>
            Set by Supervisor
          </span>
        </div>
        {thresholds.length === 0 && <div style={{ color: X.textM, fontSize: 11 }}>None set yet.</div>}
        {thresholds.map((t) => (
          <div key={t.statement} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
            borderBottom: `1px solid ${X.borderL}`,
          }}>
            <span style={{ fontWeight: 700, width: 32, fontSize: 11 }}>{t.statement.toUpperCase()}</span>
            <Pill label="%" value={t.pct_value + '%'} />
            <Pill label="$" value={'$' + Number(t.abs_value).toLocaleString()} />
            <Pill label="Mode" value={t.mode} />
            {t.mode === 'both' && <Pill label="Logic" value={t.logic.toUpperCase()} />}
          </div>
        ))}
      </div>
    </div>
  )
}


function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '3px 8px', background: X.slateL, color: X.text,
      borderRadius: 4, fontSize: 10, fontWeight: 600,
    }}>
      <span style={{ color: X.textM, marginRight: 4 }}>{label}</span>{value}
    </div>
  )
}

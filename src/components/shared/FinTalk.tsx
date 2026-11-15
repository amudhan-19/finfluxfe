// @author  veera
// @file    components/shared/FinTalk.tsx
//
// Floating AI assistant in bottom-right. Currently the bot returns canned
// responses; backend integration is a Phase-6 follow-up.
// Visibility is controlled by useUiStore.finTalkOpen so it survives nav.

import { useEffect, useRef, useState } from 'react'
import { useUiStore } from '@/store/useUiStore'
import { X } from '@/constants/theme'
import { U } from '@/constants/uiText'

interface Msg {
  from: 'ai' | 'user'
  text: string
}

const INITIAL: Msg[] = [
  { from: 'ai', text: `Hello! I'm FINTalk ${U.mdash} your flux & close-cycle assistant. Ask me anything about variances, signoffs, or your tasks.` },
]

const CANNED: Array<{ match: RegExp; reply: string }> = [
  { match: /sign[ -]?off/i, reply: 'Open a Flux Review and click "Sign Off All (PL)" to bulk-sign every caption in the active statement. A supervisor can clear individual signoffs from the table.' },
  { match: /threshold/i, reply: `Materiality thresholds live under Flux Settings ${U.arr} Thresholds. Both PL and BS support a % rule, an absolute $ rule, or "both" with AND/OR logic.` },
  { match: /macro|geopolitical/i, reply: `Macro & Geopolitical factors appear on the Dashboard as pills and inside Flux Review as an expandable strip. You can add custom factors from Flux Settings ${U.arr} AI Insights.` },
  { match: /flux|variance/i, reply: `Flux Review highlights material variances with a red triangle (${U.triUp}). Toggle Concise / Detailed at the top-right to switch the AI commentary depth.` },
  { match: /director|approval/i, reply: 'If an entity\'s approval level is "director", a supervisor will see "Send for Approval" instead of "Approve". The director then takes the final action from their queue.' },
  { match: /export/i, reply: 'Use the Export button on a Flux Review to generate a PDF/Excel using the currently selected AI mode (concise or detailed).' },
]

function reply(question: string): string {
  for (const r of CANNED) if (r.match.test(question)) return r.reply
  return "I don't have a definitive answer for that yet. Try asking about flux, signoffs, thresholds, macro factors, exports, or director approval."
}


export default function FinTalk() {
  const { finTalkOpen, setFinTalkOpen } = useUiStore()
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL)
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [msgs, finTalkOpen])

  const send = () => {
    const q = input.trim()
    if (!q) return
    const userMsg: Msg = { from: 'user', text: q }
    setMsgs((m) => [...m, userMsg])
    setInput('')
    setTimeout(() => {
      setMsgs((m) => [...m, { from: 'ai', text: reply(q) }])
    }, 350)
  }

  return (
    <>
      <button onClick={() => setFinTalkOpen(!finTalkOpen)}
              title={finTalkOpen ? 'Close FINTalk' : 'Open FINTalk'}
              style={{
                position: 'fixed', bottom: 22, right: 22,
                width: 46, height: 46, borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg,#1e293b,#334155)',
                color: '#4ade80', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', zIndex: 200,
                boxShadow: '0 4px 20px rgba(30,41,59,.4)',
              }}>
        {finTalkOpen ? (
          <span style={{ fontSize: 18 }}>{U.times}</span>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                 stroke="#4ade80" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span style={{ fontSize: 6, marginTop: 1, fontWeight: 700, letterSpacing: 0.4 }}>
              FINTalk
            </span>
          </>
        )}
      </button>

      {finTalkOpen && (
        <div style={{
          position: 'fixed', bottom: 78, right: 22,
          width: 300, height: 380, background: 'var(--x-card)',
          borderRadius: 14, border: `1px solid ${X.border}`,
          boxShadow: '0 16px 60px rgba(0,0,0,.18)',
          zIndex: 200, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{
            padding: '10px 14px', borderBottom: `1px solid ${X.border}`,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'linear-gradient(135deg,#0f172a,#1e293b)', color: '#e2e8f0',
          }}>
            <span style={{ fontSize: 14 }}>{U.bolt}</span>
            <strong style={{ fontSize: 12, color: '#4ade80' }}>FINTalk</strong>
            <span style={{ fontSize: 9, color: '#94a3b8', marginLeft: 'auto' }}>AI Assistant</span>
          </div>

          <div ref={scrollRef} style={{
            flex: 1, overflowY: 'auto', padding: 10,
            display: 'flex', flexDirection: 'column', gap: 6,
          }}>
            {msgs.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%', padding: '7px 10px',
                  borderRadius: m.from === 'user'
                    ? '10px 10px 4px 10px'
                    : '10px 10px 10px 4px',
                  background: m.from === 'user' ? '#1e293b' : '#f0fdf4',
                  color: m.from === 'user' ? '#e2e8f0' : X.text,
                  fontSize: 10.5, lineHeight: 1.4,
                }}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div style={{
            padding: 8, borderTop: `1px solid ${X.border}`,
            display: 'flex', gap: 4, flexShrink: 0,
          }}>
            <input value={input} onChange={(e) => setInput(e.target.value)}
                   placeholder={`Ask FINTalk${U.ellip}`}
                   onKeyDown={(e) => { if (e.key === 'Enter') send() }}
                   style={{
                     flex: 1, padding: '6px 10px', borderRadius: 6,
                     border: `1px solid ${X.border}`, fontSize: 11,
                   }} />
            <button disabled={!input.trim()} onClick={send} style={{
              padding: '6px 12px', borderRadius: 6, border: 'none',
              background: input.trim() ? X.green : X.border,
              color: input.trim() ? '#fff' : X.textM,
              fontSize: 10, fontWeight: 700, cursor: input.trim() ? 'pointer' : 'not-allowed',
            }}>Send</button>
          </div>
        </div>
      )}
    </>
  )
}

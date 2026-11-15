// @author  veera
// @file    components/flux/AiCommentaryDisplay.tsx

import {
  buildDetailedCommentaryDisplay,
  cleanAiText,
  type DetailedSection,
} from '@/utils/aiText'

interface ConciseProps {
  text: string | null | undefined
  isMaterial?: boolean
  clamp?: boolean
}

export function ConciseAiCommentary({
  text,
  isMaterial: _isMaterial = false,
  clamp = true,
}: ConciseProps) {
  const cleaned = cleanAiText(text)
  if (!cleaned) {
    return <span className="flux-ai flux-ai--empty">—</span>
  }

  return (
    <span className={`flux-ai flux-ai--concise${clamp ? ' flux-ai--concise--clamp' : ''}`}>
      {cleaned}
    </span>
  )
}

interface DetailedProps {
  text: string | null | undefined
  isMaterial?: boolean
}

export function DetailedAiCommentary({ text, isMaterial = false }: DetailedProps) {
  const sections = buildDetailedCommentaryDisplay(text)
  if (sections.length === 0) {
    return <span className="flux-ai flux-ai--empty">—</span>
  }

  return (
    <div className="flux-ai flux-ai__detailed">
      {sections.map((section) => (
        <DetailedSectionBlock key={section.key} section={section} />
      ))}
      {isMaterial ? (
        <div className="flux-ai__material-badge">Material — review required.</div>
      ) : null}
    </div>
  )
}

const GAP_RE = /(evidence gap|:\s*missing\b|\bnot available\b|\bunavailable\b)/i
const ESCALATION_OK_RE = /no contract-level escalation/i

/** A soft amber card for an evidence-gap / missing-evidence line. */
function GapCard({ text }: { text: string }) {
  return (
    <div
      className="flux-ai__gap-card"
      style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        color: '#92400e',
        borderRadius: 6,
        padding: '6px 10px',
        margin: '4px 0',
        fontSize: '0.85em',
      }}
    >
      {text}
    </div>
  )
}

/** A red/amber chip for an escalation trigger (gray when none present). */
function EscalationChip({ text }: { text: string }) {
  const isNone = ESCALATION_OK_RE.test(text)
  const palette = isNone
    ? { bg: '#f1f5f9', border: '#e2e8f0', fg: '#475569' }
    : { bg: '#fef2f2', border: '#fecaca', fg: '#b91c1c' }
  return (
    <span
      className="flux-ai__escalation-chip"
      style={{
        display: 'inline-block',
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.fg,
        borderRadius: 999,
        padding: '2px 10px',
        margin: '2px 4px 2px 0',
        fontSize: '0.8em',
        fontWeight: 600,
      }}
    >
      {text}
    </span>
  )
}

function DetailedSectionBlock({ section }: { section: DetailedSection }) {
  // Escalation triggers render as chips (red when a trigger is present).
  if (section.key === 'escalation_triggers') {
    return (
      <div>
        <div className="flux-ai__section-title">{section.title}</div>
        <div className="flux-ai__escalation-chips">
          {section.lines.map((line, idx) => (
            <EscalationChip key={`esc-${idx}`} text={line} />
          ))}
        </div>
      </div>
    )
  }

  // Required-evidence status: Available lines as bullets, gaps as amber cards.
  if (section.key === 'required_evidence_status') {
    return (
      <div>
        <div className="flux-ai__section-title">{section.title}</div>
        {section.lines.map((line, idx) =>
          GAP_RE.test(line) ? (
            <GapCard key={`res-${idx}`} text={line} />
          ) : (
            <div key={`res-${idx}`} className="flux-ai__evidence-line">{line}</div>
          ),
        )}
      </div>
    )
  }

  const isNarrative = (
    section.key === 'summary'
    || section.key === 'executive_summary'
    || section.key === 'headline'
    || section.key === 'variance_bridge'
    || section.key === 'contract_lens'
    || section.key === 'pattern_or_anomaly'
  )

  if (isNarrative) {
    const isHeadline = (
      section.key === 'headline'
      || section.key === 'executive_summary'
      || section.key === 'summary'
    )
    return (
      <div>
        {!isHeadline && section.key !== 'summary' ? (
          <div className="flux-ai__section-title">{section.title}</div>
        ) : null}
        <div className={isHeadline ? 'flux-ai__summary' : undefined}>
          {section.lines.join('\n')}
        </div>
      </div>
    )
  }

  const isSingleLine = section.lines.length === 1
  return (
    <div>
      <div className="flux-ai__section-title">{section.title}</div>
      {isSingleLine ? (
        GAP_RE.test(section.lines[0]) ? (
          <GapCard text={section.lines[0]} />
        ) : (
          <div>{section.lines[0]}</div>
        )
      ) : (
        <ul className="flux-ai__section-list">
          {section.lines.map((line, idx) =>
            GAP_RE.test(line) ? (
              <li key={`${section.key}-${idx}`} style={{ listStyle: 'none' }}>
                <GapCard text={line} />
              </li>
            ) : (
              <li key={`${section.key}-${idx}`}>{line}</li>
            ),
          )}
        </ul>
      )}
    </div>
  )
}

// @author  veera
// @file    utils/aiText.ts
//
// Front-end mirror of the backend AI text-hygiene helpers
// (`app/services/ai_text_clean.py`). Centralizes mojibake repair, control-
// character stripping, emoji removal, and finance-style number formatting
// so the Flux Review components never duplicate this logic and never
// render the raw â€/Ã artefacts seen in the screenshots.

const MOJIBAKE_REPLACEMENTS: ReadonlyArray<readonly [string, string]> = [
  ['\u00e2\u20ac\u2122', '\u2019'],   // â€™ -> ’
  ['\u00e2\u20ac\u0153', '\u201c'],   // â€œ -> “
  ['\u00e2\u20ac\u009d', '\u201d'],   // â€\x9d -> ”
  ['\u00e2\u20ac\ufffd', '\u201d'],
  ['\u00e2\u20ac\u201d', '\u2014'],   // â€" -> — (em dash)
  ['\u00e2\u20ac\u201c', '\u2013'],   // â€" -> – (en dash)
  ['\u00e2\u20ac\u00a2', '\u2022'],   // â€¢ -> •
  ['\u00e2\u20ac\u00a6', '\u2026'],   // â€¦ -> …
  ['\u00e2\u20ac\u02dc', '\u2018'],   // â€˜ -> ‘
  ['\u00c3\u00a9',       '\u00e9'],   // Ã© -> é
  ['\u00c3\u00a8',       '\u00e8'],   // Ã¨ -> è
  ['\u00c3\u00aa',       '\u00ea'],   // Ãª -> ê
  ['\u00c3\u00b6',       '\u00f6'],   // Ã¶ -> ö
  ['\u00c3\u00bc',       '\u00fc'],   // Ã¼ -> ü
  ['\u00c3\u00b1',       '\u00f1'],   // Ã± -> ñ
]

const MOJIBAKE_MARKERS: ReadonlyArray<string> = [
  '\u00e2\u20ac', '\u00c3\u00a9', '\u00c3\u00a8', '\u00c3\u00aa',
  '\u00c3\u00b6', '\u00c3\u00bc',
]

const BARE_NBSP_ARTEFACT = '\u00c2\u00a0'
const BARE_A_HAT         = '\u00c2'

const EMOJI_RANGES: ReadonlyArray<readonly [number, number]> = [
  [0x1F300, 0x1F6FF],
  [0x1F900, 0x1F9FF],
  [0x1FA00, 0x1FAFF],
  [0x1F000, 0x1F02F],
  [0x1F0A0, 0x1F0FF],
  [0x2600,  0x27BF],
]

function isEmojiCodepoint(codepoint: number): boolean {
  for (const [start, end] of EMOJI_RANGES) {
    if (codepoint >= start && codepoint <= end) return true
  }
  return codepoint === 0xFE0E || codepoint === 0xFE0F || codepoint === 0x200D
}

/** Best-effort cp1252 → UTF-8 round-trip. Returns the original string when
 *  any byte in `text` is outside the cp1252 range so we never throw. */
function tryCp1252Roundtrip(text: string): string {
  const bytes: number[] = []
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp > 0xFF) return text
    bytes.push(cp)
  }
  try {
    const arr = Uint8Array.from(bytes)
    return new TextDecoder('utf-8', { fatal: true }).decode(arr)
  } catch {
    return text
  }
}

interface CleanOptions {
  /** Default true — drops emoji codepoints from finance commentary. */
  dropEmoji?: boolean
}

/** Display-safe text. Empty / null inputs become "". */
export function cleanAiText(text: string | null | undefined, opts: CleanOptions = {}): string {
  if (text == null) return ''
  let s = String(text)
  if (!s.trim()) return ''

  if (MOJIBAKE_MARKERS.some((m) => s.includes(m))) {
    s = tryCp1252Roundtrip(s)
  }
  for (const [bad, good] of MOJIBAKE_REPLACEMENTS) {
    if (s.includes(bad)) s = s.split(bad).join(good)
  }
  s = s.split(BARE_NBSP_ARTEFACT).join('\u00a0')
  s = s.split(BARE_A_HAT).join('')

  const dropEmoji = opts.dropEmoji !== false
  let out = ''
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0
    if (ch === '\n' || ch === '\t') { out += ch; continue }
    if (cp < 0x20 || cp === 0x7F) continue
    if (cp === 0xFEFF || cp === 0x200B) continue
    if (dropEmoji && isEmojiCodepoint(cp)) continue
    out += ch
  }
  return out.trim()
}

/** Format a number as finance-style currency: $308,864 / -$12,345.
 *  Returns "n/a" for null/NaN. Uses 0 decimals when |value| ≥ 100. */
export function formatCurrency(
  value: number | null | undefined,
  opts: { symbol?: string } = {},
): string {
  if (value == null || Number.isNaN(value)) return 'n/a'
  const symbol = opts.symbol ?? '$'
  const sign = value < 0 ? '-' : ''
  const magnitude = Math.abs(value)
  const decimals = magnitude >= 100 ? 0 : 2
  const body = magnitude.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${sign}${symbol}${body}`
}

/** Format a percentage with explicit sign: +67%, -12%. */
export function formatPercent(
  value: number | null | undefined,
  opts: { decimals?: number } = {},
): string {
  if (value == null || Number.isNaN(value)) return 'n/a'
  const decimals = opts.decimals ?? 0
  const sign = value >= 0 ? '+' : '-'
  const body = Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${sign}${body}%`
}

// ── Detailed-text section parser ────────────────────────────────────────
// Canonical sections follow the caption-wise analysis contract (v2). Legacy
// keys are retained so commentary stored before the upgrade still renders.
export type DetailedSectionKey =
  | 'headline'
  | 'variance_bridge'
  | 'contract_lens'
  | 'primary_drivers'
  | 'decomposition'
  | 'key_transaction_evidence'
  | 'drill_down_attribution'
  | 'pattern_or_anomaly'
  | 'required_evidence_status'
  | 'reviewer_actions'
  | 'escalation_triggers'
  // Legacy keys (backward compat for stored commentary)
  | 'executive_summary'
  | 'timing_and_posting_signals'
  | 'attribution_coverage'
  | 'summary'
  | 'major_movement'
  | 'largest_transactions'
  | 'transaction_pattern'
  | 'customer_vendor'
  | 'recommended_actions'

export interface DetailedSection {
  key: DetailedSectionKey
  title: string
  lines: string[]
}

export const DETAILED_SECTION_ORDER: readonly DetailedSectionKey[] = [
  'headline',
  'variance_bridge',
  'contract_lens',
  'primary_drivers',
  'decomposition',
  'key_transaction_evidence',
  'drill_down_attribution',
  'pattern_or_anomaly',
  'required_evidence_status',
  'reviewer_actions',
  'escalation_triggers',
]

const HEADING_RULES: ReadonlyArray<{
  key: DetailedSectionKey
  title: string
  pattern: RegExp
}> = [
  { key: 'headline', title: 'Headline',
    pattern: /^(headline|executive\s+summary|summary)\s*:?$/i },
  { key: 'variance_bridge', title: 'Variance bridge',
    pattern: /^variance\s+bridge\s*:?$/i },
  { key: 'contract_lens', title: 'Contract lens',
    pattern: /^contract\s+lens\s*:?$/i },
  { key: 'primary_drivers', title: 'Primary drivers',
    pattern: /^(primary\s+drivers?|major\s+movement)\s*:?$/i },
  { key: 'decomposition', title: 'Decomposition',
    pattern: /^decomposition\s*:?$/i },
  { key: 'key_transaction_evidence', title: 'Key transaction evidence',
    pattern: /^(key\s+transaction\s+evidence|largest\s+transactions?)\s*:?$/i },
  { key: 'drill_down_attribution', title: 'Drill-down attribution',
    pattern: /^(drill[-\s]?down\s+attribution|attribution\s+coverage|customer\s*\/\s*vendor\s+context|customer\s+vendor\s+context)\s*:?$/i },
  { key: 'pattern_or_anomaly', title: 'Pattern or anomaly',
    pattern: /^(pattern\s+or\s+anomaly|timing\s+and\s+posting\s+signals?|transaction\s+pattern)\s*:?$/i },
  { key: 'required_evidence_status', title: 'Required evidence status',
    pattern: /^required\s+evidence\s+status\s*:?$/i },
  { key: 'reviewer_actions', title: 'Reviewer actions',
    pattern: /^(reviewer\s+actions?|recommended\s+action[s]?|next\s+steps?|action[s]?)\s*:?$/i },
  { key: 'escalation_triggers', title: 'Escalation triggers',
    pattern: /^escalation\s+trigger[s]?\s*:?$/i },
]

const BULLET_PREFIX_RE = /^[\s•\u2022\-*]+/

function stripBullet(line: string): string {
  return line.replace(BULLET_PREFIX_RE, '').trim()
}

/** Parse multi-line detailed_text into Flux Review sections. */
export function buildDetailedCommentaryDisplay(
  detailedText: string | null | undefined,
): DetailedSection[] {
  const cleaned = cleanAiText(detailedText)
  if (!cleaned) return []

  const sections: DetailedSection[] = []
  let current: DetailedSection | null = null

  for (const rawLine of cleaned.split(/\r?\n/)) {
    const trimmed = rawLine.trim()
    if (!trimmed) continue

    const matched = HEADING_RULES.find((rule) => rule.pattern.test(trimmed))
    if (matched) {
      current = { key: matched.key, title: matched.title, lines: [] }
      sections.push(current)
      continue
    }

    if (!current) {
      current = { key: 'headline', title: 'Headline', lines: [] }
      sections.push(current)
    }

    const isBullet = /^[\s]*[•\u2022\-*]/.test(rawLine)
    const text = isBullet ? stripBullet(rawLine) : trimmed
    if (text) current.lines.push(text)
  }

  const orderIndex = (key: DetailedSectionKey): number => {
    const canonical = key === 'summary' || key === 'executive_summary' ? 'headline'
      : key === 'major_movement' ? 'primary_drivers'
      : key === 'largest_transactions' ? 'key_transaction_evidence'
      : key === 'transaction_pattern' || key === 'timing_and_posting_signals' ? 'pattern_or_anomaly'
      : key === 'customer_vendor' || key === 'attribution_coverage' ? 'drill_down_attribution'
      : key === 'recommended_actions' ? 'reviewer_actions'
      : key
    const idx = DETAILED_SECTION_ORDER.indexOf(canonical as typeof DETAILED_SECTION_ORDER[number])
    return idx === -1 ? DETAILED_SECTION_ORDER.length : idx
  }

  return sections
    .filter((s) => s.lines.length > 0)
    .sort((a, b) => orderIndex(a.key) - orderIndex(b.key))
}

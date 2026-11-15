// @author  veera
// @file    types/models.ts

export type Role = 'analyst' | 'supervisor' | 'director' | 'admin'
export type UserStatus = 'active' | 'invited' | 'disabled'
export type EntityStatus =
  | 'assigned' | 'wip' | 'under_review'
  | 'rejected' | 'approved' | 'pending_director'

export interface UserOut {
  id: number
  name: string
  initials: string
  color: string
  role: Role
  email: string
  department?: string | null
  status?: UserStatus
}

export interface UserMe extends UserOut {
  visible_entity_ids: string[] | null
}

export interface Entity {
  id: string
  name: string
  region: 'North America' | 'Europe' | 'APAC'
  status: EntityStatus
  tags: string[]
  period_type: 'YoY' | 'MoM' | 'QoQ' | 'Custom'
  period_from: string
  period_to: string
  period_from_label?: string | null
  period_to_label?: string | null
  sub_due_date?: string | null
  rev_due_date?: string | null
  approval_level: 'supervisor' | 'director'
  supervisor: UserOut
  director?: UserOut | null
  currency?: string | null
  fiscal_year_end?: string | null
  tax_id?: string | null
  is_active: boolean
}

export interface EntityListItem extends Entity {
  assignees: UserOut[]
  macro_factor_count: number
  /** Review completion metadata (additive; defaults to 0 when unavailable). */
  caption_count?: number
  signed_count?: number
  review_progress?: number
}

export type FluxSourceType = 'seed' | 'business_central' | 'quickbooks' | 'manual'

export interface FluxRow {
  id: number
  caption: string
  current_value: number
  comp_value: number
  pct_variance: number | null
  is_material: boolean
  is_bold: boolean
  sort_order: number
  /** NULL on legacy rows; treated as 'seed' by the UI. */
  source_type?: FluxSourceType | null
  generated_from?: string | null
  generated_at?: string | null
  /** Finance-normalized variance (credit-normal revenue uses magnitude logic). */
  normal_balance?: 'debit' | 'credit' | 'neutral' | null
  raw_variance_amount?: number | null
  finance_current_value?: number | null
  finance_comparison_value?: number | null
  finance_variance_amount?: number | null
  finance_variance_percentage?: number | null
  finance_direction?: 'increased' | 'decreased' | 'flat' | null
}

// ── Admin: BC → Flux generation ─────────────────────────────────────
export interface FluxGenerateRequest {
  statement: 'pl' | 'bs' | 'both'
  mode: 'preview' | 'commit'
  /** Replace existing rows. Comments / sign-offs are preserved either way. */
  overwriteExisting?: boolean
  source?: 'business_central' | 'quickbooks'
}

export interface FluxPreviewRow {
  statement: string
  caption: string
  current_value: number
  comp_value: number
  pct_variance: number | null
  is_material: boolean
  had_existing_row: boolean
  matched_account_count: number
  matched_transaction_count: number
  skipped_reason?: string | null
  selectedGlAccounts?: string[]
  selectedSubledger?: string[]
  selectedDimensions?: string[]
  warnings?: string[]
}

export interface FluxSkippedCaption {
  caption: string
  reason: string
}

export interface FluxGenerateResponse {
  mode: 'preview' | 'commit'
  entity_id: string
  statement: string
  rows_previewed: number
  rows_inserted: number
  rows_updated: number
  rows_skipped: number
  preview_rows: FluxPreviewRow[]
  captions_total: number
  captions_with_mappings: number
  captions_without_mappings: string[]
  captions_with_zero_transactions: string[]
  matched_transaction_total: number
  rowsGenerated?: number
  matchedTransactions?: number
  unmappedCaptions?: string[]
  captionsWithNoTransactions?: string[]
  skippedCaptions?: FluxSkippedCaption[]
  statementCalculations?: FluxStatementCalculation[]
}

export interface FluxStatementCalculation {
  statement: string
  calculationMode: 'net_change' | 'balance_at_date'
  calculationLabel: string
  currentStartDate: string
  currentEndDate: string
  comparisonStartDate: string
  comparisonEndDate: string
  mappedGlAccountsCount: number
  selectedSubledgerCount: number
  matchedTransactions: number
  rowsGenerated: number
  warnings: string[]
}

export interface BcFluxDiagnostics {
  entity_id: string
  period_from: string
  period_to: string
  ontology_mappings_total: number
  ontology_mappings_pl: number
  ontology_mappings_bs: number
  captions_with_mapped_gl: number
  captions_without_mapped_gl: string[]
  captions_with_mapped_dimensions: number
  erp_gl_accounts_synced: number
  erp_dimension_values_synced: number
  erp_gl_entries_synced: number
  flux_rows_total: number
  flux_rows_seed: number
  flux_rows_bc_generated: number
  flux_rows_manual: number
  last_generated_at?: string | null
}

// ── Per-entity Flux period diagnostics + Save & Generate ────────────
/** Response of `GET /api/entities/{id}/flux-generation-diagnostics`.
 *  Used by the supervisor "Period Config" panel to show parsed labels
 *  and warn about period vs BC range mismatches. */
export interface FluxGenerationDiagnostics {
  entity_id: string
  period_type: string
  period_from_raw: string
  period_to_raw: string
  current_label: string
  comparison_label: string
  current_start_date: string
  current_end_date: string
  comparison_start_date: string
  comparison_end_date: string
  bc_oldest_posting_date?: string | null
  bc_latest_posting_date?: string | null
  bc_entry_count: number
  is_selected_range_within_bc_data: boolean
  warnings: string[]
  ontology_mappings_total: number
  captions_with_mapped_gl: number
  captions_without_mapped_gl: string[]
  gl_entries_in_current_range: number
  gl_entries_in_comparison_range: number
  flux_rows_for_selected_period: number
  statement_filter?: string | null
  captions: FluxGenerationCaptionDetail[]
}

export interface FluxGenerationCaptionDetail {
  statement: string
  caption: string
  mapped_gl_accounts: string[]
  matched_current_transactions: number
  matched_comparison_transactions: number
  current_value: number
  comparison_value: number
}

export interface SavePeriodAndGenerateRequest {
  period_type: 'YoY' | 'MoM' | 'QoQ' | 'Custom'
  period_from: string
  period_to: string
  statement?: 'pl' | 'bs' | 'both'
  /** Backend accepts both snake_case and camelCase. Default true. */
  overwriteExisting?: boolean
}

export interface SavePeriodAndGeneratePeriod {
  current_start_date:    string
  current_end_date:      string
  comparison_start_date: string
  comparison_end_date:   string
}

export interface StatementGenerationBreakdown {
  statement: string
  captions_total: number
  captions_with_mappings: number
  captions_without_mappings: string[]
  captions_with_zero_transactions: string[]
  matched_transaction_total: number
  current_transactions_matched: number
  comparison_transactions_matched: number
  rows_inserted: number
  rows_updated: number
  rows_skipped: number
  rows_generated: number
}

export interface PeriodRange {
  start_date: string
  end_date: string
  label: string
}

export interface SavePeriodAndGenerateResponse {
  ok: boolean
  entity_id: string
  period_type: string
  period_from: string
  period_to: string
  savedPeriodFrom: string
  savedPeriodTo: string
  current_label: string
  comparison_label: string
  currentRange: PeriodRange
  comparisonRange: PeriodRange
  period: SavePeriodAndGeneratePeriod
  rows_inserted: number
  rows_updated: number
  rows_skipped: number
  rows_generated: number
  captions_total: number
  captions_with_mappings: number
  captions_without_mappings: string[]
  captions_with_zero_transactions: string[]
  matched_transaction_total: number
  current_transactions_matched: number
  comparison_transactions_matched: number
  /** Per-statement breakdown keyed by `'pl'` / `'bs'`. Empty when the
   *  generator ran on an entity with no ontology mappings. */
  statements: Record<string, StatementGenerationBreakdown>
  safe_error_code?: string | null
  safe_error_message?: string | null
  warnings: string[]
}

export interface AiCommentary {
  caption: string
  concise_text: string
  detailed_text: string
  edited_text?: string | null
  edited_at?: string | null
  ai_score: number
  editor?: UserOut | null
}

export type AiImpactLevel = 'low' | 'medium' | 'high'

export interface FluxAiVarianceDriver {
  driver: string
  evidence: string
  /** Optional dollar amount; null when the model couldn't infer one. */
  amount?: number | null
  impact: AiImpactLevel
}

export interface FluxAiRiskFlag {
  risk: string
  severity: AiImpactLevel
  reason: string
}

/** Response of POST /api/entities/{id}/flux-ai/generate. Single shape for
 *  both success (`ok=true`) and SLM-side runtime failures (`ok=false` with
 *  a stable `safe_error_code`). HTTP 4xx/5xx still throw via axios.
 *
 *  New schema (May 2026) uses plain string arrays for `drivers`,
 *  `mapped_accounts`, `transaction_notes`, etc. The legacy structured
 *  fields (`variance_drivers`, `risk_flags`) remain optional for callers
 *  that still depend on them. */
export interface FluxAiGenerateResponse {
  ok: boolean
  entity_id: string
  statement: 'pl' | 'bs'
  caption: string
  concise_text?: string | null
  detailed_text?: string | null
  drivers?: string[]
  mapped_accounts?: string[]
  customer_vendor_notes?: string[]
  transaction_notes?: string[]
  party_diagnostics?: Record<string, unknown> | null
  review_notes?: string[]
  recommended_actions?: string[]
  confidence_score?: number | null
  // Legacy
  variance_drivers?: FluxAiVarianceDriver[]
  risk_flags?: FluxAiRiskFlag[]
  safe_error_code?: string | null
  safe_error_message?: string | null
}

export interface Reply {
  id: number
  text: string
  created_at: string
  user: UserOut
}

export interface Comment {
  id: number
  caption: string
  text: string
  is_resolved: boolean
  resolved_at?: string | null
  created_at: string
  user: UserOut
  resolver?: UserOut | null
  replies: Reply[]
}

export interface Signoff {
  caption: string
  signed_at: string
  version: number
  is_stale: boolean
  signer: UserOut
}

export interface MacroFactor {
  id: number
  category: string
  icon: string
  text: string
  is_custom: boolean
  created_at: string
  creator: UserOut
}

export interface Task {
  id: number
  entity_id: string
  title: string
  description?: string | null
  due_date: string
  status: 'todo' | 'in_progress' | 'pending' | 'done'
  priority: 'low' | 'medium' | 'high' | 'critical'
  phase: 'preparation' | 'review' | 'submission' | 'approval'
  is_recurring: boolean
  created_at: string
  updated_at: string
  assignee: UserOut
  reminder?: TaskReminder | null
  recurrence?: TaskRecurrence | null
}

export interface TaskReminder {
  days_before: number
  remind_time: string
  email: string
  is_sent: boolean
}

export interface TaskRecurrence {
  frequency: 'weekly' | 'monthly' | 'quarterly'
  day_of_month?: number | null
}

export interface PersonalReminder {
  id: number
  text: string
  due_date: string
  remind_time: string
  is_done: boolean
  created_at: string
}

export interface ChatReply {
  id: number
  text: string
  created_at: string
  user: UserOut
}

export interface ChatMessage {
  id: number
  text: string
  is_flagged: boolean
  created_at: string
  user: UserOut
  replies: ChatReply[]
}

export interface CompanyProfile {
  industry: string
  geography: string
  revenue_range: string
  entity_type: string
  brief?: string | null
}

export interface Threshold {
  statement: 'pl' | 'bs'
  mode: 'pct' | 'abs' | 'both'
  pct_value: number
  abs_value: number
  logic: 'and' | 'or'
  apply_all: boolean
}

// ── Admin ────────────────────────────────────────────────────────────
export interface AdminUser extends UserOut {
  supervisor?: UserOut | null
  entity_codes: string[]
  last_login_at?: string | null
  invited_at?: string | null
}

export interface RoleRow {
  id: number
  key: Role
  label: string
  description?: string | null
}

export interface PermissionRow {
  id: number
  key: string
  group: string
  label: string
}

export interface AuditLogRow {
  id: number
  actor_user_id: number
  action: string
  table_name: string
  row_pk?: string | null
  before_json?: unknown
  after_json?: unknown
  ip_address?: string | null
  created_at: string
  actor?: UserOut | null
}

export interface ErpCatalogItem {
  id: number
  key: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  auth_type?: string | null
}

export interface EntityErpMapping {
  id: number
  entity_id: string
  erp_key: string
  status: 'disconnected' | 'connecting' | 'connected' | 'error'
  last_sync_at?: string | null
}

export type ApiLayer = 'gl' | 'sub_gl' | 'transaction'

export interface ApiCredential {
  id: number
  entity_id: string
  layer: ApiLayer
  item_name?: string | null
  endpoint?: string | null
  auth_type?: string | null
  last4?: string | null
  status: 'missing' | 'unverified' | 'verified' | 'error'
  last_tested_at?: string | null
  last_synced_at?: string | null
}

// ── Business Central credentials & sync ─────────────────────────────
export type BcCredentialStatus =
  | 'not_configured'
  | 'saved'
  | 'testing'
  | 'verified'
  | 'failed'
  | 'syncing'
  | 'synced'

export type BcSyncType =
  | 'test_connection'
  | 'fetch_companies'
  | 'sync_gl_accounts'
  | 'sync_dimensions'
  | 'sync_gl_entries'
  | 'sync_customers'
  | 'sync_vendors'
  | 'sync_customer_ledger_entries'
  | 'sync_vendor_ledger_entries'

export type BcSyncStatus = 'running' | 'success' | 'failed'

export interface BcReadinessOut {
  entity_code: string
  erp_type: 'business_central'
  credential_verified: boolean
  company_selected: boolean
  gl_ready: boolean
  sub_gl_ready: boolean
  transaction_ready: boolean
  api_complete: boolean
  ready_count: number
  required_ready_count?: number
  required_ready_total?: number
  customers_ready?: boolean
  vendors_ready?: boolean
  customers_count?: number | null
  vendors_count?: number | null
  customers_last_synced_at?: string | null
  vendors_last_synced_at?: string | null
  customer_ledger_ready?: boolean
  vendor_ledger_ready?: boolean
  customer_ledger_count?: number | null
  vendor_ledger_count?: number | null
  customer_ledger_last_synced_at?: string | null
  vendor_ledger_last_synced_at?: string | null
  customer_ledger_unavailable?: boolean
  vendor_ledger_unavailable?: boolean
  customer_ledger_optional_message?: string | null
  vendor_ledger_optional_message?: string | null
  optional_warnings?: string[]
  missing_steps: string[]
  gl_account_count?: number | null
  dimension_value_count?: number | null
  general_ledger_entry_count?: number | null
  gl_last_synced_at?: string | null
  dimensions_last_synced_at?: string | null
  entries_last_synced_at?: string | null
  active_company_id?: string | null
  active_company_name?: string | null
}

export interface ErpAccountOut {
  company_id: string
  account_no: string
  display_name?: string | null
  account_name?: string | null
  account_category?: string | null
  sub_category?: string | null
  account_type?: string | null
  blocked?: boolean | null
  external_id?: string | null
  last_synced_at?: string | null
}

export interface ErpDimensionValueOut {
  company_id: string
  dimension_code: string
  dimension_name?: string | null
  value_code: string
  value_name?: string | null
  display_name?: string | null
  last_synced_at?: string | null
}

export interface ErpSubledgerOptionOut {
  value: string
  label: string
  kind: string
}

export interface ErpGlEntryOut {
  company_id: string
  external_entry_no: string
  entry_number?: string | null
  posting_date?: string | null
  document_no?: string | null
  account_no?: string | null
  description?: string | null
  debit_amount?: number | null
  credit_amount?: number | null
  amount?: number | null
  last_synced_at?: string | null
}

export interface BcCredentialOut {
  credential_id: number
  entity_id: string
  erp_type: string
  environment_name: string
  scope: string
  base_url: string
  company_id?: string | null
  company_name?: string | null
  masked_client_id?: string | null
  masked_client_secret?: string | null
  status: BcCredentialStatus
  last_safe_error_code?: string | null
  last_safe_error_message?: string | null
  last_tested_at?: string | null
  last_verified_at?: string | null
  created_at: string
  updated_at: string
}

export interface BcCompanyOut {
  company_id: string
  company_name: string
}

export interface BcSyncRunOut {
  id: number
  sync_type: BcSyncType
  status: BcSyncStatus
  started_at: string
  finished_at?: string | null
  safe_error_code?: string | null
  safe_error_message?: string | null
  records_processed?: number | null
}

export interface BcConnectorResponse {
  ok: boolean
  status: BcCredentialStatus | 'optional_unavailable'
  layer_status?: string | null
  safe_error_code?: string | null
  safe_error_message?: string | null
  records_processed?: number | null
  companies: BcCompanyOut[]
  sync_run: BcSyncRunOut
}

export interface OntologyMapping {
  id: number
  entity_id: string
  statement: 'pl' | 'bs'
  tflux_caption: string
  erp_gl_json: string[]
  erp_subgl_json: string[]
  erp_subledger_json?: Array<string | { type?: string; code?: string; name?: string; label?: string }>
  custom_caption?: string | null
  is_hidden: boolean
  display_column: 'tflux' | 'erp' | 'custom'
  sort_order: number
  version: number
}

export interface CustomCaption {
  id: number
  statement: 'pl' | 'bs'
  name: string
  is_subtotal: boolean
  erp_gl_json: string[]
  erp_subgl_json: string[]
  erp_subledger_json?: Array<string | { type?: string; code?: string; name?: string; label?: string }>
  sort_order: number
}

export interface Branding {
  logo_url?: string | null
  primary_color?: string | null
  updated_at?: string | null
}

export interface LicenseInfo {
  seats_total: number
  seats_used: number
  renewal_date: string
}

// ── Notifications ────────────────────────────────────────────────────
/** Notification type identifier — kept in sync with the backend
 *  `notifications.type` enum used in `app/services/notification_service.py`. */
export type NotificationType =
  | 'flux_submitted'
  | 'flux_rejected'
  | 'flux_approved'
  | 'director_approval_required'
  | 'director_approved'
  | 'director_rejected'
  | 'comment_mention'
  | 'task_assigned'
  | 'task_reassigned'
  | 'due_date_reminder'
  | 'bc_sync_failed'
  | 'ai_analysis_completed'
  | 'ai_analysis_failed'

export interface AppNotification {
  id: number
  type: NotificationType
  title: string
  message: string
  link_url?: string | null
  entity_id?: string | null
  is_read: boolean
  read_at?: string | null
  created_at: string
  actor?: UserOut | null
}

export interface UnreadCountResponse {
  count: number
}

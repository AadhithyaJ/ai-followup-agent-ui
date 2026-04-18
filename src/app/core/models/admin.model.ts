export interface FeatureFlags {
  [key: string]: boolean;
}

export interface FlagUpdateRequest {
  flag: string;
  enabled: boolean;
  rollout_pct?: number;
  expires_in?: number;
}

export interface DynamicConfig {
  [key: string]: any;
}

export interface ConfigSetRequest {
  path: string;
  value: any;
}

export interface ConfigAuditEntry {
  op: string;
  path: string;
  value: any;
  by: string;
  ts: number;
}

export interface Prompt {
  name: string;
  content: string;
}

export interface PromptHistory {
  version: number;
  content: string;
  author: string;
  ts: number;
}

export interface PromptUpsertRequest {
  name: string;
  content: string;
  note?: string;
}

export interface UsageEntry {
  limit_name: string;
  used: number;
  limit: number;
  percent: number;
  is_warning: boolean;
}

export interface NBAResult {
  action: string;
  confidence: number;
  reason: string;
  message_draft: string;
}

export interface LeaderboardEntry {
  lead_id: string;
  name: string;
  stage: string;
  score: string;
  conv_prob: number;
}

export interface AutopilotResult {
  tenant_id: string;
  leads_processed: number;
  actions_taken: number;
  errors: number;
  dry_run: boolean;
}

export interface OrchestrateRequest {
  message: string;
  lead_id?: string;
  context?: Record<string, any>;
}

export interface OrchestrateResult {
  lead_id: string;
  total_steps: number;
  final_summary: string;
  score: string;
  stage_updated: string;
}

/* ── Settings Models ─────────────────────────────────── */
export interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  from: string;
  source?: string;
}

export interface AlertSettings {
  emails: string[];
  alert_on_high_lead: boolean;
  alert_on_reply: boolean;
  alert_on_negotiation: boolean;
}

export interface LlmSettings {
  model: string;
  temperature: number;
  max_tokens: number;
}

export interface AgentConfig {
  system_prompt: string | null;
  model: string;
  tone: string | null;
}

export interface AgentSettings {
  [agent_name: string]: AgentConfig;
}

export interface ChannelSettings {
  email: { enabled: boolean };
  whatsapp: { enabled: boolean };
  sms: { enabled: boolean };
}

export interface WhatsappSettings {
  enabled: boolean;
  provider: 'twilio' | 'msg91';
  twilio?: { account_sid: string; from: string; configured: boolean };
  msg91?: { authkey: string; integrated_number: string; configured: boolean };
}

export interface FollowupSettings {
  enabled: boolean;
  no_reply_days: number;
  no_reply_max: number;
  no_reply_enabled: boolean;
  max_followups_per_day: number;
  high_intent_delay_sec: number;
  low_intent_delay_sec: number;
}

export interface OptoutSettings {
  keywords: string[];
}

export interface ImapSettings {
  enabled: boolean;
  poll_interval_sec: number;
  inbox?: string;
}

export interface LimitsSettings {
  max_leads_per_month: number;
  max_llm_calls_per_lead: number;
}

export interface ReportsSettings {
  daily_enabled: boolean;
  daily_hour: number;
}

export interface LanguageSettings {
  default_language: string;
  auto_detect: boolean;
  location_mapping: Record<string, string>;
  supported_languages?: Record<string, string>;
}

export interface ScoringSettings {
  enabled: boolean;
  prompt?: string;
  entity_fields: string[];
}

export interface PipelineSettings {
  stages?: string[];
  auto_assign_agent: boolean;
  auto_move_stage: boolean;
}

export interface ABExperiment {
  name: string;
  variants: string[];
}

export interface ABTestingSettings {
  enabled: boolean;
  experiments: ABExperiment[];
}

export interface PersonalizationRule {
  condition: string;
  language?: string;
  message?: string;
}

export interface PersonalizationSettings {
  enabled: boolean;
  rules: PersonalizationRule[];
}

export interface SecuritySettings {
  rate_limit_per_minute: number;
}

export interface ScalingSettings {
  api_instances: number;
  worker_instances: number;
  autoscaling?: boolean;
}

export interface QueueSettings {
  max_retries: number;
  retry_delay_sec: number;
  followup_workers?: number;
}

export interface CostControlSettings {
  max_llm_calls_per_lead: number;
  skip_llm_for_low_score: boolean;
}

/* ── A/B Testing Report ──────────────────────────────── */
export interface ABVariant {
  name: string;
  impressions: number;
  wins: number;
  win_rate: number;
  ucb_score: number;
  is_leader: boolean;
}

export interface ABReport {
  experiment: string;
  total_pulls: number;
  variants: ABVariant[];
  leader: string;
  is_significant: boolean;
  recommendation: string;
}

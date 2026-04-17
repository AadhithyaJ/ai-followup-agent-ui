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

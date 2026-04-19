export interface AgentPerformanceEntry {
  total_leads: number;
  conversions: number;
  conversion_rate: number;
}

export interface AnalyticsOverview {
  total_leads: number;
  conversion_rate: number;
  avg_response_time: number;
  active_pipeline: number;
  agent_performance: Record<string, AgentPerformanceEntry>;
}

export interface FunnelData {
  new: number;
  qualified: number;
  contacted: number;
  interested: number;
  negotiation: number;
  converted: number;
  lost: number;
}

export interface AgentPerformance {
  agent: string;
  total_leads: number;
  conversions: number;
  conversion_rate: number;
}

export interface AdvancedAnalytics {
  cohort_conversion: Record<string, { total: number; converted: number; rate: number }>;
  revenue_attribution: Record<string, number>;
  lead_velocity: { last_7_days: number; avg_per_day_7d: number };
  llm_cost_report: { daily_usd: Record<string, number>; total_usd: number };
}

export interface CostOverview {
  today_usd: number;
  monthly_usd: number;
  total_usd: number;
  daily_usd: Record<string, number>;
  by_model: Record<string, number>;
  by_operation: Record<string, number>;
  today_tokens: { prompt: number; completion: number };
}

export interface CostLog {
  ts: number;
  lead_id: string;
  model: string;
  operation: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_usd: number;
  latency_ms: number;
}

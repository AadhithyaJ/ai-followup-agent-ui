export interface AnalyticsOverview {
  total_leads: number;
  conversion_rate: number;
  avg_response_time: number;
  active_pipeline: number;
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
  conversions: number;
  conv_rate: number;
}

export interface AdvancedAnalytics {
  cohort_conversion: Record<string, { total: number; converted: number; rate: number }>;
  revenue_attribution: Record<string, number>;
  lead_velocity: { last_7_days: number; avg_per_day_7d: number };
  llm_cost_report: { daily_usd: Record<string, number>; total_usd: number };
}

export interface Lead {
  id: string;
  name: string;
  message?: string;
  score: 'high' | 'medium' | 'low';
  intent?: string;
  stage: string;
  source?: string;
  phone?: string;
  email?: string;
  assigned_agent?: string;
  followup_tasks_scheduled?: number;
  created_at?: string;
}

export interface LeadIngestRequest {
  message: string;
  source: string;
  phone?: string;
  email?: string;
}

export interface LeadIngestResponse {
  id: string;
  name: string;
  score: string;
  intent: string;
  stage: string;
  assigned_agent: string;
  opening_message: string;
  followup_tasks_scheduled: number;
}

export interface StageUpdateRequest {
  stage: string;
}

export interface TriggerEventRequest {
  lead_id: string;
  event: string;
  metadata?: Record<string, any>;
}

export interface LeadListParams {
  stage?: string;
  score?: string;
  limit?: number;
  offset?: number;
}

export interface CommunicationMessage {
  direction: 'inbound' | 'outbound';
  channel: string;
  status: string;
  message: string;
  sent_at: string;
}

export interface CommunicationThread {
  lead_id: string;
  lead_name: string;
  email: string;
  stage: string;
  score: string;
  agent: string;
  total_followups: number;
  total_replies: number;
  thread: CommunicationMessage[];
}

export interface AdvisorySuggestion {
  priority: number;
  action: string;
  reason: string;
  expected_outcome: string;
  deadline: string;
}

export interface MessageDraft {
  channel: string;
  subject: string | null;
  body: string;
}

export interface LeadAdvisory {
  lead_id: string;
  lead_name: string;
  deal_health: number;
  deal_health_label: 'hot' | 'warm' | 'cooling' | 'cold' | 'dead';
  risk_flags: string[];
  talking_points: string[];
  summary: string;
  suggestions: AdvisorySuggestion[];
  message_drafts: MessageDraft[];
  generated_at: string;
}

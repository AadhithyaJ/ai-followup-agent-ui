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

export interface WorkflowStep {
  delay_sec: number;
  action: string;
  message_template?: string;
}

export interface Workflow {
  id: string;
  name: string;
  trigger: string;
  description?: string;
  steps?: WorkflowStep[];
  is_active: boolean;
}

export interface WorkflowCreateRequest {
  name: string;
  trigger: string;
  description?: string;
  steps: WorkflowStep[];
}

export interface WorkflowTestResult {
  workflow: string;
  dry_run: boolean;
  steps_would_execute: { step: number; action: string; delay_sec: number }[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  steps: WorkflowStep[];
}

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  lead_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | string;
  triggered_at: string;
  completed_at?: string;
  steps_executed?: number;
  dry_run?: boolean;
  error?: string;
}

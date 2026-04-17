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

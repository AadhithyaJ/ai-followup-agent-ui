import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Lead, LeadIngestRequest, LeadIngestResponse,
  StageUpdateRequest, TriggerEventRequest, LeadListParams,
  CommunicationThread, LeadAdvisory
} from './models/lead.model';
import {
  AnalyticsOverview, FunnelData, AgentPerformance, AdvancedAnalytics,
  CostOverview, CostLog
} from './models/analytics.model';
import {
  Workflow, WorkflowCreateRequest, WorkflowTestResult,
  WorkflowTemplate, WorkflowExecution
} from './models/workflow.model';
import {
  FeatureFlags, FlagUpdateRequest, DynamicConfig, ConfigSetRequest,
  ConfigAuditEntry, Prompt, PromptHistory, PromptUpsertRequest,
  UsageEntry, NBAResult, LeaderboardEntry, AutopilotResult,
  OrchestrateRequest, OrchestrateResult,
  SmtpSettings, AlertSettings, LlmSettings, AgentSettings, AgentConfig,
  ChannelSettings, WhatsappSettings, FollowupSettings, OptoutSettings,
  ImapSettings, LimitsSettings, ReportsSettings, LanguageSettings,
  ScoringSettings, PipelineSettings, ABTestingSettings, PersonalizationSettings,
  SecuritySettings, ScalingSettings, QueueSettings, CostControlSettings,
  ABReport
} from './models/admin.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /* ── Leads ─────────────────────────────────────────── */
  ingestLead(body: LeadIngestRequest): Observable<LeadIngestResponse> {
    return this.http.post<LeadIngestResponse>(`${this.base}/leads/ingest`, body);
  }

  getLeads(params: LeadListParams = {}): Observable<Lead[]> {
    let p = new HttpParams();
    if (params.stage) p = p.set('stage', params.stage);
    if (params.score) p = p.set('score', params.score);
    if (params.limit != null) p = p.set('limit', params.limit);
    if (params.offset != null) p = p.set('offset', params.offset);
    return this.http.get<Lead[]>(`${this.base}/leads`, { params: p });
  }

  getLead(id: string): Observable<Lead> {
    return this.http.get<Lead>(`${this.base}/leads/${id}`);
  }

  updateLeadStage(id: string, body: StageUpdateRequest): Observable<any> {
    return this.http.patch(`${this.base}/leads/${id}/stage`, body);
  }

  triggerLeadEvent(body: TriggerEventRequest): Observable<any> {
    return this.http.post(`${this.base}/leads/trigger`, body);
  }

  getLeadCommunications(id: string): Observable<CommunicationThread> {
    return this.http.get<CommunicationThread>(`${this.base}/leads/${id}/communications`);
  }

  getLeadSuggest(id: string): Observable<LeadAdvisory> {
    return this.http.get<LeadAdvisory>(`${this.base}/leads/${id}/suggest`);
  }

  /* ── Bulk ───────────────────────────────────────────── */
  bulkIngest(leads: any[]): Observable<any> {
    return this.http.post(`${this.base}/bulk/ingest`, { leads });
  }

  bulkIngestCsv(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post(`${this.base}/bulk/ingest/csv`, fd);
  }

  getBulkJobStatus(jobId: string): Observable<any> {
    return this.http.get(`${this.base}/bulk/${jobId}/status`);
  }

  /* ── Analytics ──────────────────────────────────────── */
  getAnalyticsOverview(): Observable<AnalyticsOverview> {
    return this.http.get<AnalyticsOverview>(`${this.base}/analytics/overview`);
  }

  getAnalyticsFunnel(): Observable<FunnelData> {
    return this.http.get<FunnelData>(`${this.base}/analytics/funnel`);
  }

  getAgentPerformance(): Observable<AgentPerformance[]> {
    return this.http.get<AgentPerformance[]>(`${this.base}/analytics/agent-performance`);
  }

  getAdvancedAnalytics(): Observable<AdvancedAnalytics> {
    return this.http.get<AdvancedAnalytics>(`${this.base}/analytics/advanced`);
  }

  getCostOverview(days = 7): Observable<CostOverview> {
    return this.http.get<CostOverview>(`${this.base}/analytics/cost`, {
      params: new HttpParams().set('days', days)
    });
  }

  getCostLogs(limit = 100): Observable<{ count: number; logs: CostLog[] }> {
    return this.http.get<{ count: number; logs: CostLog[] }>(`${this.base}/analytics/cost/logs`, {
      params: new HttpParams().set('limit', limit)
    });
  }

  /* ── Workflows ──────────────────────────────────────── */
  getWorkflows(): Observable<Workflow[]> {
    return this.http.get<Workflow[]>(`${this.base}/workflows`);
  }

  createWorkflow(body: WorkflowCreateRequest): Observable<any> {
    return this.http.post(`${this.base}/workflows`, body);
  }

  getWorkflow(id: string): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.base}/workflows/${id}`);
  }

  updateWorkflow(id: string, body: Partial<Workflow>): Observable<any> {
    return this.http.patch(`${this.base}/workflows/${id}`, body);
  }

  deleteWorkflow(id: string): Observable<any> {
    return this.http.delete(`${this.base}/workflows/${id}`);
  }

  testWorkflow(id: string, leadId: string): Observable<WorkflowTestResult> {
    return this.http.post<WorkflowTestResult>(`${this.base}/workflows/${id}/test`, {}, {
      params: new HttpParams().set('lead_id', leadId)
    });
  }

  getWorkflowTemplates(): Observable<WorkflowTemplate[]> {
    return this.http.get<WorkflowTemplate[]>(`${this.base}/workflows/templates`);
  }

  cloneTemplate(templateId: string): Observable<Workflow> {
    return this.http.post<Workflow>(`${this.base}/workflows/from-template/${templateId}`, {});
  }

  assignWorkflow(workflowId: string, leadId: string): Observable<any> {
    return this.http.post(`${this.base}/workflows/${workflowId}/assign/${leadId}`, {});
  }

  runWorkflow(workflowId: string, leadId: string, dryRun = false): Observable<any> {
    return this.http.post(`${this.base}/workflows/${workflowId}/run/${leadId}`, {}, {
      params: new HttpParams().set('dry_run', dryRun)
    });
  }

  getWorkflowExecutions(workflowId: string): Observable<WorkflowExecution[]> {
    return this.http.get<WorkflowExecution[]>(`${this.base}/workflows/${workflowId}/executions`);
  }

  getLeadExecutions(leadId: string): Observable<WorkflowExecution[]> {
    return this.http.get<WorkflowExecution[]>(`${this.base}/workflows/lead/${leadId}/executions`);
  }

  getExecution(execId: string): Observable<WorkflowExecution> {
    return this.http.get<WorkflowExecution>(`${this.base}/workflows/executions/${execId}`);
  }

  /* ── Admin: Feature Flags ───────────────────────────── */
  getFlags(): Observable<FeatureFlags> {
    return this.http.get<FeatureFlags>(`${this.base}/admin/flags`);
  }

  updateFlag(body: FlagUpdateRequest): Observable<any> {
    return this.http.post(`${this.base}/admin/flags`, body);
  }

  /* ── Admin: Dynamic Config ──────────────────────────── */
  getConfig(): Observable<DynamicConfig> {
    return this.http.get<DynamicConfig>(`${this.base}/admin/config`);
  }

  setConfig(body: ConfigSetRequest): Observable<any> {
    return this.http.post(`${this.base}/admin/config`, body);
  }

  deleteConfig(path: string): Observable<any> {
    return this.http.delete(`${this.base}/admin/config/${encodeURIComponent(path)}`);
  }

  getConfigAudit(): Observable<ConfigAuditEntry[]> {
    return this.http.get<ConfigAuditEntry[]>(`${this.base}/admin/config/audit`);
  }

  /* ── Admin: Prompts ─────────────────────────────────── */
  getPromptNames(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/admin/prompts`);
  }

  getPrompt(name: string): Observable<Prompt> {
    return this.http.get<Prompt>(`${this.base}/admin/prompts/${name}`);
  }

  getPromptHistory(name: string): Observable<PromptHistory[]> {
    return this.http.get<PromptHistory[]>(`${this.base}/admin/prompts/${name}/history`);
  }

  getPromptDiff(name: string, v1: number, v2: number): Observable<{ diff: string }> {
    return this.http.get<{ diff: string }>(`${this.base}/admin/prompts/${name}/diff`, {
      params: new HttpParams().set('v1', v1).set('v2', v2)
    });
  }

  upsertPrompt(body: PromptUpsertRequest): Observable<any> {
    return this.http.post(`${this.base}/admin/prompts`, body);
  }

  rollbackPrompt(name: string, version: number): Observable<any> {
    return this.http.post(`${this.base}/admin/prompts/rollback`, { name, version });
  }

  /* ── Admin: Usage ───────────────────────────────────── */
  getUsage(): Observable<UsageEntry[]> {
    return this.http.get<UsageEntry[]>(`${this.base}/admin/usage`);
  }

  updateLimit(limit_name: string, value: number): Observable<any> {
    return this.http.post(`${this.base}/admin/usage/limits`, { limit_name, value });
  }

  topUpQuota(limit_name: string, extra: number): Observable<any> {
    return this.http.post(`${this.base}/admin/usage/topup`, { limit_name, extra });
  }

  /* ── Admin: NBA / Leaderboard ───────────────────────── */
  getNBA(leadId: string): Observable<NBAResult> {
    return this.http.get<NBAResult>(`${this.base}/admin/leads/${leadId}/nba`);
  }

  getLeaderboard(): Observable<{ leaderboard: LeaderboardEntry[] }> {
    return this.http.get<{ leaderboard: LeaderboardEntry[] }>(`${this.base}/admin/leads/leaderboard`);
  }

  /* ── Admin: Autopilot / Orchestrate ────────────────── */
  runAutopilot(dryRun = true): Observable<AutopilotResult> {
    return this.http.post<AutopilotResult>(`${this.base}/admin/autopilot/run?dry_run=${dryRun}`, {});
  }

  orchestrate(body: OrchestrateRequest): Observable<OrchestrateResult> {
    return this.http.post<OrchestrateResult>(`${this.base}/admin/orchestrate`, body);
  }

  /* ── A/B Testing ────────────────────────────────────── */
  getABReport(name: string): Observable<ABReport> {
    return this.http.get<ABReport>(`${this.base}/ab/report/${name}`);
  }

  /* ── Settings ───────────────────────────────────────── */
  getAllSettings(): Observable<any> {
    return this.http.get<any>(`${this.base}/admin/settings`);
  }

  getSmtpSettings(): Observable<SmtpSettings> {
    return this.http.get<SmtpSettings>(`${this.base}/admin/settings/smtp`);
  }
  saveSmtpSettings(body: Partial<SmtpSettings> & { password?: string; from_?: string }): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/smtp`, body);
  }

  getAlertSettings(): Observable<AlertSettings> {
    return this.http.get<AlertSettings>(`${this.base}/admin/settings/alerts`);
  }
  saveAlertSettings(body: AlertSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/alerts`, body);
  }

  getLlmSettings(): Observable<LlmSettings> {
    return this.http.get<LlmSettings>(`${this.base}/admin/settings/llm`);
  }
  saveLlmSettings(body: LlmSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/llm`, body);
  }

  getAgentSettings(): Observable<AgentSettings> {
    return this.http.get<AgentSettings>(`${this.base}/admin/settings/agents`);
  }
  saveAgentSettings(name: string, body: Partial<AgentConfig>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/agents/${name}`, body);
  }

  getChannelSettings(): Observable<ChannelSettings> {
    return this.http.get<ChannelSettings>(`${this.base}/admin/settings/channels`);
  }
  saveChannelSettings(body: { email_enabled: boolean; whatsapp_enabled: boolean; sms_enabled: boolean }): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/channels`, body);
  }

  getWhatsappSettings(): Observable<WhatsappSettings> {
    return this.http.get<WhatsappSettings>(`${this.base}/admin/settings/whatsapp`);
  }
  saveWhatsappSettings(body: any): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/whatsapp`, body);
  }

  getFollowupSettings(): Observable<FollowupSettings> {
    return this.http.get<FollowupSettings>(`${this.base}/admin/settings/followup`);
  }
  saveFollowupSettings(body: Partial<FollowupSettings>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/followup`, body);
  }

  getOptoutSettings(): Observable<OptoutSettings> {
    return this.http.get<OptoutSettings>(`${this.base}/admin/settings/optout`);
  }
  saveOptoutSettings(body: OptoutSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/optout`, body);
  }

  getImapSettings(): Observable<ImapSettings> {
    return this.http.get<ImapSettings>(`${this.base}/admin/settings/imap`);
  }
  saveImapSettings(body: Partial<ImapSettings>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/imap`, body);
  }

  getLimitsSettings(): Observable<LimitsSettings> {
    return this.http.get<LimitsSettings>(`${this.base}/admin/settings/limits`);
  }
  saveLimitsSettings(body: LimitsSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/limits`, body);
  }

  getReportsSettings(): Observable<ReportsSettings> {
    return this.http.get<ReportsSettings>(`${this.base}/admin/settings/reports`);
  }
  saveReportsSettings(body: ReportsSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/reports`, body);
  }

  getLanguageSettings(): Observable<LanguageSettings> {
    return this.http.get<LanguageSettings>(`${this.base}/admin/settings/language`);
  }
  saveLanguageSettings(body: Partial<LanguageSettings>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/language`, body);
  }
  detectLanguage(text: string, location?: string): Observable<any> {
    let p = new HttpParams().set('text', text);
    if (location) p = p.set('location', location);
    return this.http.get<any>(`${this.base}/admin/settings/language/detect`, { params: p });
  }

  getScoringSettings(): Observable<ScoringSettings> {
    return this.http.get<ScoringSettings>(`${this.base}/admin/settings/scoring`);
  }
  saveScoringSettings(body: Partial<ScoringSettings>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/scoring`, body);
  }

  getPipelineSettings(): Observable<PipelineSettings> {
    return this.http.get<PipelineSettings>(`${this.base}/admin/settings/pipeline`);
  }
  savePipelineSettings(body: Partial<PipelineSettings>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/pipeline`, body);
  }

  getAbTestingSettings(): Observable<ABTestingSettings> {
    return this.http.get<ABTestingSettings>(`${this.base}/admin/settings/ab-testing`);
  }
  saveAbTestingSettings(body: ABTestingSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/ab-testing`, body);
  }

  getPersonalizationSettings(): Observable<PersonalizationSettings> {
    return this.http.get<PersonalizationSettings>(`${this.base}/admin/settings/personalization`);
  }
  savePersonalizationSettings(body: PersonalizationSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/personalization`, body);
  }

  getSecuritySettings(): Observable<SecuritySettings> {
    return this.http.get<SecuritySettings>(`${this.base}/admin/settings/security`);
  }
  saveSecuritySettings(body: SecuritySettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/security`, body);
  }

  getScalingSettings(): Observable<ScalingSettings> {
    return this.http.get<ScalingSettings>(`${this.base}/admin/settings/scaling`);
  }
  saveScalingSettings(body: Partial<ScalingSettings>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/scaling`, body);
  }

  getQueueSettings(): Observable<QueueSettings> {
    return this.http.get<QueueSettings>(`${this.base}/admin/settings/queue`);
  }
  saveQueueSettings(body: Partial<QueueSettings>): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/queue`, body);
  }

  getCostControlSettings(): Observable<CostControlSettings> {
    return this.http.get<CostControlSettings>(`${this.base}/admin/settings/cost-control`);
  }
  saveCostControlSettings(body: CostControlSettings): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/cost-control`, body);
  }

  seedSettings(): Observable<any> {
    return this.http.post(`${this.base}/admin/settings/seed`, {});
  }

  getFlagsAudit(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/admin/flags/audit`);
  }
}

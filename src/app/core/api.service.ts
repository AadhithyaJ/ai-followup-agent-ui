import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Lead, LeadIngestRequest, LeadIngestResponse,
  StageUpdateRequest, TriggerEventRequest, LeadListParams
} from './models/lead.model';
import {
  AnalyticsOverview, FunnelData, AgentPerformance, AdvancedAnalytics
} from './models/analytics.model';
import {
  Workflow, WorkflowCreateRequest, WorkflowTestResult
} from './models/workflow.model';
import {
  FeatureFlags, FlagUpdateRequest, DynamicConfig, ConfigSetRequest,
  ConfigAuditEntry, Prompt, PromptHistory, PromptUpsertRequest,
  UsageEntry, NBAResult, LeaderboardEntry, AutopilotResult,
  OrchestrateRequest, OrchestrateResult
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
    return this.http.post<WorkflowTestResult>(`${this.base}/workflows/${id}/test`, { lead_id: leadId });
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
}

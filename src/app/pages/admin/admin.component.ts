import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import {
  FeatureFlags, DynamicConfig, ConfigAuditEntry,
  Prompt, PromptHistory, UsageEntry,
  LeaderboardEntry, AutopilotResult, OrchestrateResult
} from '../../core/models/admin.model';

type AdminTab = 'flags' | 'config' | 'prompts' | 'usage' | 'nba' | 'autopilot';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html'
})
export class AdminComponent implements OnInit {
  activeTab: AdminTab = 'flags';

  /* ── Feature Flags ── */
  flags: FeatureFlags = {};
  flagsLoading = false;
  flagForm: FormGroup;
  flagMsg = '';

  /* ── Dynamic Config ── */
  config: DynamicConfig = {};
  configAudit: ConfigAuditEntry[] = [];
  configForm: FormGroup;
  configMsg = '';
  configLoading = false;

  /* ── Prompts ── */
  promptNames: string[] = [];
  selectedPrompt: Prompt | null = null;
  promptHistory: PromptHistory[] = [];
  promptDiff = '';
  promptForm: FormGroup;
  promptMsg = '';
  promptLoading = false;
  diffV1 = 1; diffV2 = 2;

  /* ── Usage ── */
  usage: UsageEntry[] = [];
  usageLoading = false;
  limitForm: FormGroup;
  topupForm: FormGroup;
  usageMsg = '';

  /* ── NBA / Leaderboard ── */
  leaderboard: LeaderboardEntry[] = [];
  leaderboardLoading = false;
  nbaLeadId = '';
  nbaResult: any = null;
  nbaLoading = false;

  /* ── Autopilot / Orchestrate ── */
  autopilotResult: AutopilotResult | null = null;
  autopilotLoading = false;
  orchestrateForm: FormGroup;
  orchestrateResult: OrchestrateResult | null = null;
  orchestrateLoading = false;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.flagForm = this.fb.group({
      flag: ['', Validators.required],
      enabled: [true],
      rollout_pct: [100],
      expires_in: [86400]
    });
    this.configForm = this.fb.group({
      path: ['', Validators.required],
      value: ['', Validators.required]
    });
    this.promptForm = this.fb.group({
      name: ['', Validators.required],
      content: ['', Validators.required],
      note: ['']
    });
    this.limitForm = this.fb.group({
      limit_name: ['', Validators.required],
      value: [0, Validators.required]
    });
    this.topupForm = this.fb.group({
      limit_name: ['', Validators.required],
      extra: [1000, Validators.required]
    });
    this.orchestrateForm = this.fb.group({
      message: ['', Validators.required],
      lead_id: [''],
      phone: [''],
      email: ['']
    });
  }

  ngOnInit(): void { this.loadFlags(); }

  setTab(tab: AdminTab): void {
    this.activeTab = tab;
    if (tab === 'flags') this.loadFlags();
    if (tab === 'config') { this.loadConfig(); this.loadConfigAudit(); }
    if (tab === 'prompts') this.loadPromptNames();
    if (tab === 'usage') this.loadUsage();
    if (tab === 'nba') this.loadLeaderboard();
  }

  /* ── Flags ── */
  loadFlags(): void {
    this.flagsLoading = true;
    this.api.getFlags().subscribe({ next: d => { this.flags = d; this.flagsLoading = false; }, error: () => this.flagsLoading = false });
  }

  flagEntries(): { key: string; value: boolean }[] {
    return Object.entries(this.flags).map(([key, value]) => ({ key, value }));
  }

  quickToggle(key: string, value: boolean): void {
    this.api.updateFlag({ flag: key, enabled: !value }).subscribe({ next: () => { this.flags[key] = !value; } });
  }

  saveFlag(): void {
    const body = { ...this.flagForm.value };
    try { body.value = JSON.parse(body.value); } catch {}
    this.api.updateFlag(body).subscribe({
      next: () => { this.flagMsg = 'Flag updated.'; this.loadFlags(); },
      error: () => { this.flagMsg = 'Failed to update flag.'; }
    });
  }

  /* ── Config ── */
  loadConfig(): void {
    this.configLoading = true;
    this.api.getConfig().subscribe({ next: d => { this.config = d; this.configLoading = false; }, error: () => this.configLoading = false });
  }

  loadConfigAudit(): void {
    this.api.getConfigAudit().subscribe({ next: d => this.configAudit = d });
  }

  configEntries(): { key: string; value: any }[] {
    const flatten = (obj: any, prefix = ''): { key: string; value: any }[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'object' && v !== null
          ? flatten(v, prefix ? `${prefix}.${k}` : k)
          : [{ key: prefix ? `${prefix}.${k}` : k, value: v }]
      );
    return flatten(this.config);
  }

  setConfig(): void {
    const body = { path: this.configForm.value.path, value: this.configForm.value.value };
    try { body.value = JSON.parse(body.value); } catch {}
    this.api.setConfig(body).subscribe({
      next: () => { this.configMsg = 'Config updated.'; this.loadConfig(); this.loadConfigAudit(); },
      error: () => { this.configMsg = 'Failed to update config.'; }
    });
  }

  deleteConfig(path: string): void {
    if (!confirm(`Delete config override "${path}"?`)) return;
    this.api.deleteConfig(path).subscribe({ next: () => { this.configMsg = 'Deleted.'; this.loadConfig(); } });
  }

  /* ── Prompts ── */
  loadPromptNames(): void {
    this.promptLoading = true;
    this.api.getPromptNames().subscribe({ next: d => { this.promptNames = d; this.promptLoading = false; }, error: () => this.promptLoading = false });
  }

  selectPrompt(name: string): void {
    this.api.getPrompt(name).subscribe({ next: p => {
      this.selectedPrompt = p;
      this.promptForm.patchValue({ name: p.name, content: p.content, note: '' });
    }});
    this.api.getPromptHistory(name).subscribe({ next: h => this.promptHistory = h });
    this.promptDiff = '';
  }

  savePrompt(): void {
    this.promptLoading = true;
    this.api.upsertPrompt(this.promptForm.value).subscribe({
      next: () => { this.promptMsg = 'Prompt saved.'; this.promptLoading = false; this.loadPromptNames(); },
      error: () => { this.promptMsg = 'Save failed.'; this.promptLoading = false; }
    });
  }

  rollbackPrompt(name: string, version: number): void {
    this.api.rollbackPrompt(name, version).subscribe({
      next: () => { this.promptMsg = `Rolled back to v${version}.`; this.selectPrompt(name); }
    });
  }

  fetchDiff(): void {
    if (!this.selectedPrompt) return;
    this.api.getPromptDiff(this.selectedPrompt.name, this.diffV1, this.diffV2).subscribe({
      next: r => this.promptDiff = r.diff
    });
  }

  /* ── Usage ── */
  loadUsage(): void {
    this.usageLoading = true;
    this.api.getUsage().subscribe({ next: d => { this.usage = d; this.usageLoading = false; }, error: () => this.usageLoading = false });
  }

  updateLimit(): void {
    const { limit_name, value } = this.limitForm.value;
    this.api.updateLimit(limit_name, +value).subscribe({
      next: () => { this.usageMsg = 'Limit updated.'; this.loadUsage(); }
    });
  }

  topUp(): void {
    const { limit_name, extra } = this.topupForm.value;
    this.api.topUpQuota(limit_name, +extra).subscribe({
      next: () => { this.usageMsg = 'Quota topped up.'; this.loadUsage(); }
    });
  }

  /* ── NBA / Leaderboard ── */
  loadLeaderboard(): void {
    this.leaderboardLoading = true;
    this.api.getLeaderboard().subscribe({
      next: d => { this.leaderboard = d.leaderboard; this.leaderboardLoading = false; },
      error: () => this.leaderboardLoading = false
    });
  }

  fetchNBA(): void {
    if (!this.nbaLeadId.trim()) return;
    this.nbaLoading = true;
    this.api.getNBA(this.nbaLeadId.trim()).subscribe({
      next: r => { this.nbaResult = r; this.nbaLoading = false; },
      error: () => this.nbaLoading = false
    });
  }

  /* ── Autopilot / Orchestrate ── */
  runAutopilot(dryRun: boolean): void {
    this.autopilotLoading = true;
    this.autopilotResult = null;
    this.api.runAutopilot(dryRun).subscribe({
      next: r => { this.autopilotResult = r; this.autopilotLoading = false; },
      error: () => this.autopilotLoading = false
    });
  }

  orchestrate(): void {
    this.orchestrateLoading = true;
    this.orchestrateResult = null;
    const { message, lead_id, phone, email } = this.orchestrateForm.value;
    const context: any = {};
    if (phone) context['phone'] = phone;
    if (email) context['email'] = email;
    this.api.orchestrate({ message, lead_id: lead_id || undefined, context }).subscribe({
      next: r => { this.orchestrateResult = r; this.orchestrateLoading = false; },
      error: () => this.orchestrateLoading = false
    });
  }
}

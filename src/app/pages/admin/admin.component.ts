import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import {
  FeatureFlags, DynamicConfig, ConfigAuditEntry,
  Prompt, PromptHistory, UsageEntry,
  LeaderboardEntry, AutopilotResult, OrchestrateResult, ABReport
} from '../../core/models/admin.model';

type AdminTab = 'flags' | 'config' | 'prompts' | 'usage' | 'nba' | 'autopilot' | 'abtest';

@Component({
  selector: 'app-admin',
  standalone: false,
  templateUrl: './admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminComponent implements OnInit {
  activeTab = signal<AdminTab>('flags');

  /* ── Feature Flags ── */
  flags        = signal<FeatureFlags>({});
  flagsLoading = signal(false);
  flagMsg      = signal('');
  flagForm: FormGroup;

  /* ── Dynamic Config ── */
  config        = signal<DynamicConfig>({});
  configAudit   = signal<ConfigAuditEntry[]>([]);
  configMsg     = signal('');
  configLoading = signal(false);
  configForm: FormGroup;

  /* ── Prompts ── */
  promptNames    = signal<string[]>([]);
  selectedPrompt = signal<Prompt | null>(null);
  promptHistory  = signal<PromptHistory[]>([]);
  promptDiff     = signal('');
  promptMsg      = signal('');
  promptLoading  = signal(false);
  diffV1         = signal(1);
  diffV2         = signal(2);
  promptForm: FormGroup;

  /* ── Usage ── */
  usage       = signal<UsageEntry[]>([]);
  usageLoading = signal(false);
  usageMsg    = signal('');
  limitForm: FormGroup;
  topupForm: FormGroup;

  /* ── NBA / Leaderboard ── */
  leaderboard        = signal<LeaderboardEntry[]>([]);
  leaderboardLoading = signal(false);
  nbaLeadId          = signal('');
  nbaResult          = signal<any>(null);
  nbaLoading         = signal(false);

  /* ── A/B Testing ── */
  abExperimentName = signal('');
  abReport         = signal<ABReport | null>(null);
  abLoading        = signal(false);

  /* ── Autopilot / Orchestrate ── */
  autopilotResult    = signal<AutopilotResult | null>(null);
  autopilotLoading   = signal(false);
  orchestrateResult  = signal<OrchestrateResult | null>(null);
  orchestrateLoading = signal(false);
  orchestrateForm: FormGroup;

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
    this.activeTab.set(tab);
    if (tab === 'flags') this.loadFlags();
    if (tab === 'config') { this.loadConfig(); this.loadConfigAudit(); }
    if (tab === 'prompts') this.loadPromptNames();
    if (tab === 'usage') this.loadUsage();
    if (tab === 'nba') this.loadLeaderboard();
  }

  /* ── Flags ── */
  loadFlags(): void {
    this.flagsLoading.set(true);
    this.api.getFlags().subscribe({
      next: d => { this.flags.set(d); this.flagsLoading.set(false); },
      error: () => { this.flagsLoading.set(false); }
    });
  }

  flagEntries(): { key: string; value: boolean }[] {
    return Object.entries(this.flags()).map(([key, value]) => ({ key, value }));
  }

  quickToggle(key: string, value: boolean): void {
    this.api.updateFlag({ flag: key, enabled: !value }).subscribe({
      next: () => { this.flags.update(f => ({ ...f, [key]: !value })); }
    });
  }

  saveFlag(): void {
    const body = { ...this.flagForm.value };
    try { body.value = JSON.parse(body.value); } catch {}
    this.api.updateFlag(body).subscribe({
      next: () => { this.flagMsg.set('Flag updated.'); this.loadFlags(); },
      error: () => { this.flagMsg.set('Failed to update flag.'); }
    });
  }

  /* ── Config ── */
  loadConfig(): void {
    this.configLoading.set(true);
    this.api.getConfig().subscribe({
      next: d => { this.config.set(d); this.configLoading.set(false); },
      error: () => { this.configLoading.set(false); }
    });
  }

  loadConfigAudit(): void {
    this.api.getConfigAudit().subscribe({ next: d => this.configAudit.set(d) });
  }

  configEntries(): { key: string; value: any }[] {
    const flatten = (obj: any, prefix = ''): { key: string; value: any }[] =>
      Object.entries(obj).flatMap(([k, v]) =>
        typeof v === 'object' && v !== null
          ? flatten(v, prefix ? `${prefix}.${k}` : k)
          : [{ key: prefix ? `${prefix}.${k}` : k, value: v }]
      );
    return flatten(this.config());
  }

  setConfig(): void {
    const body = { path: this.configForm.value.path, value: this.configForm.value.value };
    try { body.value = JSON.parse(body.value); } catch {}
    this.api.setConfig(body).subscribe({
      next: () => { this.configMsg.set('Config updated.'); this.loadConfig(); this.loadConfigAudit(); },
      error: () => { this.configMsg.set('Failed to update config.'); }
    });
  }

  deleteConfig(path: string): void {
    if (!confirm(`Delete config override "${path}"?`)) return;
    this.api.deleteConfig(path).subscribe({ next: () => { this.configMsg.set('Deleted.'); this.loadConfig(); } });
  }

  /* ── Prompts ── */
  loadPromptNames(): void {
    this.promptLoading.set(true);
    this.api.getPromptNames().subscribe({
      next: d => { this.promptNames.set(d); this.promptLoading.set(false); },
      error: () => { this.promptLoading.set(false); }
    });
  }

  selectPrompt(name: string): void {
    this.api.getPrompt(name).subscribe({ next: p => {
      this.selectedPrompt.set(p);
      this.promptForm.patchValue({ name: p.name, content: p.content, note: '' });
    }});
    this.api.getPromptHistory(name).subscribe({ next: h => this.promptHistory.set(h) });
    this.promptDiff.set('');
  }

  savePrompt(): void {
    this.promptLoading.set(true);
    this.api.upsertPrompt(this.promptForm.value).subscribe({
      next: () => { this.promptMsg.set('Prompt saved.'); this.promptLoading.set(false); this.loadPromptNames(); },
      error: () => { this.promptMsg.set('Save failed.'); this.promptLoading.set(false); }
    });
  }

  rollbackPrompt(name: string, version: number): void {
    this.api.rollbackPrompt(name, version).subscribe({
      next: () => { this.promptMsg.set(`Rolled back to v${version}.`); this.selectPrompt(name); }
    });
  }

  fetchDiff(): void {
    const sp = this.selectedPrompt();
    if (!sp) return;
    this.api.getPromptDiff(sp.name, this.diffV1(), this.diffV2()).subscribe({
      next: r => this.promptDiff.set(r.diff)
    });
  }

  /* ── Usage ── */
  loadUsage(): void {
    this.usageLoading.set(true);
    this.api.getUsage().subscribe({
      next: d => { this.usage.set(d); this.usageLoading.set(false); },
      error: () => { this.usageLoading.set(false); }
    });
  }

  updateLimit(): void {
    const { limit_name, value } = this.limitForm.value;
    this.api.updateLimit(limit_name, +value).subscribe({
      next: () => { this.usageMsg.set('Limit updated.'); this.loadUsage(); }
    });
  }

  topUp(): void {
    const { limit_name, extra } = this.topupForm.value;
    this.api.topUpQuota(limit_name, +extra).subscribe({
      next: () => { this.usageMsg.set('Quota topped up.'); this.loadUsage(); }
    });
  }

  /* ── NBA / Leaderboard ── */
  loadLeaderboard(): void {
    this.leaderboardLoading.set(true);
    this.api.getLeaderboard().subscribe({
      next: d => { this.leaderboard.set(d.leaderboard); this.leaderboardLoading.set(false); },
      error: () => { this.leaderboardLoading.set(false); }
    });
  }

  fetchNBA(): void {
    if (!this.nbaLeadId().trim()) return;
    this.nbaLoading.set(true);
    this.api.getNBA(this.nbaLeadId().trim()).subscribe({
      next: r => { this.nbaResult.set(r); this.nbaLoading.set(false); },
      error: () => { this.nbaLoading.set(false); }
    });
  }

  /* ── A/B Testing ── */
  fetchABReport(): void {
    if (!this.abExperimentName().trim()) return;
    this.abLoading.set(true);
    this.abReport.set(null);
    this.api.getABReport(this.abExperimentName().trim()).subscribe({
      next: r => { this.abReport.set(r); this.abLoading.set(false); },
      error: () => { this.abLoading.set(false); }
    });
  }

  /* ── Autopilot / Orchestrate ── */
  runAutopilot(dryRun: boolean): void {
    this.autopilotLoading.set(true);
    this.autopilotResult.set(null);
    this.api.runAutopilot(dryRun).subscribe({
      next: r => { this.autopilotResult.set(r); this.autopilotLoading.set(false); },
      error: () => { this.autopilotLoading.set(false); }
    });
  }

  orchestrate(): void {
    this.orchestrateLoading.set(true);
    this.orchestrateResult.set(null);
    const { message, lead_id, phone, email } = this.orchestrateForm.value;
    const context: any = {};
    if (phone) context['phone'] = phone;
    if (email) context['email'] = email;
    this.api.orchestrate({ message, lead_id: lead_id || undefined, context }).subscribe({
      next: r => { this.orchestrateResult.set(r); this.orchestrateLoading.set(false); },
      error: () => { this.orchestrateLoading.set(false); }
    });
  }
}

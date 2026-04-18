import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { BrandingService } from '../../core/branding.service';

type SettingsTab =
  | 'branding'
  | 'smtp' | 'alerts' | 'llm' | 'agents' | 'channels' | 'whatsapp'
  | 'followup' | 'optout' | 'imap' | 'limits' | 'reports' | 'language'
  | 'scoring' | 'pipeline' | 'ab' | 'personalization' | 'security'
  | 'scaling' | 'queue' | 'cost';

@Component({
  selector: 'app-settings',
  standalone: false,
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit {
  activeTab = signal<SettingsTab>('smtp');
  msg       = signal<Partial<Record<SettingsTab, string>>>({});
  loading   = signal<Partial<Record<SettingsTab, boolean>>>({});

  smtpForm!: FormGroup;
  alertForm!: FormGroup;
  llmForm!: FormGroup;
  channelForm!: FormGroup;
  whatsappForm!: FormGroup;
  followupForm!: FormGroup;
  imapForm!: FormGroup;
  limitsForm!: FormGroup;
  reportsForm!: FormGroup;
  languageForm!: FormGroup;
  scoringForm!: FormGroup;
  pipelineForm!: FormGroup;
  abForm!: FormGroup;
  personalizationForm!: FormGroup;
  securityForm!: FormGroup;
  scalingForm!: FormGroup;
  queueForm!: FormGroup;
  costForm!: FormGroup;

  agentNames: string[] = ['sales_agent', 'support_agent', 'followup_agent'];
  agentForms: Record<string, FormGroup> = {};
  agentMsg = signal<Record<string, string>>({});

  optoutKeywords = signal('');
  optoutMsg      = signal('');

  detectText     = signal('');
  detectLocation = signal('');
  detectResult   = signal<any>(null);
  detectLoading  = signal(false);

  seedMsg     = signal('');
  seedLoading = signal(false);

  llmModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];

  brandingForm!: FormGroup;
  brandingMsg = signal('');

  logoIcons = [
    'fa-bolt','fa-rocket','fa-brain','fa-fire','fa-star',
    'fa-cube','fa-leaf','fa-gem','fa-dragon','fa-crown'
  ];
  colorPresets = [
    { label: 'Indigo',  primary: '#6366f1', dark: '#4f46e5', light: 'rgba(99,102,241,0.12)' },
    { label: 'Blue',    primary: '#3b82f6', dark: '#2563eb', light: 'rgba(59,130,246,0.12)' },
    { label: 'Violet',  primary: '#8b5cf6', dark: '#7c3aed', light: 'rgba(139,92,246,0.12)' },
    { label: 'Rose',    primary: '#f43f5e', dark: '#e11d48', light: 'rgba(244,63,94,0.12)'  },
    { label: 'Orange',  primary: '#f97316', dark: '#ea580c', light: 'rgba(249,115,22,0.12)' },
    { label: 'Teal',    primary: '#14b8a6', dark: '#0f766e', light: 'rgba(20,184,166,0.12)' },
    { label: 'Green',   primary: '#22c55e', dark: '#16a34a', light: 'rgba(34,197,94,0.12)'  },
    { label: 'Custom',  primary: '',        dark: '',        light: ''                       },
  ];

  tabs: { key: SettingsTab; label: string; icon: string }[] = [
    { key: 'branding',        label: 'Branding',          icon: 'fa-palette' },
    { key: 'smtp',            label: 'SMTP / Email',      icon: 'fa-mail-bulk' },
    { key: 'alerts',          label: 'Alerts',            icon: 'fa-bell' },
    { key: 'llm',             label: 'LLM / AI',          icon: 'fa-robot' },
    { key: 'agents',          label: 'Agents',            icon: 'fa-user-robot' },
    { key: 'channels',        label: 'Channels',          icon: 'fa-broadcast-tower' },
    { key: 'whatsapp',        label: 'WhatsApp',          icon: 'fa-whatsapp fab' },
    { key: 'followup',        label: 'Follow-up',         icon: 'fa-redo' },
    { key: 'optout',          label: 'Opt-out',           icon: 'fa-ban' },
    { key: 'imap',            label: 'IMAP',              icon: 'fa-inbox' },
    { key: 'limits',          label: 'Limits',            icon: 'fa-tachometer-alt' },
    { key: 'reports',         label: 'Reports',           icon: 'fa-file-alt' },
    { key: 'language',        label: 'Language',          icon: 'fa-language' },
    { key: 'scoring',         label: 'Scoring',           icon: 'fa-star' },
    { key: 'pipeline',        label: 'Pipeline',          icon: 'fa-project-diagram' },
    { key: 'ab',              label: 'A/B Testing',       icon: 'fa-flask' },
    { key: 'personalization', label: 'Personalization',   icon: 'fa-user-tag' },
    { key: 'security',        label: 'Security',          icon: 'fa-shield-alt' },
    { key: 'scaling',         label: 'Scaling',           icon: 'fa-server' },
    { key: 'queue',           label: 'Queue',             icon: 'fa-layer-group' },
    { key: 'cost',            label: 'Cost Control',      icon: 'fa-dollar-sign' },
  ];

  constructor(private api: ApiService, private fb: FormBuilder, public branding: BrandingService) {}

  ngOnInit(): void {
    this.buildForms();
    this.loadTab('branding');
  }

  buildForms(): void {
    const c = this.branding.config();
    this.brandingForm = this.fb.group({
      appName:      [c.appName],
      appSub:       [c.appSub],
      logoIcon:     [c.logoIcon],
      primaryColor: [c.primaryColor],
      primaryDark:  [c.primaryDark],
      primaryLight: [c.primaryLight],
    });
    this.smtpForm = this.fb.group({
      host: [''], port: [587], user: [''], password: [''], from_: ['']
    });
    this.alertForm = this.fb.group({
      emails: [''],
      alert_on_high_lead: [true],
      alert_on_reply: [true],
      alert_on_negotiation: [true]
    });
    this.llmForm = this.fb.group({
      model: ['gpt-4o-mini'], temperature: [0.4], max_tokens: [300]
    });
    this.channelForm = this.fb.group({
      email_enabled: [true], whatsapp_enabled: [false], sms_enabled: [false]
    });
    this.whatsappForm = this.fb.group({
      provider: ['twilio'], enabled: [false],
      msg91_authkey: [''], msg91_integrated_number: [''],
      twilio_account_sid: [''], twilio_auth_token: [''], twilio_from: ['whatsapp:+14155238886']
    });
    this.followupForm = this.fb.group({
      enabled: [true], no_reply_days: [2], no_reply_max: [3],
      no_reply_enabled: [true], max_followups_per_day: [3],
      high_intent_delay_sec: [60], low_intent_delay_sec: [3600]
    });
    this.imapForm = this.fb.group({
      enabled: [true], poll_interval_sec: [30]
    });
    this.limitsForm = this.fb.group({
      max_leads_per_month: [10000], max_llm_calls_per_lead: [20]
    });
    this.reportsForm = this.fb.group({
      daily_enabled: [true], daily_hour: [8]
    });
    this.languageForm = this.fb.group({
      default_language: ['en'], auto_detect: [true], location_mapping_json: ['{}']
    });
    this.scoringForm = this.fb.group({
      enabled: [true], prompt: [''], entity_fields_csv: ['name,requirement,contact,location,budget']
    });
    this.pipelineForm = this.fb.group({
      auto_assign_agent: [true], auto_move_stage: [true]
    });
    this.abForm = this.fb.group({
      enabled: [true],
      experiments: this.fb.array([])
    });
    this.personalizationForm = this.fb.group({
      enabled: [true],
      rules: this.fb.array([])
    });
    this.securityForm = this.fb.group({ rate_limit_per_minute: [100] });
    this.scalingForm = this.fb.group({
      api_instances: [3], worker_instances: [5]
    });
    this.queueForm = this.fb.group({
      max_retries: [3], retry_delay_sec: [60], followup_workers: [3]
    });
    this.costForm = this.fb.group({
      max_llm_calls_per_lead: [20], skip_llm_for_low_score: [false]
    });
    for (const name of this.agentNames) {
      this.agentForms[name] = this.fb.group({
        system_prompt: [''], model: ['gpt-4o-mini'], tone: ['']
      });
    }
  }

  setTab(tab: SettingsTab): void {
    this.activeTab.set(tab);
    this.loadTab(tab);
  }

  tabGroup(group: 'general' | 'messaging' | 'ai' | 'automation' | 'growth' | 'infra') {
    const map: Record<string, SettingsTab[]> = {
      general:    ['branding'],
      messaging:  ['smtp', 'alerts', 'channels', 'whatsapp'],
      ai:         ['llm', 'agents', 'scoring', 'language'],
      automation: ['followup', 'optout', 'imap', 'pipeline'],
      growth:     ['ab', 'personalization'],
      infra:      ['limits', 'cost', 'reports', 'security', 'scaling', 'queue']
    };
    return this.tabs.filter(t => (map[group] ?? []).includes(t.key));
  }

  applyPreset(p: typeof this.colorPresets[0]): void {
    if (!p.primary) return;
    this.brandingForm.patchValue({ primaryColor: p.primary, primaryDark: p.dark, primaryLight: p.light });
    this.branding.applyCssVars({ ...this.branding.config(), primaryColor: p.primary, primaryDark: p.dark, primaryLight: p.light });
  }

  saveBranding(): void {
    this.branding.save(this.brandingForm.value);
    this.brandingMsg.set('Branding updated.');
    setTimeout(() => this.brandingMsg.set(''), 3000);
  }

  resetBranding(): void {
    this.branding.reset();
    const c = this.branding.config();
    this.brandingForm.patchValue(c);
    this.brandingMsg.set('Reset to defaults.');
    setTimeout(() => this.brandingMsg.set(''), 3000);
  }

  private fetch<T>(tab: SettingsTab, obs: Observable<T>, onNext: (d: T) => void): void {
    this.loading.update(l => ({ ...l, [tab]: true }));
    obs.pipe(finalize(() => { this.loading.update(l => ({ ...l, [tab]: false })); }))
       .subscribe({ next: onNext, error: () => {} });
  }

  loadTab(tab: SettingsTab): void {
    switch (tab) {
      case 'smtp':
        this.fetch(tab, this.api.getSmtpSettings(), d => this.smtpForm.patchValue(d));
        break;
      case 'alerts':
        this.fetch(tab, this.api.getAlertSettings(), d =>
          this.alertForm.patchValue({ ...d, emails: (d.emails || []).join(', ') })
        );
        break;
      case 'llm':
        this.fetch(tab, this.api.getLlmSettings(), d => this.llmForm.patchValue(d));
        break;
      case 'agents':
        this.fetch(tab, this.api.getAgentSettings(), d => {
          for (const name of this.agentNames) {
            if (d[name]) this.agentForms[name].patchValue(d[name]);
          }
        });
        break;
      case 'channels':
        this.fetch(tab, this.api.getChannelSettings(), d =>
          this.channelForm.patchValue({
            email_enabled: d.email?.enabled ?? true,
            whatsapp_enabled: d.whatsapp?.enabled ?? false,
            sms_enabled: d.sms?.enabled ?? false
          })
        );
        break;
      case 'whatsapp':
        this.fetch(tab, this.api.getWhatsappSettings(), d => this.whatsappForm.patchValue(d));
        break;
      case 'followup':
        this.fetch(tab, this.api.getFollowupSettings(), d => this.followupForm.patchValue(d));
        break;
      case 'optout':
        this.fetch(tab, this.api.getOptoutSettings(), d =>
          this.optoutKeywords.set((d.keywords || []).join(', '))
        );
        break;
      case 'imap':
        this.fetch(tab, this.api.getImapSettings(), d => this.imapForm.patchValue(d));
        break;
      case 'limits':
        this.fetch(tab, this.api.getLimitsSettings(), d => this.limitsForm.patchValue(d));
        break;
      case 'reports':
        this.fetch(tab, this.api.getReportsSettings(), d => this.reportsForm.patchValue(d));
        break;
      case 'language':
        this.fetch(tab, this.api.getLanguageSettings(), d =>
          this.languageForm.patchValue({
            default_language: d.default_language,
            auto_detect: d.auto_detect,
            location_mapping_json: JSON.stringify(d.location_mapping || {}, null, 2)
          })
        );
        break;
      case 'scoring':
        this.fetch(tab, this.api.getScoringSettings(), d =>
          this.scoringForm.patchValue({
            enabled: d.enabled,
            prompt: d.prompt || '',
            entity_fields_csv: (d.entity_fields || []).join(', ')
          })
        );
        break;
      case 'pipeline':
        this.fetch(tab, this.api.getPipelineSettings(), d => this.pipelineForm.patchValue(d));
        break;
      case 'ab':
        this.fetch(tab, this.api.getAbTestingSettings(), d => {
          this.abForm.patchValue({ enabled: d.enabled });
          this.abExperiments.clear();
          (d.experiments || []).forEach((e: any) =>
            this.abExperiments.push(this.fb.group({
              name: [e.name], variants_csv: [(e.variants || []).join(', ')]
            }))
          );
        });
        break;
      case 'personalization':
        this.fetch(tab, this.api.getPersonalizationSettings(), d => {
          this.personalizationForm.patchValue({ enabled: d.enabled });
          this.personalizationRules.clear();
          (d.rules || []).forEach((r: any) =>
            this.personalizationRules.push(this.fb.group({
              condition: [r.condition || ''], language: [r.language || ''], message: [r.message || '']
            }))
          );
        });
        break;
      case 'security':
        this.fetch(tab, this.api.getSecuritySettings(), d => this.securityForm.patchValue(d));
        break;
      case 'scaling':
        this.fetch(tab, this.api.getScalingSettings(), d => this.scalingForm.patchValue(d));
        break;
      case 'queue':
        this.fetch(tab, this.api.getQueueSettings(), d => this.queueForm.patchValue(d));
        break;
      case 'cost':
        this.fetch(tab, this.api.getCostControlSettings(), d => this.costForm.patchValue(d));
        break;
    }
  }

  get abExperiments(): FormArray { return this.abForm.get('experiments') as FormArray; }
  get personalizationRules(): FormArray { return this.personalizationForm.get('rules') as FormArray; }

  addExperiment(): void {
    this.abExperiments.push(this.fb.group({ name: [''], variants_csv: [''] }));
  }
  removeExperiment(i: number): void { this.abExperiments.removeAt(i); }

  addRule(): void {
    this.personalizationRules.push(this.fb.group({ condition: [''], language: [''], message: [''] }));
  }
  removeRule(i: number): void { this.personalizationRules.removeAt(i); }

  save(tab: SettingsTab): void {
    this.msg.update(m => ({ ...m, [tab]: '' }));
    const ok = () => { this.msg.update(m => ({ ...m, [tab]: 'Saved successfully.' })); };
    const err = () => { this.msg.update(m => ({ ...m, [tab]: 'Save failed.' })); };

    switch (tab) {
      case 'smtp':
        this.api.saveSmtpSettings(this.smtpForm.value).subscribe({ next: ok, error: err }); break;
      case 'alerts': {
        const v = this.alertForm.value;
        const body = {
          ...v,
          emails: v.emails.split(',').map((e: string) => e.trim()).filter(Boolean)
        };
        this.api.saveAlertSettings(body).subscribe({ next: ok, error: err }); break;
      }
      case 'llm':
        this.api.saveLlmSettings(this.llmForm.value).subscribe({ next: ok, error: err }); break;
      case 'channels':
        this.api.saveChannelSettings(this.channelForm.value).subscribe({ next: ok, error: err }); break;
      case 'whatsapp':
        this.api.saveWhatsappSettings(this.whatsappForm.value).subscribe({ next: ok, error: err }); break;
      case 'followup':
        this.api.saveFollowupSettings(this.followupForm.value).subscribe({ next: ok, error: err }); break;
      case 'imap':
        this.api.saveImapSettings(this.imapForm.value).subscribe({ next: ok, error: err }); break;
      case 'limits':
        this.api.saveLimitsSettings(this.limitsForm.value).subscribe({ next: ok, error: err }); break;
      case 'reports':
        this.api.saveReportsSettings(this.reportsForm.value).subscribe({ next: ok, error: err }); break;
      case 'language': {
        const v = this.languageForm.value;
        let location_mapping = {};
        try { location_mapping = JSON.parse(v.location_mapping_json); } catch {}
        this.api.saveLanguageSettings({ default_language: v.default_language, auto_detect: v.auto_detect, location_mapping }).subscribe({ next: ok, error: err });
        break;
      }
      case 'scoring': {
        const v = this.scoringForm.value;
        const body = {
          enabled: v.enabled, prompt: v.prompt,
          entity_fields: v.entity_fields_csv.split(',').map((s: string) => s.trim()).filter(Boolean)
        };
        this.api.saveScoringSettings(body).subscribe({ next: ok, error: err }); break;
      }
      case 'pipeline':
        this.api.savePipelineSettings(this.pipelineForm.value).subscribe({ next: ok, error: err }); break;
      case 'ab': {
        const v = this.abForm.value;
        const body = {
          enabled: v.enabled,
          experiments: (v.experiments || []).map((e: any) => ({
            name: e.name,
            variants: e.variants_csv.split(',').map((s: string) => s.trim()).filter(Boolean)
          }))
        };
        this.api.saveAbTestingSettings(body).subscribe({ next: ok, error: err }); break;
      }
      case 'personalization': {
        const v = this.personalizationForm.value;
        const body = {
          enabled: v.enabled,
          rules: (v.rules || []).map((r: any) => {
            const rule: any = { condition: r.condition };
            if (r.language) rule.language = r.language;
            if (r.message) rule.message = r.message;
            return rule;
          })
        };
        this.api.savePersonalizationSettings(body).subscribe({ next: ok, error: err }); break;
      }
      case 'security':
        this.api.saveSecuritySettings(this.securityForm.value).subscribe({ next: ok, error: err }); break;
      case 'scaling':
        this.api.saveScalingSettings(this.scalingForm.value).subscribe({ next: ok, error: err }); break;
      case 'queue':
        this.api.saveQueueSettings(this.queueForm.value).subscribe({ next: ok, error: err }); break;
      case 'cost':
        this.api.saveCostControlSettings(this.costForm.value).subscribe({ next: ok, error: err }); break;
    }
  }

  saveAgent(name: string): void {
    this.agentMsg.update(m => ({ ...m, [name]: '' }));
    this.api.saveAgentSettings(name, this.agentForms[name].value).subscribe({
      next: () => { this.agentMsg.update(m => ({ ...m, [name]: 'Saved.' })); },
      error: () => { this.agentMsg.update(m => ({ ...m, [name]: 'Save failed.' })); }
    });
  }

  saveOptout(): void {
    const keywords = this.optoutKeywords().split(',').map(k => k.trim()).filter(Boolean);
    this.api.saveOptoutSettings({ keywords }).subscribe({
      next: () => { this.optoutMsg.set('Saved.'); },
      error: () => { this.optoutMsg.set('Save failed.'); }
    });
  }

  detectLanguage(): void {
    this.detectLoading.set(true);
    this.api.detectLanguage(this.detectText(), this.detectLocation() || undefined).subscribe({
      next: d => { this.detectResult.set(d); this.detectLoading.set(false); },
      error: () => { this.detectLoading.set(false); }
    });
  }

  seed(): void {
    this.seedLoading.set(true);
    this.api.seedSettings().subscribe({
      next: (r) => { this.seedMsg.set(`Seeded ${r.seeded_keys} keys.`); this.seedLoading.set(false); },
      error: () => { this.seedMsg.set('Seed failed.'); this.seedLoading.set(false); }
    });
  }
}

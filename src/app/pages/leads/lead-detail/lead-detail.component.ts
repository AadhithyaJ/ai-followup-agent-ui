import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { Lead, CommunicationThread, LeadAdvisory } from '../../../core/models/lead.model';
import { NBAResult } from '../../../core/models/admin.model';

type DetailTab = 'overview' | 'thread' | 'advisory';

@Component({
  selector: 'app-lead-detail',
  standalone: false,
  templateUrl: './lead-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadDetailComponent implements OnInit {
  lead    = signal<Lead | null>(null);
  loading = signal(true);
  error   = signal('');

  activeTab = signal<DetailTab>('overview');

  stageSuccess = signal('');
  stageError   = signal('');

  triggerSuccess = signal('');
  triggerError   = signal('');

  nba        = signal<NBAResult | null>(null);
  nbaLoading = signal(false);

  thread        = signal<CommunicationThread | null>(null);
  threadLoading = signal(false);
  threadError   = signal('');

  advisory        = signal<LeadAdvisory | null>(null);
  advisoryLoading = signal(false);
  advisoryError   = signal('');
  activeDraftChannel = signal(0);

  stageForm: FormGroup;
  triggerForm: FormGroup;

  stages = ['new', 'qualified', 'contacted', 'interested', 'negotiation', 'converted', 'lost'];
  eventTypes = ['link_click', 'form_submit', 'meeting_booked', 'demo_requested', 'email_opened'];

  constructor(
    private route: ActivatedRoute,
    private api: ApiService,
    private fb: FormBuilder
  ) {
    this.stageForm = this.fb.group({ stage: ['', Validators.required] });
    this.triggerForm = this.fb.group({
      event: ['link_click', Validators.required],
      metadata: ['']
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    console.log('Loading lead with id:', id);
    this.api.getLead(id).subscribe({
      next: (data) => {
        console.log('Lead data received:', data);
        this.lead.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading lead:', err);
        this.error.set('Failed to load lead.');
        this.loading.set(false);
      }
    });
  }

  setTab(tab: DetailTab): void {
    this.activeTab.set(tab);
    if (tab === 'thread' && !this.thread() && this.lead()) this.loadThread();
    if (tab === 'advisory' && !this.advisory() && this.lead()) this.loadAdvisory();
  }

  loadThread(): void {
    const l = this.lead();
    if (!l) return;
    this.threadLoading.set(true);
    this.threadError.set('');
    this.api.getLeadCommunications(l.id).subscribe({
      next: (data) => { this.thread.set(data); this.threadLoading.set(false); },
      error: () => { this.threadError.set('Failed to load communications.'); this.threadLoading.set(false); }
    });
  }

  loadAdvisory(): void {
    const l = this.lead();
    if (!l) return;
    this.advisoryLoading.set(true);
    this.advisoryError.set('');
    this.api.getLeadSuggest(l.id).subscribe({
      next: (data) => { this.advisory.set(data); this.advisoryLoading.set(false); },
      error: () => { this.advisoryError.set('Failed to load advisory.'); this.advisoryLoading.set(false); }
    });
  }

  updateStage(): void {
    const l = this.lead();
    if (!l) return;
    this.api.updateLeadStage(l.id, this.stageForm.value).subscribe({
      next: (res) => {
        this.stageSuccess.set(`Stage updated to "${res.stage}"`);
        this.lead.update(lead => lead ? { ...lead, stage: res.stage } : lead);
      },
      error: () => { this.stageError.set('Failed to update stage.'); }
    });
  }

  sendTrigger(): void {
    const l = this.lead();
    if (!l) return;
    let metadata = {};
    try { if (this.triggerForm.value.metadata) metadata = JSON.parse(this.triggerForm.value.metadata); } catch {}
    this.api.triggerLeadEvent({
      lead_id: l.id,
      event: this.triggerForm.value.event,
      metadata
    }).subscribe({
      next: () => { this.triggerSuccess.set('Event triggered successfully.'); },
      error: () => { this.triggerError.set('Failed to send trigger.'); }
    });
  }

  loadNBA(): void {
    const l = this.lead();
    if (!l) return;
    this.nbaLoading.set(true);
    this.api.getNBA(l.id).subscribe({
      next: (data) => { this.nba.set(data); this.nbaLoading.set(false); },
      error: () => { this.nbaLoading.set(false); }
    });
  }

  healthColor(label: string): string {
    const map: Record<string, string> = {
      hot: '#198754', warm: '#0d6efd', cooling: '#ffc107', cold: '#6c757d', dead: '#dc3545'
    };
    return map[label] || '#6c757d';
  }

  healthIcon(label: string): string {
    const map: Record<string, string> = {
      hot: 'fa-fire', warm: 'fa-thermometer-half', cooling: 'fa-snowflake',
      cold: 'fa-icicles', dead: 'fa-skull-crossbones'
    };
    return map[label] || 'fa-circle';
  }

  copyDraft(text: string): void {
    navigator.clipboard.writeText(text);
  }

  draftIcon(channel: string): string {
    const map: Record<string, string> = {
      email: 'fa-envelope', whatsapp: 'fa-whatsapp', call_script: 'fa-phone'
    };
    return map[channel] || 'fa-comment';
  }

  scoreBadge(score: string): string {
    return score === 'high' ? 'bg-success' : score === 'medium' ? 'bg-warning text-dark' : 'bg-secondary';
  }

  stageBadge(stage: string): string {
    const map: Record<string, string> = {
      new: 'bg-info text-dark', qualified: 'bg-primary', contacted: 'bg-secondary',
      interested: 'bg-success', negotiation: 'bg-warning text-dark',
      converted: 'bg-success', lost: 'bg-danger'
    };
    return map[stage] || 'bg-secondary';
  }
}

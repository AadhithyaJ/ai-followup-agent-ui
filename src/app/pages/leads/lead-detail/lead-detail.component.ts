import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/api.service';
import { Lead } from '../../../core/models/lead.model';
import { NBAResult } from '../../../core/models/admin.model';

@Component({
  selector: 'app-lead-detail',
  standalone: false,
  templateUrl: './lead-detail.component.html'
})
export class LeadDetailComponent implements OnInit {
  lead: Lead | null = null;
  loading = true;
  error = '';

  stageForm: FormGroup;
  stageSuccess = '';
  stageError = '';

  triggerForm: FormGroup;
  triggerSuccess = '';
  triggerError = '';

  nba: NBAResult | null = null;
  nbaLoading = false;

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
    this.api.getLead(id).subscribe({
      next: (data) => { this.lead = data; this.loading = false; },
      error: () => { this.error = 'Failed to load lead.'; this.loading = false; }
    });
  }

  updateStage(): void {
    if (!this.lead) return;
    this.api.updateLeadStage(this.lead.id, this.stageForm.value).subscribe({
      next: (res) => {
        this.stageSuccess = `Stage updated to "${res.stage}"`;
        if (this.lead) this.lead.stage = res.stage;
      },
      error: () => { this.stageError = 'Failed to update stage.'; }
    });
  }

  sendTrigger(): void {
    if (!this.lead) return;
    let metadata = {};
    try { if (this.triggerForm.value.metadata) metadata = JSON.parse(this.triggerForm.value.metadata); } catch {}
    this.api.triggerLeadEvent({
      lead_id: this.lead.id,
      event: this.triggerForm.value.event,
      metadata
    }).subscribe({
      next: () => { this.triggerSuccess = 'Event triggered successfully.'; },
      error: () => { this.triggerError = 'Failed to send trigger.'; }
    });
  }

  loadNBA(): void {
    if (!this.lead) return;
    this.nbaLoading = true;
    this.api.getNBA(this.lead.id).subscribe({
      next: (data) => { this.nba = data; this.nbaLoading = false; },
      error: () => { this.nbaLoading = false; }
    });
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

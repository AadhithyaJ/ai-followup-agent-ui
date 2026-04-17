import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Lead } from '../../core/models/lead.model';

@Component({
  selector: 'app-leads',
  standalone: false,
  templateUrl: './leads.component.html'
})
export class LeadsComponent implements OnInit {
  leads: Lead[] = [];
  loading = false;
  error = '';
  filterForm: FormGroup;

  // Ingest form
  showIngestForm = false;
  ingestForm: FormGroup;
  ingestLoading = false;
  ingestSuccess = '';
  ingestError = '';

  stages = ['new', 'qualified', 'contacted', 'interested', 'negotiation', 'converted', 'lost'];
  scores = ['high', 'medium', 'low'];

  constructor(private api: ApiService, private fb: FormBuilder, private router: Router) {
    this.filterForm = this.fb.group({ stage: [''], score: [''] });
    this.ingestForm = this.fb.group({
      message: [''],
      source: ['whatsapp'],
      phone: [''],
      email: ['']
    });
  }

  ngOnInit(): void { this.loadLeads(); }

  loadLeads(): void {
    this.loading = true;
    const { stage, score } = this.filterForm.value;
    const params: any = {};
    if (stage) params.stage = stage;
    if (score) params.score = score;
    this.api.getLeads(params).subscribe({
      next: (data) => { this.leads = data; this.loading = false; },
      error: () => { this.error = 'Failed to load leads.'; this.loading = false; }
    });
  }

  applyFilter(): void { this.loadLeads(); }

  clearFilter(): void {
    this.filterForm.reset({ stage: '', score: '' });
    this.loadLeads();
  }

  openLead(id: string): void { this.router.navigate(['/leads', id]); }

  ingest(): void {
    this.ingestLoading = true;
    this.ingestSuccess = '';
    this.ingestError = '';
    this.api.ingestLead(this.ingestForm.value).subscribe({
      next: (res) => {
        this.ingestSuccess = `Lead "${res.name}" ingested — score: ${res.score}, stage: ${res.stage}`;
        this.ingestLoading = false;
        this.ingestForm.reset({ source: 'whatsapp' });
        this.loadLeads();
      },
      error: (err) => {
        this.ingestError = err?.error?.detail || 'Ingest failed.';
        this.ingestLoading = false;
      }
    });
  }

  scoreBadge(score: string): string {
    return score === 'high' ? 'bg-success' : score === 'medium' ? 'bg-warning text-dark' : 'bg-secondary';
  }

  stageBadge(stage: string): string {
    const map: Record<string, string> = {
      new: 'bg-info text-dark', qualified: 'bg-primary',
      contacted: 'bg-secondary', interested: 'bg-success',
      negotiation: 'bg-warning text-dark', converted: 'bg-success',
      lost: 'bg-danger'
    };
    return map[stage] || 'bg-secondary';
  }
}

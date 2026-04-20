import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { Lead } from '../../core/models/lead.model';

interface LeadView extends Lead {
  _initials: string;
  _avatarColor: string;
  _sourceIcon: string;
}

@Component({
  selector: 'app-leads',
  standalone: false,
  templateUrl: './leads.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeadsComponent implements OnInit {
  leads          = signal<LeadView[]>([]);
  loading        = signal(false);
  error          = signal('');
  showIngestForm = signal(false);
  ingestLoading  = signal(false);
  ingestSuccess  = signal('');
  ingestError    = signal('');

  filterForm: FormGroup;
  ingestForm: FormGroup;

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
    this.loading.set(true);
    const { stage, score } = this.filterForm.value;
    const params: any = {};
    if (stage) params.stage = stage;
    if (score) params.score = score;
    this.api.getLeads(params).subscribe({
      next: (data) => {
        this.leads.set(data.map(l => ({
          ...l,
          _initials: this._initials(l.name),
          _avatarColor: this._avatarColor(l.name),
          _sourceIcon: this._sourceIcon(l.source)
        })));
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load leads.'); this.loading.set(false); }
    });
  }

  applyFilter(): void { this.loadLeads(); }

  clearFilter(): void {
    this.filterForm.reset({ stage: '', score: '' });
    this.loadLeads();
  }

  openLead(id: string): void { this.router.navigate(['/leads', id]); }

  toggleIngestForm(): void { this.showIngestForm.set(!this.showIngestForm()); }

  ingest(): void {
    this.ingestLoading.set(true);
    this.ingestSuccess.set('');
    this.ingestError.set('');
    this.api.ingestLead(this.ingestForm.value).subscribe({
      next: (res) => {
        this.ingestSuccess.set(`Lead "${res.name || 'Unknown'}" ingested — score: ${res.score}, stage: ${res.stage}`);
        this.ingestLoading.set(false);
        this.ingestForm.reset({ source: 'whatsapp' });
        this.loadLeads();
      },
      error: (err) => {
        this.ingestError.set(err?.error?.detail || 'Ingest failed.');
        this.ingestLoading.set(false);
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

  trackByLead(_: number, l: LeadView): string { return l.id; }

  private _initials(name: string): string {
    if (!name) return '?';
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  private _avatarColor(name: string): string {
    const colors = ['#6366f1','#3b82f6','#0ea5e9','#10b981','#f59e0b','#8b5cf6','#ec4899','#14b8a6'];
    let hash = 0;
    for (const c of (name || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  private _sourceIcon(source: string | undefined): string {
    const map: Record<string, string> = {
      whatsapp: 'fa-brands fa-whatsapp', email: 'fa-envelope',
      web: 'fa-globe', api: 'fa-code'
    };
    return (source && map[source]) || 'fa-question-circle';
  }
}

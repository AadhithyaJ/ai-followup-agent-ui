import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AnalyticsOverview, FunnelData, AgentPerformance } from '../../core/models/analytics.model';

interface FunnelStage { label: string; key: keyof FunnelData; color: string; count: number; pct: number; }

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  overview = signal<AnalyticsOverview | null>(null);
  funnel   = signal<FunnelData | null>(null);
  agents   = signal<AgentPerformance[]>([]);
  loading  = signal(true);
  error    = signal('');
  now      = signal(new Date());

  funnelRows = computed<FunnelStage[]>(() => {
    const f = this.funnel();
    if (!f) return [];
    return this._buildFunnel(f);
  });

  bestAgent = computed<AgentPerformance | null>(() => {
    const a = this.agents();
    return a.length ? a.reduce((x, b) => x.conv_rate > b.conv_rate ? x : b) : null;
  });

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      overview: this.api.getAnalyticsOverview(),
      funnel:   this.api.getAnalyticsFunnel(),
      agents:   this.api.getAgentPerformance()
    }).subscribe({
      next: ({ overview, funnel, agents }) => {
        this.overview.set(overview);
        this.funnel.set(funnel);
        this.agents.set(agents);
        this.now.set(new Date());
        this.loading.set(false);
      },
      error: () => { this.error.set('Failed to load dashboard.'); this.loading.set(false); }
    });
  }

  private _buildFunnel(funnel: FunnelData): FunnelStage[] {
    const defs: { label: string; key: keyof FunnelData; color: string }[] = [
      { label: 'New',         key: 'new',         color: '#6366f1' },
      { label: 'Qualified',   key: 'qualified',   color: '#3b82f6' },
      { label: 'Contacted',   key: 'contacted',   color: '#0ea5e9' },
      { label: 'Interested',  key: 'interested',  color: '#10b981' },
      { label: 'Negotiation', key: 'negotiation', color: '#f59e0b' },
      { label: 'Converted',   key: 'converted',   color: '#22c55e' },
    ];
    const max = Math.max(...defs.map(d => Number(funnel[d.key])), 1);
    return defs.map(d => ({
      ...d,
      count: Number(funnel[d.key]),
      pct:   Math.round((Number(funnel[d.key]) / max) * 100)
    }));
  }

  trackByAgent(_: number, a: AgentPerformance): string { return a.agent; }
  trackByFunnel(_: number, f: FunnelStage): string { return f.key; }
}

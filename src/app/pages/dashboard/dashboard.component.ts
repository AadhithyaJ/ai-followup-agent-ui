import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  overview: AnalyticsOverview | null = null;
  funnel: FunnelData | null = null;
  agents: AgentPerformance[] = [];
  funnelRows: FunnelStage[] = [];
  bestAgent: AgentPerformance | null = null;
  loading = true;
  error = '';
  now = new Date();

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      overview: this.api.getAnalyticsOverview(),
      funnel:   this.api.getAnalyticsFunnel(),
      agents:   this.api.getAgentPerformance()
    }).subscribe({
      next: ({ overview, funnel, agents }) => {
        this.overview = overview;
        this.funnel   = funnel;
        this.agents   = agents;
        this.now      = new Date();
        this.loading  = false;
        this._buildFunnel(funnel);
        this.bestAgent = agents.length
          ? agents.reduce((a, b) => a.conv_rate > b.conv_rate ? a : b)
          : null;
        this.cdr.markForCheck();
      },
      error: () => { this.error = 'Failed to load dashboard.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private _buildFunnel(funnel: FunnelData): void {
    const defs: { label: string; key: keyof FunnelData; color: string }[] = [
      { label: 'New',         key: 'new',         color: '#6366f1' },
      { label: 'Qualified',   key: 'qualified',   color: '#3b82f6' },
      { label: 'Contacted',   key: 'contacted',   color: '#0ea5e9' },
      { label: 'Interested',  key: 'interested',  color: '#10b981' },
      { label: 'Negotiation', key: 'negotiation', color: '#f59e0b' },
      { label: 'Converted',   key: 'converted',   color: '#22c55e' },
    ];
    const max = Math.max(...defs.map(d => Number(funnel[d.key])), 1);
    this.funnelRows = defs.map(d => ({
      ...d,
      count: Number(funnel[d.key]),
      pct:   Math.round((Number(funnel[d.key]) / max) * 100)
    }));
  }

  trackByAgent(_: number, a: AgentPerformance): string { return a.agent_id; }
  trackByFunnel(_: number, f: FunnelStage): string { return f.key; }
}

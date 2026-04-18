import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AnalyticsOverview, FunnelData, AgentPerformance } from '../../core/models/analytics.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  overview: AnalyticsOverview | null = null;
  funnel: FunnelData | null = null;
  agents: AgentPerformance[] = [];
  loading = true;
  error = '';
  now = new Date();

  constructor(private api: ApiService) {}

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
        this.loading  = false;
        this.now      = new Date();
      },
      error: () => { this.error = 'Failed to load dashboard.'; this.loading = false; }
    });
  }

  funnelStages(): { label: string; key: keyof FunnelData; color: string }[] {
    return [
      { label: 'New',         key: 'new',         color: '#6366f1' },
      { label: 'Qualified',   key: 'qualified',   color: '#3b82f6' },
      { label: 'Contacted',   key: 'contacted',   color: '#0ea5e9' },
      { label: 'Interested',  key: 'interested',  color: '#10b981' },
      { label: 'Negotiation', key: 'negotiation', color: '#f59e0b' },
      { label: 'Converted',   key: 'converted',   color: '#22c55e' },
    ];
  }

  funnelMax(): number {
    if (!this.funnel) return 1;
    return Math.max(...Object.values(this.funnel).map(Number)) || 1;
  }

  funnelPct(key: keyof FunnelData): number {
    if (!this.funnel) return 0;
    return Math.round((this.funnel[key] / this.funnelMax()) * 100);
  }

  topAgent(): AgentPerformance | null {
    return this.agents.length ? this.agents.reduce((a, b) => a.conv_rate > b.conv_rate ? a : b) : null;
  }
}

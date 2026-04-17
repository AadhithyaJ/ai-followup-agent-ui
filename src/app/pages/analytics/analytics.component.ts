import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AnalyticsOverview, FunnelData, AgentPerformance, AdvancedAnalytics } from '../../core/models/analytics.model';

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.component.html'
})
export class AnalyticsComponent implements OnInit {
  overview: AnalyticsOverview | null = null;
  funnel: FunnelData | null = null;
  agents: AgentPerformance[] = [];
  advanced: AdvancedAnalytics | null = null;
  loading = true;
  error = '';

  funnelStages = ['new', 'qualified', 'contacted', 'interested', 'negotiation', 'converted', 'lost'];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.error = '';

    this.api.getAnalyticsOverview().subscribe({
      next: d => { this.overview = d; this.loading = false; },
      error: () => { this.error = 'Failed to load overview.'; this.loading = false; }
    });

    this.api.getAnalyticsFunnel().subscribe({ next: d => this.funnel = d });
    this.api.getAgentPerformance().subscribe({ next: d => this.agents = d });
    this.api.getAdvancedAnalytics().subscribe({ next: d => this.advanced = d });
  }

  funnelCount(stage: string): number {
    if (!this.funnel) return 0;
    return (this.funnel as any)[stage] ?? 0;
  }

  funnelMax(): number {
    if (!this.funnel) return 1;
    return Math.max(...this.funnelStages.map(s => (this.funnel as any)[s] ?? 0), 1);
  }

  funnelWidth(stage: string): number {
    return Math.round((this.funnelCount(stage) / this.funnelMax()) * 100);
  }

  funnelColor(stage: string): string {
    const map: Record<string, string> = {
      new: '#0dcaf0', qualified: '#0d6efd', contacted: '#6c757d',
      interested: '#198754', negotiation: '#ffc107', converted: '#20c997', lost: '#dc3545'
    };
    return map[stage] || '#6c757d';
  }

  totalLlmCost(): number {
    return this.advanced?.llm_cost_report?.total_usd ?? 0;
  }

  attributionEntries(): { channel: string; count: number }[] {
    if (!this.advanced?.revenue_attribution) return [];
    return Object.entries(this.advanced.revenue_attribution).map(([channel, count]) => ({ channel, count }));
  }
}

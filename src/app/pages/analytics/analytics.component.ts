import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { AnalyticsOverview, FunnelData, AgentPerformance, AdvancedAnalytics } from '../../core/models/analytics.model';

interface FunnelRow { stage: string; count: number; pct: number; color: string; }
interface AttrRow   { channel: string; count: number; pct: number; }

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsComponent implements OnInit {
  overview: AnalyticsOverview | null = null;
  agents: AgentPerformance[] = [];
  advanced: AdvancedAnalytics | null = null;
  loading = true;
  error = '';

  funnelRows: FunnelRow[] = [];
  attrRows: AttrRow[] = [];
  cohortRows: { key: string; value: number }[] = [];
  totalLlmCost = 0;

  private readonly FUNNEL_COLORS: Record<string, string> = {
    new: '#0dcaf0', qualified: '#0d6efd', contacted: '#6c757d',
    interested: '#198754', negotiation: '#ffc107', converted: '#20c997', lost: '#dc3545'
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    this.error = '';
    forkJoin({
      overview: this.api.getAnalyticsOverview(),
      funnel:   this.api.getAnalyticsFunnel(),
      agents:   this.api.getAgentPerformance(),
      advanced: this.api.getAdvancedAnalytics()
    }).subscribe({
      next: ({ overview, funnel, agents, advanced }) => {
        this.overview = overview;
        this.agents   = agents;
        this.advanced = advanced;
        this.loading  = false;
        this._buildFunnel(funnel);
        this._buildAttribution(advanced);
        this.cohortRows = advanced?.cohort_conversion
          ? Object.entries(advanced.cohort_conversion).map(([key, value]) => ({ key, value }))
          : [];
        this.totalLlmCost = advanced?.llm_cost_report?.total_usd ?? 0;
        this.cdr.markForCheck();
      },
      error: () => { this.error = 'Failed to load analytics.'; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  private _buildFunnel(funnel: FunnelData): void {
    const stages = ['new','qualified','contacted','interested','negotiation','converted','lost'];
    const counts = stages.map(s => (funnel as any)[s] ?? 0);
    const max = Math.max(...counts, 1);
    this.funnelRows = stages.map((s, i) => ({
      stage: s, count: counts[i],
      pct: Math.round((counts[i] / max) * 100),
      color: this.FUNNEL_COLORS[s] || '#6c757d'
    }));
  }

  private _buildAttribution(advanced: AdvancedAnalytics | null): void {
    if (!advanced?.revenue_attribution) { this.attrRows = []; return; }
    const entries = Object.entries(advanced.revenue_attribution).map(([channel, count]) => ({ channel, count }));
    const max = Math.max(...entries.map(e => e.count), 1);
    this.attrRows = entries.map(e => ({ ...e, pct: Math.round((e.count / max) * 100) }));
  }

  rateColor(rate: number): string {
    if (rate >= 30) return 'rgba(34,197,94,0.15)';
    if (rate >= 15) return 'rgba(245,158,11,0.15)';
    return 'rgba(239,68,68,0.12)';
  }

  trackByAgent(_: number, a: AgentPerformance): string { return a.agent_id; }
  trackByFunnel(_: number, f: FunnelRow): string { return f.stage; }
  trackByAttr(_: number, a: AttrRow): string { return a.channel; }
  trackByCohort(_: number, c: { key: string }): string { return c.key; }
}

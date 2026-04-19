import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import {
  AnalyticsOverview, FunnelData, AgentPerformance, AdvancedAnalytics,
  CostOverview, CostLog
} from '../../core/models/analytics.model';

interface FunnelRow { stage: string; count: number; pct: number; color: string; }
interface AttrRow   { channel: string; count: number; pct: number; }
interface CostBar   { label: string; usd: number; pct: number; color: string; }
interface DailyBar  { date: string; usd: number; pct: number; }

@Component({
  selector: 'app-analytics',
  standalone: false,
  templateUrl: './analytics.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnalyticsComponent implements OnInit {
  overview    = signal<AnalyticsOverview | null>(null);
  agents      = signal<AgentPerformance[]>([]);
  advanced    = signal<AdvancedAnalytics | null>(null);
  cost        = signal<CostOverview | null>(null);
  costLogs    = signal<CostLog[]>([]);
  loading     = signal(true);
  costLoading = signal(false);
  error       = signal('');
  costDays    = signal(7);

  funnelRows = signal<FunnelRow[]>([]);
  attrRows   = signal<AttrRow[]>([]);

  cohortRows = computed(() => {
    const adv = this.advanced();
    return adv?.cohort_conversion
      ? Object.entries(adv.cohort_conversion).map(([key, value]) => ({ key, value }))
      : [];
  });

  dailyBars = computed<DailyBar[]>(() => {
    const c = this.cost();
    if (!c) return [];
    const entries = Object.entries(c.daily_usd).sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(...entries.map(([, v]) => v), 0.0001);
    return entries.map(([date, usd]) => ({ date: date.slice(5), usd, pct: Math.round((usd / max) * 100) }));
  });

  modelRows = computed<CostBar[]>(() => this._dictBars(this.cost()?.by_model));
  opRows    = computed<CostBar[]>(() => this._dictBars(this.cost()?.by_operation));

  private readonly FUNNEL_COLORS: Record<string, string> = {
    new: '#0dcaf0', qualified: '#0d6efd', contacted: '#6c757d',
    interested: '#198754', negotiation: '#ffc107', converted: '#20c997', lost: '#dc3545'
  };
  private readonly BAR_COLORS = ['#6366f1','#3b82f6','#0ea5e9','#8b5cf6','#f59e0b','#22c55e'];

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      overview: this.api.getAnalyticsOverview(),
      funnel:   this.api.getAnalyticsFunnel(),
      advanced: this.api.getAdvancedAnalytics(),
      cost:     this.api.getCostOverview(this.costDays()),
      costLogs: this.api.getCostLogs(100)
    }).subscribe({
      next: ({ overview, funnel, advanced, cost, costLogs }) => {
        this.overview.set(overview);
        this.agents.set(this._buildAgents(overview));
        this.advanced.set(advanced);
        this.cost.set(cost);
        this.costLogs.set(costLogs.logs);
        this.loading.set(false);
        this.funnelRows.set(this._buildFunnel(funnel));
        this.attrRows.set(this._buildAttribution(advanced));
      },
      error: () => { this.error.set('Failed to load analytics.'); this.loading.set(false); }
    });
  }

  setCostDays(d: number): void {
    this.costDays.set(d);
    this.costLoading.set(true);
    forkJoin({
      cost:     this.api.getCostOverview(d),
      costLogs: this.api.getCostLogs(100)
    }).subscribe({
      next: ({ cost, costLogs }) => {
        this.cost.set(cost);
        this.costLogs.set(costLogs.logs);
        this.costLoading.set(false);
      },
      error: () => this.costLoading.set(false)
    });
  }

  private _buildAgents(overview: AnalyticsOverview): AgentPerformance[] {
    return Object.entries(overview.agent_performance ?? {}).map(([agent, v]) => ({
      agent, total_leads: v.total_leads, conversions: v.conversions, conversion_rate: v.conversion_rate
    }));
  }

  private _buildFunnel(funnel: FunnelData): FunnelRow[] {
    const stages = ['new','qualified','contacted','interested','negotiation','converted','lost'];
    const counts = stages.map(s => (funnel as any)[s] ?? 0);
    const max = Math.max(...counts, 1);
    return stages.map((s, i) => ({
      stage: s, count: counts[i],
      pct: Math.round((counts[i] / max) * 100),
      color: this.FUNNEL_COLORS[s] || '#6c757d'
    }));
  }

  private _buildAttribution(advanced: AdvancedAnalytics | null): AttrRow[] {
    if (!advanced?.revenue_attribution) return [];
    const entries = Object.entries(advanced.revenue_attribution).map(([channel, count]) => ({ channel, count }));
    const max = Math.max(...entries.map(e => e.count), 1);
    return entries.map(e => ({ ...e, pct: Math.round((e.count / max) * 100) }));
  }

  private _dictBars(dict?: Record<string, number>): CostBar[] {
    if (!dict) return [];
    const entries = Object.entries(dict).sort(([, a], [, b]) => b - a);
    const max = Math.max(...entries.map(([, v]) => v), 0.0001);
    return entries.map(([label, usd], i) => ({
      label, usd, pct: Math.round((usd / max) * 100), color: this.BAR_COLORS[i % this.BAR_COLORS.length]
    }));
  }

  formatTs(ts: number): string {
    return new Date(ts * 1000).toLocaleString();
  }

  formatK(n: number): string {
    return n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(n);
  }

  rateColor(rate: number): string {
    if (rate >= 30) return 'rgba(34,197,94,0.15)';
    if (rate >= 15) return 'rgba(245,158,11,0.15)';
    return 'rgba(239,68,68,0.12)';
  }

  trackByAgent(_: number, a: AgentPerformance): string { return a.agent; }
  trackByFunnel(_: number, f: FunnelRow): string { return f.stage; }
  trackByAttr(_: number, a: AttrRow): string { return a.channel; }
  trackByCohort(_: number, c: { key: string }): string { return c.key; }
  trackByCostLog(_: number, l: CostLog): number { return l.ts; }
  trackByCostBar(_: number, b: CostBar): string { return b.label; }
  trackByDailyBar(_: number, b: DailyBar): string { return b.date; }
}

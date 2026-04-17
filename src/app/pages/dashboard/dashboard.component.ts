import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AnalyticsOverview } from '../../core/models/analytics.model';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  overview: AnalyticsOverview | null = null;
  loading = true;
  error = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading = true;
    this.api.getAnalyticsOverview().subscribe({
      next: (data) => { this.overview = data; this.loading = false; },
      error: () => { this.error = 'Failed to load dashboard data.'; this.loading = false; }
    });
  }
}

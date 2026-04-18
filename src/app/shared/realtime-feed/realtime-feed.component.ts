import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, input, signal } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { environment } from '../../../environments/environment';

export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: Date;
}

@Component({
  selector: 'app-realtime-feed',
  standalone: false,
  templateUrl: './realtime-feed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RealtimeFeedComponent implements OnInit, OnDestroy {
  mode    = input<'sse' | 'ws'>('sse');
  channel = input<'dashboard' | 'leads' | 'metrics'>('dashboard');

  events     = signal<RealtimeEvent[]>([]);
  connected  = signal(false);
  statusText = signal('Disconnected');

  private eventSource: EventSource | null = null;
  private ws: WebSocket | null = null;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.connect();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  connect(): void {
    const token = this.auth.getToken();
    if (!token) return;

    if (this.mode() === 'sse') {
      this.connectSSE(token);
    } else {
      this.connectWS(token);
    }
  }

  disconnect(): void {
    if (this.eventSource) { this.eventSource.close(); this.eventSource = null; }
    if (this.ws) { this.ws.close(); this.ws = null; }
    this.connected.set(false);
    this.statusText.set('Disconnected');
  }

  clearEvents(): void {
    this.events.set([]);
  }

  private connectSSE(token: string): void {
    const url = `${environment.apiUrl}/stream/${this.channel()}?token=${encodeURIComponent(token)}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.connected.set(true);
      this.statusText.set('Connected (SSE)');
    };

    this.eventSource.onmessage = (e) => {
      this.pushEvent('message', e.data);
    };

    ['lead_created', 'metrics', 'lead_scored'].forEach(evType => {
      this.eventSource!.addEventListener(evType, (e: any) => {
        this.pushEvent(evType, e.data);
      });
    });

    this.eventSource.onerror = () => {
      this.connected.set(false);
      this.statusText.set('Error — reconnecting…');
    };
  }

  private connectWS(token: string): void {
    const url = `${environment.wsUrl}/ws/leads?token=${encodeURIComponent(token)}`;
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.connected.set(true);
      this.statusText.set('Connected (WebSocket)');
    };

    this.ws.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        this.pushEvent(parsed.type || 'ws_event', parsed);
      } catch {
        this.pushEvent('ws_event', e.data);
      }
    };

    this.ws.onclose = () => {
      this.connected.set(false);
      this.statusText.set('Disconnected');
    };

    this.ws.onerror = () => {
      this.connected.set(false);
      this.statusText.set('WebSocket error');
    };
  }

  private pushEvent(type: string, data: any): void {
    this.events.update(evs => {
      const next = [{ type, data, timestamp: new Date() }, ...evs];
      if (next.length > 100) next.pop();
      return next;
    });
  }

  eventIcon(type: string): string {
    const map: Record<string, string> = {
      lead_created: 'fas fa-user-plus text-success',
      lead_scored: 'fas fa-star text-warning',
      metrics: 'fas fa-chart-bar text-info',
      ws_event: 'fas fa-bolt text-primary',
      message: 'fas fa-envelope text-secondary'
    };
    return map[type] || 'fas fa-bell text-muted';
  }
}

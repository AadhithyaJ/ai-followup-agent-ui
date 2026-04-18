import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface BrandConfig {
  appName: string;
  appSub: string;
  logoIcon: string;
  primaryColor: string;
  primaryDark: string;
  primaryLight: string;
}

const STORAGE_KEY = 'app_brand';

const DEFAULTS: BrandConfig = {
  appName: 'Revenue AI',
  appSub: 'Engine',
  logoIcon: 'fa-bolt',
  primaryColor: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: 'rgba(99,102,241,0.12)',
};

@Injectable({ providedIn: 'root' })
export class BrandingService {
  private _config = new BehaviorSubject<BrandConfig>(this.load());
  config$ = this._config.asObservable();

  get config(): BrandConfig { return this._config.value; }

  private load(): BrandConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  }

  save(partial: Partial<BrandConfig>): void {
    const next = { ...this._config.value, ...partial };
    this._config.next(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.applyCssVars(next);
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this._config.next({ ...DEFAULTS });
    this.applyCssVars(DEFAULTS);
  }

  applyCssVars(c: BrandConfig = this._config.value): void {
    const r = document.documentElement;
    r.style.setProperty('--brand-primary',      c.primaryColor);
    r.style.setProperty('--brand-primary-dark',  c.primaryDark);
    r.style.setProperty('--brand-primary-light', c.primaryLight);
  }
}

import { Injectable, signal } from '@angular/core';

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
  readonly config = signal<BrandConfig>(this.load());

  private load(): BrandConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : { ...DEFAULTS };
    } catch { return { ...DEFAULTS }; }
  }

  save(partial: Partial<BrandConfig>): void {
    const next = { ...this.config(), ...partial };
    this.config.set(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    this.applyCssVars(next);
  }

  reset(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.config.set({ ...DEFAULTS });
    this.applyCssVars(DEFAULTS);
  }

  applyCssVars(c: BrandConfig = this.config()): void {
    const r = document.documentElement;
    r.style.setProperty('--brand-primary',      c.primaryColor);
    r.style.setProperty('--brand-primary-dark',  c.primaryDark);
    r.style.setProperty('--brand-primary-light', c.primaryLight);
  }
}

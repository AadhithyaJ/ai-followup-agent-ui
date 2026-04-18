import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

const CACHE_TTL_MS = 30_000; // 30 seconds

interface CacheEntry {
  response: HttpResponse<any>;
  expiresAt: number;
}

@Injectable({ providedIn: 'root' })
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.method !== 'GET') return next.handle(req);

    const cached = this.cache.get(req.urlWithParams);
    if (cached && Date.now() < cached.expiresAt) {
      return of(cached.response.clone());
    }

    return next.handle(req).pipe(
      tap(event => {
        if (event instanceof HttpResponse) {
          this.cache.set(req.urlWithParams, { response: event.clone(), expiresAt: Date.now() + CACHE_TTL_MS });
        }
      })
    );
  }

  invalidate(): void {
    this.cache.clear();
  }
}

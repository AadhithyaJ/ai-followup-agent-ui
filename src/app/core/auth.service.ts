import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; tenant_name: string; }
export interface AuthResponse { access_token: string; token_type: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'are_access_token';
  readonly loggedIn = signal<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, payload).pipe(
      tap(res => this.saveToken(res.access_token))
    );
  }

  register(payload: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/register`, payload).pipe(
      tap(res => this.saveToken(res.access_token))
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.TOKEN_KEY);
    this.loggedIn.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return this.loggedIn();
  }

  private saveToken(token: string): void {
    sessionStorage.setItem(this.TOKEN_KEY, token);
    this.loggedIn.set(true);
  }

  private hasToken(): boolean {
    return !!sessionStorage.getItem(this.TOKEN_KEY);
  }
}

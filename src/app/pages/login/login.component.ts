import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html'
})
export class LoginComponent {
  form: FormGroup;
  error = '';
  loading = false;
  showPwd = false;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  submit(): void {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err?.error?.detail || 'Invalid credentials. Please try again.';
        this.loading = false;
      }
    });
  }
}

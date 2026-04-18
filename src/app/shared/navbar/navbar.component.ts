import { Component } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { BrandingService } from '../../core/branding.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html'
})
export class NavbarComponent {
  constructor(public auth: AuthService, public branding: BrandingService) {}

  logout(): void { this.auth.logout(); }
}

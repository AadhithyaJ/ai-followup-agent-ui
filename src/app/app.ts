import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth.service';
import { BrandingService } from './core/branding.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  constructor(public auth: AuthService, private branding: BrandingService) {}

  ngOnInit(): void {
    this.branding.applyCssVars();
  }
}

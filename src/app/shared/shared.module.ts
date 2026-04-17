import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { RealtimeFeedComponent } from './realtime-feed/realtime-feed.component';

@NgModule({
  declarations: [
    NavbarComponent,
    RealtimeFeedComponent
  ],
  imports: [CommonModule, RouterModule],
  exports: [NavbarComponent, RealtimeFeedComponent]
})
export class SharedModule {}

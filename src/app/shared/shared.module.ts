import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavbarComponent } from './navbar/navbar.component';
import { RealtimeFeedComponent } from './realtime-feed/realtime-feed.component';
import { PaginationComponent } from './pagination/pagination.component';

@NgModule({
  declarations: [
    NavbarComponent,
    RealtimeFeedComponent,
    PaginationComponent
  ],
  imports: [CommonModule, RouterModule],
  exports: [NavbarComponent, RealtimeFeedComponent, PaginationComponent]
})
export class SharedModule {}

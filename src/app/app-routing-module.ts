import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module').then(m => m.LoginModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/register/register.module').then(m => m.RegisterModule)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'leads',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/leads/leads.module').then(m => m.LeadsModule)
  },
  {
    path: 'analytics',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/analytics/analytics.module').then(m => m.AnalyticsModule)
  },
  {
    path: 'workflows',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/workflows/workflows.module').then(m => m.WorkflowsModule)
  },
  {
    path: 'admin',
    canActivate: [AuthGuard],
    loadChildren: () => import('./pages/admin/admin.module').then(m => m.AdminModule)
  },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { WorkflowsComponent } from './workflows.component';

const routes: Routes = [{ path: '', component: WorkflowsComponent }];

@NgModule({
  declarations: [WorkflowsComponent],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule.forChild(routes)]
})
export class WorkflowsModule {}

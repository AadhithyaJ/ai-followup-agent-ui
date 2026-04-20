import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { WorkflowsComponent } from './workflows.component';
import { SharedModule } from '../../shared/shared.module';

const routes: Routes = [{ path: '', component: WorkflowsComponent }];

@NgModule({
  declarations: [WorkflowsComponent],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, DragDropModule, RouterModule.forChild(routes), SharedModule]
})
export class WorkflowsModule {}

import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Workflow, WorkflowTestResult } from '../../core/models/workflow.model';

@Component({
  selector: 'app-workflows',
  standalone: false,
  templateUrl: './workflows.component.html'
})
export class WorkflowsComponent implements OnInit {
  workflows: Workflow[] = [];
  loading = false;
  error = '';
  successMsg = '';

  showForm = false;
  editingId: string | null = null;
  form: FormGroup;
  formLoading = false;
  formError = '';

  testResult: WorkflowTestResult | null = null;
  testLeadId = '';
  testingId: string | null = null;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      trigger: ['', Validators.required],
      description: [''],
      steps: this.fb.array([])
    });
  }

  ngOnInit(): void { this.loadWorkflows(); }

  get steps(): FormArray { return this.form.get('steps') as FormArray; }

  addStep(): void {
    this.steps.push(this.fb.group({
      delay_sec: [30, Validators.required],
      action: ['whatsapp', Validators.required],
      message_template: ['Hi {name}, following up on your inquiry!']
    }));
  }

  removeStep(i: number): void { this.steps.removeAt(i); }

  loadWorkflows(): void {
    this.loading = true;
    this.api.getWorkflows().subscribe({
      next: d => { this.workflows = d; this.loading = false; },
      error: () => { this.error = 'Failed to load workflows.'; this.loading = false; }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ name: '', trigger: '', description: '' });
    this.steps.clear();
    this.addStep();
    this.showForm = true;
    this.formError = '';
  }

  openEdit(wf: Workflow): void {
    this.editingId = wf.id;
    this.form.patchValue({ name: wf.name, trigger: wf.trigger, description: wf.description });
    this.steps.clear();
    (wf.steps || []).forEach(s => {
      this.steps.push(this.fb.group({
        delay_sec: [s.delay_sec],
        action: [s.action],
        message_template: [s.message_template || '']
      }));
    });
    this.showForm = true;
    this.formError = '';
  }

  cancelForm(): void { this.showForm = false; this.editingId = null; }

  save(): void {
    if (this.form.invalid) return;
    this.formLoading = true;
    this.formError = '';
    const payload = this.form.value;

    const req$ = this.editingId
      ? this.api.updateWorkflow(this.editingId, payload)
      : this.api.createWorkflow(payload);

    req$.subscribe({
      next: () => {
        this.successMsg = this.editingId ? 'Workflow updated.' : 'Workflow created.';
        this.formLoading = false;
        this.showForm = false;
        this.loadWorkflows();
      },
      error: err => {
        this.formError = err?.error?.detail || 'Save failed.';
        this.formLoading = false;
      }
    });
  }

  toggleActive(wf: Workflow): void {
    this.api.updateWorkflow(wf.id, { is_active: !wf.is_active }).subscribe({
      next: () => { wf.is_active = !wf.is_active; },
      error: () => { this.error = 'Failed to toggle workflow.'; }
    });
  }

  delete(wf: Workflow): void {
    if (!confirm(`Delete workflow "${wf.name}"?`)) return;
    this.api.deleteWorkflow(wf.id).subscribe({
      next: () => { this.successMsg = 'Workflow deleted.'; this.loadWorkflows(); },
      error: () => { this.error = 'Delete failed.'; }
    });
  }

  test(wf: Workflow): void {
    if (!this.testLeadId.trim()) { alert('Enter a lead ID to test against.'); return; }
    this.testingId = wf.id;
    this.testResult = null;
    this.api.testWorkflow(wf.id, this.testLeadId.trim()).subscribe({
      next: res => { this.testResult = res; this.testingId = null; },
      error: () => { this.error = 'Test failed.'; this.testingId = null; }
    });
  }
}

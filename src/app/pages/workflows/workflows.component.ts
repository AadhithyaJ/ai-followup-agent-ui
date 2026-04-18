import { ChangeDetectionStrategy, Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../core/api.service';
import { Workflow, WorkflowTestResult } from '../../core/models/workflow.model';

@Component({
  selector: 'app-workflows',
  standalone: false,
  templateUrl: './workflows.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowsComponent implements OnInit {
  workflows  = signal<Workflow[]>([]);
  loading    = signal(false);
  error      = signal('');
  successMsg = signal('');

  showForm   = signal(false);
  editingId  = signal<string | null>(null);
  formLoading = signal(false);
  formError   = signal('');

  testResult  = signal<WorkflowTestResult | null>(null);
  testLeadId  = signal('');
  testingId   = signal<string | null>(null);

  form: FormGroup;

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
    this.loading.set(true);
    this.api.getWorkflows().subscribe({
      next: d => { this.workflows.set(d); this.loading.set(false); },
      error: () => { this.error.set('Failed to load workflows.'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', trigger: '', description: '' });
    this.steps.clear();
    this.addStep();
    this.showForm.set(true);
    this.formError.set('');
  }

  openEdit(wf: Workflow): void {
    this.editingId.set(wf.id);
    this.form.patchValue({ name: wf.name, trigger: wf.trigger, description: wf.description });
    this.steps.clear();
    (wf.steps || []).forEach(s => {
      this.steps.push(this.fb.group({
        delay_sec: [s.delay_sec],
        action: [s.action],
        message_template: [s.message_template || '']
      }));
    });
    this.showForm.set(true);
    this.formError.set('');
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) return;
    this.formLoading.set(true);
    this.formError.set('');
    const payload = this.form.value;

    const req$ = this.editingId()
      ? this.api.updateWorkflow(this.editingId()!, payload)
      : this.api.createWorkflow(payload);

    req$.subscribe({
      next: () => {
        this.successMsg.set(this.editingId() ? 'Workflow updated.' : 'Workflow created.');
        this.formLoading.set(false);
        this.showForm.set(false);
        this.loadWorkflows();
      },
      error: err => {
        this.formError.set(err?.error?.detail || 'Save failed.');
        this.formLoading.set(false);
      }
    });
  }

  toggleActive(wf: Workflow): void {
    this.api.updateWorkflow(wf.id, { is_active: !wf.is_active }).subscribe({
      next: () => { wf.is_active = !wf.is_active; },
      error: () => { this.error.set('Failed to toggle workflow.'); }
    });
  }

  delete(wf: Workflow): void {
    if (!confirm(`Delete workflow "${wf.name}"?`)) return;
    this.api.deleteWorkflow(wf.id).subscribe({
      next: () => { this.successMsg.set('Workflow deleted.'); this.loadWorkflows(); },
      error: () => { this.error.set('Delete failed.'); }
    });
  }

  test(wf: Workflow): void {
    if (!this.testLeadId().trim()) { alert('Enter a lead ID to test against.'); return; }
    this.testingId.set(wf.id);
    this.testResult.set(null);
    this.api.testWorkflow(wf.id, this.testLeadId().trim()).subscribe({
      next: res => { this.testResult.set(res); this.testingId.set(null); },
      error: () => { this.error.set('Test failed.'); this.testingId.set(null); }
    });
  }
}

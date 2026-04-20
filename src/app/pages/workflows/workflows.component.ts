import { ChangeDetectionStrategy, Component, OnInit, computed, signal } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { ApiService } from '../../core/api.service';
import {
  Workflow, WorkflowTemplate, WorkflowExecution, WorkflowTestResult
} from '../../core/models/workflow.model';
import { Lead } from '../../core/models/lead.model';

@Component({
  selector: 'app-workflows',
  standalone: false,
  templateUrl: './workflows.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkflowsComponent implements OnInit {
  /* ── Core ─────────────────────────────────── */
  workflows   = signal<Workflow[]>([]);
  loading     = signal(false);
  error       = signal('');
  successMsg  = signal('');

  /* ── Create / Edit form ───────────────────── */
  showForm    = signal(false);
  editingId   = signal<string | null>(null);
  formLoading = signal(false);
  formError   = signal('');

  /* ── Test / Dry-run ───────────────────────── */
  testResult  = signal<WorkflowTestResult | null>(null);
  testLeadId  = signal('');
  testingId   = signal<string | null>(null);

  /* ── Lead selector ────────────────────────── */
  leads            = signal<Lead[]>([]);
  leadsLoading     = signal(false);
  leadSearch       = signal('');
  showLeadDropdown = signal(false);
  selectedLead     = signal<Lead | null>(null);

  filteredLeads = computed(() => {
    const q = this.leadSearch().toLowerCase().trim();
    if (!q) return this.leads();
    return this.leads().filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q)
    );
  });

  /* ── Templates gallery ────────────────────── */
  showTemplates    = signal(false);
  templates        = signal<WorkflowTemplate[]>([]);
  templatesLoading = signal(false);
  cloningId        = signal<string | null>(null);

  /* ── Executions & analysis ────────────────── */
  executions        = signal<WorkflowExecution[]>([]);
  executionsLoading = signal(false);
  executionsFor     = signal<string | null>(null);   // workflow id whose history is open
  actioningId       = signal<string | null>(null);   // workflow being assigned/run

  execStats = computed(() => {
    const ex = this.executions();
    const total     = ex.length;
    const completed = ex.filter(e => e.status === 'completed').length;
    const failed    = ex.filter(e => e.status === 'failed').length;
    const rate      = total ? Math.round((completed / total) * 100) : 0;
    return { total, completed, failed, rate };
  });

  form: FormGroup;

  private readonly TEMPLATE_ICONS = ['fa-bolt','fa-rocket','fa-star','fa-layer-group','fa-magic'];

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      trigger: ['', Validators.required],
      description: [''],
      steps: this.fb.array([])
    });
  }

  ngOnInit(): void { this.loadWorkflows(); this.loadLeads(); }

  get steps(): FormArray { return this.form.get('steps') as FormArray; }

  /* ── Form helpers ─────────────────────────── */
  addStep(): void {
    this.steps.push(this.fb.group({
      delay_sec: [30, Validators.required],
      action: ['whatsapp', Validators.required],
      message_template: ['Hi {name}, following up on your inquiry!']
    }));
  }

  removeStep(i: number): void { this.steps.removeAt(i); }

  dropStep(event: CdkDragDrop<FormGroup[]>): void {
    const controls = this.steps.controls.slice();
    moveItemInArray(controls, event.previousIndex, event.currentIndex);
    this.steps.clear();
    controls.forEach(c => this.steps.push(c));
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
    (wf.steps || []).forEach(s => this.steps.push(this.fb.group({
      delay_sec: [s.delay_sec], action: [s.action], message_template: [s.message_template || '']
    })));
    this.showForm.set(true);
    this.formError.set('');
  }

  cancelForm(): void { this.showForm.set(false); this.editingId.set(null); }

  save(): void {
    if (this.form.invalid) return;
    this.formLoading.set(true);
    this.formError.set('');
    const req$ = this.editingId()
      ? this.api.updateWorkflow(this.editingId()!, this.form.value)
      : this.api.createWorkflow(this.form.value);
    req$.subscribe({
      next: () => {
        this.successMsg.set(this.editingId() ? 'Workflow updated.' : 'Workflow created.');
        this.formLoading.set(false);
        this.showForm.set(false);
        this.loadWorkflows();
      },
      error: err => { this.formError.set(err?.error?.detail || 'Save failed.'); this.formLoading.set(false); }
    });
  }

  /* ── Lead selector ───────────────────────── */
  loadLeads(): void {
    this.leadsLoading.set(true);
    this.api.getLeads({}).subscribe({
      next: d => { this.leads.set(d); this.leadsLoading.set(false); },
      error: () => this.leadsLoading.set(false)
    });
  }

  selectLead(lead: Lead): void {
    this.selectedLead.set(lead);
    this.testLeadId.set(lead.id);
    this.showLeadDropdown.set(false);
    this.leadSearch.set('');
  }

  clearLeadSelection(): void {
    this.selectedLead.set(null);
    this.testLeadId.set('');
  }

  /* ── CRUD ─────────────────────────────────── */
  loadWorkflows(): void {
    this.loading.set(true);
    this.api.getWorkflows().subscribe({
      next: d => { this.workflows.set(d); this.loading.set(false); },
      error: () => { this.error.set('Failed to load workflows.'); this.loading.set(false); }
    });
  }

  toggleActive(wf: Workflow): void {
    this.api.updateWorkflow(wf.id, { is_active: !wf.is_active }).subscribe({
      next: () => this.workflows.update(ws => ws.map(w => w.id === wf.id ? { ...w, is_active: !w.is_active } : w)),
      error: () => this.error.set('Failed to toggle workflow.')
    });
  }

  delete(wf: Workflow): void {
    if (!confirm(`Delete workflow "${wf.name}"?`)) return;
    this.api.deleteWorkflow(wf.id).subscribe({
      next: () => { this.successMsg.set('Workflow deleted.'); this.loadWorkflows(); },
      error: () => this.error.set('Delete failed.')
    });
  }

  /* ── Test ─────────────────────────────────── */
  test(wf: Workflow): void {
    if (!this.testLeadId().trim()) { this.error.set('Select a lead first.'); return; }
    this.testingId.set(wf.id);
    this.testResult.set(null);
    this.api.testWorkflow(wf.id, this.testLeadId().trim()).subscribe({
      next: res => { this.testResult.set(res); this.testingId.set(null); },
      error: () => { this.error.set('Test failed.'); this.testingId.set(null); }
    });
  }

  /* ── Templates ────────────────────────────── */
  toggleTemplates(): void {
    if (this.showTemplates()) { this.showTemplates.set(false); return; }
    this.showTemplates.set(true);
    if (!this.templates().length) {
      this.templatesLoading.set(true);
      this.api.getWorkflowTemplates().subscribe({
        next: t => { this.templates.set(t); this.templatesLoading.set(false); },
        error: () => this.templatesLoading.set(false)
      });
    }
  }

  cloneTemplate(tpl: WorkflowTemplate): void {
    this.cloningId.set(tpl.id);
    this.api.cloneTemplate(tpl.id).subscribe({
      next: () => {
        this.successMsg.set(`"${tpl.name}" added to your workflows.`);
        this.cloningId.set(null);
        this.loadWorkflows();
      },
      error: () => { this.error.set('Clone failed.'); this.cloningId.set(null); }
    });
  }

  templateIcon(i: number): string { return this.TEMPLATE_ICONS[i % this.TEMPLATE_ICONS.length]; }

  /* ── Assign / Run ─────────────────────────── */
  assign(wf: Workflow): void {
    if (!this.testLeadId().trim()) { this.error.set('Select a lead first.'); return; }
    this.actioningId.set(wf.id + ':assign');
    this.api.assignWorkflow(wf.id, this.testLeadId().trim()).subscribe({
      next: () => { this.successMsg.set(`Workflow assigned to lead ${this.testLeadId()}.`); this.actioningId.set(null); },
      error: err => { this.error.set(err?.error?.detail || 'Assign failed.'); this.actioningId.set(null); }
    });
  }

  forceRun(wf: Workflow): void {
    if (!this.testLeadId().trim()) { this.error.set('Select a lead first.'); return; }
    this.actioningId.set(wf.id + ':run');
    this.api.runWorkflow(wf.id, this.testLeadId().trim(), false).subscribe({
      next: () => { this.successMsg.set(`Workflow executed on lead ${this.testLeadId()}.`); this.actioningId.set(null); },
      error: err => { this.error.set(err?.error?.detail || 'Run failed.'); this.actioningId.set(null); }
    });
  }

  /* ── Executions / History ─────────────────── */
  toggleHistory(wf: Workflow): void {
    if (this.executionsFor() === wf.id) { this.executionsFor.set(null); return; }
    this.executionsFor.set(wf.id);
    this.executionsLoading.set(true);
    this.executions.set([]);
    this.api.getWorkflowExecutions(wf.id).subscribe({
      next: ex => { this.executions.set(ex); this.executionsLoading.set(false); },
      error: () => { this.error.set('Failed to load executions.'); this.executionsLoading.set(false); }
    });
  }

  statusColor(status: string): string {
    switch (status) {
      case 'completed': return '#22c55e';
      case 'failed':    return '#ef4444';
      case 'running':   return '#3b82f6';
      default:          return '#9ca3af';
    }
  }

  statusBg(status: string): string {
    switch (status) {
      case 'completed': return 'rgba(34,197,94,0.12)';
      case 'failed':    return 'rgba(239,68,68,0.1)';
      case 'running':   return 'rgba(59,130,246,0.1)';
      default:          return 'rgba(156,163,175,0.12)';
    }
  }

  formatDate(d: string): string {
    return d ? new Date(d).toLocaleString() : '—';
  }

  execDuration(ex: WorkflowExecution): string {
    if (!ex.triggered_at || !ex.completed_at) return '—';
    const ms = new Date(ex.completed_at).getTime() - new Date(ex.triggered_at).getTime();
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  }

  actionIs(wfId: string, action: string): boolean { return this.actioningId() === `${wfId}:${action}`; }

  formatDelay(sec: number): string {
    if (sec < 60)    return `${sec}s`;
    if (sec < 3600)  return `${Math.round(sec / 60)}m`;
    if (sec < 86400) return `${Math.round(sec / 3600)}h`;
    return `${Math.round(sec / 86400)}d`;
  }

  stepActionMeta(action: string): { icon: string; color: string; bg: string; prefix: string } {
    const map: Record<string, { icon: string; color: string; bg: string; prefix: string }> = {
      whatsapp: { icon: 'fab fa-whatsapp', color: '#22c55e', bg: 'rgba(34,197,94,0.1)',   prefix: 'WhatsApp' },
      email:    { icon: 'fas fa-envelope', color: '#6366f1', bg: 'rgba(99,102,241,0.1)',  prefix: 'Email' },
      sms:      { icon: 'fas fa-sms',      color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', prefix: 'SMS' },
      call:     { icon: 'fas fa-phone',    color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', prefix: 'Call' },
    };
    return map[action] || { icon: 'fas fa-bolt', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', prefix: action };
  }

  trackById(_: number, x: { id: string }): string { return x.id; }
  trackByExec(_: number, e: WorkflowExecution): string { return e.id; }
}

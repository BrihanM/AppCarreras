/**
 * Página de administración: reglas de invalidación de cache.
 */
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'srx-admin-cache-rules-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-page">
      <h1 class="page-title">🔁 Reglas de Invalidación</h1>
      <p class="sub">Define qué endpoints deben invalidar qué rutas del cache al mutar.</p>

      <div class="rules-list">
        @if (isLoading()) {
          <p>Cargando...</p>
        } @else {
          @for (rule of rules(); track rule.id) {
            <div class="rule-row">
              <div class="rule-meta">
                <strong>{{ rule.name || rule.mutating_endpoint }}</strong>
                <div class="mut">Mutación: {{ rule.mutating_endpoint }}</div>
                <div class="inv">Invalidates: {{ rule.invalidates.join(', ') }}</div>
              </div>
              <div class="actions">
                <button (click)="edit(rule)">Editar</button>
                <button (click)="remove(rule.id)">Borrar</button>
              </div>
            </div>
          }
        }
      </div>

      <form (submit)="create($event)">
        <input placeholder="Nombre (opcional)" [(ngModel)]="form.name" name="name" />
        <input placeholder="Endpoint de mutación (ej: /api/vehicles)" [(ngModel)]="form.mutating_endpoint" name="mutating_endpoint" required />
        <input placeholder="Invalidates (coma-sep)" [(ngModel)]="form.invalidates" name="invalidates" />
        <button type="submit">Guardar</button>
      </form>
    </div>
  `,
  styles: [`.admin-page { max-width:900px; margin:0 auto; } .rule-row{display:flex;justify-content:space-between;padding:0.5rem;border-radius:8px;background:rgba(255,255,255,0.03);margin-bottom:0.5rem}`],
})
export class AdminCacheRulesPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);

  readonly isLoading = signal(false);
  readonly rules = signal<any[]>([]);

  form: any = { name: '', mutating_endpoint: '', invalidates: '' };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.admin.getCacheRules().subscribe({
      next: (res) => { this.rules.set(res.data || []); this.isLoading.set(false); },
      error: () => { this.toast.error('Error cargando reglas.'); this.isLoading.set(false); }
    });
  }

  create(ev: Event): void {
    ev.preventDefault();
    const payload = { name: this.form.name || null, mutating_endpoint: this.form.mutating_endpoint, invalidates: (this.form.invalidates || '').split(',').map((s:string)=>s.trim()).filter(Boolean) };
    this.admin.createCacheRule(payload).subscribe({
      next: () => { this.toast.success('Regla creada'); this.form = { name:'', mutating_endpoint:'', invalidates:'' }; this.load(); },
      error: () => this.toast.error('Error creando regla')
    });
  }

  edit(rule: any): void {
    const updated = prompt('Editar invalidates (coma-sep)', (rule.invalidates || []).join(', '));
    if (updated === null) return;
    const payload = { name: rule.name, mutating_endpoint: rule.mutating_endpoint, invalidates: updated.split(',').map((s:string)=>s.trim()).filter(Boolean) };
    this.admin.updateCacheRule(rule.id, payload).subscribe({ next: ()=>{ this.toast.success('Actualizado'); this.load(); }, error: ()=> this.toast.error('Error') });
  }

  remove(id: string): void {
    if (!confirm('¿Borrar regla?')) return;
    this.admin.deleteCacheRule(id).subscribe({ next: ()=>{ this.toast.success('Borrada'); this.load(); }, error: ()=> this.toast.error('Error') });
  }
}

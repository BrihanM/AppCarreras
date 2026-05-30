/**
 * Página de administración: reglas de invalidación de cache.
 */
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { CacheRulesService } from '@core/services/cache-rules.service';

@Component({
  selector: 'srx-admin-cache-rules-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-cache-rules.page.html',
  styleUrls: ['./admin-cache-rules.page.scss'],
})
export class AdminCacheRulesPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly rulesSvc = inject(CacheRulesService);

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
      next: () => { this.toast.success('Regla creada'); this.rulesSvc.invalidateCache(); this.form = { name:'', mutating_endpoint:'', invalidates:'' }; this.load(); },
      error: () => this.toast.error('Error creando regla')
    });
  }

  edit(rule: any): void {
    const updated = prompt('Editar invalidates (coma-sep)', (rule.invalidates || []).join(', '));
    if (updated === null) return;
    const payload = { name: rule.name, mutating_endpoint: rule.mutating_endpoint, invalidates: updated.split(',').map((s:string)=>s.trim()).filter(Boolean) };
    this.admin.updateCacheRule(rule.id, payload).subscribe({ next: ()=>{ this.toast.success('Actualizado'); this.rulesSvc.invalidateCache(); this.load(); }, error: ()=> this.toast.error('Error') });
  }

  remove(id: string): void {
    if (!confirm('¿Borrar regla?')) return;
    this.admin.deleteCacheRule(id).subscribe({ next: ()=>{ this.toast.success('Borrada'); this.rulesSvc.invalidateCache(); this.load(); }, error: ()=> this.toast.error('Error') });
  }
}

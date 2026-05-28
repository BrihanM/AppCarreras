/**
 * @fileoverview Componente contenedor de toasts.
 * Renderiza la pila de notificaciones en pantalla.
 * Es un Dumb Component: solo recibe la lista de toasts y emite dismissals.
 *
 * @usageNotes
 * Colocarlo en el shell layout (app.html) para visibilidad global.
 */
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast, ToastType } from '@core/services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'srx-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="alert" aria-live="polite">
      @for (toast of toasts; track toast.id) {
        <div
          class="toast toast--{{ toast.type }}"
          (click)="toastService.dismiss(toast.id)"
          [@slideIn]
        >
          <span class="toast__icon">{{ getIcon(toast.type) }}</span>
          <span class="toast__message">{{ toast.message }}</span>
        </div>
      }
    </div>
  `,
  styleUrls: ['./toast-container.component.scss'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
      ]),
    ]),
  ],
})
export class ToastContainerComponent {
  readonly toastService: ToastService = inject(ToastService);

  /** Acceso tipado a la lista actual de toasts para que el compilador conozca el tipo. */
  get toasts(): Toast[] {
    return this.toastService.toasts();
  }

  /**
   * Retorna el ícono emoji correspondiente al tipo de toast.
   * @param type Tipo del toast.
   */
  getIcon(type: ToastType): string {
    const icons: Record<ToastType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type] ?? '';
  }
}

/**
 * @fileoverview Componente de estado vacío reutilizable.
 * Muestra un mensaje cuando no hay datos disponibles para renderizar.
 *
 * @example
 * <srx-empty-state icon="🏎️" title="Sin retos" message="Aún no tienes retos activos." />
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'srx-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="empty-state">
      <span class="empty-state__icon">{{ icon }}</span>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__message">{{ message }}</p>
      <ng-content />
    </div>
  `,
  styleUrls: ['./empty-state.component.scss'],
})
export class EmptyStateComponent {
  /** Emoji o ícono representativo. */
  @Input() icon = '📭';

  /** Título principal del estado vacío. */
  @Input() title = 'Sin resultados';

  /** Descripción del estado vacío. */
  @Input() message = 'No hay datos disponibles en este momento.';
}

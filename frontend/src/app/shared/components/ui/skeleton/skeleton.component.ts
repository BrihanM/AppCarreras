/**
 * @fileoverview Componente Skeleton Loader.
 * Muestra un placeholder animado mientras los datos cargan.
 * Es un Dumb Component que acepta configuración de dimensiones y forma.
 *
 * @example
 * <srx-skeleton width="100%" height="200px" borderRadius="12px" />
 */
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'srx-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="skeleton"
      [style.width]="width"
      [style.height]="height"
      [style.borderRadius]="borderRadius"
    ></div>
  `,
  styleUrls: ['./skeleton.component.scss'],
})
export class SkeletonComponent {
  /** Ancho del skeleton (CSS value). Default: 100% */
  @Input() width = '100%';

  /** Alto del skeleton (CSS value). Default: 1rem */
  @Input() height = '1rem';

  /** Border radius del skeleton. Default: 4px */
  @Input() borderRadius = '4px';
}

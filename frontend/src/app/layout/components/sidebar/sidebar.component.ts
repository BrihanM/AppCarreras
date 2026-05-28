/**
 * @fileoverview Componente Sidebar de navegación lateral.
 * Menú principal de la aplicación con navegación por features y estado del piloto.
 *
 * @description
 * Smart Component: muestra rutas condicionadas por el rol del usuario.
 * Soporta modo colapsado para pantallas pequeñas.
 */
import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { APP_ROUTES } from '@core/constants/app.constants';

/** Ítem de navegación del sidebar. */
interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'srx-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  readonly authService = inject(AuthService);

  get currentUser() {
    return this.authService.currentUser();
  }

  /** Controla si el sidebar está visible (usado en mobile). */
  @Input() isOpen = true;

  /** Ítems de navegación principal. */
  readonly navItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: APP_ROUTES.DASHBOARD },
    { label: 'Mi Perfil', icon: '👤', route: APP_ROUTES.PROFILE },
    { label: 'Vehículos', icon: '🏎️', route: APP_ROUTES.VEHICLES },
    { label: 'Matchmaking', icon: '⚡', route: APP_ROUTES.MATCHMAKING },
    { label: 'Retos', icon: '🏁', route: APP_ROUTES.CHALLENGES },
    { label: 'Notificaciones', icon: '🔔', route: APP_ROUTES.NOTIFICATIONS },
    { label: 'Admin', icon: '⚙️', route: APP_ROUTES.ADMIN.ROOT, adminOnly: true },
  ];

  /**
   * Filtra los ítems de navegación según el rol del usuario.
   * @returns Lista de ítems visibles para el usuario actual.
   */
  get visibleNavItems(): NavItem[] {
    return this.navItems.filter(
      (item) => !item.adminOnly || this.authService.isAdmin()
    );
  }
}

/**
 * @fileoverview Facade del perfil del usuario.
 * Gestiona la carga y actualización del perfil propio.
 *
 * @class ProfileFacade
 */
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { UpdateProfilePayload } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class ProfileFacade {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly currentUser = this.authService.currentUser;

  /**
   * Actualiza el perfil del piloto.
   * @param payload Datos a actualizar.
   */
  updateProfile(payload: UpdateProfilePayload): void {
    this.isSaving.set(true);
    this.profileService
      .updateProfile(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: ({ data }) => {
          this.authService.updateCurrentUser(data);
          this.toastService.success('Perfil actualizado correctamente.');
        },
        error: () => this.toastService.error('Error al actualizar el perfil.'),
      });
  }
}

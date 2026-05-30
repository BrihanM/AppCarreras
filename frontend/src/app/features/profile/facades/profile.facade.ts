/**
 * @fileoverview Facade del perfil del usuario.
 * Gestiona la carga y actualización del perfil propio.
 *
 * @class ProfileFacade
 */
import { Injectable, inject, signal } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { Observable, Subscription } from 'rxjs';
import { ProfileService } from '../services/profile.service';
import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { UpdateProfilePayload, User, ApiResponse } from '@shared/interfaces';
import { RealtimeService } from '@core/services/realtime.service';

@Injectable({ providedIn: 'root' })
export class ProfileFacade {
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly realtime = inject(RealtimeService);
  private realtimeSub?: Subscription;

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly currentUser = this.authService.currentUser;

  constructor() {
    try {
      this.realtimeSub = this.realtime.events$.subscribe((ev) => {
        if (['user:updated', 'account:updated', 'rank:updated'].includes(ev.type)) {
          this.loadProfile().subscribe({ next: () => {}, error: () => {} });
        }
      });
    } catch (e) {}
  }

  /** Carga el perfil completo del servidor y actualiza el usuario en AuthService. */
  loadProfile(): Observable<ApiResponse<User>> {
    this.isLoading.set(true);
    return this.profileService.getMyProfile().pipe(
      tap(({ data }) => this.authService.updateCurrentUser(this.mapProfileToUser(data))),
      finalize(() => this.isLoading.set(false))
    );
  }

  /**
   * Normaliza el objeto `User` devuelto por el backend (users table)
   * al shape que usa la UI (`User` interface). No elimina campos originales.
   */
  mapProfileToUser(profile: any): User {
    const current = this.authService.currentUser() ?? ({} as User);
    const [firstName, ...rest] = (profile?.name ?? '').split(' ');
    const lastName = rest.join(' ') || undefined;

    const mapped: User = {
      // Prefer the `users.id` (profile.id) so client lookups like `/users/{id}/vehicles`
      // use the correct user UUID. Fallback to `account_id` when `id` missing.
      id: profile?.id ?? profile?.account_id ?? current.id ?? '',
      // Use profile values first; fallback to account/current values
      username: profile?.username ?? current.username ?? '',
      email: profile?.email ?? current.email ?? '',
      role: (profile?.role ?? current.role ?? 'user') as any,
      status: (profile?.state ?? current.status ?? 'active') as any,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      city: profile?.city_area ?? current.city ?? undefined,
      avatarUrl: (profile?.avatar_url ?? current.avatarUrl ?? (current as any).photo) ?? undefined,
      bio: profile?.bio ?? (current as any).bio ?? undefined,
      rank: String(profile?.rank ?? current.rank ?? 'D'),
      wins: Number(profile?.victories ?? current.wins ?? 0),
      losses: Number(profile?.defeats ?? current.losses ?? 0),
      createdAt: profile?.created_at ?? current.createdAt ?? new Date().toISOString(),
      updatedAt: profile?.updated_at ?? current.updatedAt ?? new Date().toISOString(),
    };

    return mapped;
  }

  /**
   * Actualiza el perfil del piloto.
   * @param payload Datos a actualizar.
   */
  updateProfile(payload: UpdateProfilePayload): void {
    this.isSaving.set(true);
    this.profileService.updateProfile(payload).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (resp: any) => {
        // Backend may return either the updated `User` or an object { account, user }
        const payloadResp = resp?.data ?? resp;
        const userRow = payloadResp?.user ?? payloadResp;
        this.authService.updateCurrentUser(this.mapProfileToUser(userRow));
        this.toastService.success('Perfil actualizado correctamente.');
      },
      error: () => this.toastService.error('Error al actualizar el perfil.'),
    });
  }
}

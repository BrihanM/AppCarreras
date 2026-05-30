/**
 * @fileoverview Página de Perfil del Piloto.
 * Muestra estadísticas del piloto y permite editar información personal.
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ProfileFacade } from '../facades/profile.facade';

@Component({
  selector: 'srx-profile-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePage implements OnInit {
  readonly facade = inject(ProfileFacade);
  private readonly fb = inject(FormBuilder);
  isEditing = false;

  readonly form = this.fb.group({
    // Account fields
    username: [''],
    email: [''],
    password: [''],
    firstName: [''],
    lastName: [''],
    bio: [''],
    city: [''],
    avatarUrl: [''],
  });

  ngOnInit(): void {
    // Solicita el perfil al backend y parchea el formulario cuando llegue.
    this.facade.loadProfile().subscribe({
      next: ({ data }) => {
        const current = this.facade.currentUser();
        this.form.patchValue({
          username: current?.username ?? data.username ?? '',
          email: current?.email ?? data.email ?? '',
          firstName: current?.firstName ?? data.firstName ?? '',
          lastName: current?.lastName ?? data.lastName ?? '',
          bio: current?.bio ?? data.bio ?? '',
          city: current?.city ?? data.city ?? '',
          avatarUrl: current?.avatarUrl ?? data.avatarUrl ?? '',
        });
      },
      error: () => {
        const user = this.facade.currentUser();
        if (user) {
          this.form.patchValue({
            username: user.username ?? '',
            email: user.email ?? '',
            firstName: user.firstName ?? '',
            lastName: user.lastName ?? '',
            bio: user.bio ?? '',
            city: user.city ?? '',
            avatarUrl: user.avatarUrl ?? '',
          });
        }
      },
    });
  }

  startEditing(): void {
    const user = this.facade.currentUser();
    if (user) {
      this.form.patchValue({
        username: user.username ?? '',
        email: user.email ?? '',
        password: '',
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        bio: user.bio ?? '',
        city: user.city ?? '',
        avatarUrl: user.avatarUrl ?? '',
      });
    }
    this.isEditing = true;
  }

  cancelEditing(): void { this.isEditing = false; }

  submit(): void {
    if (this.form.invalid) return;
    this.facade.updateProfile({
      username: this.form.value.username ?? undefined,
      email: this.form.value.email ?? undefined,
      password: this.form.value.password ?? undefined,
      firstName: this.form.value.firstName ?? undefined,
      lastName: this.form.value.lastName ?? undefined,
      bio: this.form.value.bio ?? undefined,
      city: this.form.value.city ?? undefined,
      avatarUrl: this.form.value.avatarUrl ?? undefined,
    });
    this.isEditing = false;
  }
}

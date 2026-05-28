/**
 * @fileoverview Página de Login de StreetRaceX.
 * Formulario de autenticación con diseño oscuro inspirado en NFS/Forza.
 *
 * @description
 * Dumb/Smart híbrido: usa AuthFacade para lógica, ReactiveFormsModule para el form.
 * Valida en cliente antes de enviar al backend.
 */
import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../facades/auth.facade';
import { APP_ROUTES } from '@core/constants/app.constants';

@Component({
  selector: 'srx-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrl: './login.page.scss',
})
export class LoginPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly authFacade = inject(AuthFacade);
  readonly routes = APP_ROUTES;

  /** Formulario reactivo de login. */
  readonly form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  /** Controla la visibilidad del campo password. */
  showPassword = false;

  /**
   * Envía las credenciales al facade si el formulario es válido.
   */
  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.authFacade.login(this.form.getRawValue());
  }

  /** Alterna la visibilidad de la contraseña. */
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnDestroy(): void {
    this.authFacade.clearError();
  }

  /** Helpers para acceder a los controles del formulario. */
  get emailCtrl() { return this.form.get('email')!; }
  get passwordCtrl() { return this.form.get('password')!; }
}

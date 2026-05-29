/**
 * @fileoverview Página de Registro de StreetRaceX.
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
import { RegisterWithUserPayload } from '@shared/interfaces';
import { AuthFacade } from '../../facades/auth.facade';
import { APP_ROUTES } from '@core/constants/app.constants';

@Component({
  selector: 'srx-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrl: './register.page.scss',
})
export class RegisterPage implements OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly authFacade = inject(AuthFacade);
  readonly routes = APP_ROUTES;

  readonly form: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],

    // Campos del empleado / user
    name: ['', [Validators.required]],
    local_zone: [''],
    city_area: [''],
    state_zone: [''],
    country_zone: [''],
  });

  showPassword = false;

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const values = this.form.getRawValue();
    const payload: RegisterWithUserPayload = {
      username: values.username,
      email: values.email,
      password: values.password,
      user: {
        name: values.name,
        local_zone: values.local_zone || null,
        city_area: values.city_area || null,
        state_zone: values.state_zone || null,
        country_zone: values.country_zone || null,
        rank: null,
        category_id: null,
        victories: 0,
        defeats: 0,
        consecutive_challenges: 0,
        state: 'active',
      },
    };

    this.authFacade.register(payload);
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  ngOnDestroy(): void { this.authFacade.clearError(); }

  get usernameCtrl() { return this.form.get('username')!; }
  get emailCtrl() { return this.form.get('email')!; }
  get passwordCtrl() { return this.form.get('password')!; }
}

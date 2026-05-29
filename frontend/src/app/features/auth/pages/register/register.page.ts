/**
 * @fileoverview Página de Registro de StreetRaceX.
 */
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
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
export class RegisterPage implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  readonly authFacade = inject(AuthFacade);
  readonly routes = APP_ROUTES;

  readonly form: FormGroup = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],

    // Campos del empleado / user
    name: ['', [Validators.required]],
    local_zone: [{ value: null, disabled: true }],
    city_area: [{ value: null, disabled: true }],
    state_zone: [{ value: null, disabled: true }],
    country_zone: [null],
  });

  // Datos de ejemplo para países / estados / ciudades / zonas locales (pocos, para pruebas)
  readonly countries = [
    {
      code: 'CO',
      name: 'Colombia',
      states: [
        {
          name: 'Cundinamarca',
          cities: [
            { name: 'Bogotá', localZones: ['Centro', 'Norte', 'Sur'] },
            { name: 'Soacha', localZones: ['Chicalá', 'Ciudad Latina'] },
          ],
        },
        {
          name: 'Antioquia',
          cities: [
            { name: 'Medellín', localZones: ['El Poblado', 'Laureles'] },
            { name: 'Bello', localZones: ['Centro', 'Niquía'] },
          ],
        },
      ],
    },
    {
      code: 'MX',
      name: 'México',
      states: [
        {
          name: 'Ciudad de México',
          cities: [
            { name: 'Ciudad de México', localZones: ['Centro', 'Sur'] },
          ],
        },
        {
          name: 'Jalisco',
          cities: [
            { name: 'Guadalajara', localZones: ['Centro', 'Zapopan'] },
          ],
        },
      ],
    },
  ];

  showPassword = false;

  private readonly subs: Array<{ unsubscribe(): void }> = [];

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

  ngOnInit(): void {
    const countryCtrl = this.form.get('country_zone')!;
    const stateCtrl = this.form.get('state_zone')!;
    const cityCtrl = this.form.get('city_area')!;

    // Habilitar / deshabilitar controles dependientes según selección
    this.subs.push(
      countryCtrl.valueChanges.subscribe((val) => {
        if (val) {
          stateCtrl.enable({ emitEvent: false });
        } else {
          stateCtrl.disable({ emitEvent: false });
          stateCtrl.setValue(null, { emitEvent: false });
        }
        cityCtrl.disable({ emitEvent: false });
        cityCtrl.setValue(null, { emitEvent: false });
        this.form.get('local_zone')!.disable({ emitEvent: false });
        this.form.get('local_zone')!.setValue(null, { emitEvent: false });
      })
    );

    this.subs.push(
      stateCtrl.valueChanges.subscribe((val) => {
        if (val) {
          cityCtrl.enable({ emitEvent: false });
        } else {
          cityCtrl.disable({ emitEvent: false });
          cityCtrl.setValue(null, { emitEvent: false });
        }
        this.form.get('local_zone')!.disable({ emitEvent: false });
        this.form.get('local_zone')!.setValue(null, { emitEvent: false });
      })
    );

    this.subs.push(
      cityCtrl.valueChanges.subscribe((val) => {
        if (val) {
          this.form.get('local_zone')!.enable({ emitEvent: false });
        } else {
          this.form.get('local_zone')!.disable({ emitEvent: false });
          this.form.get('local_zone')!.setValue(null, { emitEvent: false });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
    this.authFacade.clearError();
  }

  get usernameCtrl() { return this.form.get('username')!; }
  get emailCtrl() { return this.form.get('email')!; }
  get passwordCtrl() { return this.form.get('password')!; }

  get availableStates() {
    const code = this.form.get('country_zone')!.value as string | null;
    return this.countries.find((c) => c.code === code)?.states ?? [];
  }

  get availableCities() {
    const stateName = this.form.get('state_zone')!.value as string | null;
    return this.availableStates.find((s: any) => s.name === stateName)?.cities ?? [];
  }

  get availableLocalZones() {
    const cityName = this.form.get('city_area')!.value as string | null;
    return this.availableCities.find((c: any) => c.name === cityName)?.localZones ?? [];
  }
}

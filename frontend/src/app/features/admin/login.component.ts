import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ApiService, errorMessage } from "../../core/api.service";
@Component({
  selector: "app-login",
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  template: `<main class="login-page">
    <a routerLink="/" class="back-link"
      ><i class="pi pi-arrow-left"></i> Volver al catálogo</a
    >
    <section class="login-card">
      <span class="mark"><i class="pi pi-shop"></i></span
      ><span class="eyebrow">TU COMERCIO, EN TUS MANOS</span>
      <h1>Bienvenido de nuevo</h1>
      <p>Ingresá para administrar tu catálogo.</p>
      <form [formGroup]="form" (ngSubmit)="login()">
        <label
          >Usuario<input
            pInputText
            formControlName="username"
            autocomplete="username"
            maxlength="100" /></label
        ><label
          >Contraseña<input
            pInputText
            type="password"
            formControlName="password"
            autocomplete="current-password"
            maxlength="72"
        /></label>
        @if (error()) {
          <p class="error-banner" role="alert">{{ error() }}</p>
        }
        <p-button
          type="submit"
          label="Ingresar al panel"
          icon="pi pi-arrow-right"
          [loading]="busy()"
          [disabled]="form.invalid"
        />
      </form>
      <p class="privacy-note">
        Acceso exclusivo para administradores del comercio.
      </p>
    </section>
  </main>`,
})
export class LoginComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly form = this.fb.nonNullable.group({
    username: ["", [Validators.required, Validators.maxLength(100)]],
    password: ["", [Validators.required, Validators.maxLength(72)]],
  });
  async login() {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    try {
      const v = this.form.getRawValue();
      await this.api.login(v.username, v.password);
      await this.router.navigateByUrl("/admin");
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
}

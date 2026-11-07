import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageService } from "primeng/api";
import { ApiService, errorMessage } from "../../core/api.service";
import { StoreState } from "../../core/store-state.service";
@Component({
  selector: "app-settings",
  imports: [ReactiveFormsModule, ButtonModule, InputTextModule],
  template: `<main class="admin-content">
    <span class="eyebrow">TU IDENTIDAD, TU FORMA DE VENDER</span>
    <h1>Mi negocio</h1>
    <p class="muted">Los cambios se reflejan en tu catálogo público.</p>
    @if (loading()) {
      <p aria-busy="true">Cargando configuración…</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="save()">
        <section class="form-panel">
          <h2>Identidad del comercio</h2>
          <div class="form-grid">
            <label
              >Nombre comercial<input
                pInputText
                formControlName="name"
                maxlength="120" /></label
            ><label
              >Color principal<input
                type="color"
                formControlName="primaryColor" /></label
            ><label class="full"
              >Descripción<textarea
                formControlName="description"
                maxlength="1000"
                rows="3"
              ></textarea></label
            ><label class="full"
              >Mensaje de bienvenida<input
                pInputText
                formControlName="welcomeMessage"
                maxlength="500"
            /></label>
            @for (kind of imageKinds; track kind) {
              <div class="branding-image">
                <h3>{{ kind === "logo" ? "Logo" : "Banner" }}</h3>
                @if (form.controls[kind].value) {
                  <img [src]="form.controls[kind].value" [alt]="kind" /><button
                    type="button"
                    class="text-button remove"
                    (click)="form.controls[kind].setValue('')"
                  >
                    Quitar
                  </button>
                }
                <label class="upload-label"
                  >Cargar {{ kind
                  }}<input
                    type="file"
                    accept="image/png,image/jpeg"
                    [disabled]="uploading()"
                    (change)="upload($event, kind)"
                /></label>
              </div>
            }
          </div>
        </section>
        <section class="form-panel">
          <h2>Contacto y redes</h2>
          <div class="form-grid">
            <label
              >WhatsApp<input
                pInputText
                formControlName="whatsapp"
                inputmode="numeric"
                maxlength="15"
                placeholder="5491123456789"
              /><small
                >Código de país y número. Solo dígitos, sin +, espacios ni
                guiones.</small
              ></label
            ><label
              >Teléfono<input
                pInputText
                formControlName="phone"
                maxlength="40" /></label
            ><label
              >Email<input
                pInputText
                formControlName="email"
                type="email"
                maxlength="254" /></label
            ><label
              >Dirección<input
                pInputText
                formControlName="address"
                maxlength="300" /></label
            ><label
              >Instagram<input
                pInputText
                formControlName="instagram"
                type="url"
                maxlength="300"
                placeholder="https://www.instagram.com/tucomercio" /></label
            ><label
              >Facebook<input
                pInputText
                formControlName="facebook"
                type="url"
                maxlength="300"
                placeholder="https://www.facebook.com/tucomercio"
            /></label>
          </div>
        </section>
        <section class="form-panel">
          <h2>Condiciones de compra</h2>
          <div class="form-grid">
            <label
              >Moneda<select formControlName="currency">
                @for (currency of currencies; track currency) {
                  <option [value]="currency">{{ currency }}</option>
                }
              </select></label
            ><label
              >Pedido mínimo<input
                type="number"
                formControlName="minimumOrder"
                min="0"
                step="0.01" /></label
            ><label class="check-label full"
              ><input type="checkbox" formControlName="wholesale" /> Modalidad
              mayorista</label
            ><label class="full"
              >Condiciones comerciales<textarea
                formControlName="terms"
                maxlength="4000"
                rows="5"
                placeholder="Medios de pago, entregas, cambios y condiciones de compra"
              ></textarea>
            </label>
          </div>
        </section>
        @if (error()) {
          <p class="error-banner" role="alert">{{ error() }}</p>
        }
        @if (form.touched && form.invalid) {
          <p class="field-error">
            Revisá los campos: nombre obligatorio, WhatsApp de 8 a 15 dígitos,
            email válido, redes con https y pedido mínimo no negativo.
          </p>
        }
        <div class="sticky-save">
          <span>Publicá los cambios cuando estén listos.</span
          ><p-button
            type="submit"
            label="Guardar configuración"
            icon="pi pi-check"
            [loading]="saving()"
            [disabled]="uploading()"
          />
        </div>
      </form>
    }
  </main>`,
})
export class SettingsComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly state = inject(StoreState);
  private readonly toast = inject(MessageService);
  readonly error = signal("");
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly imageKinds = ["logo", "banner"] as const;
  readonly currencies = [
    "ARS",
    "USD",
    "UYU",
    "CLP",
    "BRL",
    "EUR",
    "MXN",
    "COP",
    "PEN",
    "BOB",
    "PYG",
  ];
  readonly form = this.fb.nonNullable.group({
    name: [
      "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120),
      ],
    ],
    description: [""],
    currency: ["ARS"],
    primaryColor: ["#176b52", Validators.pattern(/^#[0-9a-fA-F]{6}$/)],
    whatsapp: ["", Validators.pattern(/^$|^[1-9][0-9]{7,14}$/)],
    minimumOrder: [0, [Validators.required, Validators.min(0)]],
    welcomeMessage: [""],
    terms: [""],
    logo: [""],
    banner: [""],
    address: [""],
    phone: [""],
    email: ["", Validators.email],
    instagram: ["", Validators.pattern(/^$|^https:\/\/\S+$/)],
    facebook: ["", Validators.pattern(/^$|^https:\/\/\S+$/)],
    wholesale: [false],
  });
  constructor() {
    void this.api
      .get("admin/business")
      .then((b) =>
        this.form.patchValue(b as ReturnType<typeof this.form.getRawValue>),
      )
      .catch((e) => this.error.set(errorMessage(e)))
      .finally(() => this.loading.set(false));
  }
  async upload(event: Event, kind: "logo" | "banner") {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set("");
    try {
      const result = await this.api.upload(file);
      this.form.controls[kind].setValue(result.url);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.uploading.set(false);
      input.value = "";
    }
  }
  async save() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.saving() || this.uploading()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      await this.api.write("PUT", "admin/business", this.form.getRawValue());
      await this.state.reload();
      this.toast.add({
        severity: "success",
        summary: "Configuración guardada",
        detail: "Tu catálogo ya muestra los cambios.",
      });
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}

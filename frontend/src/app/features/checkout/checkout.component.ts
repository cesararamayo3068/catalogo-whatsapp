import { Component, computed, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { ApiService, errorMessage } from "../../core/api.service";
import { CartService } from "../../core/cart.service";
import { StoreState } from "../../core/store-state.service";
import { Prepared } from "../../core/models";
@Component({
  selector: "app-checkout",
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  template: `<main class="page-container">
    <a routerLink="/carrito" class="back-link"
      ><i class="pi pi-arrow-left"></i> Volver al carrito</a
    ><span class="eyebrow">SIN REGISTROS. DIRECTO AL COMERCIO.</span>
    <h1>Prepará tu pedido</h1>
    @if (!cart.items().length) {
      <div class="empty-state">
        <h2>Primero agregá productos</h2>
        <a routerLink="/" class="primary-link">Ver el catálogo</a>
      </div>
    } @else {
      <div class="checkout-layout">
        <section class="form-panel">
          <h2>Tus datos de contacto</h2>
          @if (state.business()?.demo) {
            <p>Demo con datos de ejemplo. Usá un nombre y una localidad ficticios.</p>
          } @else {
            <p>El comercio los recibirá cuando confirmes el envío en WhatsApp.</p>
          }
          <form [formGroup]="form" (ngSubmit)="prepare()">
            <div class="form-grid">
              <label
                >Nombre y apellido<input
                  pInputText
                  formControlName="customerName"
                  autocomplete="name"
                  maxlength="120"
                />
                @if (
                  form.controls.customerName.touched &&
                  form.controls.customerName.invalid
                ) {
                  <small class="field-error"
                    >Ingresá tu nombre y apellido.</small
                  >
                }</label
              ><label
                >Localidad<input
                  pInputText
                  formControlName="locality"
                  autocomplete="address-level2"
                  maxlength="150"
                />
                @if (
                  form.controls.locality.touched &&
                  form.controls.locality.invalid
                ) {
                  <small class="field-error">Ingresá tu localidad.</small>
                }</label
              ><label class="full"
                >Teléfono <span class="muted">(opcional)</span
                ><input
                  pInputText
                  formControlName="phone"
                  type="tel"
                  autocomplete="tel"
                  maxlength="40" /></label
              ><label class="full"
                >Observaciones <span class="muted">(opcional)</span
                ><textarea
                  formControlName="notes"
                  rows="4"
                  maxlength="1000"
                  placeholder="Indicaciones o consultas sobre tu pedido"
                ></textarea>
              </label>
            </div>
            @if (error()) {
              <p class="error-banner" role="alert">{{ error() }}</p>
            }
            <p-button
              type="submit"
              label="Revisar y preparar pedido"
              icon="pi pi-check"
              [loading]="busy()"
            />
            <p class="privacy-note">
              <i class="pi pi-lock"></i> Estos datos no se guardan en nuestra
              base de datos.
            </p>
          </form>
        </section>
        <aside class="order-summary">
          <h2>Tu selección</h2>
          @for (item of cart.items(); track item.key) {
            <div>
              <span
                >{{ item.quantity }} × {{ item.name }}
                @if (item.variant) {
                  <small>{{ item.variant }}</small>
                }
              </span>
            </div>
          }
          <div class="total">
            <strong>Total estimado</strong
            ><strong>{{ state.money(cart.total()) }}</strong>
          </div>
          <p>
            El importe definitivo se recalcula con los precios actuales del
            comercio.
          </p>
          @if (!state.business()?.demo && !state.business()?.whatsapp) {
            <p class="notice">
              El comercio necesita configurar su número de WhatsApp antes de
              recibir pedidos.
            </p>
          }
        </aside>
      </div>
      @if (prepared(); as order) {
        <section class="prepared-order" aria-live="polite">
          <div class="section-heading">
            <div>
              <span class="eyebrow">PRECIOS Y DISPONIBILIDAD REVISADOS</span>
              <h2>{{ order.whatsappUrl ? "Revisá antes de abrir WhatsApp" : "Vista previa del mensaje" }}</h2>
            </div>
            <strong>{{ state.money(order.total) }}</strong>
          </div>
          @if (order.total !== cart.total()) {
            <p class="notice">
              El total cambió respecto del carrito. Este es el importe
              actualizado; revisá el detalle antes de continuar.
            </p>
          }
          <pre>{{ order.message }}</pre>
          @if (stale()) {
            <p class="notice">
              Cambiaste tus datos o el carrito. Prepará el pedido nuevamente.
            </p>
          } @else if (expired()) {
            <p class="notice">
              La validación venció. Prepará el pedido nuevamente para actualizar
              los precios.
            </p>
          } @else if (order.whatsappUrl) {
            <a
              class="primary-link whatsapp-button"
              [href]="order.whatsappUrl"
              target="_blank"
              rel="noopener"
              (click)="opened.set(true)"
              ><i class="pi pi-whatsapp"></i> Abrir WhatsApp para enviar</a
            >
          }
          @if (order.whatsappUrl) {
            <p>
              Se abrirá WhatsApp con el mensaje preparado.
              <strong>Vos tenés que confirmar el envío.</strong>
            </p>
          } @else {
            <p>En esta demo podés revisar el pedido de ejemplo. El envío está deshabilitado.</p>
          }
          @if (opened()) {
            <p class="notice">
              Se solicitó abrir WhatsApp. El carrito se conserva para que puedas
              volver a consultarlo.
            </p>
          }
        </section>
      }
    }
  </main>`,
})
export class CheckoutComponent {
  readonly cart = inject(CartService);
  readonly state = inject(StoreState);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.nonNullable.group({
    customerName: [
      "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(120),
      ],
    ],
    locality: [
      "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(150),
      ],
    ],
    phone: ["", Validators.maxLength(40)],
    notes: ["", Validators.maxLength(1000)],
  });
  readonly prepared = signal<Prepared | null>(null);
  readonly busy = signal(false);
  readonly error = signal("");
  readonly opened = signal(false);
  readonly expired = signal(false);
  private signature = "";
  private timer: ReturnType<typeof setTimeout> | undefined;
  readonly revision = signal(0);
  readonly stale = computed(() => {
    this.revision();
    return !!this.prepared() && this.signature !== this.currentSignature();
  });
  constructor() {
    this.form.valueChanges.subscribe(() => this.revision.update((n) => n + 1));
  }
  currentSignature() {
    return JSON.stringify({
      form: this.form.getRawValue(),
      items: this.cart.items(),
    });
  }
  async prepare() {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set("");
    this.prepared.set(null);
    this.opened.set(false);
    try {
      const signature = this.currentSignature();
      const order = await this.api.prepare({
        ...this.form.getRawValue(),
        items: this.cart.items().map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      });
      this.signature = signature;
      this.prepared.set(order);
      this.expired.set(false);
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.expired.set(true), 5 * 60 * 1000);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.busy.set(false);
    }
  }
  ngOnDestroy() {
    clearTimeout(this.timer);
  }
}

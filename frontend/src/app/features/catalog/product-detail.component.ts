import { Component, computed, inject, signal } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { FormsModule } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { MessageService } from "primeng/api";
import { ApiService, errorMessage } from "../../core/api.service";
import { CartService } from "../../core/cart.service";
import { StoreState } from "../../core/store-state.service";
import { effectivePrice, Product } from "../../core/models";
@Component({
  selector: "app-product-detail",
  imports: [FormsModule, RouterLink, ButtonModule],
  template: `<main class="page-container">
    <a routerLink="/" class="back-link"
      ><i class="pi pi-arrow-left"></i> Volver al catálogo</a
    >
    @if (error()) {
      <div class="empty-state" role="alert">
        <h2>No pudimos abrir el producto</h2>
        <p>{{ error() }}</p>
      </div>
    } @else if (!product()) {
      <div class="empty-state" aria-busy="true">Cargando producto…</div>
    } @else {
      <div class="product-detail">
        <section class="gallery">
          <div class="detail-image">
            @if (product()!.images.length) {
              <img
                [src]="product()!.images[imageIndex()]"
                [alt]="product()!.name"
              />
            } @else {
              <i class="pi pi-image"></i>
            }
          </div>
          @if (product()!.images.length > 1) {
            <div class="thumbnails">
              @for (image of product()!.images; track image; let i = $index) {
                <button
                  [class.active]="imageIndex() === i"
                  (click)="imageIndex.set(i)"
                  [attr.aria-label]="'Ver imagen ' + (i + 1)"
                >
                  <img [src]="image" alt="" />
                </button>
              }
            </div>
          }
        </section>
        <section class="detail-copy">
          <span class="eyebrow">{{ product()!.categoryName }}</span>
          <h1>{{ product()!.name }}</h1>
          @if (product()!.sku) {
            <span class="muted">SKU {{ product()!.sku }}</span>
          }
          <div class="detail-price">
            @if (
              product()!.promotionalPrice !== null && selected()?.price === null
            ) {
              <del>{{ state.money(product()!.price) }}</del>
            }
            <strong>{{ state.money(price()) }}</strong>
          </div>
          <span class="availability" [class.off]="!canBuy()"
            ><span></span
            >{{
              canBuy() ? "Disponible para consultar" : "Sin disponibilidad"
            }}</span
          >
          <p class="description">{{ product()!.description }}</p>
          @if (product()!.variants.length) {
            <fieldset class="variant-options">
              <legend>Elegí una opción</legend>
              @for (v of product()!.variants; track v.id) {
                <button
                  [class.active]="variantId() === v.id"
                  [disabled]="!v.available"
                  (click)="variantId.set(v.id)"
                >
                  {{ v.label }}
                  @if (!v.available) {
                    <small>Sin disponibilidad</small>
                  }
                </button>
              }
            </fieldset>
          }
          <div class="buy-row">
            <label
              >Cantidad<input
                type="number"
                [min]="product()!.minimumQuantity"
                max="9999"
                step="1"
                [(ngModel)]="quantity"
                aria-label="Cantidad" /></label
            ><p-button
              label="Agregar al carrito"
              icon="pi pi-shopping-bag"
              [disabled]="!canBuy()"
              (onClick)="add()"
            />
          </div>
          <small class="muted"
            >Compra mínima: {{ product()!.minimumQuantity }} unidad(es). El
            precio y la disponibilidad se revisan al preparar el pedido.</small
          >
          @if (localError()) {
            <p class="error-banner" role="alert">{{ localError() }}</p>
          }
          <a routerLink="/carrito" class="subtle-link"
            >Ver mi carrito <i class="pi pi-arrow-right"></i
          ></a>
          @if (attributeEntries().length) {
            <h3>Detalles del producto</h3>
            <dl class="attribute-list">
              @for (entry of attributeEntries(); track entry[0]) {
                <dt>{{ entry[0] }}</dt>
                <dd>{{ entry[1] }}</dd>
              }
            </dl>
          }
        </section>
      </div>
    }
  </main>`,
})
export class ProductDetailComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(CartService);
  private readonly toast = inject(MessageService);
  readonly state = inject(StoreState);
  readonly product = signal<Product | null>(null);
  readonly error = signal("");
  readonly localError = signal("");
  readonly variantId = signal<string | null>(null);
  readonly imageIndex = signal(0);
  quantity = 1;
  readonly selected = computed(() =>
    this.product()?.variants.find((v) => v.id === this.variantId()),
  );
  readonly price = computed(() =>
    this.product() ? effectivePrice(this.product()!, this.selected()) : 0,
  );
  readonly canBuy = computed(
    () =>
      !!this.product()?.available &&
      (!this.product()!.variants.length || !!this.selected()?.available),
  );
  readonly attributeEntries = computed(() =>
    Object.entries({
      ...this.product()?.attributes,
      ...this.selected()?.attributes,
    }),
  );
  constructor() {
    this.route.paramMap.subscribe((params) => {
      void this.load(params.get("id") || "");
    });
  }
  async load(id: string) {
    this.product.set(null);
    this.error.set("");
    try {
      const p = await this.api.product(id);
      this.product.set(p);
      this.quantity = p.minimumQuantity;
      this.variantId.set(p.variants.find((v) => v.available)?.id || null);
      this.imageIndex.set(0);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  add() {
    this.localError.set("");
    try {
      this.cart.add(this.product()!, this.quantity, this.selected());
      this.toast.add({
        severity: "success",
        summary: "Agregado al carrito",
        detail: this.product()!.name,
        life: 2500,
      });
    } catch (e) {
      this.localError.set((e as Error).message);
    }
  }
}

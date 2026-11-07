import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { CartService, CartItem } from "../../core/cart.service";
import { StoreState } from "../../core/store-state.service";
import { cents } from "../../core/models";
@Component({
  selector: "app-cart",
  imports: [RouterLink, ButtonModule],
  template: `<main class="page-container">
    <a routerLink="/" class="back-link"
      ><i class="pi pi-arrow-left"></i> Seguir explorando</a
    >
    <div class="section-heading">
      <div>
        <span class="eyebrow">UN PASO MÁS CERCA</span>
        <h1>
          Mi carrito <span class="count-pill">{{ cart.count() }}</span>
        </h1>
      </div>
    </div>
    @if (!cart.items().length) {
      <div class="empty-state">
        <i class="pi pi-shopping-bag"></i>
        <h2>Tu carrito está esperando</h2>
        <p>Explorá el catálogo y sumá tus favoritos.</p>
        <a routerLink="/" class="primary-link"
          >Ver productos <i class="pi pi-arrow-right"></i
        ></a>
      </div>
    } @else {
      <div class="checkout-layout">
        <section class="cart-items">
          @for (item of cart.items(); track item.key) {
            <article class="cart-item">
              @if (item.image) {
                <a [routerLink]="['/producto', item.productId]"
                  ><img [src]="item.image" [alt]="item.name"
                /></a>
              }
              <div class="cart-item-info">
                <a [routerLink]="['/producto', item.productId]"
                  ><h3>{{ item.name }}</h3></a
                >
                @if (item.variant) {
                  <p>{{ item.variant }}</p>
                }
                <span>{{ state.money(item.unitPrice) }} por unidad</span
                ><button
                  class="text-button remove"
                  (click)="cart.remove(item.key)"
                >
                  Quitar
                </button>
              </div>
              <div class="cart-item-quantity">
                <label class="sr-only" [for]="item.key"
                  >Cantidad de {{ item.name }}</label
                ><input
                  [id]="item.key"
                  type="number"
                  [value]="item.quantity"
                  [min]="item.minimum"
                  max="9999"
                  step="1"
                  (change)="update(item, $event)"
                /><strong>{{ state.money(subtotal(item)) }}</strong>
              </div>
            </article>
          }
          @if (error()) {
            <p class="error-banner" role="alert">{{ error() }}</p>
          }
          @if (cart.storageWarning()) {
            <p class="notice">
              El navegador no permite guardar el carrito. Se conservará mientras
              esta página esté abierta.
            </p>
          }
        </section>
        <aside class="order-summary">
          <h2>Resumen del pedido</h2>
          <div>
            <span>{{ cart.count() }} artículos</span
            ><span>{{ state.money(cart.total()) }}</span>
          </div>
          <div class="total">
            <strong>Total estimado</strong
            ><strong>{{ state.money(cart.total()) }}</strong>
          </div>
          @if (state.business()?.minimumOrder) {
            <p>
              Pedido mínimo: {{ state.money(state.business()!.minimumOrder) }}
            </p>
          }
          <a routerLink="/checkout" class="primary-link"
            >Continuar <i class="pi pi-arrow-right"></i
          ></a>
          <p class="summary-note">
            <i class="pi pi-shield"></i> Revisamos precios y disponibilidad
            antes de preparar tu mensaje. Pago y entrega se acuerdan con el
            comercio.
          </p>
        </aside>
      </div>
    }
  </main>`,
})
export class CartComponent {
  readonly cart = inject(CartService);
  readonly state = inject(StoreState);
  readonly error = signal("");
  subtotal(item: CartItem) {
    return (cents(item.unitPrice) * item.quantity) / 100;
  }
  update(item: CartItem, event: Event) {
    const field = event.target as HTMLInputElement;
    if (!this.cart.update(item.key, Number(field.value))) {
      this.error.set(
        `La cantidad debe ser entera, entre ${item.minimum} y 9999.`,
      );
      field.value = String(item.quantity);
    } else this.error.set("");
  }
}

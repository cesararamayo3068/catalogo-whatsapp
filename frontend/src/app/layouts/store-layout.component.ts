import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { StoreState } from "../core/store-state.service";
import { CartService } from "../core/cart.service";
@Component({
  selector: "app-store-layout",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: ` <div
    class="store"
    [style.--brand]="state.business()?.primaryColor || '#176b52'"
  >
    <div class="announcement">
      Elegí online · Coordiná pago y entrega directamente con el comercio
    </div>
    <header class="store-header">
      <a routerLink="/" class="identity">
        @if (state.business()?.logo) {
          <img
            class="brand-logo"
            [src]="state.business()!.logo"
            alt="Logo del comercio"
          />
        } @else {
          <span class="mark"
            ><i class="pi pi-shop" aria-hidden="true"></i
          ></span>
        }
        <span>{{ state.business()?.name || "Catálogo digital" }}</span></a
      >
      <nav aria-label="Navegación principal">
        <a
          routerLink="/"
          [routerLinkActiveOptions]="{ exact: true }"
          routerLinkActive="selected"
          >Catálogo</a
        ><a
          routerLink="/carrito"
          class="cart-link"
          [attr.aria-label]="'Mi carrito: ' + cart.count() + ' artículos'"
          ><i class="pi pi-shopping-bag" aria-hidden="true"></i
          ><span>Mi carrito</span><b>{{ cart.count() }}</b></a
        >
      </nav>
    </header>
    <router-outlet />
    <footer class="store-footer">
      <div>
        <a routerLink="/" class="footer-brand">{{
          state.business()?.name || "Catálogo digital"
        }}</a>
        <p>{{ state.business()?.description }}</p>
      </div>
      <div>
        <h3>Hablemos</h3>
        @if (state.business()?.address) {
          <p>{{ state.business()!.address }}</p>
        }
        @if (state.business()?.phone) {
          <p>{{ state.business()!.phone }}</p>
        }
        @if (state.business()?.email) {
          <a [href]="'mailto:' + state.business()!.email">{{
            state.business()!.email
          }}</a>
        }
        @if (state.business()?.whatsapp) {
          <a
            [href]="'https://wa.me/' + state.business()!.whatsapp"
            target="_blank"
            rel="noopener"
            >WhatsApp <i class="pi pi-arrow-up-right" aria-hidden="true"></i
          ></a>
        }
      </div>
      <div>
        <h3>Encontranos</h3>
        @if (state.business()?.instagram) {
          <a [href]="state.business()!.instagram" target="_blank" rel="noopener"
            >Instagram</a
          >
        }
        @if (state.business()?.facebook) {
          <a [href]="state.business()!.facebook" target="_blank" rel="noopener"
            >Facebook</a
          >
        }
        <a routerLink="/admin">Administrar comercio</a>
      </div>
    </footer>
    <div class="footer-bottom">
      <span>Compras simples. Contacto cercano.</span
      ><span>El pago y la entrega se acuerdan con el comercio.</span>
    </div>
  </div>`,
})
export class StoreLayoutComponent {
  readonly state = inject(StoreState);
  readonly cart = inject(CartService);
}

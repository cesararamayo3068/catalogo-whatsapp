import { Component, inject, input } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { MessageService } from "primeng/api";
import { Product } from "../core/models";
import { StoreState } from "../core/store-state.service";
import { CartService } from "../core/cart.service";
@Component({
  selector: "app-product-card",
  imports: [RouterLink, ButtonModule],
  template: `<article class="product-card">
    <a
      class="product-image"
      [routerLink]="['/producto', product().id]"
      [attr.aria-label]="'Ver ' + product().name"
    >
      @if (product().images.length) {
        <img
          [src]="product().images[0]"
          [alt]="product().name"
          loading="lazy"
        />
      } @else {
        <i class="pi pi-image" aria-hidden="true"></i>
      }
      @if (product().promotionalPrice !== null) {
        <span class="sale-badge">{{ discount() }}% OFF</span>
      }
      @if (!product().available) {
        <span class="unavailable-badge">Sin disponibilidad</span>
      }
    </a>
    <div class="product-info">
      <span class="product-category">{{ product().categoryName }}</span
      ><a [routerLink]="['/producto', product().id]" class="product-name">{{
        product().name
      }}</a>
      <div class="product-bottom">
        <div>
          @if (product().promotionalPrice !== null) {
            <del>{{ state.money(product().price) }}</del>
          }
          <strong>{{
            state.money(product().promotionalPrice ?? product().price)
          }}</strong>
          @if (product().minimumQuantity > 1) {
            <small>Mín. {{ product().minimumQuantity }} unidades</small>
          }
        </div>
        @if (product().variants.length) {
          <a
            class="icon-action"
            [routerLink]="['/producto', product().id]"
            [attr.aria-label]="'Elegir ' + product().name"
            ><i class="pi pi-arrow-up-right" aria-hidden="true"></i
          ></a>
        } @else {
          <button
            class="icon-action"
            [disabled]="!product().available"
            (click)="add()"
            [attr.aria-label]="'Agregar ' + product().name + ' al carrito'"
          >
            <i class="pi pi-plus" aria-hidden="true"></i>
          </button>
        }
      </div>
    </div>
  </article>`,
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly state = inject(StoreState);
  private readonly cart = inject(CartService);
  private readonly toast = inject(MessageService);
  discount() {
    return Math.round(
      (1 -
        (this.product().promotionalPrice ?? this.product().price) /
          this.product().price) *
        100,
    );
  }
  add() {
    try {
      this.cart.add(this.product(), this.product().minimumQuantity);
      this.toast.add({
        severity: "success",
        summary: "Agregado al carrito",
        detail: this.product().name,
        life: 2400,
      });
    } catch (e) {
      this.toast.add({ severity: "error", summary: (e as Error).message });
    }
  }
}

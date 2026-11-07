import { Component, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ApiService, errorMessage } from "../../core/api.service";
import { StoreState } from "../../core/store-state.service";
@Component({
  selector: "app-dashboard",
  imports: [RouterLink],
  template: `<main class="admin-content">
    <span class="eyebrow">TODO BAJO CONTROL</span>
    <h1>El pulso de tu catálogo</h1>
    <p class="muted">Administrá tu tienda desde un solo lugar.</p>
    @if (error()) {
      <p class="error-banner" role="alert">{{ error() }}</p>
    }
    @if (stats()) {
      <div class="stat-grid">
        @for (card of cards; track card.key) {
          <div class="stat-card">
            <i [class]="card.icon"></i><span>{{ card.label }}</span
            ><strong>{{ stats()![card.key] }}</strong>
          </div>
        }
      </div>
    } @else if (!error()) {
      <p aria-busy="true">Cargando resumen…</p>
    }
    <div class="admin-actions">
      <a routerLink="/admin/productos/nuevo" class="action-card"
        ><i class="pi pi-plus"></i>
        <h2>Sumá un producto</h2>
        <p>Agregá fotos, precio y opciones a tu catálogo.</p></a
      ><a routerLink="/admin/configuracion" class="action-card"
        ><i class="pi pi-sliders-h"></i>
        <h2>Dale tu identidad</h2>
        <p>Configurá tu marca, WhatsApp y condiciones.</p></a
      >
    </div>
    @if (!state.business()?.whatsapp) {
      <div class="notice">
        <strong>Falta tu número de WhatsApp.</strong> Configuralo en
        <a routerLink="/admin/configuracion">Mi negocio</a> para habilitar la
        preparación de pedidos.
      </div>
    }
    <p class="muted">
      Este resumen muestra el estado del catálogo. Los pagos y ventas se
      concretan fuera de la plataforma.
    </p>
  </main>`,
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  readonly state = inject(StoreState);
  readonly stats = signal<Record<string, number> | null>(null);
  readonly error = signal("");
  readonly cards = [
    { key: "products", label: "Productos", icon: "pi pi-box" },
    { key: "categories", label: "Categorías", icon: "pi pi-th-large" },
    { key: "active", label: "Activos", icon: "pi pi-check-circle" },
    { key: "inactive", label: "Inactivos", icon: "pi pi-pause-circle" },
    {
      key: "unavailable",
      label: "Sin disponibilidad",
      icon: "pi pi-exclamation-circle",
    },
  ];
  constructor() {
    void this.api
      .get<Record<string, number>>("admin/dashboard")
      .then((v) => this.stats.set(v))
      .catch((e) => this.error.set(errorMessage(e)));
  }
}

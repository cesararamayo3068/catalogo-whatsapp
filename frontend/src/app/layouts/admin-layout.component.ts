import { Component, inject, signal } from "@angular/core";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { ApiService, errorMessage } from "../core/api.service";
import { StoreState } from "../core/store-state.service";
@Component({
  selector: "app-admin-layout",
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `<div class="admin-layout">
    <aside class="admin-sidebar">
      <a routerLink="/admin" class="identity"
        ><span class="mark"><i class="pi pi-shop"></i></span
        ><span>Mi comercio</span></a
      ><span class="sidebar-caption">ADMINISTRACIÓN</span>
      <nav aria-label="Administración">
        <a
          routerLink="/admin"
          [routerLinkActiveOptions]="{ exact: true }"
          routerLinkActive="active"
          ><i class="pi pi-chart-bar"></i> Resumen</a
        ><a routerLink="/admin/productos" routerLinkActive="active"
          ><i class="pi pi-box"></i> Productos</a
        ><a routerLink="/admin/categorias" routerLinkActive="active"
          ><i class="pi pi-th-large"></i> Categorías</a
        ><a routerLink="/admin/configuracion" routerLinkActive="active"
          ><i class="pi pi-cog"></i> Mi negocio</a
        >
      </nav>
      <div class="sidebar-bottom">
        <a routerLink="/"
          ><i class="pi pi-external-link"></i> Ver catálogo público</a
        ><button (click)="logout()">
          <i class="pi pi-sign-out"></i> Cerrar sesión
        </button>
      </div>
    </aside>
    <div class="admin-main">
      <div class="admin-topbar">
        <span>{{ state.business()?.name || "Mi comercio" }}</span
        ><span><i class="pi pi-user"></i> {{ api.username() }}</span>
      </div>
      @if (error()) {
        <p class="error-banner" role="alert">{{ error() }}</p>
      }
      <router-outlet />
    </div>
  </div>`,
})
export class AdminLayoutComponent {
  readonly api = inject(ApiService);
  readonly state = inject(StoreState);
  private readonly router = inject(Router);
  readonly error = signal("");
  async logout() {
    try {
      await this.api.logout();
      await this.router.navigateByUrl("/ingresar");
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
}

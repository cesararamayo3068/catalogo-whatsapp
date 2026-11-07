import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { TableModule } from "primeng/table";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageService } from "primeng/api";
import { ApiService, errorMessage } from "../../core/api.service";
import { StoreState } from "../../core/store-state.service";
import { Product, ProductPage } from "../../core/models";
@Component({
  selector: "app-admin-products",
  imports: [
    FormsModule,
    RouterLink,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
  ],
  template: `<main class="admin-content">
    <div class="section-heading">
      <div>
        <span class="eyebrow">TU CATÁLOGO</span>
        <h1>Productos</h1>
      </div>
      <a routerLink="/admin/productos/nuevo" class="primary-link"
        ><i class="pi pi-plus"></i> Nuevo producto</a
      >
    </div>
    <form
      class="search-field admin-search"
      (submit)="$event.preventDefault(); load(0)"
    >
      <i class="pi pi-search"></i
      ><input
        pInputText
        [(ngModel)]="query"
        name="query"
        maxlength="100"
        placeholder="Buscar por nombre o SKU"
        aria-label="Buscar productos"
      /><button type="submit" aria-label="Buscar">
        <i class="pi pi-arrow-right"></i>
      </button>
    </form>
    @if (error()) {
      <p class="error-banner" role="alert">{{ error() }}</p>
    }
    <p-table
      [value]="result()?.items || []"
      [loading]="loading()"
      [tableStyle]="{ 'min-width': '650px' }"
      ><ng-template #header
        ><tr>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Precio</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr></ng-template
      ><ng-template #body let-p
        ><tr>
          <td>
            <div class="table-product">
              @if (p.images.length) {
                <img [src]="p.images[0]" alt="" />
              }
              <div>
                <strong>{{ p.name }}</strong
                ><small>{{ p.sku || "Sin SKU" }}</small>
              </div>
            </div>
          </td>
          <td>{{ p.categoryName }}</td>
          <td>{{ state.money(p.promotionalPrice ?? p.price) }}</td>
          <td>
            <span class="status-pill" [class.off]="!p.active">{{
              p.active ? "Activo" : "Inactivo"
            }}</span>
            @if (!p.available) {
              <small>Sin disponibilidad</small>
            }
          </td>
          <td>
            <div class="table-actions">
              <a [routerLink]="['/admin/productos', p.id]" class="text-button"
                >Editar</a
              ><button class="text-button" (click)="toggle(p)">
                {{ p.active ? "Desactivar" : "Activar" }}</button
              ><button class="text-button remove" (click)="deleting = p">
                Eliminar
              </button>
            </div>
          </td>
        </tr></ng-template
      ><ng-template #emptymessage
        ><tr>
          <td colspan="5">
            <div class="empty-state">
              <h3>No hay productos para mostrar</h3>
              <p>Creá el primero o modificá tu búsqueda.</p>
            </div>
          </td>
        </tr></ng-template
      ></p-table
    >
    <div class="pagination">
      <span>{{ result()?.totalElements || 0 }} productos</span
      ><p-button
        label="Anterior"
        [outlined]="true"
        [disabled]="!result() || result()!.page === 0 || loading()"
        (onClick)="load(result()!.page - 1)"
      /><p-button
        label="Siguiente"
        [outlined]="true"
        [disabled]="
          !result() || result()!.page + 1 >= result()!.totalPages || loading()
        "
        (onClick)="load(result()!.page + 1)"
      />
    </div>
    <p-dialog
      header="Eliminar producto"
      [visible]="!!deleting"
      (visibleChange)="!$event && (deleting = null)"
      [modal]="true"
      [style]="{ width: '440px', 'max-width': '94vw' }"
      ><p>
        ¿Querés eliminar <strong>{{ deleting?.name }}</strong
        >? Se quitará definitivamente del catálogo. También podés desactivarlo
        para conservarlo.
      </p>
      <div class="dialog-actions">
        <p-button
          label="Cancelar"
          [text]="true"
          (onClick)="deleting = null"
        /><p-button
          label="Eliminar"
          severity="danger"
          [loading]="saving()"
          (onClick)="remove()"
        /></div
    ></p-dialog>
  </main>`,
})
export class AdminProductsComponent {
  private readonly api = inject(ApiService);
  readonly state = inject(StoreState);
  private readonly toast = inject(MessageService);
  readonly result = signal<ProductPage | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal("");
  query = "";
  deleting: Product | null = null;
  constructor() {
    void this.load(0);
  }
  async load(page: number) {
    this.loading.set(true);
    this.error.set("");
    try {
      this.result.set(
        await this.api.products({ query: this.query, page, size: 15 }, true),
      );
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  async toggle(p: Product) {
    try {
      await this.api.write("PUT", "admin/products/" + p.id, {
        ...p,
        active: !p.active,
      });
      this.toast.add({ severity: "success", summary: "Estado actualizado" });
      await this.load(this.result()?.page || 0);
    } catch (e) {
      this.error.set(errorMessage(e));
    }
  }
  async remove() {
    if (!this.deleting || this.saving()) return;
    this.saving.set(true);
    try {
      await this.api.write("DELETE", "admin/products/" + this.deleting.id);
      this.deleting = null;
      this.toast.add({ severity: "success", summary: "Producto eliminado" });
      await this.load(0);
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
}

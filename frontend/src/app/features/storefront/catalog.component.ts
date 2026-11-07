import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { ButtonModule } from "primeng/button";
import { SelectModule } from "primeng/select";
import { InputTextModule } from "primeng/inputtext";
import { ApiService, errorMessage } from "../../core/api.service";
import { StoreState } from "../../core/store-state.service";
import { Category, ProductPage } from "../../core/models";
import { ProductCardComponent } from "../../shared/product-card.component";
@Component({
  selector: "app-catalog",
  imports: [
    FormsModule,
    RouterLink,
    ButtonModule,
    SelectModule,
    InputTextModule,
    ProductCardComponent,
  ],
  template: `<main class="catalog-page">
    <section class="hero">
      <div class="hero-copy">
        <span class="eyebrow">ENCONTRÁ TUS PRÓXIMOS FAVORITOS</span>
        <h1>
          {{
            state.business()?.welcomeMessage ||
              "Lo que necesitás, a un mensaje."
          }}
        </h1>
        <p>{{ state.business()?.description }}</p>
        <a class="primary-link" href="#catalogo"
          >Explorar el catálogo
          <i class="pi pi-arrow-down" aria-hidden="true"></i></a
        ><span class="hero-note"
          ><i class="pi pi-whatsapp" aria-hidden="true"></i> Elegís acá. Lo
          coordinamos por WhatsApp.</span
        >
      </div>
      <div class="hero-art">
        @if (state.business()?.banner) {
          <img [src]="state.business()!.banner" alt="Novedades del comercio" />
        } @else {
          <div class="hero-circle"></div>
          <img
            class="hero-bottle"
            src="/assets/products/bottle.svg"
            alt="Botella térmica de ejemplo"
          /><img
            class="hero-notebook"
            src="/assets/products/notebook.svg"
            alt="Cuaderno de ejemplo"
          /><span class="hero-sticker"
            >Pequeños hallazgos.<br />Grandes favoritos.</span
          >
        }
      </div>
    </section>
    <div class="service-strip">
      <span
        ><i class="pi pi-th-large" aria-hidden="true"></i> Todo en un solo
        lugar</span
      ><span
        ><i class="pi pi-comments" aria-hidden="true"></i> Atención de persona a
        persona</span
      ><span
        ><i class="pi pi-lock" aria-hidden="true"></i> Sin pagos online ni
        registros</span
      >
    </div>
    <section id="catalogo" class="catalog-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">MIRÁ, ELEGÍ Y CONSULTANOS</span>
          <h2>
            Nuestro catálogo<span class="count-pill">{{
              result()?.totalElements || 0
            }}</span>
          </h2>
        </div>
        <a routerLink="/carrito" class="subtle-link"
          >Ver mi carrito <i class="pi pi-arrow-right" aria-hidden="true"></i
        ></a>
      </div>
      <div class="category-tabs" aria-label="Filtrar por categoría">
        <button [class.active]="category === null" (click)="setCategory(null)">
          Todos los productos
        </button>
        @for (c of categories(); track c.id) {
          <button
            [class.active]="category === c.id"
            (click)="setCategory(c.id)"
          >
            {{ c.name }}
          </button>
        }
      </div>
      <div class="catalog-toolbar">
        <form class="search-field" (submit)="$event.preventDefault(); load(0)">
          <i class="pi pi-search" aria-hidden="true"></i
          ><input
            pInputText
            type="search"
            name="query"
            [(ngModel)]="query"
            placeholder="¿Qué estás buscando?"
            maxlength="100"
            aria-label="Buscar productos"
          /><button type="submit" aria-label="Buscar">
            <i class="pi pi-arrow-right" aria-hidden="true"></i>
          </button>
        </form>
        <div class="toolbar-options">
          <label class="check-label"
            ><input type="checkbox" [(ngModel)]="featured" (change)="load(0)" />
            Destacados</label
          ><label class="check-label"
            ><input
              type="checkbox"
              [(ngModel)]="available"
              (change)="load(0)"
            />
            Disponibles</label
          ><p-select
            [options]="sortOptions"
            optionLabel="label"
            optionValue="value"
            [(ngModel)]="sort"
            (onChange)="load(0)"
            ariaLabel="Ordenar productos"
          />
        </div>
      </div>
      @if (error()) {
        <div class="empty-state" role="alert">
          <i class="pi pi-wifi"></i>
          <h3>No pudimos cargar el catálogo</h3>
          <p>{{ error() }}</p>
          <p-button label="Volver a intentar" (onClick)="load(0)" />
        </div>
      } @else if (loading()) {
        <div
          class="product-grid"
          aria-label="Cargando productos"
          aria-busy="true"
        >
          @for (i of [1, 2, 3, 4]; track i) {
            <div class="skeleton-card"></div>
          }
        </div>
      } @else if (result()?.items?.length) {
        <div class="product-grid">
          @for (product of result()!.items; track product.id) {
            <app-product-card [product]="product" />
          }
        </div>
        <div class="pagination">
          <span
            >{{ result()!.totalElements }} productos · Página
            {{ result()!.page + 1 }} de {{ result()!.totalPages }}</span
          >
          @if (result()!.totalPages > 1) {
            <p-button
              label="Anterior"
              [outlined]="true"
              [disabled]="result()!.page === 0"
              (onClick)="load(result()!.page - 1)"
            /><p-button
              label="Siguiente"
              [outlined]="true"
              [disabled]="result()!.page + 1 >= result()!.totalPages"
              (onClick)="load(result()!.page + 1)"
            />
          }
        </div>
      } @else {
        <div class="empty-state">
          <i class="pi pi-search" aria-hidden="true"></i>
          <h3>No encontramos productos</h3>
          <p>Probá con otra búsqueda o categoría.</p>
          <p-button
            label="Limpiar filtros"
            [outlined]="true"
            (onClick)="reset()"
          />
        </div>
      }
    </section>
    <section class="how-it-works">
      <div>
        <span class="eyebrow">ASÍ DE SIMPLE</span>
        <h2>Del catálogo a una conversación.</h2>
      </div>
      <div>
        <b>01</b>
        <h3>Encontrá lo que te gusta</h3>
        <p>Explorá productos y elegí sus opciones.</p>
      </div>
      <div>
        <b>02</b>
        <h3>Armá tu carrito</h3>
        <p>Revisá los productos y cantidades.</p>
      </div>
      <div>
        <b>03</b>
        <h3>Hablemos por WhatsApp</h3>
        <p>Enviá tu consulta y coordiná con el comercio.</p>
      </div>
    </section>
    @if (state.business()?.terms) {
      <details class="commercial-terms">
        <summary>Condiciones comerciales</summary>
        <p>{{ state.business()!.terms }}</p>
      </details>
    }
  </main>`,
})
export class CatalogComponent {
  private readonly api = inject(ApiService);
  readonly state = inject(StoreState);
  readonly categories = signal<Category[]>([]);
  readonly result = signal<ProductPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal("");
  query = "";
  category: number | null = null;
  sort = "newest";
  featured = false;
  available = false;
  private generation = 0;
  readonly sortOptions = [
    { label: "Más recientes", value: "newest" },
    { label: "Menor precio", value: "price-asc" },
    { label: "Mayor precio", value: "price-desc" },
    { label: "Nombre: A a Z", value: "name" },
  ];
  constructor() {
    void this.api
      .categories()
      .then((c) => this.categories.set(c))
      .catch(() => {});
    void this.load(0);
  }
  setCategory(id: number | null) {
    this.category = id;
    void this.load(0);
  }
  reset() {
    this.query = "";
    this.category = null;
    this.featured = false;
    this.available = false;
    this.sort = "newest";
    void this.load(0);
  }
  async load(page: number) {
    const gen = ++this.generation;
    this.loading.set(true);
    this.error.set("");
    try {
      const filters: Record<string, string | number | boolean> = {
        query: this.query,
        sort: this.sort,
        page,
        size: 12,
      };
      if (this.category !== null) filters["category"] = this.category;
      if (this.featured) filters["featured"] = true;
      if (this.available) filters["available"] = true;
      const result = await this.api.products(filters);
      if (gen === this.generation) this.result.set(result);
    } catch (e) {
      if (gen === this.generation) this.error.set(errorMessage(e));
    } finally {
      if (gen === this.generation) this.loading.set(false);
    }
  }
}

import { Component, inject, signal } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageService } from "primeng/api";
import { ApiService, errorMessage } from "../../core/api.service";
import { Category, Product, Variant } from "../../core/models";
@Component({
  selector: "app-product-editor",
  imports: [ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule],
  template: `<main class="admin-content">
    <a routerLink="/admin/productos" class="back-link"
      ><i class="pi pi-arrow-left"></i> Productos</a
    >
    <h1>{{ original ? "Editar producto" : "Nuevo producto" }}</h1>
    @if (loading()) {
      <p aria-busy="true">Cargando datos…</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="save()">
        <div class="editor-layout">
          <div>
            <section class="form-panel">
              <h2>Información del producto</h2>
              <div class="form-grid">
                <label class="full"
                  >Nombre<input
                    pInputText
                    formControlName="name"
                    maxlength="180" /></label
                ><label
                  >SKU <span class="muted">(opcional)</span
                  ><input
                    pInputText
                    formControlName="sku"
                    maxlength="100" /></label
                ><label
                  >Categoría<select formControlName="categoryId">
                    <option [ngValue]="null">Seleccionar categoría</option>
                    @for (c of categories(); track c.id) {
                      <option [ngValue]="c.id">
                        {{ c.name }}{{ c.active ? "" : " (inactiva)" }}
                      </option>
                    }
                  </select></label
                ><label class="full"
                  >Descripción<textarea
                    formControlName="description"
                    rows="4"
                    maxlength="6000"
                  ></textarea></label
                ><label
                  >Precio<input
                    type="number"
                    formControlName="price"
                    min="0"
                    step="0.01"
                    max="999999999999" /></label
                ><label
                  >Precio promocional <span class="muted">(opcional)</span
                  ><input
                    type="number"
                    formControlName="promotionalPrice"
                    min="0"
                    step="0.01" /></label
                ><label
                  >Cantidad mínima<input
                    type="number"
                    formControlName="minimumQuantity"
                    min="1"
                    max="9999"
                    step="1"
                /></label>
              </div>
            </section>
            <section class="form-panel">
              <div class="section-heading">
                <div>
                  <h2>Opciones y variantes</h2>
                  <p class="muted">
                    Talles, colores, medidas o cualquier combinación.
                  </p>
                </div>
                <p-button
                  label="Agregar opción"
                  icon="pi pi-plus"
                  [text]="true"
                  [disabled]="form.controls.variants.length >= 100"
                  (onClick)="addVariant()"
                />
              </div>
              <div formArrayName="variants">
                @for (
                  group of form.controls.variants.controls;
                  track group;
                  let i = $index
                ) {
                  <div class="variant-editor" [formGroupName]="i">
                    <div class="form-grid">
                      <label
                        >Opción (ej. M / Negro)<input
                          pInputText
                          formControlName="label"
                          maxlength="160" /></label
                      ><label
                        >SKU opcional<input
                          pInputText
                          formControlName="sku"
                          maxlength="100" /></label
                      ><label
                        >Precio propio <span class="muted">(opcional)</span
                        ><input
                          type="number"
                          formControlName="price"
                          min="0"
                          step="0.01" /></label
                      ><label class="check-label"
                        ><input type="checkbox" formControlName="available" />
                        Disponible</label
                      >
                    </div>
                    <button
                      class="text-button remove"
                      type="button"
                      (click)="form.controls.variants.removeAt(i)"
                    >
                      Quitar opción
                    </button>
                  </div>
                }
              </div>
              @if (!form.controls.variants.length) {
                <p class="muted">El producto se compra sin elegir variantes.</p>
              }
            </section>
            <section class="form-panel">
              <div class="section-heading">
                <h2>Características</h2>
                <p-button
                  label="Agregar detalle"
                  icon="pi pi-plus"
                  [text]="true"
                  [disabled]="attributes.length >= 30"
                  (onClick)="addAttribute()"
                />
              </div>
              @for (group of attributes.controls; track group; let i = $index) {
                <div class="attribute-editor" [formGroup]="group">
                  <input
                    pInputText
                    formControlName="key"
                    placeholder="Ej. Material"
                    aria-label="Nombre de característica"
                    maxlength="80"
                  /><input
                    pInputText
                    formControlName="value"
                    placeholder="Ej. Acero inoxidable"
                    aria-label="Valor de característica"
                    maxlength="200"
                  /><button
                    type="button"
                    class="text-button remove"
                    (click)="attributes.removeAt(i)"
                    aria-label="Quitar característica"
                  >
                    <i class="pi pi-times"></i>
                  </button>
                </div>
              }
            </section>
          </div>
          <aside>
            <section class="form-panel">
              <h2>Publicación</h2>
              <label class="check-label"
                ><input type="checkbox" formControlName="active" /> Visible en
                el catálogo</label
              ><label class="check-label"
                ><input type="checkbox" formControlName="available" />
                Disponible para pedir</label
              ><label class="check-label"
                ><input type="checkbox" formControlName="featured" /> Producto
                destacado</label
              >
            </section>
            <section class="form-panel">
              <h2>Imágenes</h2>
              <p class="muted">
                Hasta 8 imágenes. PNG o JPG, máximo 5 MB y 4096 px por lado. La
                primera es la portada.
              </p>
              <div class="image-editor">
                @for (image of images(); track image; let i = $index) {
                  <div>
                    <img [src]="image" alt="Imagen del producto" />
                    <div>
                      <button
                        type="button"
                        class="text-button"
                        [disabled]="i === 0"
                        (click)="moveImage(i)"
                      >
                        Portada</button
                      ><button
                        type="button"
                        class="text-button remove"
                        (click)="removeImage(i)"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                }
              </div>
              <label class="upload-label"
                ><i class="pi pi-upload"></i>
                {{ uploading() ? "Subiendo…" : "Cargar imágenes"
                }}<input
                  type="file"
                  accept="image/png,image/jpeg"
                  multiple
                  (change)="upload($event)"
                  [disabled]="uploading() || images().length >= 8"
              /></label>
            </section>
          </aside>
        </div>
        @if (error()) {
          <p class="error-banner" role="alert">{{ error() }}</p>
        }
        @if (form.touched && form.invalid) {
          <p class="field-error">
            Revisá nombre, categoría, precio, cantidad y los datos de las
            opciones.
          </p>
        }
        <div class="sticky-save">
          <a routerLink="/admin/productos" class="subtle-link">Cancelar</a
          ><p-button
            type="submit"
            label="Guardar producto"
            icon="pi pi-check"
            [loading]="saving()"
            [disabled]="uploading() || loading()"
          />
        </div>
      </form>
    }
  </main>`,
})
export class ProductEditorComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(MessageService);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly uploading = signal(false);
  readonly error = signal("");
  readonly categories = signal<Category[]>([]);
  readonly images = signal<string[]>([]);
  original: Product | null = null;
  variantGroup(v?: Variant) {
    return this.fb.group({
      id: this.fb.control<string | null>(v?.id || null),
      label: this.fb.nonNullable.control(v?.label || "", [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(160),
      ]),
      sku: this.fb.nonNullable.control(v?.sku || ""),
      price: this.fb.control<number | null>(
        v?.price ?? null,
        Validators.min(0),
      ),
      available: this.fb.nonNullable.control(v?.available ?? true),
    });
  }
  readonly attributes = this.fb.array<ReturnType<typeof this.attributeGroup>>(
    [],
  );
  attributeGroup(key = "", value = "") {
    return this.fb.nonNullable.group({
      key: [key, [Validators.required, Validators.maxLength(80)]],
      value: [value, [Validators.required, Validators.maxLength(200)]],
    });
  }
  readonly form = this.fb.group({
    name: this.fb.nonNullable.control("", [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(180),
    ]),
    sku: this.fb.nonNullable.control(""),
    description: this.fb.nonNullable.control(""),
    categoryId: this.fb.control<number | null>(null, Validators.required),
    price: this.fb.control<number | null>(null, [
      Validators.required,
      Validators.min(0),
    ]),
    promotionalPrice: this.fb.control<number | null>(null, Validators.min(0)),
    minimumQuantity: this.fb.nonNullable.control(1, [
      Validators.required,
      Validators.min(1),
      Validators.max(9999),
      Validators.pattern(/^\d+$/),
    ]),
    active: this.fb.nonNullable.control(true),
    available: this.fb.nonNullable.control(true),
    featured: this.fb.nonNullable.control(false),
    variants: this.fb.array<ReturnType<typeof this.variantGroup>>([]),
  });
  constructor() {
    void this.load();
  }
  async load() {
    try {
      this.categories.set(await this.api.categories(true));
      const id = this.route.snapshot.paramMap.get("id");
      if (id) {
        const p = await this.api.product(id, true);
        this.original = p;
        const { variants, ...fields } = p;
        this.form.patchValue({ ...fields, sku: p.sku || "" });
        this.images.set(p.images);
        p.variants.forEach((v) =>
          this.form.controls.variants.push(this.variantGroup(v)),
        );
        Object.entries(p.attributes).forEach(([k, v]) =>
          this.attributes.push(this.attributeGroup(k, v)),
        );
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  addVariant() {
    this.form.controls.variants.push(this.variantGroup());
  }
  addAttribute() {
    this.attributes.push(this.attributeGroup());
  }
  removeImage(i: number) {
    this.images.update((images) => images.filter((_, n) => n !== i));
  }
  moveImage(i: number) {
    this.images.update((images) => [
      images[i],
      ...images.filter((_, n) => n !== i),
    ]);
  }
  async upload(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.uploading.set(true);
    this.error.set("");
    try {
      for (const file of files) {
        if (this.images().length >= 8) break;
        const result = await this.api.upload(file);
        this.images.update((images) => [...images, result.url]);
      }
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.uploading.set(false);
      input.value = "";
    }
  }
  async save() {
    this.form.markAllAsTouched();
    this.attributes.markAllAsTouched();
    if (
      this.form.invalid ||
      this.attributes.invalid ||
      this.saving() ||
      this.uploading()
    )
      return;
    const value = this.form.getRawValue();
    this.error.set("");
    if (
      value.promotionalPrice !== null &&
      value.promotionalPrice >= (value.price ?? 0)
    ) {
      this.error.set(
        "El precio promocional debe ser menor al precio habitual.",
      );
      return;
    }
    const entries = this.attributes.getRawValue();
    if (new Set(entries.map((e) => e.key.trim())).size !== entries.length) {
      this.error.set("Las características deben tener nombres diferentes.");
      return;
    }
    this.saving.set(true);
    try {
      await this.api.write(
        this.original ? "PUT" : "POST",
        "admin/products" + (this.original ? "/" + this.original.id : ""),
        {
          ...value,
          version: this.original?.version ?? null,
          images: this.images(),
          attributes: Object.fromEntries(
            entries.map((e) => [e.key.trim(), e.value]),
          ),
          variants: value.variants.map((v) => ({
            ...v,
            attributes: this.variantAttributes(v.id, v.label),
          })),
        },
      );
      this.toast.add({ severity: "success", summary: "Producto guardado" });
      await this.router.navigateByUrl("/admin/productos");
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
  private variantAttributes(
    id: string | null,
    label: string,
  ): Record<string, string> {
    const original = this.original?.variants.find(
      (v) => v.id === id,
    )?.attributes;
    if (original && Object.keys(original).length && !("Opción" in original))
      return { ...original };
    return { Opción: label };
  }
}

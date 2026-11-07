import { Component, inject, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { TableModule } from "primeng/table";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { MessageService } from "primeng/api";
import { ApiService, errorMessage } from "../../core/api.service";
import { Category } from "../../core/models";
@Component({
  selector: "app-admin-categories",
  imports: [
    ReactiveFormsModule,
    TableModule,
    DialogModule,
    ButtonModule,
    InputTextModule,
  ],
  template: `<main class="admin-content">
    <span class="eyebrow">CADA COSA EN SU LUGAR</span>
    <h1>Categorías</h1>
    <p class="muted">
      Las categorías inactivas y sus productos no aparecen en el catálogo
      público.
    </p>
    <form
      class="form-panel category-form"
      [formGroup]="form"
      (ngSubmit)="save()"
    >
      <h2>{{ editing ? "Editar categoría" : "Nueva categoría" }}</h2>
      <div class="form-grid">
        <label
          >Nombre<input
            pInputText
            formControlName="name"
            maxlength="100" /></label
        ><label
          >Orden<input
            type="number"
            min="0"
            max="100000"
            formControlName="sortOrder" /></label
        ><label class="check-label"
          ><input type="checkbox" formControlName="active" /> Activa</label
        >
      </div>
      <div class="form-actions">
        <p-button
          type="submit"
          [label]="editing ? 'Guardar cambios' : 'Crear categoría'"
          [disabled]="form.invalid"
          [loading]="saving()"
        />
        @if (editing) {
          <p-button
            label="Cancelar edición"
            [text]="true"
            (onClick)="reset()"
          />
        }
      </div>
    </form>
    @if (error()) {
      <p class="error-banner" role="alert">{{ error() }}</p>
    }
    <p-table
      [value]="categories()"
      [loading]="loading()"
      [tableStyle]="{ 'min-width': '500px' }"
      ><ng-template #header
        ><tr>
          <th>Nombre</th>
          <th>Orden</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr></ng-template
      ><ng-template #body let-c
        ><tr>
          <td>{{ c.name }}</td>
          <td>{{ c.sortOrder }}</td>
          <td>{{ c.active ? "Activa" : "Inactiva" }}</td>
          <td>
            <div class="table-actions">
              <button class="text-button" (click)="edit(c)">Editar</button
              ><button class="text-button remove" (click)="deleting = c">
                Eliminar
              </button>
            </div>
          </td>
        </tr></ng-template
      ><ng-template #emptymessage
        ><tr>
          <td colspan="4">Todavía no hay categorías.</td>
        </tr></ng-template
      ></p-table
    ><p-dialog
      header="Eliminar categoría"
      [visible]="!!deleting"
      (visibleChange)="!$event && (deleting = null)"
      [modal]="true"
      [style]="{ width: '420px', 'max-width': '94vw' }"
      ><p>
        ¿Eliminar {{ deleting?.name }}? Solo se puede eliminar si no tiene
        productos.
      </p>
      <div class="dialog-actions">
        <p-button
          label="Cancelar"
          [text]="true"
          (onClick)="deleting = null"
        /><p-button
          label="Eliminar"
          severity="danger"
          (onClick)="remove()"
        /></div
    ></p-dialog>
  </main>`,
})
export class AdminCategoriesComponent {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(MessageService);
  readonly categories = signal<Category[]>([]);
  readonly error = signal("");
  readonly saving = signal(false);
  readonly loading = signal(true);
  editing: number | null = null;
  deleting: Category | null = null;
  readonly form = this.fb.nonNullable.group({
    name: [
      "",
      [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(100),
      ],
    ],
    sortOrder: [
      0,
      [Validators.required, Validators.min(0), Validators.max(100000)],
    ],
    active: [true],
  });
  constructor() {
    void this.load();
  }
  async load() {
    this.loading.set(true);
    try {
      this.categories.set(await this.api.categories(true));
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.loading.set(false);
    }
  }
  edit(c: Category) {
    this.editing = c.id;
    this.form.reset({ name: c.name, sortOrder: c.sortOrder, active: c.active });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  reset() {
    this.editing = null;
    this.form.reset({ name: "", sortOrder: 0, active: true });
  }
  async save() {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);
    this.error.set("");
    try {
      await this.api.write(
        this.editing ? "PUT" : "POST",
        "admin/categories" + (this.editing ? "/" + this.editing : ""),
        this.form.getRawValue(),
      );
      this.reset();
      this.toast.add({ severity: "success", summary: "Categoría guardada" });
      await this.load();
    } catch (e) {
      this.error.set(errorMessage(e));
    } finally {
      this.saving.set(false);
    }
  }
  async remove() {
    if (!this.deleting) return;
    try {
      await this.api.write("DELETE", "admin/categories/" + this.deleting.id);
      this.deleting = null;
      await this.load();
    } catch (e) {
      this.deleting = null;
      this.error.set(errorMessage(e));
    }
  }
}

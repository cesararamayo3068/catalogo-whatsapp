import { inject, Injectable, signal } from "@angular/core";
import { ApiService } from "./api.service";
import { Business } from "./models";
@Injectable({ providedIn: "root" })
export class StoreState {
  private readonly api = inject(ApiService);
  readonly business = signal<Business | null>(null);
  constructor() {
    void this.reload().catch(() => {});
  }
  async reload() {
    const settings = await this.api.business();
    this.business.set(settings);
    document.title = settings.name || "Catálogo digital";
  }
  money(amount: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: this.business()?.currency || "ARS",
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

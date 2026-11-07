import { inject, Injectable, signal } from "@angular/core";
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import {
  Business,
  Category,
  CheckoutInput,
  Prepared,
  Product,
  ProductPage,
} from "./models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly username = signal<string | null>(null);
  get<T>(path: string): Promise<T> {
    return firstValueFrom(
      this.http.get<T>("/api/" + path, { withCredentials: true }),
    );
  }
  async write<T>(method: string, path: string, body?: unknown): Promise<T> {
    const csrf = await this.get<{ token: string; headerName: string }>(
      "auth/csrf",
    );
    return firstValueFrom(
      this.http.request<T>(method, "/api/" + path, {
        body,
        withCredentials: true,
        headers: new HttpHeaders({ [csrf.headerName]: csrf.token }),
      }),
    );
  }
  business() {
    return this.get<Business>("public/business");
  }
  categories(admin = false) {
    return this.get<Category[]>((admin ? "admin" : "public") + "/categories");
  }
  products(
    query: Record<string, string | number | boolean> = {},
    admin = false,
  ) {
    const params = new URLSearchParams(
      Object.entries(query).map(([k, v]) => [k, String(v)]),
    );
    return this.get<ProductPage>(
      (admin ? "admin" : "public") + "/products?" + params,
    );
  }
  product(id: string | number, admin = false) {
    return this.get<Product>((admin ? "admin" : "public") + "/products/" + id);
  }
  prepare(input: CheckoutInput) {
    return this.write<Prepared>("POST", "public/checkout/prepare", input);
  }
  async me(): Promise<boolean> {
    try {
      const user = await this.get<{ username: string }>("auth/me");
      this.username.set(user.username);
      return true;
    } catch {
      this.username.set(null);
      return false;
    }
  }
  async login(username: string, password: string): Promise<void> {
    const csrf = await this.get<{ token: string }>("auth/csrf");
    await firstValueFrom(
      this.http.post(
        "/api/auth/login",
        new URLSearchParams({ username, password }).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "X-XSRF-TOKEN": csrf.token,
          },
          withCredentials: true,
        },
      ),
    );
    await this.me();
  }
  async logout() {
    await this.write("POST", "auth/logout");
    this.username.set(null);
  }
  upload(file: File) {
    const data = new FormData();
    data.append("file", file);
    return this.write<{ url: string }>("POST", "admin/images", data);
  }
}
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401)
      return "La sesión terminó o los datos de acceso no son correctos. Volvé a ingresar.";
    if (error.status === 403)
      return "No se pudo validar la sesión. Recargá la página e intentá nuevamente.";
    if (error.status === 429)
      return "Demasiados intentos. Esperá diez minutos antes de volver a ingresar.";
    const body = error.error as {
      detail?: string;
      fields?: Record<string, string>;
    } | null;
    if (body?.fields)
      return Object.entries(body.fields)
        .map(([field, message]) => `${field}: ${message}`)
        .join(" · ");
    if (body?.detail) return body.detail;
  }
  return "No pudimos completar la operación. Revisá la conexión y volvé a intentar.";
}

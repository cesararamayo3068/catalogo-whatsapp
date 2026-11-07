import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withXsrfConfiguration } from "@angular/common/http";
import { provideRouter } from "@angular/router";
import { providePrimeNG } from "primeng/config";
import Aura from "@primeuix/themes/aura";
import { AppComponent } from "./app/app.component";
import { MessageService } from "primeng/api";
import { adminGuard } from "./app/core/auth.guard";

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: "XSRF-TOKEN",
        headerName: "X-XSRF-TOKEN",
      }),
    ),
    MessageService,
    provideRouter([
      {
        path: "ingresar",
        loadComponent: () =>
          import("./app/features/admin/login.component").then(
            (m) => m.LoginComponent,
          ),
      },
      {
        path: "admin",
        canActivate: [adminGuard],
        loadComponent: () =>
          import("./app/layouts/admin-layout.component").then(
            (m) => m.AdminLayoutComponent,
          ),
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./app/features/admin/dashboard.component").then(
                (m) => m.DashboardComponent,
              ),
          },
          {
            path: "productos",
            loadComponent: () =>
              import("./app/features/admin/products.component").then(
                (m) => m.AdminProductsComponent,
              ),
          },
          {
            path: "productos/nuevo",
            loadComponent: () =>
              import("./app/features/admin/product-editor.component").then(
                (m) => m.ProductEditorComponent,
              ),
          },
          {
            path: "productos/:id",
            loadComponent: () =>
              import("./app/features/admin/product-editor.component").then(
                (m) => m.ProductEditorComponent,
              ),
          },
          {
            path: "categorias",
            loadComponent: () =>
              import("./app/features/admin/categories.component").then(
                (m) => m.AdminCategoriesComponent,
              ),
          },
          {
            path: "configuracion",
            loadComponent: () =>
              import("./app/features/admin/settings.component").then(
                (m) => m.SettingsComponent,
              ),
          },
        ],
      },
      {
        path: "",
        loadComponent: () =>
          import("./app/layouts/store-layout.component").then(
            (m) => m.StoreLayoutComponent,
          ),
        children: [
          {
            path: "",
            loadComponent: () =>
              import("./app/features/storefront/catalog.component").then(
                (m) => m.CatalogComponent,
              ),
          },
          {
            path: "producto/:id",
            loadComponent: () =>
              import("./app/features/catalog/product-detail.component").then(
                (m) => m.ProductDetailComponent,
              ),
          },
          {
            path: "carrito",
            loadComponent: () =>
              import("./app/features/cart/cart.component").then(
                (m) => m.CartComponent,
              ),
          },
          {
            path: "checkout",
            loadComponent: () =>
              import("./app/features/checkout/checkout.component").then(
                (m) => m.CheckoutComponent,
              ),
          },
        ],
      },
      { path: "**", redirectTo: "" },
    ]),
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: ".app-dark" } },
    }),
  ],
}).catch((error) => console.error("No se pudo iniciar la aplicación", error));

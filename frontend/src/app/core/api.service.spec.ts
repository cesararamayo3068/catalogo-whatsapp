import { TestBed } from "@angular/core/testing";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ApiService } from "./api.service";
describe("ApiService", () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it("loads business settings without authentication tokens in storage", async () => {
    const pending = TestBed.inject(ApiService).business();
    TestBed.inject(HttpTestingController)
      .expectOne("/api/public/business")
      .flush({ name: "Comercio", configured: true });
    expect((await pending).name).toBe("Comercio");
  });
  it("obtains a fresh CSRF token before preparing an order", async () => {
    const http = TestBed.inject(HttpTestingController);
    const input = {
      customerName: "Ana",
      phone: "",
      locality: "Córdoba",
      notes: "",
      items: [{ productId: 1, variantId: null, quantity: 2 }],
    };
    const pending = TestBed.inject(ApiService).prepare(input);
    http
      .expectOne("/api/auth/csrf")
      .flush({ headerName: "X-XSRF-TOKEN", token: "test-csrf" });
    await Promise.resolve();
    const request = http.expectOne("/api/public/checkout/prepare");
    expect(request.request.headers.get("X-XSRF-TOKEN")).toBe("test-csrf");
    expect(request.request.body).toEqual(input);
    request.flush({
      total: 25,
      message: "Pedido",
      whatsappUrl: "https://wa.me/5491100000000?text=Pedido",
    });
    expect((await pending).total).toBe(25);
  });
});

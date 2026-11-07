import { TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { CheckoutComponent } from "./checkout.component";
import { CartService } from "../../core/cart.service";
import { ApiService } from "../../core/api.service";
import { StoreState } from "../../core/store-state.service";
import { signal } from "@angular/core";
describe("CheckoutComponent", () => {
  const prepared = {
    items: [],
    total: 42,
    currency: "ARS",
    message: "Pedido verificado",
    whatsappUrl: "https://wa.me/5491100000000?text=Pedido",
  };
  let prepare: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    prepare = vi.fn().mockResolvedValue(prepared);
    TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: { prepare } },
        {
          provide: StoreState,
          useValue: { business: signal(null), money: (v: number) => String(v) },
        },
        {
          provide: CartService,
          useValue: {
            items: signal([{ productId: 3, variantId: "abc", quantity: 2 }]),
            total: signal(42),
          },
        },
      ],
    });
  });
  it("requires customer name and locality before requesting checkout", async () => {
    const c = TestBed.createComponent(CheckoutComponent).componentInstance;
    await c.prepare();
    expect(prepare).not.toHaveBeenCalled();
    expect(c.form.invalid).toBe(true);
  });
  it("sends only product identifiers and quantities to revalidate on the server", async () => {
    const c = TestBed.createComponent(CheckoutComponent).componentInstance;
    c.form.patchValue({ customerName: "Ana", locality: "Córdoba" });
    await c.prepare();
    expect(prepare).toHaveBeenCalledWith({
      customerName: "Ana",
      locality: "Córdoba",
      phone: "",
      notes: "",
      items: [{ productId: 3, variantId: "abc", quantity: 2 }],
    });
    expect(c.prepared()?.total).toBe(42);
    c.ngOnDestroy();
  });
  it("invalidates a prepared message when customer fields change", async () => {
    const c = TestBed.createComponent(CheckoutComponent).componentInstance;
    c.form.patchValue({ customerName: "Ana", locality: "Córdoba" });
    await c.prepare();
    expect(c.stale()).toBe(false);
    c.form.patchValue({ locality: "Rosario" });
    expect(c.stale()).toBe(true);
    c.ngOnDestroy();
  });
});

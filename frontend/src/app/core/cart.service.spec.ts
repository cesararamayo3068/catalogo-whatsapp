import { TestBed } from "@angular/core/testing";
import { CartService } from "./cart.service";
import { Product, Variant } from "./models";
const variant = (id: string): Variant => ({
  id,
  label: id,
  sku: null,
  price: null,
  available: true,
  attributes: {},
});
const product = (price = 0.1): Product => ({
  id: 1,
  name: "Producto",
  sku: null,
  description: "",
  categoryId: 1,
  categoryName: "Categoría",
  price,
  promotionalPrice: null,
  active: true,
  available: true,
  featured: false,
  minimumQuantity: 1,
  images: [],
  attributes: {},
  variants: [],
  version: 0,
  createdAt: "",
  updatedAt: "",
});
describe("CartService", () => {
  it("rejects totals that cannot be represented exactly in cents", () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    expect(() =>
      TestBed.inject(CartService).add(product(999999999999.99), 9999),
    ).toThrow();
  });
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
  });
  it("sums monetary amounts in cents", () => {
    const cart = TestBed.inject(CartService);
    cart.add(product(), 3);
    expect(cart.total()).toBe(0.3);
  });
  it("distinguishes variants and merges identical selections", () => {
    const cart = TestBed.inject(CartService);
    const p = product();
    p.variants = [variant("a"), variant("b")];
    cart.add(p, 1, p.variants[0]);
    cart.add(p, 2, p.variants[1]);
    cart.add(p, 1, p.variants[0]);
    expect(cart.items()).toHaveLength(2);
    expect(cart.count()).toBe(4);
  });
  it("rejects fractional quantities and respects the minimum", () => {
    const cart = TestBed.inject(CartService);
    const p = product();
    p.minimumQuantity = 3;
    expect(() => cart.add(p, 1)).toThrow();
    cart.add(p, 3);
    expect(cart.update(cart.items()[0].key, 2)).toBe(false);
    expect(cart.update(cart.items()[0].key, 3.5)).toBe(false);
    expect(cart.count()).toBe(3);
  });
  it("does not accept unavailable products or variants", () => {
    const cart = TestBed.inject(CartService);
    const p = product();
    p.available = false;
    expect(() => cart.add(p, 1)).toThrow();
  });
  it("restores persisted selections", () => {
    const first = TestBed.inject(CartService);
    first.add(product(), 2);
    TestBed.tick();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    expect(TestBed.inject(CartService).count()).toBe(2);
  });
  it("ignores corrupted and invalid stored data", () => {
    localStorage.setItem("commerce-cart-v1", '[{"quantity":-1}]');
    expect(TestBed.inject(CartService).items()).toEqual([]);
  });
});

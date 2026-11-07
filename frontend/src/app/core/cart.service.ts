import { computed, effect, Injectable, signal } from "@angular/core";
import { cents, effectivePrice, Product, Variant } from "./models";
export interface CartItem {
  key: string;
  productId: number;
  variantId: string | null;
  name: string;
  variant: string;
  image: string;
  unitPrice: number;
  quantity: number;
  minimum: number;
}
const storageKey = "commerce-cart-v1";
@Injectable({ providedIn: "root" })
export class CartService {
  readonly items = signal<CartItem[]>(this.restore());
  readonly count = computed(() =>
    this.items().reduce((n, i) => n + i.quantity, 0),
  );
  readonly total = computed(
    () =>
      this.items().reduce(
        (sum, i) => sum + cents(i.unitPrice) * i.quantity,
        0,
      ) / 100,
  );
  readonly storageWarning = signal(false);
  constructor() {
    effect(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(this.items()));
      } catch {
        this.storageWarning.set(true);
      }
    });
  }
  add(product: Product, quantity: number, variant?: Variant): void {
    if (
      !product.available ||
      !product.active ||
      !Number.isInteger(quantity) ||
      quantity < product.minimumQuantity ||
      quantity > 9999
    )
      throw new Error("Revisá la cantidad y disponibilidad.");
    if (
      (product.variants.length && (!variant || !variant.available)) ||
      (variant && !product.variants.some((v) => v.id === variant.id))
    )
      throw new Error("Elegí una variante disponible.");
    const key = `${product.id}:${variant?.id || ""}`;
    const existing = this.items().find((i) => i.key === key);
    if (!existing && this.items().length >= 50)
      throw new Error("El carrito admite hasta 50 productos diferentes.");
    const amount = (existing?.quantity || 0) + quantity;
    if (amount > 9999) throw new Error("La cantidad máxima es 9999.");
    const item: CartItem = {
      key,
      productId: product.id,
      variantId: variant?.id || null,
      name: product.name,
      variant: variant?.label || "",
      image: product.images[0] || "",
      unitPrice: effectivePrice(product, variant),
      quantity: amount,
      minimum: product.minimumQuantity,
    };
    const next = [...this.items().filter((i) => i.key !== key), item];
    if (!this.hasSafeTotal(next))
      throw new Error(
        "El importe supera el límite del carrito. Consultá al comercio directamente.",
      );
    this.items.set(next);
  }
  update(key: string, quantity: number): boolean {
    const item = this.items().find((i) => i.key === key);
    if (
      !item ||
      !Number.isInteger(quantity) ||
      quantity < item.minimum ||
      quantity > 9999
    )
      return false;
    const next = this.items().map((i) =>
      i.key === key ? { ...i, quantity } : i,
    );
    if (!this.hasSafeTotal(next)) return false;
    this.items.set(next);
    return true;
  }
  remove(key: string) {
    this.items.update((items) => items.filter((i) => i.key !== key));
  }
  clear() {
    this.items.set([]);
  }
  private restore(): CartItem[] {
    try {
      const value: unknown = JSON.parse(
        localStorage.getItem(storageKey) || "[]",
      );
      if (!Array.isArray(value) || value.length > 50) return [];
      const keys = new Set<string>();
      const restored = value.filter((item: unknown): item is CartItem => {
        if (!item || typeof item !== "object") return false;
        const i = item as CartItem;
        const valid =
          Number.isSafeInteger(i.productId) &&
          i.productId > 0 &&
          (i.variantId === null || typeof i.variantId === "string") &&
          typeof i.key === "string" &&
          i.key === `${i.productId}:${i.variantId || ""}` &&
          !keys.has(i.key) &&
          typeof i.name === "string" &&
          typeof i.variant === "string" &&
          typeof i.image === "string" &&
          Number.isFinite(i.unitPrice) &&
          i.unitPrice >= 0 &&
          i.unitPrice <= 1e12 &&
          Number.isInteger(i.minimum) &&
          i.minimum >= 1 &&
          Number.isInteger(i.quantity) &&
          i.quantity >= i.minimum &&
          i.quantity <= 9999;
        if (valid) keys.add(i.key);
        return valid;
      });
      return this.hasSafeTotal(restored) ? restored : [];
    } catch {
      return [];
    }
  }
  private hasSafeTotal(items: CartItem[]): boolean {
    return Number.isSafeInteger(
      items.reduce(
        (total, item) => total + cents(item.unitPrice) * item.quantity,
        0,
      ),
    );
  }
}

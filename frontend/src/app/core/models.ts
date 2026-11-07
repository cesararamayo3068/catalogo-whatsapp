export interface Business {
  name: string;
  description: string;
  currency: string;
  primaryColor: string;
  whatsapp: string;
  demo?: boolean;
  minimumOrder: number;
  welcomeMessage: string;
  terms: string;
  configured: boolean;
  logo: string;
  banner: string;
  address: string;
  phone: string;
  email: string;
  instagram: string;
  facebook: string;
  wholesale: boolean;
}
export interface Category {
  id: number;
  name: string;
  active: boolean;
  sortOrder: number;
}
export interface Variant {
  id: string | null;
  label: string;
  sku: string | null;
  price: number | null;
  available: boolean;
  attributes: Record<string, string>;
}
export interface Product {
  id: number;
  sku: string | null;
  name: string;
  description: string;
  categoryId: number;
  categoryName: string;
  price: number;
  promotionalPrice: number | null;
  active: boolean;
  available: boolean;
  featured: boolean;
  minimumQuantity: number;
  images: string[];
  attributes: Record<string, string>;
  variants: Variant[];
  version: number;
  createdAt: string;
  updatedAt: string;
}
export interface ProductPage {
  items: Product[];
  page: number;
  totalPages: number;
  totalElements: number;
}
export interface PreparedLine {
  productId: number;
  variantId: string | null;
  name: string;
  sku: string | null;
  variant: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
export interface Prepared {
  items: PreparedLine[];
  total: number;
  currency: string;
  message: string;
  whatsappUrl: string;
}
export interface CheckoutInput {
  customerName: string;
  phone: string;
  locality: string;
  notes: string;
  items: { productId: number; variantId: string | null; quantity: number }[];
}
export const cents = (value: number): number => Math.round(value * 100);
export const effectivePrice = (p: Product, v?: Variant): number =>
  v?.price ?? p.promotionalPrice ?? p.price;

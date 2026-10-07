/** AUTO-GENERATED from openapi — do not edit. */
export interface ProductsListQuery {
  q?: string;
}

export type ProductsListResponse = { id: string; name: string; price: number; primaryImage: unknown; inStock: boolean }[];

export interface ProductsGetResponse {
  id: string;
  name: string;
  description?: unknown;
  price: number;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
}

export interface CartGetResponse {
  id?: string;
  items: { id: string; product: { id: string; name: string; price: number; primaryImage: unknown; inStock: boolean }; quantity: number; lineTotal: number }[];
  total: number;
}

export interface CartItemsAddRequest {
  productId: string;
  quantity?: number;
}

export interface CartItemsAddResponse {
  id?: string;
  items: { id: string; product: { id: string; name: string; price: number; primaryImage: unknown; inStock: boolean }; quantity: number; lineTotal: number }[];
  total: number;
}

export interface CartItemsRemoveResponse {
  id?: string;
  items: { id: string; product: { id: string; name: string; price: number; primaryImage: unknown; inStock: boolean }; quantity: number; lineTotal: number }[];
  total: number;
}

export interface CartItemsUpdateRequest {
  quantity: number;
}

export interface CartItemsUpdateResponse {
  id?: string;
  items: { id: string; product: { id: string; name: string; price: number; primaryImage: unknown; inStock: boolean }; quantity: number; lineTotal: number }[];
  total: number;
}

export interface AuthLoginRequest {
  email: string;
  password: string;
}

export interface AuthLoginResponse {
  accessToken: string;
  token?: string;
  user: { id: string; email: string; role: "user" | "admin" };
}

export type OrdersListMineResponse = { id: string; orderNumber: string; placedAt: string; total: number; status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" }[];

export interface OrdersCreateRequest {
  deliveryFullName: string;
  deliveryPhone: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPostalCode: string;
}

export interface OrdersCreateResponse {
  id: string;
  orderNumber: string;
  status: "pending";
}

export interface OrdersGetMineResponse {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cash_on_delivery";
  total: number;
  lines: { id: string; productId?: unknown; productNameSnapshot: string; unitPriceSnapshot: number; quantity: number; lineTotal: number }[];
  deliveryFullName: string;
  deliveryPhone: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPostalCode: string;
}

export type AdminProductsListResponse = { id: string; name: string; description?: unknown; price: number; stockQuantity: number; images: string[]; isActive: boolean }[];

export interface AdminProductsCreateRequest {
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  images: string[];
}

export interface AdminProductsCreateResponse {
  id: string;
  name: string;
  description?: unknown;
  price: number;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
}

export interface AdminProductsGetResponse {
  id: string;
  name: string;
  description?: unknown;
  price: number;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
}

export interface AdminProductsUpdateRequest {
  name?: string;
  description?: string;
  price?: number;
  stockQuantity?: number;
  images?: string[];
}

export interface AdminProductsUpdateResponse {
  id: string;
  name: string;
  description?: unknown;
  price: number;
  stockQuantity: number;
  images: string[];
  isActive: boolean;
}

export type AdminOrdersListResponse = { id: string; orderNumber: string; customerName: string; placedAt: string; total: number; status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" }[];

export interface AdminOrdersGetResponse {
  id: string;
  orderNumber: string;
  placedAt: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cash_on_delivery";
  total: number;
  lines: { id: string; productId?: unknown; productNameSnapshot: string; unitPriceSnapshot: number; quantity: number; lineTotal: number }[];
  deliveryFullName: string;
  deliveryPhone: string;
  deliveryStreet: string;
  deliveryCity: string;
  deliveryPostalCode: string;
  customer: { id: string; email: string; fullName: string };
}

export interface AdminOrdersUpdateStatusRequest {
  status: "confirmed" | "shipped" | "delivered" | "cancelled";
}

export interface AdminOrdersUpdateStatusResponse {
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
}

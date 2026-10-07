/** AUTO-GENERATED from openapi — do not edit. */
import { request, setAuthSession, setAuthToken } from "../http";
import type { AdminOrdersGetResponse, AdminOrdersListResponse, AdminOrdersUpdateStatusRequest, AdminOrdersUpdateStatusResponse, AdminProductsCreateRequest, AdminProductsCreateResponse, AdminProductsGetResponse, AdminProductsListResponse, AdminProductsUpdateRequest, AdminProductsUpdateResponse, AuthLoginRequest, AuthLoginResponse, CartGetResponse, CartItemsAddRequest, CartItemsAddResponse, CartItemsRemoveResponse, CartItemsUpdateRequest, CartItemsUpdateResponse, OrdersCreateRequest, OrdersCreateResponse, OrdersGetMineResponse, OrdersListMineResponse, ProductsGetResponse, ProductsListQuery, ProductsListResponse } from "./types";

/** Pick the JWT from a login/register body (OpenAPI field names vary). */
function extractAccessToken(result: unknown): string | undefined {
  if (!result || typeof result !== "object") return undefined;
  const body = result as Record<string, unknown>;
  for (const key of ["accessToken", "token", "access_token", "sessionToken", "session_token"] as const) {
    const value = body[key];
    if (typeof value === "string" && value) return value;
  }
  return undefined;
}

function withQuery(path: string, query?: object): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function products_list(query?: ProductsListQuery): Promise<ProductsListResponse> {
  return request<ProductsListResponse>("GET", withQuery("/products", query));
}

export async function products_get(id: string): Promise<ProductsGetResponse> {
  return request<ProductsGetResponse>("GET", `/products/${id}`);
}

export async function cart_get(): Promise<CartGetResponse> {
  return request<CartGetResponse>("GET", "/cart");
}

export async function cart_items_add(body: CartItemsAddRequest): Promise<CartItemsAddResponse> {
  return request<CartItemsAddResponse>("POST", "/cart/items", body);
}

export async function cart_items_remove(id: string): Promise<CartItemsRemoveResponse> {
  return request<CartItemsRemoveResponse>("DELETE", `/cart/items/${id}`);
}

export async function cart_items_update(id: string, body: CartItemsUpdateRequest): Promise<CartItemsUpdateResponse> {
  return request<CartItemsUpdateResponse>("PATCH", `/cart/items/${id}`, body);
}

export async function auth_login(body: AuthLoginRequest): Promise<AuthLoginResponse> {
  const result = await request<AuthLoginResponse>("POST", "/auth/login", body);
  const token = extractAccessToken(result);
  if (token) {
    setAuthToken(token);
    setAuthSession(result);
  }
  return result;
}

export async function auth_logout(): Promise<void> {
  try {
    return await request<void>("POST", "/auth/logout");
  } finally {
    setAuthToken(undefined);
  }
}

export async function orders_list_mine(): Promise<OrdersListMineResponse> {
  return request<OrdersListMineResponse>("GET", "/orders");
}

export async function orders_create(body: OrdersCreateRequest): Promise<OrdersCreateResponse> {
  return request<OrdersCreateResponse>("POST", "/orders", body);
}

export async function orders_get_mine(id: string): Promise<OrdersGetMineResponse> {
  return request<OrdersGetMineResponse>("GET", `/orders/${id}`);
}

export async function admin_products_list(): Promise<AdminProductsListResponse> {
  return request<AdminProductsListResponse>("GET", "/admin/products");
}

export async function admin_products_create(body: AdminProductsCreateRequest): Promise<AdminProductsCreateResponse> {
  return request<AdminProductsCreateResponse>("POST", "/admin/products", body);
}

export async function admin_products_get(id: string): Promise<AdminProductsGetResponse> {
  return request<AdminProductsGetResponse>("GET", `/admin/products/${id}`);
}

export async function admin_products_delete(id: string): Promise<void> {
  return request<void>("DELETE", `/admin/products/${id}`);
}

export async function admin_products_update(id: string, body: AdminProductsUpdateRequest): Promise<AdminProductsUpdateResponse> {
  return request<AdminProductsUpdateResponse>("PATCH", `/admin/products/${id}`, body);
}

export async function admin_orders_list(): Promise<AdminOrdersListResponse> {
  return request<AdminOrdersListResponse>("GET", "/admin/orders");
}

export async function admin_orders_get(id: string): Promise<AdminOrdersGetResponse> {
  return request<AdminOrdersGetResponse>("GET", `/admin/orders/${id}`);
}

export async function admin_orders_update_status(id: string, body: AdminOrdersUpdateStatusRequest): Promise<AdminOrdersUpdateStatusResponse> {
  return request<AdminOrdersUpdateStatusResponse>("PATCH", `/admin/orders/${id}/status`, body);
}

export { setAuthToken };

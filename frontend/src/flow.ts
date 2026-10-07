/** Generated from ui-spec + OpenAPI. Do not edit. */
export const PRODUCT = "E-Commerce Website";
export const NAV: { name: string; route: string }[] = [
  {
    "name": "Product Catalog",
    "route": "/"
  },
  {
    "name": "Cart",
    "route": "/cart"
  },
  {
    "name": "Checkout",
    "route": "/checkout"
  },
  {
    "name": "My Orders",
    "route": "/orders"
  }
];
export const ADMIN: { name: string; route: string }[] = [
  {
    "name": "Admin Product List",
    "route": "/admin/products"
  },
  {
    "name": "Admin Product Form",
    "route": "/admin/products/:id (and /admin/products/new)"
  },
  {
    "name": "Admin Orders Dashboard",
    "route": "/admin/orders"
  },
  {
    "name": "Admin Order Detail",
    "route": "/admin/orders/:id"
  }
];
export const CREATE: { label: string; route: string }[] = [
  {
    "label": "Create cart",
    "route": "/cart/new"
  }
];
export const LOGIN_ROUTE = "/signin";
export const SIGNUP_ROUTE = "";
export const HOME_ROUTE = "/";
export const DEMO_ADMIN_EMAIL = "admin@demo.local";
export const DEMO_ADMIN_PASSWORD = "demo-admin-password";
export const DEMO_USER_EMAIL = "user@demo.local";
export const DEMO_USER_PASSWORD = "demo-user-password";

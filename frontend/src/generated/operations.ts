/** AUTO-GENERATED from openapi — do not edit. */
export const CONTRACT_OPERATIONS = [
  {
    "operationId": "products_list",
    "method": "GET",
    "path": "/products",
    "secured": false,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": [
      "q"
    ]
  },
  {
    "operationId": "products_get",
    "method": "GET",
    "path": "/products/{id}",
    "secured": false,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "cart_get",
    "method": "GET",
    "path": "/cart",
    "secured": false,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "cart_items_add",
    "method": "POST",
    "path": "/cart/items",
    "secured": false,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "cart_items_remove",
    "method": "DELETE",
    "path": "/cart/items/{id}",
    "secured": false,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "cart_items_update",
    "method": "PATCH",
    "path": "/cart/items/{id}",
    "secured": false,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "auth_login",
    "method": "POST",
    "path": "/auth/login",
    "secured": false,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "auth_logout",
    "method": "POST",
    "path": "/auth/logout",
    "secured": true,
    "successStatuses": [
      204
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "orders_list_mine",
    "method": "GET",
    "path": "/orders",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "orders_create",
    "method": "POST",
    "path": "/orders",
    "secured": true,
    "successStatuses": [
      201
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "orders_get_mine",
    "method": "GET",
    "path": "/orders/{id}",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_products_list",
    "method": "GET",
    "path": "/admin/products",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_products_create",
    "method": "POST",
    "path": "/admin/products",
    "secured": true,
    "successStatuses": [
      201
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_products_get",
    "method": "GET",
    "path": "/admin/products/{id}",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_products_delete",
    "method": "DELETE",
    "path": "/admin/products/{id}",
    "secured": true,
    "successStatuses": [
      204
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_products_update",
    "method": "PATCH",
    "path": "/admin/products/{id}",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_orders_list",
    "method": "GET",
    "path": "/admin/orders",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_orders_get",
    "method": "GET",
    "path": "/admin/orders/{id}",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  },
  {
    "operationId": "admin_orders_update_status",
    "method": "PATCH",
    "path": "/admin/orders/{id}/status",
    "secured": true,
    "successStatuses": [
      200
    ],
    "storyIds": [],
    "query": []
  }
] as const;

export type ContractOperationId = "products_list" | "products_get" | "cart_get" | "cart_items_add" | "cart_items_remove" | "cart_items_update" | "auth_login" | "auth_logout" | "orders_list_mine" | "orders_create" | "orders_get_mine" | "admin_products_list" | "admin_products_create" | "admin_products_get" | "admin_products_delete" | "admin_products_update" | "admin_orders_list" | "admin_orders_get" | "admin_orders_update_status";

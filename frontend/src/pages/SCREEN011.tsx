import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { admin_orders_list, admin_orders_update_status } from "../api";
import { ErrorMessage, LoadingSpinner } from "../components/Shared";
import type { AdminOrdersListResponse, AdminOrdersUpdateStatusRequest } from "../generated/types";
import { ApiError } from "../http";

type OrderRow = AdminOrdersListResponse[number];

const STATUS_OPTIONS: AdminOrdersUpdateStatusRequest["status"][] = ["confirmed", "shipped", "delivered", "cancelled"];

const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatPrice(price: number): string {
  return Number.isFinite(price) ? `$${price.toFixed(2)}` : "";
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

/** Admin Orders Dashboard (/admin/orders) — every order with a status control. */
export function SCREEN011() {
  const [orders, setOrders] = useState<AdminOrdersListResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrders(await admin_orders_list());
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Could not load orders. Try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(order: OrderRow, status: AdminOrdersUpdateStatusRequest["status"]) {
    setUpdatingId(order.id);
    setActionError(null);
    try {
      await admin_orders_update_status(order.id, { status });
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err : new Error(`Could not update order ${order.orderNumber}.`));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Orders Dashboard</h1>
        <p className="muted mt-1 text-sm">Review incoming orders and move them through fulfilment.</p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner />
          <span className="muted text-sm">Loading orders…</span>
        </div>
      ) : error ? (
        <div className="card flex flex-col items-start gap-3 p-6">
          <ErrorMessage>{error.message}</ErrorMessage>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Try again
          </button>
        </div>
      ) : orders.length === 0 ? (
        <div className="card p-8">
          <p className="font-medium text-slate-900">No orders yet</p>
          <p className="muted mt-1 text-sm">Orders placed by customers appear here.</p>
        </div>
      ) : (
        <section aria-label="Orders">
          {actionError ? (
            <div className="mb-4">
              <ErrorMessage>{actionError.message}</ErrorMessage>
            </div>
          ) : null}
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 font-medium">Order</th>
                  <th scope="col" className="px-4 py-3 font-medium">Customer</th>
                  <th scope="col" className="px-4 py-3 font-medium">Placed</th>
                  <th scope="col" className="px-4 py-3 font-medium">Total</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Update status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${order.id}`} className="font-medium text-slate-900 underline-offset-2 hover:text-emerald-700 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{order.customerName}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(order.placedAt)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatPrice(order.total)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
                          (STATUS_CLASSES[order.status] ?? "bg-slate-100 text-slate-600")
                        }
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <label htmlFor={`status-${order.id}`} className="sr-only">
                        Status for {order.orderNumber}
                      </label>
                      <select
                        id={`status-${order.id}`}
                        value={order.status === "pending" ? "" : order.status}
                        disabled={updatingId === order.id}
                        onChange={(event) => {
                          const next = event.target.value as AdminOrdersUpdateStatusRequest["status"];
                          if (next) void changeStatus(order, next);
                        }}
                        className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs text-slate-700 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">{order.status === "pending" ? "pending — choose…" : "Choose…"}</option>
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted mt-3 text-xs">
            {orders.length} {orders.length === 1 ? "order" : "orders"}
          </p>
        </section>
      )}
    </main>
  );
}

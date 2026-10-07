import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { orders_list_mine } from "../api";
import { EmptyState, ErrorMessage, LoadingSpinner } from "../components/Shared";

type Order = Awaited<ReturnType<typeof orders_list_mine>>[number];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const statusStyles: Record<Order["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function StatusBadge({ status }: { status: Order["status"] }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize " +
        (statusStyles[status] ?? "bg-slate-100 text-slate-700")
      }
    >
      {status}
    </span>
  );
}

function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <tr key={i} className="border-b border-slate-200 last:border-0">
          <td className="px-4 py-4">
            <span className="block h-4 w-24 animate-pulse rounded bg-slate-200" />
          </td>
          <td className="px-4 py-4">
            <span className="block h-4 w-28 animate-pulse rounded bg-slate-200" />
          </td>
          <td className="px-4 py-4">
            <span className="block h-4 w-16 animate-pulse rounded bg-slate-200" />
          </td>
          <td className="px-4 py-4">
            <span className="block h-5 w-20 animate-pulse rounded-full bg-slate-200" />
          </td>
          <td className="px-4 py-4 text-right">
            <span className="ml-auto block h-4 w-20 animate-pulse rounded bg-slate-200" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function SCREEN006() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await orders_list_mine();
      setOrders(data);
    } catch (e) {
      setOrders(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openOrder = (id: string) => navigate(`/orders/${id}`);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your Cash on Delivery orders and their current status.
          </p>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
          <ErrorMessage>Could not load your orders. Try again.</ErrorMessage>
          {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <section aria-label="Loading orders" className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center gap-2 px-4 py-3">
            <LoadingSpinner />
            <span className="text-sm text-slate-500">Loading your orders…</span>
          </div>
          <table className="w-full table-fixed border-t border-slate-200 text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-4 py-3 font-semibold">Order number</th>
                <th scope="col" className="px-4 py-3 font-semibold">Placed at</th>
                <th scope="col" className="px-4 py-3 font-semibold">Total</th>
                <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              <SkeletonRows />
            </tbody>
          </table>
        </section>
      ) : null}

      {!loading && !error && orders !== null && orders.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center">
          <EmptyState>You have no orders yet</EmptyState>
          <Link
            to="/"
            className="mt-4 inline-flex items-center rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Browse products
          </Link>
        </div>
      ) : null}

      {!loading && !error && orders !== null && orders.length > 0 ? (
        <section
          aria-label="Orders"
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 font-semibold">Order number</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Placed at</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Total</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    tabIndex={0}
                    onClick={() => openOrder(order.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openOrder(order.id);
                      }
                    }}
                    className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50"
                  >
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <Link
                        to={`/orders/${order.id}`}
                        className="text-emerald-700 underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(order.placedAt)}</td>
                    <td className="px-4 py-4 font-semibold text-slate-900">
                      {money.format(order.total)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View order
                      </Link>
                      <Link
                        to={`/orders/${order.id}/confirmation`}
                        className="ml-2 inline-flex items-center rounded-md px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Confirmation
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

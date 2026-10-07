import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { admin_orders_get, admin_orders_update_status } from "../api";
import { Card, EmptyState, ErrorMessage, SuccessMessage } from "../components/Shared";
import { ApiError } from "../http";
import type { AdminOrdersGetResponse } from "../generated/types";

type MutableStatus = "confirmed" | "shipped" | "delivered" | "cancelled";

const STATUS_OPTIONS: { value: MutableStatus; label: string }[] = [
  { value: "confirmed", label: "Confirmed" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_BADGE: Record<AdminOrdersGetResponse["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-sky-100 text-sky-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function paymentLabel(method: AdminOrdersGetResponse["paymentMethod"]): string {
  return method === "cash_on_delivery" ? "Cash on delivery" : method;
}

function StatusBadge({ status }: { status: AdminOrdersGetResponse["status"] }) {
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold capitalize " +
        (STATUS_BADGE[status] ?? "bg-slate-100 text-slate-700")
      }
    >
      {status}
    </span>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 py-1.5">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function SkeletonPanel({ className = "" }: { className?: string }) {
  return <div className={"animate-pulse rounded-xl bg-slate-200 " + className} aria-hidden="true" />;
}

function OrderSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonPanel className="h-28" />
      <SkeletonPanel className="h-56" />
      <div className="grid gap-6 md:grid-cols-2">
        <SkeletonPanel className="h-44" />
        <SkeletonPanel className="h-44" />
      </div>
      <SkeletonPanel className="h-44" />
    </div>
  );
}

export function SCREEN012() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<AdminOrdersGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [statusValue, setStatusValue] = useState<MutableStatus>("confirmed");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<Error | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    setSaved(false);
    try {
      const data = await admin_orders_get(id);
      setOrder(data);
      setStatusValue(data.status === "pending" ? "confirmed" : data.status);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        navigate("/403");
        return;
      }
      setOrder(null);
      setLoadError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleUpdateStatus(event: FormEvent) {
    event.preventDefault();
    if (!order || saving || statusValue === order.status) return;
    setSaving(true);
    setActionError(null);
    setSaved(false);
    try {
      await admin_orders_update_status(order.id, { status: statusValue });
      setSaved(true);
      await load();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setActionError(new ApiError(409, "This status change is not allowed."));
      } else {
        setActionError(err as Error);
      }
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <OrderSkeleton />
      </main>
    );
  }

  if (loadError) {
    if (loadError instanceof ApiError && loadError.status === 404) {
      return (
        <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
          <EmptyState>Order not found</EmptyState>
        </main>
      );
    }
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <ErrorMessage>Could not load this order. Try again.</ErrorMessage>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
        >
          Try again
        </button>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <EmptyState>Order not found</EmptyState>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-900">Order {order.orderNumber}</h1>
        <p className="muted mt-1 text-sm">Admin order detail</p>
      </header>

      {/* order-header */}
      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Order number</p>
            <p className="text-lg font-semibold text-slate-900">{order.orderNumber}</p>
            <p className="muted mt-1 text-sm">Placed {formatDate(order.placedAt)}</p>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <StatusBadge status={order.status} />
            <p className="muted text-sm">
              Payment: <span className="font-medium text-slate-900">{paymentLabel(order.paymentMethod)}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* order-lines */}
      <Card className="overflow-hidden p-0">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-500 sm:px-6">
          Items
        </h2>
        {order.lines.length === 0 ? (
          <div className="p-4 sm:p-6">
            <EmptyState>No items in this order.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium sm:px-6">Product</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Unit price</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Qty</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium sm:px-6">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.lines.map((line) => (
                  <tr key={line.id}>
                    <td className="px-4 py-3 font-medium text-slate-900 sm:px-6">{line.productNameSnapshot}</td>
                    <td className="px-4 py-3 text-slate-600">{money.format(line.unitPriceSnapshot)}</td>
                    <td className="px-4 py-3 text-slate-600">{line.quantity}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 sm:px-6">
                      {money.format(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* customer-panel */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Customer</h2>
          <dl className="mt-3 divide-y divide-slate-100">
            <DetailRow label="Name">{order.customer.fullName}</DetailRow>
            <DetailRow label="Email">{order.customer.email}</DetailRow>
          </dl>
        </Card>

        {/* delivery-info */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Delivery info</h2>
          <dl className="mt-3 divide-y divide-slate-100">
            <DetailRow label="Recipient">{order.deliveryFullName}</DetailRow>
            <DetailRow label="Phone">{order.deliveryPhone}</DetailRow>
            <DetailRow label="Street">{order.deliveryStreet}</DetailRow>
            <DetailRow label="City">{order.deliveryCity}</DetailRow>
            <DetailRow label="Postal code">{order.deliveryPostalCode}</DetailRow>
          </dl>
        </Card>
      </div>

      {/* order-total + status-controls */}
      <Card className="p-4 sm:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Order total</h2>
            <p className="mt-3 text-3xl font-semibold text-slate-900">{money.format(order.total)}</p>
            <p className="muted mt-1 text-sm">Cash on delivery — collected when the order arrives.</p>
          </div>

          <form onSubmit={handleUpdateStatus} className="space-y-3 md:border-l md:border-slate-200 md:pl-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Update status</h2>
            <div>
              <label htmlFor="order-status" className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                id="order-status"
                value={statusValue}
                onChange={(e) => setStatusValue(e.target.value as MutableStatus)}
                className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500/30"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="muted mt-1 text-xs">
                pending → confirmed → shipped → delivered; cancelled allowed from pending or confirmed.
              </p>
            </div>

            {actionError ? <ErrorMessage>{actionError.message}</ErrorMessage> : null}
            {saved ? <SuccessMessage>Status saved; visible to the customer on their order.</SuccessMessage> : null}

            <button
              type="submit"
              disabled={saving || statusValue === order.status}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <span className="loader" aria-hidden="true" />
              ) : null}
              {saving ? "Saving…" : "Update status"}
            </button>
          </form>
        </div>
      </Card>
    </main>
  );
}

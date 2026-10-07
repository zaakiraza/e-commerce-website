import type { OrdersGetMineResponse } from "../../generated/types";
import { Card } from "../Shared";

/** Shapes pulled from the orders_get_mine response so the page stays typed end to end. */
export type OrderLine = OrdersGetMineResponse["lines"][number];
export type OrderStatus = OrdersGetMineResponse["status"];

/** Backend prices are plain numbers; show them as USD with two fraction digits. */
export function formatMoney(value: number): string {
  return Number.isFinite(value)
    ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value)
    : "—";
}

/** placedAt as a readable local date/time; falls back to the raw string when unparseable. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-[#fff4e0] text-[#8a5a00] border-[#f2d9a4]",
  confirmed: "bg-[#e8f2ff] text-[#0b5aad] border-[#bcd8f5]",
  shipped: "bg-[#eeeaff] text-[#4636a8] border-[#d4ccf4]",
  delivered: "bg-[#e5f6ee] text-[#027a48] border-[#b3e3cd]",
  cancelled: "bg-[#fdecea] text-[#b42318] border-[#f3c1bb]",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span className={"inline-flex items-center rounded-full border px-3 py-0.5 text-sm font-semibold " + style}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">{label}</dt>
      <dd className="text-sm text-[#15202b]">{value ? value : "—"}</dd>
    </div>
  );
}

/** order-header: orderNumber, placedAt, status. */
export function OrderHeaderPanel({ order }: { order: OrdersGetMineResponse }) {
  return (
    <Card className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">Order</p>
        <h1 className="text-2xl font-bold text-[#15202b]">{order.orderNumber}</h1>
        <p className="text-sm text-[#5b6b7c]">Placed {formatDateTime(order.placedAt)}</p>
      </div>
      <div className="flex flex-col items-start gap-1 md:items-end">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">Status</p>
        <StatusBadge status={order.status} />
      </div>
    </Card>
  );
}

/** order-lines: snapshot name/price, quantity, line total; productId null means the product was deleted. */
export function OrderLinesPanel({ lines, total }: { lines: OrderLine[]; total: number }) {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold text-[#15202b]">Items</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] border-collapse text-sm">
          <caption className="sr-only">Items in this order with snapshotted prices</caption>
          <thead>
            <tr className="border-b border-[#d7dee7] text-left text-xs font-semibold uppercase tracking-wide text-[#5b6b7c]">
              <th scope="col" className="py-2 pr-4">Item</th>
              <th scope="col" className="py-2 pr-4 text-right">Unit price</th>
              <th scope="col" className="py-2 pr-4 text-right">Quantity</th>
              <th scope="col" className="py-2 text-right">Line total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.id} className="border-b border-[#e7ecf2] last:border-b-0">
                <td className="py-3 pr-4">
                  <span className="font-medium text-[#15202b]">{line.productNameSnapshot}</span>
                  {line.productId == null ? (
                    <span className="ml-2 rounded-full bg-[#fdecea] px-2 py-0.5 text-xs font-medium text-[#b42318]">
                      No longer available
                    </span>
                  ) : null}
                </td>
                <td className="py-3 pr-4 text-right text-[#5b6b7c]">{formatMoney(line.unitPriceSnapshot)}</td>
                <td className="py-3 pr-4 text-right text-[#5b6b7c]">{line.quantity}</td>
                <td className="py-3 text-right font-semibold text-[#15202b]">{formatMoney(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 flex items-center justify-end gap-2 text-base font-bold text-[#15202b]">
        <span className="text-sm font-semibold uppercase tracking-wide text-[#5b6b7c]">Total</span>
        {formatMoney(total)}
      </p>
    </Card>
  );
}

/** delivery-info: name, phone, street, city, postal code. */
export function DeliveryInfoPanel({ order }: { order: OrdersGetMineResponse }) {
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold text-[#15202b]">Delivery information</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <DetailRow label="Full name" value={order.deliveryFullName} />
        <DetailRow label="Phone" value={order.deliveryPhone} />
        <DetailRow label="Street" value={order.deliveryStreet} />
        <DetailRow label="City" value={order.deliveryCity} />
        <DetailRow label="Postal code" value={order.deliveryPostalCode} />
      </dl>
    </Card>
  );
}

/** payment-info: read-only payment method (COD only in this MVP). */
export function PaymentInfoPanel({ paymentMethod }: { paymentMethod: OrdersGetMineResponse["paymentMethod"] }) {
  const label = paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : paymentMethod;
  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold text-[#15202b]">Payment</h2>
      <p className="text-sm font-medium text-[#15202b]">{label}</p>
      <p className="mt-1 text-xs text-[#5b6b7c]">Pay with cash when your order arrives.</p>
    </Card>
  );
}

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { orders_get_mine } from "../api";
import { Card, ErrorMessage, LoadingSpinner } from "../components/Shared";
import {
  DeliveryInfoPanel,
  OrderHeaderPanel,
  OrderLinesPanel,
  PaymentInfoPanel,
} from "../components/SCREEN007/OrderPanels";
import { ApiError } from "../http";
import type { OrdersGetMineResponse } from "../generated/types";

/** Skeleton detail panel shown while orders_get_mine is pending. */
function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <Card className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-40 animate-pulse rounded bg-[#d7dee7]" />
          <div className="h-4 w-56 animate-pulse rounded bg-[#e7ecf2]" />
        </div>
        <div className="h-7 w-24 animate-pulse rounded-full bg-[#d7dee7]" />
      </Card>
      <Card className="flex flex-col gap-3">
        <div className="h-5 w-24 animate-pulse rounded bg-[#d7dee7]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#e7ecf2]" />
        <div className="h-4 w-full animate-pulse rounded bg-[#e7ecf2]" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-[#e7ecf2]" />
      </Card>
      <Card className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-9 animate-pulse rounded bg-[#e7ecf2]" />
        ))}
      </Card>
    </div>
  );
}

export function SCREEN007() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrdersGetMineResponse | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setOrder(await orders_get_mine(id));
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, "Could not load your order. Try again."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 p-4 sm:p-6">
      <Link
        to="/orders"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-[#0f6e56] hover:underline focus:text-[#0c5a46] focus:outline-none focus-visible:underline"
      >
        ← Back to my orders
      </Link>

      {loading ? (
        <>
          <LoadingSpinner />
          <DetailSkeleton />
        </>
      ) : error && error.status === 404 ? (
        <Card>
          <h1 className="text-xl font-semibold text-[#15202b]">Order not found</h1>
          <p className="mt-1 text-sm text-[#5b6b7c]">
            This order does not exist or belongs to another customer.
          </p>
        </Card>
      ) : error ? (
        <Card>
          <ErrorMessage>Could not load your order. Try again.</ErrorMessage>
          <button
            type="button"
            onClick={() => void load()}
            className="mt-3 rounded-md bg-[#0f6e56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c5a46] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </Card>
      ) : order ? (
        <>
          <OrderHeaderPanel order={order} />
          <OrderLinesPanel lines={order.lines} total={order.total} />
          <div className="grid gap-4 md:grid-cols-2">
            <DeliveryInfoPanel order={order} />
            <PaymentInfoPanel paymentMethod={order.paymentMethod} />
          </div>
        </>
      ) : (
        <Card>
          <h1 className="text-xl font-semibold text-[#15202b]">Order not found</h1>
        </Card>
      )}
    </main>
  );
}

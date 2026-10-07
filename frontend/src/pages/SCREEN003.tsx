import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cart_get, cart_items_remove, cart_items_update } from "../api";
import { useAuth } from "../auth";
import { Card, EmptyState, ErrorMessage, LoadingSpinner, SuccessMessage } from "../components/Shared";
import { CartLine, type CartItem } from "../components/SCREEN003/CartLine";
import { formatPrice } from "../components/SCREEN003/format";
import { ApiError } from "../http";

type CartData = { items: CartItem[]; total: number };
type LineErrors = Record<string, string | null>;

/** Cart (/cart): review and modify the cart before checkout. */
export function SCREEN003() {
  const { signedIn } = useAuth();
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [lineErrors, setLineErrors] = useState<LineErrors>({});
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async (initial: boolean) => {
    if (initial) setLoading(true);
    setFailed(false);
    try {
      const data = await cart_get();
      setCart({ items: data.items, total: data.total });
      setLineErrors({});
    } catch {
      if (initial) setFailed(true);
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(true);
  }, [load]);

  const setLineError = (id: string, message: string | null) =>
    setLineErrors((prev) => ({ ...prev, [id]: message }));

  const changeQuantity = async (item: CartItem, quantity: number) => {
    if (busyItemId || !Number.isFinite(quantity) || quantity < 1 || quantity === item.quantity) return;
    setBusyItemId(item.id);
    setNotice(null);
    setLineError(item.id, null);
    try {
      const updated = await cart_items_update(item.id, { quantity });
      setCart({ items: updated.items, total: updated.total });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const available = err.message.match(/\d+/)?.[0];
        setLineError(item.id, available ? `Only ${available} available.` : err.message);
      } else {
        setLineError(item.id, err instanceof Error ? err.message : "Could not update quantity.");
      }
      // Revert the stepper to the stored quantity.
      await load(false);
    } finally {
      setBusyItemId(null);
    }
  };

  const removeItem = async (item: CartItem) => {
    if (busyItemId) return;
    setBusyItemId(item.id);
    setNotice(null);
    setLineError(item.id, null);
    try {
      const updated = await cart_items_remove(item.id);
      setCart({ items: updated.items, total: updated.total });
      setNotice("Removed from cart.");
    } catch (err) {
      setLineError(item.id, err instanceof Error ? err.message : "Could not remove item.");
    } finally {
      setBusyItemId(null);
    }
  };

  const items = cart?.items ?? [];
  const checkoutTo = signedIn ? "/checkout" : "/signin?redirect=/checkout";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight">Cart</h1>

      {loading && cart === null ? (
        <section className="mt-6" aria-busy="true">
          <LoadingSpinner />
          <CartSkeleton />
        </section>
      ) : failed ? (
        <section className="mt-6 space-y-3">
          <ErrorMessage>Could not load your cart. Try again.</ErrorMessage>
          <button
            type="button"
            onClick={() => void load(true)}
            className="inline-flex items-center justify-center rounded-lg border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold hover:bg-[color:var(--bg)] focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
          >
            Try again
          </button>
        </section>
      ) : items.length === 0 ? (
        <section className="mt-6 space-y-4">
          <SuccessMessage>{notice}</SuccessMessage>
          <EmptyState>Your cart is empty</EmptyState>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
          >
            Browse products
          </Link>
        </section>
      ) : (
        <>
          <div className="mt-4">
            <SuccessMessage>{notice}</SuccessMessage>
          </div>
          <div className="mt-4 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <Card>
              <ul className="divide-y divide-[color:var(--line)]">
                {items.map((item) => (
                  <CartLine
                    key={item.id}
                    item={item}
                    busy={busyItemId === item.id}
                    locked={busyItemId !== null}
                    error={lineErrors[item.id] ?? null}
                    onQuantityChange={(quantity) => void changeQuantity(item, quantity)}
                    onRemove={() => void removeItem(item)}
                  />
                ))}
              </ul>
            </Card>

            <Card>
              <h2 className="text-base font-semibold">Summary</h2>
              <dl className="mt-3 flex items-baseline justify-between">
                <dt className="text-sm text-[color:var(--muted)]">Total</dt>
                <dd className="text-lg font-bold tabular-nums">{formatPrice(cart?.total ?? 0)}</dd>
              </dl>
              <Link
                to={checkoutTo}
                className="mt-4 flex w-full items-center justify-center rounded-lg bg-[color:var(--accent)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2"
              >
                Proceed to checkout
              </Link>
              <p className="muted mt-3 text-center text-xs">Cash on delivery</p>
            </Card>
          </div>
        </>
      )}
    </main>
  );
}

/** Skeleton list of cart lines shown while cart_get is pending. */
function CartSkeleton() {
  return (
    <ul className="mt-4 space-y-6" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <li key={row} className="flex items-center gap-4">
          <div className="h-20 w-20 shrink-0 animate-pulse rounded-lg bg-[color:var(--line)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/5 animate-pulse rounded bg-[color:var(--line)]" />
            <div className="h-3 w-1/5 animate-pulse rounded bg-[color:var(--line)]" />
          </div>
          <div className="h-9 w-28 animate-pulse rounded-lg bg-[color:var(--line)]" />
          <div className="h-4 w-16 animate-pulse rounded bg-[color:var(--line)]" />
        </li>
      ))}
    </ul>
  );
}

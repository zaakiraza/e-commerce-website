import { Link } from "react-router-dom";
import type { CartGetResponse } from "../../generated/types";
import { ErrorMessage, LoadingSpinner } from "../Shared";
import { QuantityStepper } from "./QuantityStepper";
import { formatPrice } from "./format";

/** One cart line as returned by cart_get and the cart mutations. */
export type CartItem = CartGetResponse["items"][number];

type CartLineProps = {
  item: CartItem;
  /** This line's own request is in flight (shows an inline spinner). */
  busy?: boolean;
  /** Any line is mutating, so the controls lock. */
  locked?: boolean;
  error?: string | null;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
};

export function CartLine({
  item,
  busy = false,
  locked = false,
  error = null,
  onQuantityChange,
  onRemove,
}: CartLineProps) {
  const disabled = busy || locked;
  const image = typeof item.product.primaryImage === "string" ? item.product.primaryImage : undefined;

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          to={`/products/${item.product.id}`}
          className="shrink-0 self-start rounded-lg focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] sm:self-center"
        >
          {image ? (
            <img
              src={image}
              alt={item.product.name}
              className="h-20 w-20 rounded-lg border border-[color:var(--line)] object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-lg border border-[color:var(--line)] bg-[color:var(--bg)] text-xs font-medium text-[color:var(--muted)]">
              No image
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <Link
            to={`/products/${item.product.id}`}
            className="rounded text-sm font-semibold hover:underline focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]"
          >
            {item.product.name}
          </Link>
          <p className="muted mt-1 text-sm">{formatPrice(item.product.price)} each</p>
        </div>

        <div className="flex items-center gap-3">
          {busy ? <LoadingSpinner /> : null}
          <QuantityStepper
            quantity={item.quantity}
            min={1}
            disabled={disabled}
            onDecrease={() => onQuantityChange(item.quantity - 1)}
            onIncrease={() => onQuantityChange(item.quantity + 1)}
          />
        </div>

        <p className="w-24 text-right text-sm font-semibold tabular-nums sm:text-base">
          {formatPrice(item.lineTotal)}
        </p>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="self-start rounded text-sm font-medium text-[color:var(--bad)] hover:underline focus-visible:ring-2 focus-visible:ring-[color:var(--bad)] disabled:cursor-not-allowed disabled:opacity-40 sm:self-center"
        >
          Remove
        </button>
      </div>

      {error ? (
        <div className="mt-2">
          <ErrorMessage>{error}</ErrorMessage>
        </div>
      ) : null}
    </li>
  );
}

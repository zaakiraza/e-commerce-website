import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cart_get, orders_create } from "../api";
import { ApiError } from "../http";
import { LOGIN_ROUTE } from "../auth";
import { Card, EmptyState, ErrorMessage, LoadingSpinner } from "../components/Shared";
import type { CartGetResponse, OrdersCreateRequest } from "../generated/types";

type CartLine = CartGetResponse["items"][number];
type DeliveryField = keyof OrdersCreateRequest;

const FIELDS: {
  name: DeliveryField;
  label: string;
  type: string;
  autoComplete: string;
  requiredMessage: string;
}[] = [
  { name: "deliveryFullName", label: "Full name", type: "text", autoComplete: "name", requiredMessage: "Full name is required." },
  { name: "deliveryPhone", label: "Phone", type: "tel", autoComplete: "tel", requiredMessage: "Phone is required." },
  { name: "deliveryStreet", label: "Street address", type: "text", autoComplete: "street-address", requiredMessage: "Street address is required." },
  { name: "deliveryCity", label: "City", type: "text", autoComplete: "address-level2", requiredMessage: "City is required." },
  { name: "deliveryPostalCode", label: "Postal code", type: "text", autoComplete: "postal-code", requiredMessage: "Postal code is required." },
];

const EMPTY_FORM: OrdersCreateRequest = {
  deliveryFullName: "",
  deliveryPhone: "",
  deliveryStreet: "",
  deliveryCity: "",
  deliveryPostalCode: "",
};

function money(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

/** Checkout (/checkout): delivery form + COD order placement. */
export function SCREEN004() {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartGetResponse | undefined>();
  const [loadError, setLoadError] = useState<Error | undefined>();
  const [reload, setReload] = useState(0);
  const [form, setForm] = useState<OrdersCreateRequest>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<DeliveryField, string>>>({});
  const [submitError, setSubmitError] = useState<string | undefined>();
  const [conflict, setConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const redirectTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setLoadError(undefined);
    cart_get()
      .then((body) => {
        if (alive) setCart(body);
      })
      .catch((err: unknown) => {
        if (alive) setLoadError(err instanceof Error ? err : new Error("Could not load your cart."));
      });
    return () => {
      alive = false;
    };
  }, [reload]);

  useEffect(() => () => window.clearTimeout(redirectTimer.current), []);

  const loading = !cart && !loadError;
  const empty = Boolean(cart && cart.items.length === 0);

  function update(name: DeliveryField, value: string) {
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
  }

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;

    const errors: Partial<Record<DeliveryField, string>> = {};
    for (const field of FIELDS) {
      if (form[field.name].trim() === "") errors[field.name] = field.requiredMessage;
    }
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) return;

    setSubmitting(true);
    setSubmitError(undefined);
    setConflict(false);
    try {
      const order = await orders_create({
        deliveryFullName: form.deliveryFullName,
        deliveryPhone: form.deliveryPhone,
        deliveryStreet: form.deliveryStreet,
        deliveryCity: form.deliveryCity,
        deliveryPostalCode: form.deliveryPostalCode,
      });
      navigate(`/orders/${order.id}/confirmation`);
    } catch (err) {
      const api = err instanceof ApiError ? err : undefined;
      if (api?.status === 401) {
        navigate(`${LOGIN_ROUTE}?redirect=/checkout`);
        return;
      }
      if (api?.status === 409) {
        // Stock ran low: keep the cart, tell the shopper, then let them adjust quantities.
        setSubmitError(api.message);
        setConflict(true);
        redirectTimer.current = window.setTimeout(() => navigate("/cart"), 2600);
        return;
      }
      setSubmitError(api ? api.message : "Could not place your order. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Checkout</h1>
        <p className="mt-1 text-sm text-slate-500">Pay in cash when your order is delivered.</p>
      </header>

      {loading ? (
        <CheckoutSkeleton />
      ) : loadError ? (
        <Card className="p-6">
          <ErrorMessage>{loadError.message}</ErrorMessage>
          <button
            type="button"
            onClick={() => setReload((n) => n + 1)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            Try again
          </button>
        </Card>
      ) : empty ? (
        <Card className="p-8 text-center">
          <EmptyState>Your cart is empty</EmptyState>
          <p className="mt-2 text-sm text-slate-500">Browse the catalog and add something before checking out.</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center justify-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            Continue shopping
          </Link>
        </Card>
      ) : cart ? (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <form noValidate onSubmit={placeOrder} className="card order-2 space-y-5 p-6 lg:order-1">
            <h2 className="text-lg font-semibold text-slate-900">Delivery information</h2>

            {submitError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <ErrorMessage>{submitError}</ErrorMessage>
                {conflict && (
                  <p className="mt-1 text-sm text-red-700">Taking you to your cart to adjust quantities…</p>
                )}
              </div>
            )}

            {FIELDS.map((field) => (
              <TextField
                key={field.name}
                name={field.name}
                label={field.label}
                type={field.type}
                autoComplete={field.autoComplete}
                value={form[field.name]}
                error={fieldErrors[field.name]}
                onChange={update}
              />
            ))}

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
              <h2 className="text-sm font-semibold text-emerald-900">Payment method</h2>
              <p className="mt-1 flex items-center gap-2 text-sm text-emerald-800">
                <span aria-hidden="true" className="text-base">💵</span>
                Cash on Delivery
              </p>
              <p className="mt-1 text-xs text-emerald-700">No online payment needed — hand the cash to the courier.</p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <LoadingSpinner />}
              {submitting ? "Placing order…" : "Place order (Cash on Delivery)"}
            </button>
          </form>

          <Card className="order-1 p-6 lg:order-2">
            <h2 className="text-lg font-semibold text-slate-900">Order summary</h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {cart.items.map((item) => (
                <CartRow key={item.id} item={item} />
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
              <span className="text-base font-semibold text-slate-900">Total</span>
              <span className="text-lg font-semibold text-slate-900">{money(cart.total)}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">Cash on Delivery — no shipping fees at checkout.</p>
            <Link
              to="/cart"
              className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              Edit cart
            </Link>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function CartRow({ item }: { item: CartLine }) {
  const image = typeof item.product.primaryImage === "string" ? item.product.primaryImage : undefined;
  return (
    <li className="flex items-center gap-3 py-3">
      {image && (
        <img
          src={image}
          alt={item.product.name}
          className="h-12 w-12 flex-none rounded-lg border border-slate-200 object-cover"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{item.product.name}</p>
        <p className="text-sm text-slate-500">
          Qty {item.quantity} × {money(item.product.price)}
        </p>
      </div>
      <p className="flex-none text-sm font-semibold text-slate-900">{money(item.lineTotal)}</p>
    </li>
  );
}

function TextField({
  name,
  label,
  type,
  autoComplete,
  value,
  error,
  onChange,
}: {
  name: DeliveryField;
  label: string;
  type: string;
  autoComplete: string;
  value: string;
  error?: string;
  onChange: (name: DeliveryField, value: string) => void;
}) {
  const id = `checkout-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(name, event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={
          "mt-1 block w-full rounded-lg border px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 " +
          (error
            ? "border-red-400 focus:border-red-500 focus:ring-red-500"
            : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-600")
        }
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="card animate-pulse space-y-4 p-6" aria-hidden="true">
        <div className="h-6 w-44 rounded bg-slate-200" />
        {FIELDS.map((field) => (
          <div key={field.name} className="space-y-2">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-10 w-full rounded-lg bg-slate-100" />
          </div>
        ))}
        <div className="h-11 w-full rounded-lg bg-slate-200" />
      </div>
      <div className="card animate-pulse space-y-3 p-6" aria-hidden="true">
        <div className="h-6 w-36 rounded bg-slate-200" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-full rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-6 w-28 rounded bg-slate-200" />
      </div>
    </div>
  );
}

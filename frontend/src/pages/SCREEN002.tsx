import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { cart_items_add, products_get } from "../api";
import { ErrorMessage, LoadingSpinner, SuccessMessage } from "../components/Shared";
import type { ProductsGetResponse } from "../generated/types";
import { ApiError } from "../http";

function formatPrice(price: number): string {
  return Number.isFinite(price) ? `$${price.toFixed(2)}` : "";
}

function StockBadge({ inStock }: { inStock: boolean }) {
  return (
    <span
      className={
        "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
        (inStock ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800")
      }
    >
      {inStock ? "In stock" : "Out of stock"}
    </span>
  );
}

/** Product Detail (/products/:id) — view one product and add it to the cart. */
export function SCREEN002() {
  const { id = "" } = useParams();
  const [product, setProduct] = useState<ProductsGetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [addError, setAddError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setProduct(await products_get(id));
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Could not load this product."));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addToCart() {
    if (!product) return;
    setAdding(true);
    setAdded(false);
    setAddError(null);
    try {
      await cart_items_add({ productId: product.id, quantity });
      setAdded(true);
    } catch (err) {
      setAddError(err instanceof ApiError ? err : new Error("Could not add this product to the cart."));
    } finally {
      setAdding(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex w-full max-w-6xl items-center gap-2 px-6 py-16">
        <LoadingSpinner />
        <span className="muted text-sm">Loading product…</span>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="mx-auto w-full max-w-3xl px-6 py-16">
        <div className="card flex flex-col items-start gap-3 p-8">
          <h1 className="text-xl font-semibold text-slate-900">Product unavailable</h1>
          <ErrorMessage>{error?.message ?? "This product could not be found."}</ErrorMessage>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Try again
            </button>
            <Link
              to="/"
              className="inline-flex h-9 items-center rounded-md bg-emerald-700 px-3 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Back to catalog
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const image = product.images.find((src) => typeof src === "string" && src);
  const description = typeof product.description === "string" ? product.description : "";

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <div className="mb-4 text-sm">
        <Link to="/" className="muted underline-offset-2 hover:underline">
          ← Back to catalog
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="card overflow-hidden p-0">
          <div className="aspect-[4/3] w-full bg-slate-100">
            {image ? (
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <header>
            <h1 className="text-2xl font-semibold text-slate-900">{product.name}</h1>
            <p className="mt-2 text-2xl font-bold text-emerald-700">{formatPrice(product.price)}</p>
            <div className="mt-3">
              <StockBadge inStock={product.inStock} />
            </div>
          </header>

          {description ? (
            <p className="whitespace-pre-line text-sm leading-6 text-slate-700">{description}</p>
          ) : null}

          <div className="card mt-auto flex flex-col gap-4 p-4">
            <div className="flex items-center gap-3">
              <label htmlFor="quantity" className="text-sm font-medium text-slate-700">
                Quantity
              </label>
              <input
                id="quantity"
                name="quantity"
                type="number"
                min={1}
                max={Math.max(product.stockQuantity, 1)}
                value={quantity}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setQuantity(Number.isFinite(next) && next > 0 ? Math.floor(next) : 1);
                }}
                className="h-10 w-20 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
              />
              {product.inStock ? (
                <span className="muted text-xs">{product.stockQuantity} in stock</span>
              ) : null}
            </div>

            <button
              type="button"
              disabled={!product.inStock || adding}
              onClick={() => void addToCart()}
              className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-6 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add to cart"}
            </button>

            {added ? <SuccessMessage>Added to cart.</SuccessMessage> : null}
            {addError ? <ErrorMessage>{addError.message}</ErrorMessage> : null}
            {!product.inStock ? <p className="muted text-xs">This product is out of stock right now.</p> : null}
          </div>
        </div>
      </div>
    </main>
  );
}

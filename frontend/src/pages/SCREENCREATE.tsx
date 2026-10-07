import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cart_items_add, products_list } from "../api";
import { Card, EmptyState, ErrorMessage, LoadingSpinner } from "../components/Shared";
import type { ProductsListResponse } from "../generated/types";
import { ApiError } from "../http";

type ProductRow = ProductsListResponse[number];

type FieldErrors = { productId?: string; quantity?: string };

function imageUrl(value: unknown): string {
  return typeof value === "string" ? value : "";
}

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

function ProductPreview({ product }: { product: ProductRow }) {
  const src = imageUrl(product.primaryImage);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#d7dee7] bg-[#f8fafb] p-3">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
        {src ? <img src={src} alt={product.name} className="h-full w-full object-cover" /> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <p className="truncate text-sm font-semibold text-[#15202b]">{product.name}</p>
        <p className="text-sm text-[#5b6b7c]">{formatPrice(product.price)}</p>
        <StockBadge inStock={product.inStock} />
      </div>
    </div>
  );
}

const SELECT_CLASS =
  "block w-full rounded-md border border-[#d7dee7] bg-white px-3 py-2 text-sm text-[#15202b] " +
  "focus:border-[#0f6e56] focus:outline-none focus:ring-2 focus:ring-[#0f6e56]";

export function SCREENCREATE() {
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductsListResponse>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<ApiError | null>(null);

  const [productId, setProductId] = useState("");
  const [quantityText, setQuantityText] = useState("1");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<ApiError | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setProducts(await products_list());
    } catch (err) {
      setLoadError(err instanceof ApiError ? err : new ApiError(0, "Could not load products. Try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selected = useMemo(
    () => products.find((product) => product.id === productId) ?? null,
    [products, productId],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FieldErrors = {};
    if (!productId) {
      nextErrors.productId = "Choose a product to add.";
    }
    const quantity = Number(quantityText);
    if (quantityText.trim() === "" || !Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity < 1) {
      nextErrors.quantity = "Enter a quantity of at least 1.";
    }
    if (productId && selected && !selected.inStock) {
      nextErrors.productId = "This product is out of stock.";
    }
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await cart_items_add({ productId: productId, quantity: quantity });
      navigate("/cart");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err : new ApiError(0, "Could not add this item to your cart. Try again."),
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 sm:p-6">
      <Link
        to="/cart"
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-[#0f6e56] hover:underline focus:text-[#0c5a46] focus:outline-none focus-visible:underline"
      >
        ← Back to cart
      </Link>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-[#15202b]">Add to cart</h1>
          <p className="text-sm text-[#5b6b7c]">
            Choose a product and quantity, then add it to your cart.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-4">
            <LoadingSpinner />
            <span className="text-sm text-[#5b6b7c]">Loading products…</span>
          </div>
        ) : loadError ? (
          <div className="flex flex-col gap-3">
            <ErrorMessage>{loadError.message}</ErrorMessage>
            <button
              type="button"
              onClick={() => void load()}
              className="w-fit rounded-md bg-[#0f6e56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c5a46] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : products.length === 0 ? (
          <EmptyState>No products available yet.</EmptyState>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cart-product" className="text-sm font-semibold text-[#15202b]">
                Product
              </label>
              <select
                id="cart-product"
                name="productId"
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, productId: undefined }));
                }}
                aria-invalid={fieldErrors.productId ? true : undefined}
                aria-describedby={fieldErrors.productId ? "cart-product-error" : undefined}
                className={SELECT_CLASS}
              >
                <option value="">Choose a product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} disabled={!product.inStock}>
                    {product.name} — {formatPrice(product.price)}
                    {product.inStock ? "" : " (Out of stock)"}
                  </option>
                ))}
              </select>
              {fieldErrors.productId ? (
                <p id="cart-product-error" className="error" role="alert">
                  {fieldErrors.productId}
                </p>
              ) : null}
            </div>

            {selected ? <ProductPreview product={selected} /> : null}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="cart-quantity" className="text-sm font-semibold text-[#15202b]">
                Quantity
              </label>
              <input
                id="cart-quantity"
                name="quantity"
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={quantityText}
                onChange={(event) => {
                  setQuantityText(event.target.value);
                  setFieldErrors((prev) => ({ ...prev, quantity: undefined }));
                }}
                aria-invalid={fieldErrors.quantity ? true : undefined}
                aria-describedby={fieldErrors.quantity ? "cart-quantity-error" : undefined}
                className={SELECT_CLASS}
              />
              {fieldErrors.quantity ? (
                <p id="cart-quantity-error" className="error" role="alert">
                  {fieldErrors.quantity}
                </p>
              ) : null}
            </div>

            {submitError ? <ErrorMessage>{submitError.message}</ErrorMessage> : null}

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-md bg-[#0f6e56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0c5a46] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <LoadingSpinner /> : null}
                {submitting ? "Adding…" : "Add to cart"}
              </button>
              <Link
                to="/cart"
                className="text-sm font-semibold text-[#5b6b7c] hover:text-[#15202b] hover:underline focus:text-[#15202b] focus:outline-none focus-visible:underline"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </Card>
    </main>
  );
}

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { products_list } from "../api";
import { Card, CatalogGrid, EmptyState, ErrorMessage, LoadingSpinner } from "../components/Shared";
import type { ProductsListResponse } from "../generated/types";
import { ApiError } from "../http";

type ProductRow = ProductsListResponse[number];

const SKELETON_ROWS = [0, 1, 2, 3, 4, 5, 6, 7];

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

function ProductCard({ product }: { product: ProductRow }) {
  const src = imageUrl(product.primaryImage);
  return (
    <Card className="group flex flex-col overflow-hidden p-0 transition duration-150 hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to={`/products/${product.id}`}
        className="flex h-full flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
          {src ? (
            <img
              src={src}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full" aria-hidden="true" />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h2 className="text-base font-semibold text-slate-900">{product.name}</h2>
          <p className="text-lg font-bold text-emerald-700">{formatPrice(product.price)}</p>
          <div className="mt-auto pt-1">
            <StockBadge inStock={product.inStock} />
          </div>
        </div>
      </Link>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <div className="card overflow-hidden p-0" aria-hidden="true">
      <div className="aspect-[4/3] w-full animate-pulse bg-slate-200" />
      <div className="space-y-2 p-4">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
        <div className="h-5 w-20 animate-pulse rounded-full bg-slate-200" />
      </div>
    </div>
  );
}

/** Product Catalog (/) — browse and search all sellable products. */
export function SCREEN001() {
  const [draft, setDraft] = useState("");
  const [term, setTerm] = useState("");
  const [products, setProducts] = useState<ProductsListResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const trimmed = q.trim();
      setProducts(await products_list(trimmed ? { q: trimmed } : undefined));
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Could not load products. Try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
  }, [load]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = draft.trim();
    setDraft(next);
    setTerm(next);
    void load(next);
  }

  function clearSearch() {
    setDraft("");
    setTerm("");
    void load("");
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Product Catalog</h1>
        <p className="muted mt-1 text-sm">Browse and search all sellable products.</p>
      </header>

      <form role="search" onSubmit={onSubmit} className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label htmlFor="catalog-search" className="sr-only">
          Search products
        </label>
        <input
          id="catalog-search"
          name="q"
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search products"
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 sm:max-w-md"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Search
          </button>
          <button
            type="button"
            onClick={clearSearch}
            className="inline-flex h-10 items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Clear search
          </button>
        </div>
      </form>
      <p className="muted mb-6 text-xs">Case-insensitive match on product name.</p>

      {loading ? (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <LoadingSpinner />
            <span className="muted text-sm">Loading products…</span>
          </div>
          <CatalogGrid>
            {SKELETON_ROWS.map((row) => (
              <SkeletonCard key={row} />
            ))}
          </CatalogGrid>
        </div>
      ) : error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Could not load products. Try again.</p>
          <ErrorMessage>{error.message}</ErrorMessage>
          <button
            type="button"
            onClick={() => void load(term)}
            className="mt-3 inline-flex h-9 items-center rounded-md border border-red-300 bg-white px-3 text-sm font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="card flex flex-col items-start gap-3 p-8">
          <EmptyState>{term ? "No products found" : "No products yet"}</EmptyState>
          {term ? (
            <>
              <p className="muted text-sm">Nothing matches “{term}”. Try a different search.</p>
              <button
                type="button"
                onClick={clearSearch}
                className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
              >
                Clear search
              </button>
            </>
          ) : null}
        </div>
      ) : (
        <section aria-label="Products">
          <p className="muted mb-4 text-sm">
            {products.length} {products.length === 1 ? "product" : "products"}
            {term ? (
              <>
                {" "}
                matching “{term}”
              </>
            ) : null}
          </p>
          <CatalogGrid>
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </CatalogGrid>
        </section>
      )}
    </main>
  );
}

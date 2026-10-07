import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { admin_products_delete, admin_products_list } from "../api";
import { ErrorMessage, LoadingSpinner } from "../components/Shared";
import type { AdminProductsListResponse } from "../generated/types";
import { ApiError } from "../http";

type ProductRow = AdminProductsListResponse[number];

function formatPrice(price: number): string {
  return Number.isFinite(price) ? `$${price.toFixed(2)}` : "";
}

/** Admin Product List (/admin/products) — every product with stock and delete controls. */
export function SCREEN009() {
  const [products, setProducts] = useState<AdminProductsListResponse>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<Error | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProducts(await admin_products_list());
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Could not load products. Try again."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(product: ProductRow) {
    setDeletingId(product.id);
    setActionError(null);
    try {
      await admin_products_delete(product.id);
      await load();
    } catch (err) {
      setActionError(err instanceof ApiError ? err : new Error(`Could not delete “${product.name}”.`));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Product List</h1>
          <p className="muted mt-1 text-sm">Manage the catalog: stock levels and removal.</p>
        </div>
        <Link
          to="/admin/products/new"
          className="inline-flex h-10 items-center rounded-md bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
        >
          New product
        </Link>
      </header>

      {loading ? (
        <div className="flex items-center gap-2">
          <LoadingSpinner />
          <span className="muted text-sm">Loading products…</span>
        </div>
      ) : error ? (
        <div className="card flex flex-col items-start gap-3 p-6">
          <ErrorMessage>{error.message}</ErrorMessage>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
          >
            Try again
          </button>
        </div>
      ) : products.length === 0 ? (
        <div className="card p-8">
          <p className="font-medium text-slate-900">No products yet</p>
          <p className="muted mt-1 text-sm">Create the first product to fill the catalog.</p>
        </div>
      ) : (
        <section aria-label="Products">
          {actionError ? (
            <div className="mb-4">
              <ErrorMessage>{actionError.message}</ErrorMessage>
            </div>
          ) : null}
          <div className="card overflow-x-auto p-0">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th scope="col" className="px-4 py-3 font-medium">Product</th>
                  <th scope="col" className="px-4 py-3 font-medium">Price</th>
                  <th scope="col" className="px-4 py-3 font-medium">Stock</th>
                  <th scope="col" className="px-4 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3">
                      <Link to={`/admin/products/${product.id}`} className="font-medium text-slate-900 underline-offset-2 hover:text-emerald-700 hover:underline">
                        {product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatPrice(product.price)}</td>
                    <td className="px-4 py-3 text-slate-700">{product.stockQuantity}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium " +
                          (product.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")
                        }
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/admin/products/${product.id}`}
                          className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === product.id}
                          onClick={() => void remove(product)}
                          className="inline-flex h-8 items-center rounded-md border border-red-200 bg-white px-3 text-xs font-medium text-red-700 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === product.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted mt-3 text-xs">
            {products.length} {products.length === 1 ? "product" : "products"}
          </p>
        </section>
      )}
    </main>
  );
}

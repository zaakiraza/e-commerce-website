import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { admin_products_create, admin_products_get, admin_products_update } from "../api";
import { ApiError } from "../http";
import { ErrorMessage, LoadingSpinner } from "../components/Shared";

/** Admin Product Form — create (/admin/products/new) and edit (/admin/products/:id). */

type FormValues = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  images: string;
};

type FieldName = keyof FormValues;

const EMPTY_VALUES: FormValues = { name: "", description: "", price: "", stockQuantity: "", images: "" };

function parseImageUrls(raw: string): string[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function validate(values: FormValues, mode: "create" | "edit"): Partial<Record<FieldName, string>> {
  const errors: Partial<Record<FieldName, string>> = {};
  if (values.name.trim().length === 0) errors.name = "Name is required.";
  const price = Number(values.price);
  if (values.price.trim() === "" || !Number.isFinite(price) || price <= 0) errors.price = "Price must be greater than 0.";
  const stock = Number(values.stockQuantity);
  if (values.stockQuantity.trim() === "" || !Number.isFinite(stock) || stock < 0) errors.stockQuantity = "Stock cannot be negative.";
  if (mode === "create" && parseImageUrls(values.images).length === 0) errors.images = "At least one image URL is required.";
  return errors;
}

/** Nest class-validator 400 bodies: attach each message to the field it mentions. */
function fieldErrorsFrom400(body: unknown): { fields: Partial<Record<FieldName, string>>; rest: string[] } {
  const raw = (body as { message?: unknown } | null)?.message;
  const messages = Array.isArray(raw) ? raw.map(String) : typeof raw === "string" ? [raw] : [];
  const fields: Partial<Record<FieldName, string>> = {};
  const rest: string[] = [];
  for (const message of messages) {
    const low = message.toLowerCase();
    if (low.includes("stock")) fields.stockQuantity = message;
    else if (low.includes("price")) fields.price = message;
    else if (low.includes("image")) fields.images = message;
    else if (low.includes("description")) fields.description = message;
    else if (low.includes("name")) fields.name = message;
    else rest.push(message);
  }
  return { fields, rest };
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-sm text-[#b42318]" role="alert">
      {message}
    </p>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      <div className="mt-1">{children}</div>
      <FieldError message={error} />
    </div>
  );
}

const inputClass =
  "block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#0f6e56] focus:outline-none focus:ring-1 focus:ring-[#0f6e56] disabled:cursor-not-allowed disabled:bg-slate-100";

function SkeletonField({ wide }: { wide?: boolean }) {
  return (
    <div className={wide ? "space-y-2" : "space-y-2 max-w-sm"}>
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="h-10 w-full animate-pulse rounded-md bg-slate-200" />
    </div>
  );
}

function SkeletonForm() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <SkeletonField />
      <SkeletonField wide />
      <div className="grid gap-5 sm:grid-cols-2">
        <SkeletonField />
        <SkeletonField />
      </div>
      <SkeletonField wide />
    </div>
  );
}

export function SCREEN010() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id && id !== "new");

  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [loading, setLoading] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadTick, setLoadTick] = useState(0);

  const setField = (field: FieldName, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] ? { ...current, [field]: undefined } : current));
  };

  useEffect(() => {
    if (!isEdit || !id) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(undefined);
    setNotFound(false);
    admin_products_get(id)
      .then((product) => {
        if (cancelled) return;
        setValues({
          name: product.name,
          description: typeof product.description === "string" ? product.description : "",
          price: String(product.price),
          stockQuantity: String(product.stockQuantity),
          images: product.images.join("\n"),
        });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        if (error instanceof ApiError && error.status === 404) setNotFound(true);
        else setLoadError(error instanceof Error ? error.message : "Could not load this product. Try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, loadTick]);

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(undefined);
      const nextErrors = validate(values, isEdit ? "edit" : "create");
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
      const price = Number(values.price);
      const stockQuantity = Number(values.stockQuantity);
      const body = {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
        price,
        stockQuantity,
        images: parseImageUrls(values.images),
      };
      setSaving(true);
      try {
        if (isEdit && id) await admin_products_update(id, body);
        else await admin_products_create(body);
        navigate("/admin/products");
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.status === 400) {
            const { fields, rest } = fieldErrorsFrom400(error.body);
            setErrors(fields);
            setFormError(rest.length > 0 ? rest.join(", ") : "Please fix the highlighted fields. Nothing was saved.");
          } else if (error.status === 403) {
            setFormError("Unauthorized");
          } else {
            setFormError(error.message);
          }
        } else {
          setFormError(error instanceof Error ? error.message : "Could not save this product. Try again.");
        }
      } finally {
        setSaving(false);
      }
    },
    [values, isEdit, id, navigate],
  );

  const previewUrls = parseImageUrls(values.images).slice(0, 6);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500">Admin</p>
      <h1 className="mt-1 text-2xl font-semibold text-slate-900">
        {isEdit ? "Edit product" : "New product"}
      </h1>

      {loading ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <SkeletonForm />
        </div>
      ) : notFound ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-700">Product not found</p>
          <button
            type="button"
            onClick={() => navigate("/admin/products")}
            className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0f6e56] focus:ring-offset-2"
          >
            Back to products
          </button>
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <ErrorMessage>{loadError}</ErrorMessage>
          <p className="mt-2 text-sm text-slate-600">Could not load this product. Try again.</p>
          <button
            type="button"
            onClick={() => setLoadTick((tick) => tick + 1)}
            className="mt-4 rounded-md bg-[#0f6e56] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c5a46] focus:outline-none focus:ring-2 focus:ring-[#0f6e56] focus:ring-offset-2"
          >
            Try again
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          {formError ? (
            <div className="rounded-md border border-[#f4c7c3] bg-[#fdf3f2] px-4 py-3">
              <ErrorMessage>{formError}</ErrorMessage>
            </div>
          ) : null}

          <Field id="product-name" label="Name" error={errors.name}>
            <input
              id="product-name"
              name="name"
              type="text"
              value={values.name}
              onChange={(event) => setField("name", event.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </Field>

          <Field id="product-description" label="Description" error={errors.description}>
            <textarea
              id="product-description"
              name="description"
              rows={4}
              value={values.description}
              onChange={(event) => setField("description", event.target.value)}
              disabled={saving}
              className={inputClass}
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field id="product-price" label="Price" error={errors.price}>
              <input
                id="product-price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={values.price}
                onChange={(event) => setField("price", event.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </Field>
            <Field id="product-stock" label="Stock quantity" error={errors.stockQuantity}>
              <input
                id="product-stock"
                name="stockQuantity"
                type="number"
                min="0"
                step="1"
                value={values.stockQuantity}
                onChange={(event) => setField("stockQuantity", event.target.value)}
                disabled={saving}
                className={inputClass}
              />
            </Field>
          </div>

          <Field id="product-images" label="Image URLs" error={errors.images} hint="One URL per line.">
            <textarea
              id="product-images"
              name="images"
              rows={4}
              value={values.images}
              onChange={(event) => setField("images", event.target.value)}
              disabled={saving}
              className={`${inputClass} font-mono text-xs`}
            />
          </Field>

          {previewUrls.length > 0 ? (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Preview</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {previewUrls.map((url) => (
                  <img
                    key={url}
                    src={url}
                    alt=""
                    className="h-20 w-20 rounded-md border border-slate-200 object-cover"
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3 border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-[#0f6e56] px-4 py-2 text-sm font-medium text-white hover:bg-[#0c5a46] focus:outline-none focus:ring-2 focus:ring-[#0f6e56] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? <LoadingSpinner /> : null}
              {saving ? "Saving…" : "Save product"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/admin/products")}
              disabled={saving}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0f6e56] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

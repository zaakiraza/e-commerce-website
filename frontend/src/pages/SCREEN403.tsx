import { Link } from "react-router-dom";
import { Card } from "../components/Shared";

/** Forbidden (/403) — static error chrome for unauthorized access. */
export function SCREEN403() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-16">
      <Card className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[var(--bad)]">
          Error 403
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--ink)]">
          Forbidden
        </h1>
        <p className="mt-3 text-[var(--muted)]">
          You do not have permission to view this page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          Go to catalog
        </Link>
      </Card>
    </main>
  );
}

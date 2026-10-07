import { LoadingSpinner, EmptyState } from "../components/Shared";

/** Stub for Order Confirmation (/orders/:id/confirmation) — builder fills this screen. */
export function SCREEN005() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Order Confirmation</h1>
      <LoadingSpinner />
      <EmptyState>Loading Order Confirmation…</EmptyState>
    </main>
  );
}

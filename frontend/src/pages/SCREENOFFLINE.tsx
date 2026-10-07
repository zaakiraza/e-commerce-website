import { Card } from "../components/Shared";

/**
 * Offline (/offline) — static chrome shown when the network is unavailable.
 * Panel message + "Try again" button that reloads the app.
 */
export function SCREENOFFLINE() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md text-center">
        <div
          aria-hidden="true"
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--line)] bg-[var(--bg)]"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--bad)]" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-[var(--ink)]">
          You are offline
        </h1>
        <p className="muted mb-5 text-sm">
          You are offline. Check your connection and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2"
        >
          Try again
        </button>
      </Card>
    </main>
  );
}

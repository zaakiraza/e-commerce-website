import { Link } from "react-router-dom";
import { Card } from "../components/Shared";

/** Not Found (/404) — static error chrome for unknown routes. */
export function SCREEN404() {
  return (
    <main className="p-6">
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center">
        <Card className="w-full text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#5b6b7c]">
            Error 404
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Page not found.</h1>
          <p className="muted mt-2 text-sm">
            The page you are looking for does not exist or has moved.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-md bg-[#0f6e56] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6e56] focus-visible:ring-offset-2"
          >
            Go to catalog
          </Link>
        </Card>
      </div>
    </main>
  );
}

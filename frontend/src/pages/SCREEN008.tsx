import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth_login, auth_logout } from "../api";
import { ErrorMessage, LoadingSpinner } from "../components/Shared";
import { AuthFrame } from "../shell";
import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, DEMO_USER_EMAIL, DEMO_USER_PASSWORD, HOME_ROUTE } from "../flow";
import { ApiError, getAuthToken } from "../http";

/** Sign In (/signin) — email + password sign-in with the demo accounts one click away. */
export function SCREEN008() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? HOME_ROUTE;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Landing on /signin while a stale token is still held (e.g. after a 401): end that server session.
  useEffect(() => {
    if (!getAuthToken()) return;
    void auth_logout().catch(() => undefined);
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await auth_login({ email: email.trim(), password: password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err : new Error("Could not sign in. Try again."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthFrame>
      <main className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-16">
      <div className="card p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Sign In</h1>
        <p className="muted mt-1 text-sm">Sign in to see your cart, orders, and admin tools.</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1">
            <label htmlFor="signin-email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="signin-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="signin-password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="signin-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-700/20"
            />
          </div>

          {error ? <ErrorMessage>{error.message}</ErrorMessage> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center rounded-md bg-emerald-700 px-6 text-sm font-medium text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? (
              <>
                <LoadingSpinner />
                <span className="ml-2">Signing in…</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="muted text-xs">Demo accounts:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_USER_EMAIL);
                setPassword(DEMO_USER_PASSWORD);
              }}
              className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Use demo user
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail(DEMO_ADMIN_EMAIL);
                setPassword(DEMO_ADMIN_PASSWORD);
              }}
              className="inline-flex h-8 items-center rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              Use demo admin
            </button>
          </div>
        </div>
      </div>
      </main>
    </AuthFrame>
  );
}

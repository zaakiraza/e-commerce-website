import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth";
import { getAuthSession } from "./http";
import { auth_logout } from "./api";
import { ADMIN, CREATE, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, DEMO_USER_EMAIL, DEMO_USER_PASSWORD, HOME_ROUTE, LOGIN_ROUTE, NAV, PRODUCT, SIGNUP_ROUTE } from "./flow";

interface SessionValue {
  loading: boolean;
  user: unknown;
  admin: boolean;
}

const Session = createContext<SessionValue>({ loading: false, user: null, admin: false });

export function accountName(user: unknown): string {
  const row = record(user);
  const nested = record(row?.user) ?? row;
  if (!nested) return "Account";
  for (const key of ["name", "fullName", "displayName", "email"]) {
    const value = nested[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "Account";
}

export function accountIsAdmin(user: unknown): boolean {
  const row = record(user);
  const nested = record(row?.user) ?? row;
  if (!nested) return false;
  const role = nested.role ?? nested.userRole;
  if (typeof role === "string" && /admin/i.test(role)) return true;
  if (Array.isArray(nested.roles) && nested.roles.some((item) => /admin/i.test(String(item)))) return true;
  return nested.isAdmin === true;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

export function SessionGate({ children }: { children: ReactNode }) {
  const { signedIn } = useAuth();
  const [user, setUser] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!signedIn) {
      setUser(null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
      setUser(getAuthSession() ?? null);
      setLoading(false);
    return () => {
      live = false;
    };
  }, [signedIn]);
  return <Session.Provider value={{ loading, user, admin: accountIsAdmin(user) }}>{children}</Session.Provider>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const session = useContext(Session);
  if (session.loading) return null;
  if (!session.admin) return <Navigate to={HOME_ROUTE} replace />;
  return <>{children}</>;
}

const ICON_FONT = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#8882"/><path d="M150 190l35-45 30 35 20-25 35 35z" fill="#8886"/><circle cx="165" cy="125" r="14" fill="#8886"/></svg>');

/** Icon font and broken-image fallback, once per page load. */
function useShellAssets(): void {
  useEffect(() => {
    if (!document.querySelector('link[href*="Material+Symbols"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = ICON_FONT;
      document.head.appendChild(link);
    }
    const onError = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.src !== PLACEHOLDER) {
        target.src = PLACEHOLDER;
      }
    };
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
  }, []);
}

function Icon({ name }: { name: string }) {
  return (
    <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20, lineHeight: 1 }}>
      {name}
    </span>
  );
}

const LINE = { borderColor: "rgba(127,127,127,0.22)" };
const ACTIVE = { background: "rgba(127,127,127,0.16)" };

function NavLink({ to, label, icon, active }: { to: string; label: string; icon: string; active: boolean }) {
  return (
    <Link to={to} className="flex h-10 items-center gap-3 rounded-md px-4 text-sm" style={active ? ACTIVE : { opacity: 0.72 }}>
      <Icon name={icon} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

function isActive(pathname: string, route: string): boolean {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function AppShell({ children }: { children: ReactNode }) {
  useShellAssets();
  const { signedIn, signOut } = useAuth();
  const session = useContext(Session);
  const location = useLocation();
  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r" style={LINE}>
        <div className="flex h-16 items-center px-5 font-semibold">{PRODUCT}</div>
        <nav className="flex flex-col gap-1 px-3">
          {NAV.map((item) => (
            <NavLink key={item.route} to={item.route} label={item.name} icon="radio_button_unchecked" active={isActive(location.pathname, item.route)} />
          ))}
          {session.admin && ADMIN.length ? (
            <>
              <p className="mt-5 px-4 pb-1 text-xs uppercase tracking-wide" style={{ opacity: 0.55 }}>
                Admin
              </p>
              {ADMIN.map((item) => (
                <NavLink key={item.route} to={item.route} label={item.name.replace(/^admin( dashboard)?\s*[-–—:]?\s*/i, "")} icon="radio_button_unchecked" active={isActive(location.pathname, item.route)} />
              ))}
            </>
          ) : null}
        </nav>
        <div className="mt-auto border-t p-3" style={LINE}>
          {signedIn ? (
            <button type="button" className="flex h-10 w-full items-center gap-3 rounded-md px-4 text-sm" style={{ opacity: 0.72 }} onClick={() => { void auth_logout().catch(() => undefined).finally(signOut); }}>
              <Icon name="logout" />
              Sign out
            </button>
          ) : (
            <Link to={LOGIN_ROUTE} className="flex h-10 items-center gap-3 rounded-md px-4 text-sm">
              <Icon name="login" />
              Sign in
            </Link>
          )}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-end gap-3 border-b px-6" style={LINE}>
          {CREATE.map((item) => (
            <Link key={item.route} to={item.route} className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm font-medium" style={LINE}>
              <Icon name="add" />
              {item.label}
            </Link>
          ))}
          {signedIn ? (
            <span className="flex items-center gap-2 text-sm">
              <Icon name="account_circle" />
              {accountName(session.user)}
            </span>
          ) : (
            <>
              <Link to={LOGIN_ROUTE} className="text-sm">
                Sign in
              </Link>
              {SIGNUP_ROUTE ? (
                <Link to={SIGNUP_ROUTE} className="flex h-9 items-center rounded-md border px-3 text-sm font-medium" style={LINE}>
                  Sign up
                </Link>
              ) : null}
            </>
          )}
        </header>
        {children}
      </div>
    </div>
  );
}

/** Sign in and sign up always reach each other, whatever the page drew. */
export function AuthFrame({ children }: { children: ReactNode }) {
  useShellAssets();
  const location = useLocation();
  const onSignup = Boolean(SIGNUP_ROUTE) && location.pathname === SIGNUP_ROUTE;
  const other = onSignup ? LOGIN_ROUTE : SIGNUP_ROUTE;
  return (
    <>
      {children}
      <p className="px-4 pb-4 text-center text-xs" style={{ opacity: 0.72 }}>
        Demo admin {DEMO_ADMIN_EMAIL} / {DEMO_ADMIN_PASSWORD}
        <br />
        Demo user {DEMO_USER_EMAIL} / {DEMO_USER_PASSWORD}
      </p>
      {other ? (
        <p className="pb-10 text-center text-sm" style={{ opacity: 0.8 }}>
          {onSignup ? "Already have an account? " : "New here? "}
          <Link to={other} className="font-medium underline">
            {onSignup ? "Sign in" : "Create an account"}
          </Link>
        </p>
      ) : null}
    </>
  );
}

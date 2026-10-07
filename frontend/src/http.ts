/** Shared fetch for the live Nest backend (VITE_API_URL). Persists JWT across reloads. */
const BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? "").replace(/\/$/, "");
const TOKEN_KEY = "ai-factory-auth-token";

function readStoredToken(): string | undefined {
  try {
    return localStorage.getItem(TOKEN_KEY) || undefined;
  } catch {
    return undefined;
  }
}

let token: string | undefined = readStoredToken();
const listeners = new Set<(token: string | undefined) => void>();
const SESSION_KEY = "ai-factory-auth-session";

/** Store (or clear) the bearer token used by request(). Login/register ops of the generated client call it. */
export function setAuthToken(next?: string): void {
  token = next || undefined;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
  } catch {
    /* private mode / SSR */
  }
  listeners.forEach((listener) => listener(token));
}

/** The login/register response without the token: name and role for the shell when the API has no /me. */
export function setAuthSession(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const rest = { ...(body as Record<string, unknown>) };
  for (const key of ["accessToken", "token", "access_token", "refreshToken", "sessionToken", "session_token"]) delete rest[key];
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(rest));
  } catch {
    /* private mode / SSR */
  }
}

export function getAuthSession(): unknown {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export function getAuthToken(): string | undefined {
  return token;
}

/** Subscribe to sign-in / sign-out; returns the unsubscribe function (fits useEffect). */
export function onAuthTokenChange(listener: (token: string | undefined) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function apiBase(): string {
  return BASE;
}

/** A non-2xx answer. `message` is the backend's own message (Nest: string or string[]). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!BASE) {
    throw new ApiError(0, "VITE_API_URL is not set");
  }
  const res = await fetch(`${BASE}${path.startsWith("/") ? path : `/${path}`}`, {
    method,
    headers: {
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    let parsed: unknown;
    try {
      parsed = text ? JSON.parse(text) : undefined;
    } catch {
      parsed = undefined;
    }
    const raw = (parsed as { message?: unknown } | undefined)?.message;
    const message = Array.isArray(raw) ? raw.join(", ") : typeof raw === "string" ? raw : text || res.statusText;
    if (res.status === 401 && token) setAuthToken(undefined);
    throw new ApiError(res.status, message, parsed);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

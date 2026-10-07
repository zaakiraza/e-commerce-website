// cart-session.ts: guest cart identity. The contract documents a "session cart, cookie or
// session-scoped" cart: the `cart_session` cookie is that identifier, issued on the first
// guest request and echoed back by the client on every cart call.
import type { Request, Response } from "express";

export const CART_SESSION_COOKIE = "cart_session";
const MAX_SESSION_LENGTH = 128;

/** The guest session from the `X-Cart-Session` header or the `cart_session` cookie; null when absent. */
export function readCartSession(request: Request): string | null {
  const header = request.headers["x-cart-session"];
  const fromHeader = Array.isArray(header) ? header[0] : header;
  if (fromHeader && fromHeader.length <= MAX_SESSION_LENGTH) {
    return fromHeader;
  }
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() !== CART_SESSION_COOKIE) {
      continue;
    }
    const value = part.slice(separator + 1).trim();
    return value.length > 0 && value.length <= MAX_SESSION_LENGTH ? value : null;
  }
  return null;
}

/** Issues a fresh guest session cookie; only called for guests that do not have one yet. */
export function writeCartSession(response: Response, sessionId: string): void {
  response.cookie(CART_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
}

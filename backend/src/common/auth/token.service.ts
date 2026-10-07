import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { AuthUser } from "./auth-user";

/** Tokens revoked by sign-out; kept for the lifetime of this process. */
const revokedTokens = new Set<string>();

/** Issues and verifies access tokens. The secret comes only from `JWT_SECRET`. */
@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(user: AuthUser): string {
    return this.jwt.sign({ sub: user.id });
  }

  /** Server-side sign-out: the token no longer verifies on any secured route. */
  revoke(token: string): void {
    if (token) {
      revokedTokens.add(token);
    }
  }

  /** @returns the caller, or null when the token is malformed, expired, forged or revoked. */
  verify(token: string): AuthUser | null {
    if (revokedTokens.has(token)) {
      return null;
    }
    try {
      const payload = this.jwt.verify<{ sub?: unknown }>(token);
      return typeof payload.sub === "string" ? { id: payload.sub } : null;
    } catch {
      return null;
    }
  }
}

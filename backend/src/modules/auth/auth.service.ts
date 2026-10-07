// auth.service.ts: credential check and server-side sign-out for the `auth` tag.
import { eq } from "drizzle-orm";
import { Inject, Injectable } from "@nestjs/common";
import { TokenService, verifyPassword } from "../../common/auth";
import { AppError } from "../../common/errors";
import { DB, type Db } from "../../db/db.module";
import { users } from "../../db/schema";
import { CartService } from "../cart/cart.service";
import type { LoginInput, LoginResponse } from "./auth.schemas";

@Injectable()
export class AuthService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly tokens: TokenService,
    private readonly carts: CartService,
  ) {}

  /** Verifies credentials and issues a bearer token; never reveals which part failed. */
  async login(input: LoginInput, guestSessionId: string | null): Promise<LoginResponse> {
    const email = input.email.trim().toLowerCase();
    const user = this.db
      .select({ id: users.id, email: users.email, role: users.role, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .get();
    const passwordOk = user ? await verifyPassword(input.password, user.passwordHash) : false;
    if (!user || !passwordOk) {
      throw new AppError("UNAUTHENTICATED", 401, "Invalid email or password");
    }
    // The guest cart carried by the session cookie folds into the user's persisted cart.
    if (guestSessionId) {
      this.carts.mergeGuestCart(guestSessionId, user.id);
    }
    const accessToken = this.tokens.sign({ id: user.id });
    return {
      accessToken,
      token: accessToken, // documented alias, retained for spec compatibility
      user: { id: user.id, email: user.email, role: user.role },
    };
  }

  /** Signs the caller out by revoking their token server-side; it no longer verifies anywhere. */
  logout(authorization: string | undefined): void {
    const token = authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
    if (token) {
      this.tokens.revoke(token);
    }
  }
}

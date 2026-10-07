import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AppError } from "../errors";
import type { AuthUser } from "./auth-user";
import { TokenService } from "./token.service";

/** `@UseGuards(JwtAuthGuard)` on secured operations. Sets `request.user`, or throws 401 UNAUTHENTICATED. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokenService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { user?: AuthUser }>();
    const header = request.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";
    const user = token ? this.tokens.verify(token) : null;
    if (!user) {
      throw new AppError("UNAUTHENTICATED", 401, "Authentication required");
    }
    request.user = user;
    return true;
  }
}

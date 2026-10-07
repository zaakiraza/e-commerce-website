// auth.controller.ts: thin; one handler per auth operationId, named exactly like it.
import { Body, Controller, Headers, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { JwtAuthGuard } from "../../common/auth";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { readCartSession } from "../cart/cart-session";
import { LoginSchema, type LoginInput, type LoginResponse } from "./auth.schemas";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Post("login")
  @HttpCode(200) // the contract documents 200 for sign-in, not the Nest POST default 201
  auth_login(
    @Body(new ZodValidationPipe(LoginSchema)) body: LoginInput,
    @Req() request: Request,
  ): Promise<LoginResponse> {
    return this.service.login(body, readCartSession(request));
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  auth_logout(@Headers("authorization") authorization?: string): void {
    this.service.logout(authorization);
  }
}

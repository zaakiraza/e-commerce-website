// cart.controller.ts: thin; one handler per cart operationId, named exactly like it. Cart
// routes are unsecured: the caller is resolved per request (user token or guest session cookie).
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AddCartItemSchema, UpdateCartItemSchema, type AddCartItemInput, type CartResponse, type UpdateCartItemInput } from "./cart.schemas";
import { CartService } from "./cart.service";

@Controller("cart")
export class CartController {
  constructor(private readonly service: CartService) {}

  @Get()
  cart_get(@Req() request: Request, @Res({ passthrough: true }) response: Response): CartResponse {
    return this.service.getCart(this.service.resolveCaller(request, response));
  }

  @Post("items")
  @HttpCode(200) // the contract documents "200 Updated cart", not the Nest POST default 201
  cart_items_add(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Body(new ZodValidationPipe(AddCartItemSchema)) body: AddCartItemInput,
  ): CartResponse {
    return this.service.addItem(this.service.resolveCaller(request, response), body);
  }

  @Patch("items/:id")
  cart_items_update(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(UpdateCartItemSchema)) body: UpdateCartItemInput,
  ): CartResponse {
    return this.service.updateItem(this.service.resolveCaller(request, response), id, body);
  }

  @Delete("items/:id")
  cart_items_remove(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
    @Param("id") id: string,
  ): CartResponse {
    return this.service.removeItem(this.service.resolveCaller(request, response), id);
  }
}

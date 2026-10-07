// cart.module.ts: wires the `cart` tag. Exports CartService so the auth tag can merge a guest
// cart into the user's cart on sign-in.
import { Module } from "@nestjs/common";
import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

@Module({
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}

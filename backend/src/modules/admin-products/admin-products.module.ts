// admin-products.module.ts: wires the `admin-products` tag. DB comes from the global DbModule.
import { Module } from "@nestjs/common";
import { AdminProductsController } from "./admin-products.controller";
import { AdminProductsService } from "./admin-products.service";

@Module({
  controllers: [AdminProductsController],
  providers: [AdminProductsService],
})
export class AdminProductsModule {}

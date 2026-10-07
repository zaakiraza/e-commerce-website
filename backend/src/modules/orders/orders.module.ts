// orders.module.ts: wires the `orders` tag. DB comes from the global DbModule.
import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}

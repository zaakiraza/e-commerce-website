// admin-orders.module.ts: wires the `admin-orders` tag. DB comes from the global DbModule.
import { Module } from "@nestjs/common";
import { AdminOrdersController } from "./admin-orders.controller";
import { AdminOrdersService } from "./admin-orders.service";

@Module({
  controllers: [AdminOrdersController],
  providers: [AdminOrdersService],
})
export class AdminOrdersModule {}

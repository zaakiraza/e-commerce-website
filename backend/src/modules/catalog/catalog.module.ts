// catalog.module.ts: wires the `catalog` tag. DB comes from the global DbModule.
import { Module } from "@nestjs/common";
import { CatalogController } from "./catalog.controller";
import { CatalogService } from "./catalog.service";

@Module({
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}

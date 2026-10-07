import { Module, type Type } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { AuthModule } from "./common/auth";
import { AllExceptionsFilter } from "./common/errors";
import { DbModule } from "./db/db.module";
import { HealthModule } from "./health/health.module";
import { AdminOrdersModule } from "./modules/admin-orders/admin-orders.module";
import { AdminProductsModule } from "./modules/admin-products/admin-products.module";
import { AuthFeatureModule } from "./modules/auth/auth.module";
import { CartModule } from "./modules/cart/cart.module";
import { CatalogModule } from "./modules/catalog/catalog.module";
import { OrdersModule } from "./modules/orders/orders.module";

/**
 * Feature modules, one per OpenAPI tag (`src/modules/<tag>/<tag>.module.ts`).
 * Add each new module here; the contract check only sees routes reachable from AppModule.
 */
export const FEATURE_MODULES: Type<unknown>[] = [
  AuthFeatureModule,
  CatalogModule,
  CartModule,
  OrdersModule,
  AdminProductsModule,
  AdminOrdersModule,
];

@Module({
  imports: [DbModule, AuthModule, HealthModule, ...FEATURE_MODULES],
  // Registered as a provider (not only in main.ts) so tests built from AppModule get the same envelope.
  providers: [{ provide: APP_FILTER, useClass: AllExceptionsFilter }],
})
export class AppModule {}

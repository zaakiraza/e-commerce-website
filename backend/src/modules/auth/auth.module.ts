// auth.module.ts: wires the `auth` tag. Named AuthFeatureModule to avoid clashing with the
// global common/auth AuthModule. DB and TokenService come from global modules; CartModule
// supplies CartService for the guest-cart merge on sign-in.
import { Module } from "@nestjs/common";
import { CartModule } from "../cart/cart.module";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";

@Module({
  imports: [CartModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthFeatureModule {}

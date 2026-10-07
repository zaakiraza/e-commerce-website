import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

/** Boots the API. Config from env: DATABASE_URL, JWT_SECRET, PORT, SEED_DEMO, CORS_ORIGIN. */
async function bootstrap(): Promise<void> {
  // Migrations and the demo seed run in DbModule's factory while the module graph builds.
  const app = await NestFactory.create(AppModule);
  const origin = process.env.CORS_ORIGIN?.trim();
  if (origin) {
    app.enableCors({ origin, credentials: true });
  }
  app.enableShutdownHooks();
  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap();

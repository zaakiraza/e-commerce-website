import { Global, Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { applyMigrations, openDatabase, type Db } from "./database";
import { seedDemo } from "./seed";

/** Injection token for the Drizzle database: `constructor(@Inject(DB) private readonly db: Db)`. */
export const DB = "DB";
export type { Db };

@Global()
@Module({
  providers: [
    {
      provide: DB,
      // Migrations and the demo seed run here rather than only in main.ts, so any boot
      // path that builds AppModule starts from a migrated, seeded database. Tests that
      // override this provider keep full control over their own database.
      useFactory: async (): Promise<Db> => {
        const db = openDatabase(process.env.DATABASE_URL ?? "file:./data/app.db");
        applyMigrations(db);
        if (process.env.SEED_DEMO !== "0") {
          await seedDemo(db);
        }
        return db;
      },
    },
  ],
  exports: [DB],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DB) private readonly db: Db) {}

  onApplicationShutdown(): void {
    this.db.$client.close();
  }
}

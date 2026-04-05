import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

const runMigrate = async () => {
  if (!process.env.POSTGRES_URL) {
    console.log("POSTGRES_URL not defined, skipping migrations");
    process.exit(0);
  }

  const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
  const db = drizzle(connection);

  console.log("Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("Migrations completed in", end - start, "ms");

  try {
    await connection.unsafe(`
      INSERT INTO "User" ("id", "email", "isAnonymous", "createdAt", "updatedAt")
      VALUES ('00000000-0000-0000-0000-000000000001', 'anonymous@local', true, now(), now())
      ON CONFLICT ("id") DO NOTHING
    `);
    console.log("Anonymous user seed applied (for no-auth artifact storage).");
  } catch (seedError) {
    console.warn("Anonymous user seed skipped:", seedError);
  }

  process.exit(0);
};

runMigrate().catch((err) => {
  console.error("Migration failed");
  console.error(err);
  process.exit(1);
});

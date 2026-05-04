import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

config({ path: "apps/api/.env" });
config({ path: ".env", override: false });

export default defineConfig({
  schema: "apps/api/prisma/schema.prisma",
  migrations: {
    path: "apps/api/prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});

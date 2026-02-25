import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * Prisma 7 requires adapter or accelerateUrl
 * Here we use Postgres driver adapter
 */

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter
});
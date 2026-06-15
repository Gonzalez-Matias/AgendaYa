import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}
const adapter = new PrismaPg({ connectionString: databaseUrl });

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development"
    ? ["query", "error", "warn"]
    : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
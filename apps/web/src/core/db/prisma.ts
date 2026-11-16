import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function createClient(url: string) {
  // The mariadb driver speaks MySQL too, but expects the mariadb:// scheme.
  const adapter = new PrismaMariaDb(url.replace(/^mysql:\/\//, "mariadb://"));
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient; prismaUrl?: string };

function getClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Rebuild if .env changed while `next dev` was running (it reloads env, not globals).
  if (!globalForPrisma.prisma || globalForPrisma.prismaUrl !== url) {
    void globalForPrisma.prisma?.$disconnect();
    globalForPrisma.prisma = createClient(url);
    globalForPrisma.prismaUrl = url;
  }
  return globalForPrisma.prisma;
}

/**
 * Created on first use, not at import, so a missing DATABASE_URL surfaces
 * inside the caller's try/catch instead of crashing module load.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

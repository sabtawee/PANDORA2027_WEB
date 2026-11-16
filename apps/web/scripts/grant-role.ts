/**
 * Give a user a role. The user must have signed in once first.
 *   npm run admin:grant -- you@example.com           (ADMIN)
 *   npm run admin:grant -- you@example.com EDITOR
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient, Role } from "../src/generated/prisma/client";

const [email, roleArg = "ADMIN"] = process.argv.slice(2);
const role = roleArg.toUpperCase() as Role;

if (!email || !(role in Role)) {
  console.error("Usage: npm run admin:grant -- <email> [USER|EDITOR|GM|ADMIN]");
  process.exit(1);
}

const url = process.env.DATABASE_URL!.replace(/^mysql:\/\//, "mariadb://");
const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) });

prisma.user
  .update({ where: { email }, data: { role } })
  .then((u) => console.log(`${u.email} is now ${u.role}`))
  .catch((e) => {
    console.error(e.code === "P2025" ? `No user with email ${email} — sign in on the site first.` : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

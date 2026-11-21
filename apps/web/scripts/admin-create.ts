/**
 * Create a back-office staff account, or reset its password if it exists.
 * Prints a one-time temporary password that must be changed at first login.
 *
 *   npm run admin:create -w web -- <username> [SUPER_ADMIN|ADMIN|EDITOR] ["Display Name"]
 *
 * Use this for the very first Super Admin, and to recover a locked-out account.
 * Everyone else should be created from /admin/admins.
 */
import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { generateTempPassword, hashPassword } from "../src/core/admin/password";
import { AdminRole, PrismaClient } from "../src/generated/prisma/client";

const [usernameArg, roleArg = "SUPER_ADMIN", displayNameArg] = process.argv.slice(2);
const username = usernameArg?.trim().toLowerCase();
const role = roleArg.toUpperCase() as AdminRole;

if (!username || !/^[a-z0-9._-]{3,40}$/.test(username) || !(role in AdminRole)) {
  console.error('Usage: npm run admin:create -w web -- <username> [SUPER_ADMIN|ADMIN|EDITOR] ["Display Name"]');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(process.env.DATABASE_URL!.replace(/^mysql:\/\//, "mariadb://")) });

async function main() {
  const tempPassword = generateTempPassword();
  const passwordHash = await hashPassword(tempPassword);
  const existing = await prisma.adminUser.findUnique({ where: { username } });

  if (existing) {
    await prisma.$transaction([
      prisma.adminUser.update({
        where: { id: existing.id },
        data: { passwordHash, mustChangePassword: true, failedAttempts: 0, lockedUntil: null, isActive: true, passwordChangedAt: new Date() },
      }),
      prisma.adminSession.deleteMany({ where: { adminId: existing.id } }),
      prisma.auditLog.create({
        data: { op: "SECURITY", action: "admin.password.reset.cli", entity: "admin", target: username, data: { via: "scripts/admin-create" } },
      }),
    ]);
    console.log(`Reset password for existing admin "${username}" (${existing.role}).`);
  } else {
    const created = await prisma.adminUser.create({
      data: { username, displayName: displayNameArg?.trim() || username, role, passwordHash, mustChangePassword: true },
    });
    await prisma.auditLog.create({
      data: {
        op: "CREATE",
        action: "admin.create.cli",
        entity: "admin",
        target: username,
        after: { username, displayName: created.displayName, role, isActive: true },
        data: { via: "scripts/admin-create" },
      },
    });
    console.log(`Created ${role} "${username}".`);
  }
  console.log(`Temporary password (shown once): ${tempPassword}`);
  console.log("Sign in at /admin/login — you will be asked to set a new password.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

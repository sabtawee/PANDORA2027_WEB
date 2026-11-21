import Link from "next/link";
import { adminHasRole } from "@/core/admin/roles";
import { requireAdmin } from "@/core/admin/session";
import type { AdminRole } from "@/generated/prisma/client";
import { logoutAction } from "../login/actions";

const NAV: { href: string; label: string; min: AdminRole }[] = [
  { href: "/admin", label: "ภาพรวม", min: "ADMIN" },
  { href: "/admin/users", label: "ผู้เล่น", min: "ADMIN" },
  { href: "/admin/fraud", label: "Fraud Review", min: "ADMIN" },
  { href: "/admin/news", label: "ข่าวสาร", min: "EDITOR" },
  { href: "/admin/settings", label: "ตั้งค่าเว็บ", min: "ADMIN" },
  { href: "/admin/quests", label: "ภารกิจ / แต้ม", min: "ADMIN" },
  { href: "/admin/milestones", label: "Milestones", min: "ADMIN" },
  { href: "/admin/tiers", label: "Reward Tiers", min: "ADMIN" },
  { href: "/admin/audit", label: "Audit Log", min: "ADMIN" },
  { href: "/admin/logins", label: "ประวัติเข้าระบบ", min: "ADMIN" },
  { href: "/admin/admins", label: "บัญชีแอดมิน", min: "SUPER_ADMIN" },
];

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  // Each page and action also checks its own role; this only builds the menu.
  const admin = await requireAdmin("EDITOR", { allowPasswordChange: true });
  const nav = admin.mustChangePassword ? [] : NAV.filter((n) => adminHasRole(admin.role, n.min));

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="flex flex-col border-b border-line bg-bg-sunken md:w-56 md:shrink-0 md:border-r md:border-b-0">
        <div className="p-4">
          <Link href={adminHasRole(admin.role, "ADMIN") ? "/admin" : "/admin/news"} className="font-semibold text-gilded">
            PANDORA · Admin
          </Link>
          <p className="mt-1 truncate text-xs text-faint">
            {admin.displayName} · {admin.role}
          </p>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-1 md:flex-col md:pb-0">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted hover:bg-bg-raised hover:text-text">
              {n.label}
            </Link>
          ))}
          <Link href="/th" className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-faint hover:text-text">
            ← กลับหน้าเว็บ
          </Link>
        </nav>
        <div className="flex gap-1 px-2 pb-3 md:flex-col md:border-t md:border-line md:pt-3">
          <Link href="/admin/account" className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted hover:bg-bg-raised hover:text-text">
            เปลี่ยนรหัสผ่าน
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="w-full rounded-md px-3 py-2 text-left text-sm whitespace-nowrap text-ember hover:bg-ember/10">
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

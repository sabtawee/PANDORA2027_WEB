import type { Metadata } from "next";
import Link from "next/link";
import { Kanit } from "next/font/google";
import { requireRole } from "@/core/rbac";
import "../globals.css";

const kanit = Kanit({ variable: "--font-kanit", subsets: ["thai", "latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "Admin | PANDORA-RO",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "ภาพรวม" },
  { href: "/admin/settings", label: "ตั้งค่าเว็บ" },
  { href: "/admin/quests", label: "ภารกิจ / แต้ม" },
  { href: "/admin/milestones", label: "Milestones" },
];

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireRole("ADMIN");

  return (
    <html lang="th" className={`${kanit.variable} h-full`}>
      <body className="min-h-full">
        <div className="flex min-h-screen flex-col md:flex-row">
          <aside className="border-b border-line bg-bg-sunken md:w-56 md:shrink-0 md:border-r md:border-b-0">
            <div className="p-4">
              <Link href="/admin" className="font-semibold text-gilded">
                PANDORA · Admin
              </Link>
              <p className="mt-1 truncate text-xs text-faint">{user.email}</p>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:pb-0">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-muted hover:bg-bg-raised hover:text-text">
                  {n.label}
                </Link>
              ))}
              <Link href="/th" className="rounded-md px-3 py-2 text-sm whitespace-nowrap text-faint hover:text-text">
                ← กลับหน้าเว็บ
              </Link>
            </nav>
          </aside>
          <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

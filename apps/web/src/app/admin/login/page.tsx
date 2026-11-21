import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/core/admin/session";
import { AdminLoginForm } from "./LoginForm";

export default async function AdminLoginPage() {
  if (await getCurrentAdmin()) redirect("/admin");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="panel w-full max-w-sm p-8">
        <h1 className="text-center text-xl font-semibold text-gilded">PANDORA · Admin</h1>
        <p className="mt-1 mb-6 text-center text-xs text-faint">สำหรับทีมงานเท่านั้น · ทุกการเข้าระบบถูกบันทึก</p>
        <AdminLoginForm />
      </div>
    </main>
  );
}

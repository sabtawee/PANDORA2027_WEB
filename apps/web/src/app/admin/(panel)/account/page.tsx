import { requireAdmin } from "@/core/admin/session";
import { Card, PageTitle } from "../ui";
import { PasswordForm } from "./PasswordForm";

export default async function AccountPage() {
  const me = await requireAdmin("EDITOR", { allowPasswordChange: true });

  return (
    <>
      <PageTitle sub={`${me.displayName} (@${me.username})`}>เปลี่ยนรหัสผ่าน</PageTitle>
      {me.mustChangePassword && (
        <p className="mb-4 rounded-md border border-gold/40 bg-gold/5 px-3 py-2 text-sm text-gold-bright">
          คุณกำลังใช้รหัสผ่านชั่วคราว ต้องตั้งรหัสผ่านใหม่ก่อนใช้งานเมนูอื่น
        </p>
      )}
      <Card>
        <PasswordForm />
        <p className="mt-4 text-xs text-faint">เปลี่ยนแล้ว เครื่องอื่นที่ล็อกอินบัญชีนี้ค้างไว้จะถูกออกจากระบบทั้งหมด</p>
      </Card>
    </>
  );
}

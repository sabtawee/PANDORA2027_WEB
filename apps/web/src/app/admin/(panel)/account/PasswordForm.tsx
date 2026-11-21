"use client";

import { useActionState } from "react";
import { changePasswordAction, type PasswordState } from "./actions";

const input =
  "w-full rounded-md border border-line bg-bg-sunken px-3 py-2 text-sm text-text placeholder:text-faint focus:border-gold focus:outline-none";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePasswordAction, { error: null });
  return (
    <form action={action} className="max-w-sm space-y-4">
      {state.error && <p role="alert" className="rounded-md border border-ember/50 bg-ember/10 px-3 py-2 text-sm text-ember">{state.error}</p>}
      <label className="block">
        <span className="text-sm text-muted">รหัสผ่านปัจจุบัน</span>
        <input name="current" type="password" required autoComplete="current-password" className={`${input} mt-1`} />
      </label>
      <label className="block">
        <span className="text-sm text-muted">รหัสผ่านใหม่</span>
        <input name="next" type="password" required minLength={10} autoComplete="new-password" className={`${input} mt-1`} />
        <span className="mt-1 block text-xs text-faint">อย่างน้อย 10 ตัว และมี 3 แบบจาก ตัวเล็ก ตัวใหญ่ ตัวเลข สัญลักษณ์</span>
      </label>
      <label className="block">
        <span className="text-sm text-muted">ยืนยันรหัสผ่านใหม่</span>
        <input name="confirm" type="password" required minLength={10} autoComplete="new-password" className={`${input} mt-1`} />
      </label>
      <button type="submit" disabled={pending} className="btn-gold px-5 py-2 text-sm disabled:opacity-50">
        {pending ? "กำลังบันทึก…" : "เปลี่ยนรหัสผ่าน"}
      </button>
    </form>
  );
}

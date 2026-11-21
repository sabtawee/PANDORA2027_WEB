"use client";

import { useActionState } from "react";
import { createAdminAction, resetPasswordAction, type TempPasswordState } from "./actions";

const input =
  "w-full rounded-md border border-line bg-bg-sunken px-3 py-2 text-sm text-text placeholder:text-faint focus:border-gold focus:outline-none";

/** Shows the one-time password right after it is generated. It is never stored or shown again. */
function TempPassword({ state }: { state: TempPasswordState }) {
  if (state.error) return <p role="alert" className="rounded-md border border-ember/50 bg-ember/10 px-3 py-2 text-sm text-ember">{state.error}</p>;
  if (!state.tempPassword) return null;
  return (
    <div className="rounded-md border border-success/40 bg-success/10 px-3 py-2 text-sm">
      <p className="text-success">
        รหัสผ่านชั่วคราวของ <b>{state.username}</b> (แสดงครั้งเดียว ส่งให้เจ้าของบัญชีทางช่องทางส่วนตัว):
      </p>
      <code className="mt-1 block text-base tracking-wide text-text select-all">{state.tempPassword}</code>
      <p className="mt-1 text-xs text-faint">ต้องเปลี่ยนรหัสผ่านใหม่ตอนเข้าระบบครั้งแรก</p>
    </div>
  );
}

export function CreateAdminForm() {
  const [state, action, pending] = useActionState<TempPasswordState, FormData>(createAdminAction, { error: null });
  return (
    <form action={action} className="space-y-3">
      <TempPassword state={state} />
      <div className="grid gap-3 sm:grid-cols-3">
        <input name="username" required placeholder="ชื่อผู้ใช้ (a-z 0-9 . _ -)" autoCapitalize="none" className={input} />
        <input name="displayName" required placeholder="ชื่อที่แสดง" className={input} />
        <select name="role" defaultValue="EDITOR" className={input}>
          <option value="EDITOR">Editor — เขียนข่าว</option>
          <option value="ADMIN">Admin</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn-gold px-5 py-2 text-sm disabled:opacity-50">
        สร้างบัญชี
      </button>
    </form>
  );
}

export function ResetPasswordForm({ id, username }: { id: string; username: string }) {
  const [state, action, pending] = useActionState<TempPasswordState, FormData>(resetPasswordAction, { error: null });
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`ตั้งรหัสผ่านชั่วคราวใหม่ให้ ${username}? บัญชีนี้จะถูกออกจากระบบทุกเครื่อง`)) e.preventDefault();
      }}
      className="space-y-2"
    >
      <input type="hidden" name="id" value={id} />
      <TempPassword state={state} />
      <button type="submit" disabled={pending} className="text-xs text-gold-bright hover:underline disabled:opacity-50">
        รีเซ็ตรหัสผ่าน
      </button>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { TURNSTILE_SITE_KEY, TurnstileWidget } from "@/core/security/TurnstileWidget";
import { adminLoginAction, type LoginState } from "./actions";

const input =
  "w-full rounded-md border border-line bg-bg-sunken px-3 py-2 text-sm text-text placeholder:text-faint focus:border-gold focus:outline-none";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(adminLoginAction, { error: null, username: "" });
  const [verified, setVerified] = useState(!TURNSTILE_SITE_KEY);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-md border border-ember/50 bg-ember/10 px-3 py-2 text-sm text-ember">
          {state.error}
        </p>
      )}
      <label className="block">
        <span className="text-sm text-muted">ชื่อผู้ใช้</span>
        <input name="username" required autoComplete="username" autoCapitalize="none" spellCheck={false} defaultValue={state.username} className={`${input} mt-1`} />
      </label>
      <label className="block">
        <span className="text-sm text-muted">รหัสผ่าน</span>
        <input name="password" type="password" required autoComplete="current-password" className={`${input} mt-1`} />
      </label>
      <TurnstileWidget language="th" onChange={setVerified} />
      <button type="submit" disabled={pending || !verified} className="btn-gold w-full py-2.5 text-sm disabled:opacity-50">
        {pending ? "กำลังตรวจสอบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}

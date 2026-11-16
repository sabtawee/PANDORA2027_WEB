"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { verifyDiscordAction, type VerifyState } from "./actions";

export function VerifyDiscordButton({ inviteUrl }: { inviteUrl: string }) {
  const t = useTranslations("discord");
  const [state, action, pending] = useActionState<VerifyState>(verifyDiscordAction, { result: null });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
        {inviteUrl && (
          <a href={inviteUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost py-1 text-sm">
            {t("join")}
          </a>
        )}
        <form action={action}>
          <button type="submit" disabled={pending} className="btn-ghost py-1 text-sm disabled:opacity-50">
            {pending ? t("checking") : t("verify")}
          </button>
        </form>
      </div>
      {state.result && state.result !== "done" && (
        <p role="status" className="text-xs text-ember">
          {t(`result.${state.result}`)}
        </p>
      )}
    </div>
  );
}

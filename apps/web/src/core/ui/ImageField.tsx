"use client";

import { useEffect, useState } from "react";

export interface ImageFieldTexts {
  pick: string;
  hint: string;
  pending: string;
  remove: string;
  tooBig: string;
}

const TH: ImageFieldTexts = {
  pick: "คลิกเพื่อเลือกรูป",
  hint: "PNG, JPG, WebP หรือ GIF · ไม่เกิน 2 MB · แนะนำสี่เหลี่ยมจัตุรัส พื้นใส",
  pending: "รูปใหม่ จะบันทึกเมื่อกดบันทึก",
  remove: "ลบรูปนี้",
  tooBig: "รูปใหญ่เกิน 2 MB",
};

/**
 * File picker with a live preview. Submits `image` (the file) and, when the
 * user ticks "remove", `removeImage=on`. Leaving it alone keeps the current image.
 * Used by the admin panel (Thai defaults) and the player profile page.
 */
export function ImageField({
  current,
  label = "รูป",
  texts = TH,
  round = false,
}: {
  current?: string | null;
  label?: string;
  texts?: ImageFieldTexts;
  round?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shown = remove ? null : (preview ?? current ?? null);

  return (
    <div>
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1 flex items-start gap-4">
        <label
          className={`grid h-28 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden border border-dashed border-line-strong bg-bg-sunken px-2 text-center text-xs text-faint hover:border-gold ${
            round ? "rounded-full" : "rounded-xl"
          }`}
        >
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className={`h-full w-full ${round ? "object-cover" : "object-contain"}`} />
          ) : (
            <span>{texts.pick}</span>
          )}
          <input
            type="file"
            name="image"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              setError(null);
              if (!f) return setPreview(null);
              if (f.size > 2 * 1024 * 1024) {
                setError(texts.tooBig);
                e.target.value = "";
                return setPreview(null);
              }
              setRemove(false);
              setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
        <div className="space-y-2 text-xs text-faint">
          <p>{texts.hint}</p>
          {preview && <p className="text-gold-bright">{texts.pending}</p>}
          {current && (
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" name="removeImage" checked={remove} onChange={(e) => setRemove(e.target.checked)} className="accent-[var(--ember)]" />
              {texts.remove}
            </label>
          )}
          {error && <p className="text-ember">{error}</p>}
        </div>
      </div>
    </div>
  );
}

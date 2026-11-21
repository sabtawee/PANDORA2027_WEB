"use client";

import { useEffect, useState } from "react";

/**
 * File picker with a live preview. Submits `image` (the file) and, when the
 * admin ticks "remove", `removeImage=on`. Leaving it alone keeps the current image.
 */
export function ImageField({ current, label = "รูป" }: { current?: string | null; label?: string }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [remove, setRemove] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  const shown = remove ? null : (preview ?? current ?? null);

  return (
    <div>
      <span className="text-sm text-muted">{label}</span>
      <div className="mt-1 flex items-start gap-4">
        <label className="grid h-28 w-28 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-xl border border-dashed border-line-strong bg-bg-sunken text-center text-xs text-faint hover:border-gold">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shown} alt="" className="h-full w-full object-contain" />
          ) : (
            <span>
              คลิกเพื่อ
              <br />
              เลือกรูป
            </span>
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
                setError("รูปใหญ่เกิน 2 MB");
                e.target.value = "";
                return setPreview(null);
              }
              setRemove(false);
              setPreview(URL.createObjectURL(f));
            }}
          />
        </label>
        <div className="space-y-2 text-xs text-faint">
          <p>PNG, JPG, WebP หรือ GIF · ไม่เกิน 2 MB · แนะนำสี่เหลี่ยมจัตุรัส พื้นใส</p>
          {preview && <p className="text-gold-bright">รูปใหม่ จะบันทึกเมื่อกดบันทึก</p>}
          {current && (
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" name="removeImage" checked={remove} onChange={(e) => setRemove(e.target.checked)} className="accent-[var(--ember)]" />
              ลบรูปนี้
            </label>
          )}
          {error && <p className="text-ember">{error}</p>}
        </div>
      </div>
    </div>
  );
}

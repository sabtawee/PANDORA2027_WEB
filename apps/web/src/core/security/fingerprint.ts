"use client";

/**
 * Lightweight device fingerprint for fraud checks: hashes stable browser and
 * hardware traits so two accounts made on one device (even in incognito)
 * share the same value. Never sent to third parties.
 */
export async function deviceFingerprint(): Promise<string | null> {
  try {
    const parts: (string | number)[] = [
      navigator.userAgent,
      navigator.language,
      navigator.languages?.join(",") ?? "",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen.width,
      screen.height,
      screen.colorDepth,
      window.devicePixelRatio,
      navigator.hardwareConcurrency ?? 0,
      (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 0,
      navigator.maxTouchPoints ?? 0,
    ];

    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "16px Arial";
      ctx.fillStyle = "#f60";
      ctx.fillRect(100, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("PANDORA-RO ✦ แพนโดร่า", 2, 15);
      ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
      ctx.fillText("PANDORA-RO ✦ แพนโดร่า", 4, 17);
      parts.push(canvas.toDataURL());
    }

    const gl = document.createElement("canvas").getContext("webgl");
    const dbg = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && dbg) parts.push(String(gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)), String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)));

    const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(parts.join("|")));
    return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return null;
  }
}

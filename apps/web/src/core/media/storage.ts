import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Admin-uploaded images. Files live in UPLOAD_DIR (default ./uploads, outside
 * public/ — Next only serves public/ files that existed at build time) and are
 * served by app/media/[...path]/route.ts at /media/<folder>/<file>.
 * In production, mount UPLOAD_DIR on a persistent volume.
 */
export const MEDIA_PREFIX = "/media/";
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"));
}

const FOLDERS = new Set(["milestones", "tiers"]);

/** Detect the real type from the file's first bytes (never trust the name or browser type). SVG is refused: it can carry scripts. */
function sniff(buf: Buffer): { ext: string; mime: string } | null {
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png", mime: "image/png" };
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: "jpg", mime: "image/jpeg" };
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return { ext: "webp", mime: "image/webp" };
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.toString("ascii", 0, 6))) return { ext: "gif", mime: "image/gif" };
  return null;
}

export const MIME_BY_EXT: Record<string, string> = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export class MediaError extends Error {}

/** Returns the public URL (/media/folder/name.ext) or null when no file was chosen. */
export async function saveImage(file: FormDataEntryValue | null, folder: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  if (!FOLDERS.has(folder)) throw new MediaError("bad folder");
  if (file.size > MAX_IMAGE_BYTES) throw new MediaError("รูปใหญ่เกิน 2 MB");

  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type) throw new MediaError("รองรับเฉพาะ PNG, JPG, WebP, GIF");

  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${type.ext}`;
  const dir = path.join(uploadDir(), folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf, { flag: "wx" });
  return `${MEDIA_PREFIX}${folder}/${name}`;
}

/** Map a /media/... URL to its file on disk, refusing anything outside UPLOAD_DIR. */
export function mediaPath(url: string): string | null {
  if (!url.startsWith(MEDIA_PREFIX)) return null;
  const rel = url.slice(MEDIA_PREFIX.length);
  if (!/^[a-z0-9-]+\/[a-z0-9-]+\.(png|jpg|webp|gif)$/.test(rel)) return null;
  const root = uploadDir();
  const full = path.resolve(root, rel);
  return full.startsWith(root + path.sep) ? full : null;
}

/**
 * Handles an ImageField submission (`image` file + `removeImage` checkbox).
 * Returns the new value for the record's image column (undefined = unchanged),
 * or an error message to show the admin.
 */
export async function imageFromForm(formData: FormData, folder: string): Promise<{ image?: string | null; error?: string }> {
  try {
    const uploaded = await saveImage(formData.get("image"), folder);
    if (uploaded) return { image: uploaded };
    if (formData.get("removeImage") === "on") return { image: null };
    return {};
  } catch (err) {
    if (err instanceof MediaError) return { error: err.message };
    throw err;
  }
}

/** Remove an uploaded file we no longer reference. Ignores URLs that aren't ours. */
export async function deleteImage(url: string | null | undefined) {
  const file = url ? mediaPath(url) : null;
  if (file) await unlink(file).catch(() => {});
}

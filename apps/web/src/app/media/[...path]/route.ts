import { readFile } from "node:fs/promises";
import { MEDIA_PREFIX, MIME_BY_EXT, mediaPath } from "@/core/media/storage";

/** Serves admin-uploaded images from UPLOAD_DIR. File names are random and never reused, so they cache forever. */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path: parts } = await ctx.params;
  const file = mediaPath(MEDIA_PREFIX + parts.join("/"));
  if (!file) return new Response("Not found", { status: 404 });

  try {
    const body = await readFile(file);
    const ext = file.split(".").pop()!;
    return new Response(new Uint8Array(body), {
      headers: {
        "Content-Type": MIME_BY_EXT[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}

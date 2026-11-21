"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/core/auth";
import { prisma } from "@/core/db/prisma";
import { routing, type Locale } from "@/core/i18n/routing";
import { deleteImage, imageFromForm } from "@/core/media/storage";
import { rateLimit } from "@/core/security/rate-limit";

const schema = z.object({
  // Letters, numbers, spaces and a few symbols; no control chars or markup.
  name: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[\p{L}\p{M}\p{N} ._\-]+$/u),
  locale: z.enum(routing.locales as unknown as [Locale, ...Locale[]]),
});

export async function saveProfile(formData: FormData) {
  const session = await auth();
  const rawLocale = String(formData.get("locale") ?? "");
  const back = (routing.locales as readonly string[]).includes(rawLocale) ? rawLocale : routing.defaultLocale;
  if (!session?.user) redirect(`/${back}/login`);
  const userId = session.user.id;

  if (!rateLimit(`profile:${userId}`, 10, 10 * 60_000).ok) redirect(`/${back}/profile?error=rate`);

  const parsed = schema.safeParse({ name: formData.get("name") ?? "", locale: rawLocale });
  if (!parsed.success) redirect(`/${back}/profile?error=name`);

  const img = await imageFromForm(formData, "avatars");
  if (img.error) redirect(`/${back}/profile?error=image`);

  const before = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { image: true } });
  await prisma.user.update({
    where: { id: userId },
    data: {
      name: parsed.data.name,
      locale: parsed.data.locale,
      ...(img.image !== undefined ? { image: img.image } : {}),
    },
  });
  // Only our own uploads are deleted; a Google/Discord picture URL is ignored by deleteImage.
  if (img.image !== undefined && before.image !== img.image) await deleteImage(before.image);

  revalidatePath("/", "layout");
  redirect(`/${parsed.data.locale}/profile?ok=1`);
}

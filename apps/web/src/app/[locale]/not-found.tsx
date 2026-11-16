import { useTranslations } from "next-intl";
import { Link } from "@/core/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <section className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="font-display text-6xl text-gilded">404</p>
      <h1 className="mt-4 text-xl">{t("title")}</h1>
      <Link href="/" className="btn-gold mt-8">
        {t("back")}
      </Link>
    </section>
  );
}

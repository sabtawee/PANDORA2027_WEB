import { getTranslations } from "next-intl/server";
import { CLASS_TINT, ClassSilhouette, type ClassKey } from "./ClassSilhouette";

const CLASSES: ClassKey[] = ["swordman", "mage", "archer", "acolyte", "thief", "merchant"];

/** Home page "choose your path" cards. Art is an original placeholder (see ClassSilhouette). */
export async function ClassShowcase() {
  const t = await getTranslations("classes");
  return (
    <section className="mx-auto mt-20 max-w-6xl px-4">
      <h2 data-reveal className="text-center font-display text-3xl text-gilded">
        {t("title")}
      </h2>
      <p data-reveal style={{ "--reveal-delay": "100ms" } as React.CSSProperties} className="mx-auto mt-3 max-w-2xl text-center text-muted">
        {t("subtitle")}
      </p>
      <ul className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {CLASSES.map((k, i) => (
          <li key={k} data-reveal style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
            <div className="panel lift group relative flex h-full flex-col items-center overflow-hidden px-3 pt-4 pb-5 text-center">
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 opacity-70 transition-opacity group-hover:opacity-100"
                style={{ background: CLASS_TINT[k] }}
              />
              <ClassSilhouette k={k} className="h-40 w-auto transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105" />
              <p className="mt-2 font-display text-lg" style={{ color: CLASS_TINT[k] }}>
                {t(`${k}.name`)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{t(`${k}.desc`)}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center text-xs text-faint">{t("placeholderNote")}</p>
    </section>
  );
}

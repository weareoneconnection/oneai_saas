"use client";

import { useI18n } from "@/lib/i18n";

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useI18n();

  return (
    <div
      className={[
        "inline-flex shrink-0 items-center rounded-lg border border-black/10 bg-white p-1",
        compact ? "h-9" : "",
      ].join(" ")}
      aria-label="Language selector"
    >
      {(["en", "zh"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          className={[
            "rounded-md px-2.5 py-1 text-xs font-bold transition",
            locale === item ? "bg-black text-white" : "text-black/55 hover:bg-black/5 hover:text-black",
          ].join(" ")}
          aria-pressed={locale === item}
        >
          {item === "en" ? "EN" : "中文"}
        </button>
      ))}
    </div>
  );
}


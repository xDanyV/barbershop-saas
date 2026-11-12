"use client";

import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { brandFontClasses } from "@/[locale]/brand";
import { ACCENT_PRESETS, PRIMARY_PRESETS, THEME_DEFAULTS, businessThemeStyle } from "@/lib/theme";
import { card, sectionHint, sectionTitle } from "./ui";

type Props = {
    businessName: string;
    primary: string | null;
    accent: string | null;
    onChange: (field: "themePrimary" | "themeAccent", value: string | null) => void;
};

function ColorRow({
    label,
    hint,
    value,
    fallback,
    presets,
    onPick,
}: {
    label: string;
    hint: string;
    value: string | null;
    fallback: string;
    presets: string[];
    onPick: (value: string | null) => void;
}) {
    const t = useTranslations("MyBusiness.theme");
    const current = value ?? fallback;
    const isCustom = !presets.includes(current);
    const name = (color: string) => (t.has(`colors.${color.slice(1)}`) ? t(`colors.${color.slice(1)}`) : color);

    return (
        <fieldset>
            <legend className="font-semibold text-gray-900">{label}</legend>
            <p className="text-sm text-gray-600">{hint}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {presets.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onPick(color === fallback ? null : color)}
                        aria-pressed={current === color}
                        aria-label={name(color)}
                        title={name(color)}
                        className={`h-11 w-11 border transition-transform hover:scale-105 ${current === color ? "outline-2 outline-offset-2 outline-gray-900" : "border-gray-200"}`}
                        style={{ background: color }}
                    />
                ))}

                <label
                    className={`relative flex h-11 cursor-pointer items-center gap-2 border px-3 text-sm font-semibold transition-colors hover:border-gray-900 ${isCustom ? "outline-2 outline-offset-2 outline-gray-900" : "border-gray-200"}`}
                >
                    <span className="h-5 w-5 border border-gray-200" style={{ background: current }} aria-hidden="true" />
                    {t("other")}
                    <input
                        type="color"
                        value={current}
                        onChange={(event) => onPick(event.target.value.toLowerCase())}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={t("otherLabel", { label })}
                    />
                </label>
            </div>
        </fieldset>
    );
}

// El dueño elige el color principal y el de acento de su página; la vista previa usa los mismos cálculos que la página
export default function BusinessThemePicker({ businessName, primary, accent, onChange }: Props) {
    const t = useTranslations("MyBusiness.theme");
    const preview = businessThemeStyle(primary, accent);
    const isDefault = !primary && !accent;

    return (
        <section className={`${card} space-y-6`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h2 className={sectionTitle}>{t("title")}</h2>
                    <p className={sectionHint}>{t("hint")}</p>
                </div>

                {!isDefault && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange("themePrimary", null);
                            onChange("themeAccent", null);
                        }}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-sm font-semibold text-gray-600 hover:text-gray-900"
                    >
                        <RotateCcw size={14} aria-hidden="true" />
                        {t("reset")}
                    </button>
                )}
            </div>

            <ColorRow
                label={t("primary")}
                hint={t("primaryHint")}
                value={primary}
                fallback={THEME_DEFAULTS.primary}
                presets={PRIMARY_PRESETS}
                onPick={(value) => onChange("themePrimary", value)}
            />

            <ColorRow
                label={t("accent")}
                hint={t("accentHint")}
                value={accent}
                fallback={THEME_DEFAULTS.accent}
                presets={ACCENT_PRESETS}
                onPick={(value) => onChange("themeAccent", value)}
            />

            <div>
                <p className="text-sm font-semibold text-gray-900">{t("preview")}</p>
                <div className={`brand ${brandFontClasses} mt-2 grid overflow-hidden border border-gray-200 sm:grid-cols-[1fr_9rem]`} style={preview}>
                    <div className="p-4">
                        <p className="brand-display text-2xl [overflow-wrap:anywhere]">{businessName || t("sampleName")}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                            <span className="h-2.5 w-2.5 bg-[var(--brand-accent)]" aria-hidden="true" />
                            {t("sampleHours")}
                        </p>
                        <div className="mt-2 border-l-4 border-[var(--brand-accent)] bg-[var(--brand-paper)] px-3 py-2 text-sm">{t("samplePost")}</div>
                        <span className="mt-3 inline-flex min-h-10 items-center bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--brand-on-primary)]">
                            {t("sampleBook")}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[var(--brand-field)] p-4 text-sm text-[var(--brand-field-ink)] sm:flex-col sm:items-start sm:justify-center">
                        <span className="font-semibold">{t("sampleVisit")}</span>
                        <span className="text-[var(--brand-field-muted)]">Tijuana, B.C.</span>
                    </div>
                </div>
            </div>
        </section>
    );
}

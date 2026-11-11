"use client";

import { Palette, RotateCcw } from "lucide-react";
import { motion } from "framer-motion";
import { brandFontClasses } from "@/[locale]/brand";
import { ACCENT_PRESETS, PRIMARY_PRESETS, THEME_DEFAULTS, businessThemeStyle } from "@/lib/theme";

type Props = {
    businessName: string;
    primary: string | null;
    accent: string | null;
    onChange: (field: "themePrimary" | "themeAccent", value: string | null) => void;
};

const COLOR_NAMES: Record<string, string> = {
    "#0f2733": "Azul tinta",
    "#1f1f1f": "Negro",
    "#7a1f2b": "Vino",
    "#1d4d3a": "Verde bosque",
    "#23395d": "Azul marino",
    "#5b3a29": "Café",
    "#b8860b": "Dorado",
    "#c2410c": "Terracota",
    "#e8603a": "Naranja",
    "#d4a017": "Mostaza",
    "#c0392b": "Rojo",
    "#2f7d5b": "Verde",
    "#3a7bd5": "Azul",
    "#8e5cc2": "Morado",
    "#e4dccb": "Arena",
    "#ffffff": "Blanco",
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
    const current = value ?? fallback;
    const isCustom = !presets.includes(current);

    return (
        <fieldset>
            <legend className="text-sm font-semibold text-gray-900">{label}</legend>
            <p className="text-xs text-gray-500">{hint}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
                {presets.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => onPick(color === fallback ? null : color)}
                        aria-pressed={current === color}
                        aria-label={COLOR_NAMES[color] ?? color}
                        title={COLOR_NAMES[color] ?? color}
                        className={`h-11 w-11 border transition-transform hover:scale-105 ${current === color ? "outline-2 outline-offset-2 outline-gray-900" : "border-gray-200"}`}
                        style={{ background: color }}
                    />
                ))}

                <label
                    className={`relative flex h-11 cursor-pointer items-center gap-2 border px-3 text-xs font-semibold transition-colors hover:border-gray-900 ${isCustom ? "outline-2 outline-offset-2 outline-gray-900" : "border-gray-200"}`}
                >
                    <span className="h-5 w-5 border border-gray-200" style={{ background: current }} aria-hidden="true" />
                    Otro
                    <input
                        type="color"
                        value={current}
                        onChange={(event) => onPick(event.target.value.toLowerCase())}
                        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        aria-label={`${label}: elegir otro color`}
                    />
                </label>
            </div>
        </fieldset>
    );
}

// El dueño elige el color principal y el de acento de su página; la vista previa usa los mismos cálculos que la página
export default function BusinessThemePicker({ businessName, primary, accent, onChange }: Props) {
    const preview = businessThemeStyle(primary, accent);
    const isDefault = !primary && !accent;

    return (
        <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="bg-white border border-gray-100 rounded-3xl p-5 md:p-7 shadow-sm space-y-5"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Palette size={20} />
                    </div>

                    <div>
                        <h2 className="font-black text-gray-900">Colores de tu página</h2>
                        <p className="text-xs text-gray-500">Así se verán tus botones y bloques de color.</p>
                    </div>
                </div>

                {!isDefault && (
                    <button
                        type="button"
                        onClick={() => {
                            onChange("themePrimary", null);
                            onChange("themeAccent", null);
                        }}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-xs font-semibold text-gray-600 hover:text-gray-900"
                    >
                        <RotateCcw size={14} aria-hidden="true" />
                        Restablecer
                    </button>
                )}
            </div>

            <ColorRow
                label="Color principal"
                hint="Botones, encabezados y el bloque de ubicación."
                value={primary}
                fallback={THEME_DEFAULTS.primary}
                presets={PRIMARY_PRESETS}
                onPick={(value) => onChange("themePrimary", value)}
            />

            <ColorRow
                label="Color de acento"
                hint="Detalles: avisos, íconos y marcas pequeñas."
                value={accent}
                fallback={THEME_DEFAULTS.accent}
                presets={ACCENT_PRESETS}
                onPick={(value) => onChange("themeAccent", value)}
            />

            <div>
                <p className="text-xs font-semibold text-gray-500">Vista previa</p>
                <div className={`brand ${brandFontClasses} mt-2 grid overflow-hidden border border-gray-100 sm:grid-cols-[1fr_9rem]`} style={preview}>
                    <div className="p-4">
                        <p className="brand-display text-2xl [overflow-wrap:anywhere]">{businessName || "Tu barbería"}</p>
                        <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
                            <span className="h-2.5 w-2.5 bg-[var(--brand-accent)]" aria-hidden="true" />
                            Cierra a las 8:00 PM
                        </p>
                        <div className="mt-2 border-l-4 border-[var(--brand-accent)] bg-[var(--brand-paper)] px-3 py-2 text-sm">Promoción de la semana</div>
                        <span className="mt-3 inline-flex min-h-10 items-center bg-[var(--brand-primary)] px-4 text-sm font-semibold text-[var(--brand-on-primary)]">
                            Reservar cita
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-[var(--brand-field)] p-4 text-sm text-[var(--brand-field-ink)] sm:flex-col sm:items-start sm:justify-center">
                        <span className="font-semibold">Ubicación</span>
                        <span className="text-[var(--brand-field-muted)]">Tijuana, B.C.</span>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

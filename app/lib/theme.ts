import type { CSSProperties } from "react";

// Colores de la página pública de cada negocio. El dueño elige un color principal
// (botones y bloques de color) y uno de acento (detalles); el resto se calcula para que
// el texto siempre se lea bien.

export const THEME_DEFAULTS = { primary: "#0f2733", accent: "#e8603a" } as const;

const INK = "#0f2733";
const PAPER = "#ffffff";
const BACKGROUND = "#f1f3f2";
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export const PRIMARY_PRESETS = ["#0f2733", "#1f1f1f", "#7a1f2b", "#1d4d3a", "#23395d", "#5b3a29", "#b8860b", "#c2410c"];
export const ACCENT_PRESETS = ["#e8603a", "#d4a017", "#c0392b", "#2f7d5b", "#3a7bd5", "#8e5cc2", "#e4dccb", "#ffffff"];

export function isHexColor(value: unknown): value is string {
    return typeof value === "string" && HEX_COLOR.test(value);
}

function luminance(hex: string) {
    const channels = [1, 3, 5].map((start) => {
        const value = parseInt(hex.slice(start, start + 2), 16) / 255;
        return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });

    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function contrastRatio(a: string, b: string) {
    const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (light + 0.05) / (dark + 0.05);
}

// Texto que se lee mejor sobre un color: blanco o el tono oscuro de la marca
export function textOn(color: string) {
    return contrastRatio(color, PAPER) >= contrastRatio(color, INK) ? PAPER : INK;
}

function darken(hex: string, amount: number) {
    const channel = (start: number) =>
        Math.round(parseInt(hex.slice(start, start + 2), 16) * (1 - amount))
            .toString(16)
            .padStart(2, "0");

    return `#${channel(1)}${channel(3)}${channel(5)}`;
}

// Un tono medio no se lee bien ni con blanco ni con oscuro: se oscurece lo justo
export function readablePrimary(color: string) {
    let current = color.toLowerCase();

    for (let step = 1; contrastRatio(current, textOn(current)) < 4.5 && step <= 10; step++) {
        current = darken(color.toLowerCase(), step * 0.06);
    }

    return current;
}

// Variables CSS que reemplazan las de .brand; sin colores propios no cambia nada
export function businessThemeStyle(rawPrimary?: string | null, accent?: string | null): CSSProperties | undefined {
    const vars: Record<string, string> = {};

    if (isHexColor(rawPrimary)) {
        const primary = readablePrimary(rawPrimary);
        const onPrimary = textOn(primary);

        vars["--brand-primary"] = primary;
        vars["--brand-on-primary"] = onPrimary;
        vars["--brand-field"] = primary;
        vars["--brand-field-ink"] = onPrimary;
        vars["--brand-field-muted"] = `color-mix(in srgb, ${onPrimary} 75%, ${primary})`;
        vars["--brand-surface"] = `color-mix(in srgb, ${primary} 12%, ${BACKGROUND})`;
        vars["--brand-bg"] = `color-mix(in srgb, ${primary} 4%, ${BACKGROUND})`;

        // Un color oscuro también tiñe los títulos y el texto; uno claro deja el texto oscuro
        if (contrastRatio(primary, BACKGROUND) >= 7) {
            vars["--brand-ink"] = primary;
        }
    }

    if (isHexColor(accent)) {
        vars["--brand-accent"] = accent;
    }

    return Object.keys(vars).length ? (vars as CSSProperties) : undefined;
}

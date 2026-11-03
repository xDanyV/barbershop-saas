import { Archivo } from "next/font/google";

// Tipografía de la marca pública (landing y página "próximamente"): una sola familia, sobria
export const brandFont = Archivo({
    subsets: ["latin"],
    weight: ["400", "600"],
    variable: "--font-brand",
    display: "swap",
});

export const brandFontClasses = brandFont.variable;

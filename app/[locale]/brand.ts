import { Onest, Unbounded } from "next/font/google";

// Tipografías de la marca pública (landing y página "próximamente")
export const displayFont = Unbounded({
    subsets: ["latin"],
    weight: ["800"],
    variable: "--font-display",
    display: "swap",
});

export const textFont = Onest({
    subsets: ["latin"],
    weight: ["400", "500"],
    variable: "--font-text",
    display: "swap",
});

export const brandFontClasses = `${displayFont.variable} ${textFont.variable}`;

import localFont from "next/font/local";

// Tipografía de la marca pública (landing y página "próximamente"): una sola familia, sobria.
// Los archivos viven en el repositorio para que el build no dependa de descargar de Google Fonts.
export const brandFont = localFont({
    src: [
        { path: "../fonts/archivo-latin-400-normal.woff2", weight: "400", style: "normal" },
        { path: "../fonts/archivo-latin-600-normal.woff2", weight: "600", style: "normal" },
    ],
    variable: "--font-brand",
    display: "swap",
});

export const brandFontClasses = brandFont.variable;

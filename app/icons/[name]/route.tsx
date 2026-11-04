import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Tamaño total y tamaño de las tijeras. El maskable deja margen porque el teléfono recorta las esquinas.
const ICONS: Record<string, { size: number; glyph: number }> = {
    "favicon-32.png": { size: 32, glyph: 24 },
    "apple-touch-icon.png": { size: 180, glyph: 112 },
    "icon-192.png": { size: 192, glyph: 120 },
    "icon-512.png": { size: 512, glyph: 320 },
    "maskable-512.png": { size: 512, glyph: 256 },
};

export function generateStaticParams() {
    return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
    const { name } = await context.params;
    const icon = ICONS[name];

    if (!icon) return new Response("Not found", { status: 404 });

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f2733" }}>
                <svg width={icon.glyph} height={icon.glyph} viewBox="0 0 24 24" fill="none" stroke="#e4dccb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3" />
                    <path d="M8.12 8.12 12 12" />
                    <path d="M20 4 8.12 15.88" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M14.8 14.8 20 20" />
                </svg>
            </div>
        ),
        { width: icon.size, height: icon.size }
    );
}

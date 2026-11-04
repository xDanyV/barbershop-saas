import { ImageResponse } from "next/og";

export const dynamic = "force-static";

// Vista previa al compartir un enlace que no tiene imagen propia (WhatsApp, Facebook)
export function GET() {
    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0f2733", color: "#f1f3f2" }}>
                <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="#e4dccb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3" />
                    <path d="M8.12 8.12 12 12" />
                    <path d="M20 4 8.12 15.88" />
                    <circle cx="6" cy="18" r="3" />
                    <path d="M14.8 14.8 20 20" />
                </svg>
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ fontSize: 84, lineHeight: 1.05, letterSpacing: -2 }}>Citas en línea para tu barbería</div>
                    <div style={{ marginTop: 28, fontSize: 36, color: "#a9b7bc" }}>Tijuana · Baja California</div>
                </div>
            </div>
        ),
        { width: 1200, height: 630 }
    );
}

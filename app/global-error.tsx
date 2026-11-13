"use client";

// Último recurso: falló el propio layout (sin traducciones ni estilos disponibles). Bilingüe y sin dependencias.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
    return (
        <html lang="es">
            <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f1f3f2", color: "#0f2733" }}>
                <main style={{ minHeight: "100svh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, textAlign: "center" }}>
                    <h1 style={{ fontSize: 28, margin: 0 }}>Algo salió mal</h1>
                    <p style={{ color: "#4a5a61", marginTop: 12, maxWidth: 420 }}>
                        Vuelve a intentarlo en un momento. · Something went wrong, please try again in a moment.
                    </p>
                    <button
                        type="button"
                        onClick={reset}
                        style={{ marginTop: 24, minHeight: 48, padding: "0 24px", border: 0, background: "#0f2733", color: "#fff", fontWeight: 600, fontSize: 16, cursor: "pointer" }}
                    >
                        Reintentar · Try again
                    </button>
                </main>
            </body>
        </html>
    );
}

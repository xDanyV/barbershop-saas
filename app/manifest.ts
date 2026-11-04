import type { MetadataRoute } from "next";

// Lo que usa el teléfono para instalar la app en la pantalla de inicio
export default function manifest(): MetadataRoute.Manifest {
    return {
        id: "/",
        name: "Citas de barbería",
        short_name: "Citas",
        description: "Reserva y administra las citas de tu barbería en Tijuana.",
        lang: "es-MX",
        start_url: "/es/dashboard",
        scope: "/",
        display: "standalone",
        background_color: "#f1f3f2",
        theme_color: "#0f2733",
        icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
    };
}

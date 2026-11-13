import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Política de contenido. Se publica en modo "solo reporte": el navegador avisa en la consola de lo
// que bloquearía, sin romper nada. Cuando no aparezcan avisos, cambiar la cabecera a
// Content-Security-Policy para aplicarla.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // Fotos de negocios: UploadThing y URLs https que pegue el owner
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  // Subidas de imágenes con UploadThing
  // Buscar la dirección en el mapa (OpenStreetMap)
  "connect-src 'self' https://*.uploadthing.com https://*.ufs.sh https://utfs.io https://nominatim.openstreetmap.org",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  // Nadie puede mostrar el sitio dentro de un iframe (evita clickjacking del login)
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  // Solo HTTPS durante dos años (Vercel ya sirve todo por HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // El navegador debe revisar siempre si hay una versión nueva del service worker
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache" }] },
    ];
  },
};

export default withNextIntl(nextConfig);

import { computeBusinessHours, type HoursRow } from "@/lib/business-hours";

// Dirección pública del sitio. Al tener dominio propio basta con definir NEXT_PUBLIC_SITE_URL.
export function getSiteUrl(env: Record<string, string | undefined> = process.env) {
    const explicit = env.NEXT_PUBLIC_SITE_URL?.trim();
    if (explicit) return explicit.replace(/\/+$/, "");

    if (env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;

    return "http://localhost:3000";
}

// path sin idioma: "" para el inicio, "/privacy", "/business/mi-barberia"
export function localizedAlternates(path: string, locale: string, siteUrl = getSiteUrl()) {
    return {
        canonical: `${siteUrl}/${locale}${path}`,
        languages: {
            es: `${siteUrl}/es${path}`,
            en: `${siteUrl}/en${path}`,
            "x-default": `${siteUrl}/es${path}`,
        },
    };
}

const SCHEMA_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Datos estructurados para que los buscadores entiendan que es una barbería
export function buildBarberShopJsonLd(params: {
    url: string;
    name: string;
    description?: string | null;
    phone?: string | null;
    address?: string | null;
    image?: string | null;
    hours: HoursRow[];
    rating?: { average: number; count: number } | null;
}) {
    const { url, name, description, phone, address, image, hours, rating } = params;

    const openingHours = computeBusinessHours(hours)
        .filter((day) => day.open && day.close)
        .map((day) => ({
            "@type": "OpeningHoursSpecification",
            dayOfWeek: SCHEMA_DAYS[day.dayOfWeek],
            opens: day.open,
            closes: day.close,
        }));

    return {
        "@context": "https://schema.org",
        "@type": "BarberShop",
        name,
        url,
        ...(description ? { description } : {}),
        ...(image ? { image } : {}),
        ...(phone ? { telephone: `+52${phone.replace(/\D/g, "").slice(-10)}` } : {}),
        ...(address ? { address: { "@type": "PostalAddress", streetAddress: address, addressCountry: "MX" } } : {}),
        ...(openingHours.length ? { openingHoursSpecification: openingHours } : {}),
        ...(rating && rating.count > 0
            ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.average, reviewCount: rating.count, bestRating: 5, worstRating: 1 } }
            : {}),
    };
}

// Se inserta dentro de <script>: "<" escapado evita que un texto del negocio cierre la etiqueta
export function serializeJsonLd(data: unknown) {
    return JSON.stringify(data).replace(/</g, "\\u003c");
}

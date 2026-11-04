import type { MetadataRoute } from "next";
import { publicBusinessWhere } from "@/lib/billing/status";
import { isMaintenanceMode } from "@/lib/maintenance";
import { prisma } from "@/lib/prisma";
import { getSiteUrl, localizedAlternates } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    if (isMaintenanceMode()) return [];

    const siteUrl = getSiteUrl();

    const entry = (path: string, lastModified?: Date): MetadataRoute.Sitemap[number] => {
        const { canonical, languages } = localizedAlternates(path, "es", siteUrl);

        return {
            url: canonical,
            lastModified,
            alternates: { languages: { es: languages.es, en: languages.en } },
        };
    };

    const pages = [entry(""), entry("/privacy"), entry("/terms")];

    try {
        const businesses = await prisma.business.findMany({
            where: publicBusinessWhere,
            select: { slug: true, updatedAt: true },
        });

        return [...pages, ...businesses.map((business) => entry(`/business/${business.slug}`, business.updatedAt))];
    } catch (error) {
        // Sin base el mapa sigue siendo válido con las páginas fijas
        console.error("Sitemap businesses error:", error);
        return pages;
    }
}

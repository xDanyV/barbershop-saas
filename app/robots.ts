import type { MetadataRoute } from "next";
import { isMaintenanceMode } from "@/lib/maintenance";
import { getSiteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
    // Mientras está la página "próximamente" no hay nada que indexar
    if (isMaintenanceMode()) {
        return { rules: { userAgent: "*", disallow: "/" } };
    }

    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/", "/es/dashboard", "/en/dashboard", "/es/login", "/en/login", "/es/register", "/en/register"],
        },
        sitemap: `${getSiteUrl()}/sitemap.xml`,
    };
}

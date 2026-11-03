import { prisma } from "@/lib/prisma";

export function createSlug(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/ñ/g, "n")
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
}

// Acepta un slug, una ruta o la URL completa de la página del negocio (p. ej. el enlace del QR)
export function extractBusinessSlug(value: string) {
    let rawValue = value.trim();

    try {
        rawValue = new URL(rawValue).pathname;
    } catch {
        // No es una URL completa: se usa como texto o ruta
    }

    const segments = rawValue.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1] ?? rawValue;

    return createSlug(lastSegment);
}

// Una sola consulta en lugar de probar slug-1, slug-2... uno por uno
export async function generateUniqueBusinessSlug(name: string) {
    const baseSlug = createSlug(name) || "negocio";

    const taken = await prisma.business.findMany({
        where: { slug: { startsWith: baseSlug } },
        select: { slug: true },
    });
    const takenSlugs = new Set(taken.map((b) => b.slug));

    if (!takenSlugs.has(baseSlug)) return baseSlug;

    let counter = 1;
    while (takenSlugs.has(`${baseSlug}-${counter}`)) counter++;

    return `${baseSlug}-${counter}`;
}

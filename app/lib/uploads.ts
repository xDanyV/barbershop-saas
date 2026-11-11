import { after } from "next/server";
import { UTApi } from "uploadthing/server";
import { prisma } from "@/lib/prisma";
import { fileKeyFromUrl } from "@/lib/upload-keys";

// Una URL sigue en uso si algo visible la muestra (incluso en otro negocio): entonces no se borra
async function isStillUsed(url: string) {
    const [businesses, gallery, posts, barbers] = await Promise.all([
        prisma.business.count({ where: { OR: [{ logoUrl: url }, { coverUrl: url }] } }),
        prisma.businessGallery.count({ where: { imageUrl: url, active: true } }),
        prisma.businessPost.count({ where: { imageUrl: url, active: true } }),
        prisma.barber.count({ where: { profileImageUrl: url } }),
    ]);

    return businesses + gallery + posts + barbers > 0;
}

async function deleteUnusedUploads(urls: string[]) {
    if (!process.env.UPLOADTHING_TOKEN) return;

    const keys: string[] = [];

    for (const url of new Set(urls)) {
        const key = fileKeyFromUrl(url);
        if (key && !(await isStillUsed(url))) keys.push(key);
    }

    if (keys.length === 0) return;

    await new UTApi().deleteFiles(keys);
}

// Borra de UploadThing las fotos que se reemplazaron o quitaron, después de responder.
// Si falla solo queda un archivo huérfano: nunca se interrumpe el cambio del usuario.
export function cleanUpUploads(urls: Array<string | null | undefined>) {
    const list = urls.filter((url): url is string => Boolean(url));
    if (list.length === 0) return;

    after(async () => {
        try {
            await deleteUnusedUploads(list);
        } catch (error) {
            console.error("Upload cleanup failed", error);
        }
    });
}

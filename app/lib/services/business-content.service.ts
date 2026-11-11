import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

// Galería y publicaciones del negocio del OWNER. El borrado es lógico (active=false).
// Devuelven la imagen actual para poder borrar el archivo cuando se reemplaza o se quita.

export async function assertGalleryItem(id: string, businessId: string) {
    const item = await prisma.businessGallery.findFirst({
        where: { id, businessId, active: true },
        select: { id: true, imageUrl: true },
    });

    if (!item) throw new AppError("Gallery item not found", 404);

    return item;
}

export async function assertBusinessPost(id: string, businessId: string) {
    const post = await prisma.businessPost.findFirst({
        where: { id, businessId, active: true },
        select: { id: true, imageUrl: true },
    });

    if (!post) throw new AppError("Post not found", 404);

    return post;
}

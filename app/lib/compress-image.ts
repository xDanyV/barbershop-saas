// Reduce las fotos en el navegador antes de subirlas: una foto de celular de 5 MB queda en unos cientos de KB.
// Si algo falla o el resultado no es más ligero, se sube el archivo original.

type Options = {
    // Lado más largo en píxeles
    maxSize?: number;
    quality?: number;
};

const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
    return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function compressImage(file: File, { maxSize = 1600, quality = 0.82 }: Options = {}): Promise<File> {
    if (typeof window === "undefined" || !file.type.startsWith("image/") || SKIP_TYPES.has(file.type)) return file;

    try {
        const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
        const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");
        if (!context) return file;

        context.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();

        // WebP conserva la transparencia de los logos; si el navegador no lo genera, JPEG para fotos
        let blob = await toBlob(canvas, "image/webp", quality);
        if (blob?.type !== "image/webp") {
            if (file.type === "image/png") return file;
            blob = await toBlob(canvas, "image/jpeg", quality);
        }

        if (!blob || blob.size >= file.size) return file;

        const extension = blob.type === "image/webp" ? "webp" : "jpg";
        const name = `${file.name.replace(/\.[^.]+$/, "") || "foto"}.${extension}`;

        return new File([blob], name, { type: blob.type, lastModified: Date.now() });
    } catch {
        return file;
    }
}

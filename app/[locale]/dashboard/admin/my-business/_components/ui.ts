"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { compressImage } from "@/lib/compress-image";

// Estilos compartidos de "Mi negocio", iguales a los de Equipo y la agenda
export const card = "border border-gray-200 bg-white p-5 md:p-6";
export const sectionTitle = "text-lg font-semibold text-gray-900";
export const sectionHint = "mt-1 text-sm text-gray-600";
export const fieldLabel = "block text-sm font-semibold text-gray-900";
export const fieldInput =
    "mt-2 block min-h-12 w-full border border-gray-200 bg-white px-4 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900";
export const fieldTextarea =
    "mt-2 block w-full resize-y border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-900";
export const primaryButton =
    "inline-flex min-h-11 items-center justify-center gap-2 bg-gray-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
export const secondaryButton =
    "inline-flex min-h-11 items-center justify-center gap-2 border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 transition-colors hover:border-gray-900 disabled:opacity-50";
export const dangerLink = "inline-flex min-h-11 items-center gap-1.5 px-2 text-sm font-semibold text-[#b8431f] hover:underline disabled:opacity-50";

type Endpoint = "businessLogoImage" | "businessCoverImage" | "businessPostImage" | "businessGalleryImage";

// Revisa, aligera y sube una imagen; devuelve su URL o null si algo falló (ya avisado con un toast)
export function useImageUpload(endpoint: Endpoint, options: { maxSize: number; maxMb: number }) {
    const t = useTranslations("MyBusiness.upload");
    const [uploading, setUploading] = useState(false);
    // El error del servidor ya se avisa aquí; así no se muestra dos veces
    const reported = useRef(false);
    const { startUpload } = useUploadThing(endpoint, {
        onUploadError: (error) => {
            reported.current = true;
            toast.error(error.message || t("failed"));
        },
    });

    const upload = async (file: File | undefined) => {
        if (!file) return null;

        if (!file.type.startsWith("image/")) {
            toast.error(t("notImage"));
            return null;
        }

        setUploading(true);
        reported.current = false;

        try {
            const light = await compressImage(file, { maxSize: options.maxSize });

            if (light.size > options.maxMb * 1024 * 1024) {
                toast.error(t("tooBig", { mb: options.maxMb }));
                return null;
            }

            const result = await startUpload([light]);
            const url = result?.[0]?.serverData?.url ?? result?.[0]?.url;

            if (!url) {
                if (!reported.current) toast.error(t("failed"));
                return null;
            }

            return url as string;
        } catch {
            toast.error(t("failed"));
            return null;
        } finally {
            setUploading(false);
        }
    };

    return { upload, uploading };
}

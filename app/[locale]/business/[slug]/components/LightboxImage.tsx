"use client";

import { useEffect } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslations } from "next-intl";

export type LightboxItem = {
    src: string;
    alt: string;
    caption?: string | null;
};

type Props = {
    items: LightboxItem[];
    index: number;
    onChange: (index: number) => void;
    onClose: () => void;
};

// Visor de fotos a pantalla completa: flechas, teclado y Escape para cerrar
export default function Lightbox({ items, index, onChange, onClose }: Props) {
    const t = useTranslations("BusinessPage.gallery");
    const item = items[index];
    const many = items.length > 1;

    useEffect(() => {
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
            if (!many) return;
            if (event.key === "ArrowRight") onChange((index + 1) % items.length);
            if (event.key === "ArrowLeft") onChange((index - 1 + items.length) % items.length);
        };

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [index, items.length, many, onChange, onClose]);

    if (!item) return null;

    const navButton =
        "absolute top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center bg-[rgba(15,39,51,0.7)] text-white transition-colors hover:bg-[#0f2733]";

    return (
        <div role="dialog" aria-modal="true" aria-label={item.alt} className="fixed inset-0 z-[90] flex flex-col bg-[rgba(10,26,34,0.94)]" onClick={onClose}>
            <div className="flex justify-end p-2">
                <button type="button" onClick={onClose} aria-label={t("close")} className="flex h-12 w-12 items-center justify-center text-white">
                    <X size={24} />
                </button>
            </div>

            <div className="relative flex min-h-0 flex-1 items-center justify-center px-4" onClick={(event) => event.stopPropagation()}>
                <img src={item.src} alt={item.alt} className="max-h-full max-w-full object-contain" />

                {many && (
                    <>
                        <button type="button" onClick={() => onChange((index - 1 + items.length) % items.length)} aria-label={t("previous")} className={`${navButton} left-2`}>
                            <ChevronLeft size={24} />
                        </button>
                        <button type="button" onClick={() => onChange((index + 1) % items.length)} aria-label={t("next")} className={`${navButton} right-2`}>
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}
            </div>

            <div className="min-h-16 px-4 py-4 text-center text-white" onClick={(event) => event.stopPropagation()}>
                {item.caption && <p className="mx-auto max-w-2xl">{item.caption}</p>}
                {many && (
                    <p className="tabular mt-1 text-sm text-white/70">
                        {index + 1} / {items.length}
                    </p>
                )}
            </div>
        </div>
    );
}

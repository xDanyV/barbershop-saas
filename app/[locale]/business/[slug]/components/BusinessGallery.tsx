"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { PublicBusinessGalleryItem } from "../lib/business-page.types";
import Lightbox from "./LightboxImage";

type Props = {
    gallery: PublicBusinessGalleryItem[];
};

// Cuadrícula de fotos; al tocar una se abre en grande
export default function BusinessGallery({ gallery }: Props) {
    const t = useTranslations("BusinessPage.gallery");
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const items = gallery.map((item) => ({ src: item.imageUrl, alt: item.caption || t("imageAlt"), caption: item.caption }));

    return (
        <>
            <ul className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3 md:gap-3">
                {gallery.map((item, index) => (
                    <li key={item.id} className={index === 0 && gallery.length >= 5 ? "col-span-2 row-span-2" : ""}>
                        <button
                            type="button"
                            onClick={() => setOpenIndex(index)}
                            aria-label={t("open", { name: item.caption || t("imageAlt") })}
                            className="group block aspect-square w-full overflow-hidden bg-[var(--brand-surface)]"
                        >
                            <img
                                src={item.imageUrl}
                                alt={item.caption || t("imageAlt")}
                                loading="lazy"
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        </button>
                    </li>
                ))}
            </ul>

            {openIndex !== null && <Lightbox items={items} index={openIndex} onChange={setOpenIndex} onClose={() => setOpenIndex(null)} />}
        </>
    );
}

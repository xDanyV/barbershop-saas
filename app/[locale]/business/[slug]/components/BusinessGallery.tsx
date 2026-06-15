"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ImageIcon } from "lucide-react";
import { PublicBusinessGalleryItem } from "../lib/business-page.types";
import LightboxImage from "./LightboxImage";

type Props = {
    gallery: PublicBusinessGalleryItem[];
};

export default function BusinessGallery({ gallery }: Props) {
    const [activeIndex, setActiveIndex] = useState(0);

    if (gallery.length === 0) {
        return (
            <div className="bg-white/6 border border-white/10 rounded-4xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
                        <ImageIcon size={22} />
                    </div>

                    <div>
                        <h2 className="text-xl font-black">Galería</h2>
                        <p className="text-gray-400 text-sm">Fotos del negocio.</p>
                    </div>
                </div>

                <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center">
                    <ImageIcon className="mx-auto text-gray-600 mb-3" size={34} />
                    <p className="text-gray-400 text-sm">
                        Aún no hay fotos en la galería.
                    </p>
                </div>
            </div>
        );
    }

    const activeImage = gallery[activeIndex];

    const goPrevious = () => {
        setActiveIndex((current) =>
            current === 0 ? gallery.length - 1 : current - 1
        );
    };

    const goNext = () => {
        setActiveIndex((current) =>
            current === gallery.length - 1 ? 0 : current + 1
        );
    };

    return (
        <div className="bg-white/6 border border-white/10 rounded-4xl p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
                        <ImageIcon size={22} />
                    </div>

                    <div>
                        <h2 className="text-xl font-black">Galería</h2>
                        <p className="text-gray-400 text-sm">
                            {gallery.length} foto{gallery.length === 1 ? "" : "s"}.
                        </p>
                    </div>
                </div>

                {gallery.length > 1 && (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={goPrevious}
                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                        >
                            <ArrowLeft size={15} />
                        </button>

                        <button
                            type="button"
                            onClick={goNext}
                            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center transition-colors"
                        >
                            <ArrowRight size={15} />
                        </button>
                    </div>
                )}
            </div>

            <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black/20">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeImage.id}
                        initial={{ opacity: 0, scale: 1.04 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25 }}
                    >
                        <LightboxImage
                            src={activeImage.imageUrl}
                            alt={activeImage.caption || "Foto del negocio"}
                            caption={activeImage.caption}
                            imageClassName="w-full h-72 object-contain bg-black/30"
                        />
                    </motion.div>
                </AnimatePresence>

                {activeImage.caption && (
                    <div className="absolute left-0 right-0 bottom-0 bg-linear-to-t from-black/80 to-transparent p-4">
                        <p className="text-sm text-white font-bold">
                            {activeImage.caption}
                        </p>
                    </div>
                )}
            </div>

            {gallery.length > 1 && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                    {gallery.slice(0, 8).map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`aspect-square rounded-2xl overflow-hidden border transition-all ${activeIndex === index
                                ? "border-indigo-300 opacity-100 scale-[1.03]"
                                : "border-white/10 opacity-55 hover:opacity-100"
                                }`}
                        >
                            <img
                                src={item.imageUrl}
                                alt={item.caption || "Foto del negocio"}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn } from "lucide-react";

type Props = {
    src: string;
    alt: string;
    caption?: string | null;
    buttonClassName?: string;
    imageClassName?: string;
};

export default function LightboxImage({
    src,
    alt,
    caption,
    buttonClassName = "",
    imageClassName = "",
}: Props) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className={`group relative block w-full overflow-hidden text-left ${buttonClassName}`}
            >
                <img src={src} alt={alt} className={imageClassName} />

                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-all bg-white/90 text-gray-900 rounded-full p-3 shadow-lg">
                        <ZoomIn size={20} />
                    </div>
                </div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-80 bg-black/80 backdrop-blur-sm px-4 py-6 flex items-center justify-center"
                        onClick={() => setIsOpen(false)}
                    >
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ duration: 0.2 }}
                            className="max-w-6xl w-full"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={src}
                                alt={alt}
                                className="mx-auto max-w-full max-h-[82vh] w-auto h-auto object-contain rounded-2xl border border-white/10 shadow-2xl"
                            />

                            {caption && (
                                <p className="mt-4 text-center text-sm text-gray-200 max-w-3xl mx-auto leading-relaxed">
                                    {caption}
                                </p>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
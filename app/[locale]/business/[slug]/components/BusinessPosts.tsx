"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { PublicBusinessPost } from "../lib/business-page.types";
import { formatDate } from "../lib/business-page.utils";
import Lightbox from "./LightboxImage";

type Props = {
    posts: PublicBusinessPost[];
};

// Avisos y promociones del negocio, los más recientes primero
export default function BusinessPosts({ posts }: Props) {
    const t = useTranslations("BusinessPage.posts");
    const locale = useLocale();
    const [open, setOpen] = useState<PublicBusinessPost | null>(null);

    return (
        <>
            <ul className="mt-8 grid gap-6 md:grid-cols-2">
                {posts.map((post) => (
                    <li key={post.id} className="border-t-2 border-[var(--brand-ink)] pt-4">
                        <p className="tabular text-[length:var(--step-small)] text-[var(--brand-muted)]">{formatDate(new Date(post.createdAt), locale)}</p>

                        {post.imageUrl && (
                            <button
                                type="button"
                                onClick={() => setOpen(post)}
                                aria-label={t("openImage")}
                                className="group mt-3 block aspect-[4/3] w-full overflow-hidden bg-[var(--brand-surface)]"
                            >
                                <img
                                    src={post.imageUrl}
                                    alt={t("imageAlt")}
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </button>
                        )}

                        <p className="mt-3 whitespace-pre-line">{post.content}</p>
                    </li>
                ))}
            </ul>

            {open?.imageUrl && (
                <Lightbox
                    items={[{ src: open.imageUrl, alt: t("imageAlt"), caption: open.content }]}
                    index={0}
                    onChange={() => undefined}
                    onClose={() => setOpen(null)}
                />
            )}
        </>
    );
}

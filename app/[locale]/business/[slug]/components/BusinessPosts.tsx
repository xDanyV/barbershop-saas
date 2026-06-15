import { Megaphone, Newspaper } from "lucide-react";
import { PublicBusinessPost } from "../lib/business-page.types";
import { formatDate } from "../lib/business-page.utils";

type Props = {
    posts: PublicBusinessPost[];
};

export default function BusinessPosts({ posts }: Props) {
    const latestPosts = posts.slice(0, 6);

    return (
        <div className="bg-white/6 border border-white/10 rounded-4xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center shrink-0">
                        <Newspaper size={22} />
                    </div>

                    <div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                            Publicaciones
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Avisos, promociones y novedades del negocio.
                        </p>
                    </div>
                </div>

                {latestPosts.length > 0 && (
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-indigo-300">
                        {latestPosts.length} publicación
                        {latestPosts.length === 1 ? "" : "es"}
                    </p>
                )}
            </div>

            {latestPosts.length === 0 ? (
                <div className="min-h-48 md:min-h-56 rounded-3xl border border-dashed border-white/10 bg-black/20 flex flex-col items-center justify-center text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 text-gray-500 flex items-center justify-center mb-4">
                        <Megaphone size={26} />
                    </div>

                    <p className="text-gray-300 font-black text-lg">
                        Aún no hay publicaciones.
                    </p>

                    <p className="text-gray-500 text-sm mt-2 max-w-md">
                        Cuando el negocio agregue promociones, avisos o novedades, aparecerán en esta sección.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {latestPosts.map((post, index) => (
                        <article
                            key={post.id}
                            className={`bg-black/20 border border-white/10 rounded-3xl overflow-hidden ${index === 0 ? "md:col-span-2" : ""
                                }`}
                        >
                            {post.imageUrl && (
                                <img
                                    src={post.imageUrl}
                                    alt="Publicación"
                                    className={`w-full object-cover border-b border-white/10 ${index === 0 ? "h-64 md:h-80" : "h-48"
                                        }`}
                                />
                            )}

                            <div className="p-5 md:p-6">
                                <p className="text-gray-200 leading-relaxed text-sm md:text-base whitespace-pre-line">
                                    {post.content}
                                </p>

                                <p className="text-xs text-gray-500 mt-4 font-bold">
                                    {formatDate(post.createdAt)}
                                </p>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
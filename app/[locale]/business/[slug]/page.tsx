import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
    MapPin,
    Phone,
    Scissors,
    Users,
    ImageIcon,
    Newspaper,
    CalendarDays,
} from "lucide-react";

type BusinessPageProps = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

function formatPrice(price: number) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(price);
}

export default async function BusinessPage({ params }: BusinessPageProps) {
    const { locale, slug } = await params;

    const business = await prisma.business.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            phone: true,
            address: true,
            logoUrl: true,
            coverUrl: true,
            active: true,
            settings: {
                select: {
                    isServiceActive: true,
                    maintenanceMessage: true,
                },
            },
            barbers: {
                where: {
                    active: true,
                    status: "APPROVED",
                },
                select: {
                    id: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
            services: {
                where: {
                    active: true,
                    barber: {
                        active: true,
                        status: "APPROVED",
                    },
                },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    duration: true,
                    barber: {
                        select: {
                            user: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
            gallery: {
                where: {
                    active: true,
                },
                select: {
                    id: true,
                    imageUrl: true,
                    caption: true,
                    position: true,
                },
                orderBy: [
                    {
                        position: "asc",
                    },
                    {
                        createdAt: "desc",
                    },
                ],
            },
            posts: {
                where: {
                    active: true,
                },
                select: {
                    id: true,
                    content: true,
                    imageUrl: true,
                    createdAt: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
            },
        },
    });

    if (!business || !business.active) {
        notFound();
    }

    const isServiceActive = business.settings?.isServiceActive ?? true;

    return (
        <main className="min-h-screen bg-[#0a0a0f] text-white">
            <section className="relative">
                <div className="h-64 bg-gradient-to-br from-indigo-700 via-indigo-950 to-black">
                    {business.coverUrl && (
                        <img
                            src={business.coverUrl}
                            alt={business.name}
                            className="h-full w-full object-cover opacity-80"
                        />
                    )}
                </div>

                <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
                    <div className="bg-white/10 border border-white/10 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-2xl">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-5">
                            <div className="w-24 h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-3xl font-black border border-white/20 overflow-hidden">
                                {business.logoUrl ? (
                                    <img
                                        src={business.logoUrl}
                                        alt={business.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    business.name.charAt(0)
                                )}
                            </div>

                            <div className="flex-1">
                                <p className="text-indigo-300 text-xs font-bold uppercase tracking-[0.25em] mb-2">
                                    Perfil del negocio
                                </p>

                                <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                                    {business.name}
                                </h1>

                                {business.description && (
                                    <p className="text-gray-300 mt-3 max-w-2xl">
                                        {business.description}
                                    </p>
                                )}

                                <div className="flex flex-wrap gap-3 mt-5 text-sm text-gray-300">
                                    {business.address && (
                                        <span className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                            <MapPin size={16} />
                                            {business.address}
                                        </span>
                                    )}

                                    {business.phone && (
                                        <span className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                                            <Phone size={16} />
                                            {business.phone}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div>
                                <Link
                                    href={`/${locale}/business/${business.slug}/book`}
                                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl transition-colors"
                                >
                                    <CalendarDays size={18} />
                                    Reservar cita
                                </Link>
                            </div>
                        </div>

                        {!isServiceActive && (
                            <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-200 rounded-2xl px-4 py-3 text-sm">
                                {business.settings?.maintenanceMessage ||
                                    "El servicio está temporalmente inactivo."}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <Scissors className="text-indigo-400" />
                            <h2 className="text-2xl font-black">Servicios</h2>
                        </div>

                        {business.services.length === 0 ? (
                            <p className="text-gray-400 text-sm">
                                Este negocio aún no ha agregado servicios.
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {business.services.map((service) => (
                                    <div
                                        key={service.id}
                                        className="bg-black/20 border border-white/10 rounded-2xl p-4"
                                    >
                                        <h3 className="font-bold text-lg">{service.name}</h3>
                                        <p className="text-gray-400 text-sm mt-1">
                                            {service.duration} min ·{" "}
                                            {service.barber.user.name || "Barbero"}
                                        </p>
                                        <p className="text-indigo-300 font-black mt-3">
                                            {formatPrice(service.price)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <Newspaper className="text-indigo-400" />
                            <h2 className="text-2xl font-black">Publicaciones</h2>
                        </div>

                        {business.posts.length === 0 ? (
                            <p className="text-gray-400 text-sm">
                                Aún no hay publicaciones.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {business.posts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="bg-black/20 border border-white/10 rounded-2xl p-4"
                                    >
                                        <p className="text-gray-200">{post.content}</p>

                                        {post.imageUrl && (
                                            <img
                                                src={post.imageUrl}
                                                alt="Publicación"
                                                className="mt-4 rounded-xl w-full max-h-80 object-cover"
                                            />
                                        )}

                                        <p className="text-xs text-gray-500 mt-3">
                                            {new Date(post.createdAt).toLocaleDateString("es-MX")}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <aside className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <Users className="text-indigo-400" />
                            <h2 className="text-xl font-black">Barberos</h2>
                        </div>

                        {business.barbers.length === 0 ? (
                            <p className="text-gray-400 text-sm">
                                No hay barberos disponibles.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {business.barbers.map((barber) => (
                                    <div
                                        key={barber.id}
                                        className="bg-black/20 border border-white/10 rounded-2xl px-4 py-3"
                                    >
                                        <p className="font-bold">
                                            {barber.user.name || "Barbero"}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <ImageIcon className="text-indigo-400" />
                            <h2 className="text-xl font-black">Galería</h2>
                        </div>

                        {business.gallery.length === 0 ? (
                            <p className="text-gray-400 text-sm">
                                Aún no hay fotos en la galería.
                            </p>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {business.gallery.map((item) => (
                                    <div key={item.id}>
                                        <img
                                            src={item.imageUrl}
                                            alt={item.caption || "Foto del negocio"}
                                            className="aspect-square w-full object-cover rounded-xl border border-white/10"
                                        />

                                        {item.caption && (
                                            <p className="text-xs text-gray-400 mt-1">
                                                {item.caption}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </aside>
            </section>
        </main>
    );
}
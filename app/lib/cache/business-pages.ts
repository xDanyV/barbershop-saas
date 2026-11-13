import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { publicBusinessWhere } from "@/lib/billing/status";

// Las páginas públicas de un negocio (perfil y reserva) se leen de caché.
// Las rutas que editan esos datos llaman a revalidateBusinessPages para que el cambio se vea al instante.
const PUBLIC_PAGE_REVALIDATE_SECONDS = 300;

const businessPageTag = (slug: string) => `business-page:${slug}`;

async function queryPublicBusinessPage(slug: string) {
    const business = await queryPublicBusiness(slug);
    if (!business) return null;

    // Reseñas visibles: promedio, total y las más recientes (nada si la barbería no las recibe)
    const reviewsEnabled = business.settings?.reviewsEnabled !== false;
    const [summary, latest] = reviewsEnabled
        ? await Promise.all([
              prisma.review.aggregate({ where: { businessId: business.id, hidden: false }, _avg: { rating: true }, _count: { _all: true } }),
              prisma.review.findMany({
                  where: { businessId: business.id, hidden: false },
                  orderBy: { createdAt: "desc" },
                  take: 6,
                  select: { id: true, rating: true, comment: true, reply: true, createdAt: true, user: { select: { name: true } } },
              }),
          ])
        : [null, []];

    return {
        ...business,
        rating: summary && summary._count._all > 0 ? { average: Math.round((summary._avg.rating ?? 0) * 10) / 10, count: summary._count._all } : null,
        reviews: latest.map((review) => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            reply: review.reply,
            createdAt: review.createdAt,
            // Solo el nombre de pila: la reseña es pública
            author: (review.user.name ?? "").split(" ")[0],
        })),
    };
}

async function queryPublicBusiness(slug: string) {
    return prisma.business.findFirst({
        where: { slug, ...publicBusinessWhere },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            phone: true,
            address: true,
            logoUrl: true,
            latitude: true,
            longitude: true,
            themePrimary: true,
            themeAccent: true,
            coverUrl: true,
            active: true,
            timezone: true,
            settings: {
                select: {
                    isServiceActive: true,
                    maintenanceMessage: true,
                    reviewsEnabled: true,
                },
            },
            // Sin servicios o sin horario un barbero no tiene nada que reservar
            barbers: {
                where: {
                    active: true,
                    status: "APPROVED",
                    services: { some: { active: true } },
                    availability: { some: {} },
                },
                select: {
                    id: true,
                    profileImageUrl: true,
                    availability: {
                        select: { dayOfWeek: true, startTime: true, endTime: true },
                    },
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
                    priceCents: true,
                    duration: true,
                    barber: {
                        select: {
                            id: true,
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
}

async function queryBookingBusiness(slug: string) {
    return prisma.business.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            phone: true,
            logoUrl: true,
            themePrimary: true,
            themeAccent: true,
            timezone: true,
            active: true,
            subscription: { select: { billingStatus: true } },
            settings: {
                select: {
                    isServiceActive: true,
                    maintenanceMessage: true,
                    autoConfirm: true,
                },
            },
            // Sin servicios o sin horario un barbero no tiene nada que reservar
            barbers: {
                where: {
                    active: true,
                    status: "APPROVED",
                    services: { some: { active: true } },
                    availability: { some: {} },
                },
                select: {
                    id: true,
                    profileImageUrl: true,
                    user: {
                        select: {
                            name: true,
                        },
                    },
                    // El cliente elige el servicio antes que la hora y solo ve los días que el barbero trabaja
                    services: {
                        where: { active: true },
                        select: { id: true, name: true, priceCents: true, duration: true },
                        orderBy: { priceCents: "asc" },
                    },
                    availability: {
                        select: { dayOfWeek: true },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });
}

export async function getPublicBusinessPage(slug: string) {
    const business = await unstable_cache(
        () => queryPublicBusinessPage(slug),
        ["public-business-page", slug],
        { revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS, tags: [businessPageTag(slug)] }
    )();

    if (!business) return null;

    // La caché serializa a JSON: las fechas vuelven como texto
    return {
        ...business,
        posts: business.posts.map((post) => ({ ...post, createdAt: new Date(post.createdAt) })),
        reviews: business.reviews.map((review) => ({ ...review, createdAt: new Date(review.createdAt) })),
    };
}

export function getBookingBusiness(slug: string) {
    return unstable_cache(
        () => queryBookingBusiness(slug),
        ["booking-business", slug],
        { revalidate: PUBLIC_PAGE_REVALIDATE_SECONDS, tags: [businessPageTag(slug)] }
    )();
}

// Expira de inmediato la caché pública del negocio (perfil y página de reserva)
export async function revalidateBusinessPages(businessId: string | null | undefined) {
    if (!businessId) return;

    const business = await prisma.business.findUnique({
        where: { id: businessId },
        select: { slug: true },
    });

    if (business) {
        revalidateTag(businessPageTag(business.slug), { expire: 0 });
    }
}

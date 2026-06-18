import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BusinessHero from "./components/BusinessHero";
import BarberCarousel from "./components/BarberCarousel";
import BusinessGallery from "./components/BusinessGallery";
import BusinessPosts from "./components/BusinessPosts";
import FloatingContactCard from "./components/FloatingContactCard";
import BusinessCTA from "./components/BusinessCTA";
import BusinessPublicNavbar from "./components/BusinessPublicNavbar";
import { groupServicesByName } from "./lib/business-page.utils";

type BusinessPageProps = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

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
                    profileImageUrl: true,
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
    const bookUrl = `/${locale}/business/${business.slug}/book`;

    const groupedServices = groupServicesByName(business.services);

    const barbersForCarousel = business.barbers.map((barber) => ({
        id: barber.id,
        name: barber.user.name || "Barbero",
        imageUrl: barber.profileImageUrl || null,
    }));

    return (
        <main className="min-h-screen bg-[#08080d] text-white overflow-hidden">

            <BusinessPublicNavbar locale={locale} slug={business.slug} />

            <BusinessHero
                business={business}
                locale={locale}
                isServiceActive={isServiceActive}
                serviceCount={groupedServices.length}
                barberCount={business.barbers.length}
                galleryCount={business.gallery.length}
            />

            <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-16 pb-8 md:pb-10 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
                <div>
                    <BarberCarousel
                        barbers={barbersForCarousel}
                        bookUrl={bookUrl}
                    />
                </div>

                <aside className="space-y-6">
                    <BusinessGallery gallery={business.gallery} />

                    <FloatingContactCard
                        phone={business.phone}
                        address={business.address}
                    />
                </aside>
            </section>

            <section className="max-w-6xl mx-auto px-4 pb-12 md:pb-16">
                <BusinessPosts posts={business.posts} />
            </section>

            <BusinessCTA
                businessName={business.name}
                bookUrl={bookUrl}
                isServiceActive={isServiceActive}
            />
        </main>
    );
}
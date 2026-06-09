import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BusinessBookingClient from "./BusinessBookingClient";

type BookPageProps = {
    params: Promise<{
        locale: string;
        slug: string;
    }>;
};

export default async function BusinessBookPage({ params }: BookPageProps) {
    const { locale, slug } = await params;

    const business = await prisma.business.findUnique({
        where: { slug },
        select: {
            id: true,
            name: true,
            slug: true,
            description: true,
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
                            email: true,
                            phone: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });

    if (!business || !business.active) {
        notFound();
    }

    if (business.settings && !business.settings.isServiceActive) {
        return (
            <main className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-4">
                <div className="max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 text-center">
                    <h1 className="text-2xl font-black">{business.name}</h1>
                    <p className="text-gray-400 mt-4">
                        {business.settings.maintenanceMessage ||
                            "El servicio está temporalmente inactivo."}
                    </p>
                </div>
            </main>
        );
    }

    return (
        <BusinessBookingClient
            locale={locale}
            business={{
                name: business.name,
                slug: business.slug,
                description: business.description,
                barbers: business.barbers,
            }}
        />
    );
}
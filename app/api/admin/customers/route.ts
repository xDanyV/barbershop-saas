import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const businessId = headersList.get("x-business-id");

        if (role !== "ADMIN" && role !== "OWNER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (role === "OWNER" && !businessId) {
            return NextResponse.json({ error: "Business context is required" }, { status: 403 });
        }

        const customers = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                ...(role === "OWNER"
                    ? {
                        appointments: {
                            some: {
                                businessId: businessId!,
                            },
                        },
                    }
                    : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                isBanned: true,
                _count: {
                    select: {
                        appointments: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(customers);
    } catch (error) {
        console.error("Error fetching customers:", error);
        return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const headersList = await headers();
        const role = headersList.get("x-user-role");
        const businessId = headersList.get("x-business-id");

        if (role !== "ADMIN" && role !== "OWNER") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (role === "OWNER" && !businessId) {
            return NextResponse.json({ error: "Business context is required" }, { status: 403 });
        }

        const body = await req.json();
        const { customerId, isBanned } = body;

        if (!customerId || typeof isBanned !== "boolean") {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        if (role === "OWNER") {
            const hasAppointmentInBusiness = await prisma.appointment.findFirst({
                where: {
                    userId: customerId,
                    businessId: businessId!,
                },
                select: {
                    id: true,
                },
            });

            if (!hasAppointmentInBusiness) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
            }
        }

        const updatedCustomer = await prisma.user.update({
            where: { id: customerId },
            data: { isBanned },
        });

        return NextResponse.json({ success: true, user: updatedCustomer });
    } catch (error) {
        console.error("Error updating customer ban status:", error);
        return NextResponse.json({ error: "Failed to update customer" }, { status: 500 });
    }
}
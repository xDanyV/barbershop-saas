import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { BarberStatus } from "@prisma/client";

export async function GET() {
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    const businessId = headerList.get("x-business-id");

    if (role !== "ADMIN" && role !== "OWNER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (role === "OWNER" && !businessId) {
        return NextResponse.json(
            { error: "Business context is required" },
            { status: 403 }
        );
    }

    try {
        const pendingBarbers = await prisma.barber.findMany({
            where: {
                status: "PENDING",
                ...(role === "OWNER" ? { businessId: businessId! } : {}),
            },
            select: {
                id: true,
                userId: true,
                businessId: true,
                status: true,
                active: true,
                createdAt: true,
                profileImageUrl: true,
                user: {
                    select: {
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(pendingBarbers);
    } catch (error) {
        console.error("Error fetching pending barbers:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    const businessId = headerList.get("x-business-id");

    if (role !== "ADMIN" && role !== "OWNER") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (role === "OWNER" && !businessId) {
        return NextResponse.json(
            { error: "Business context is required" },
            { status: 403 }
        );
    }

    try {
        const body = await req.json();
        const { barberId, status, profileImageUrl } = body as {
            barberId?: string;
            status?: BarberStatus;
            profileImageUrl?: string | null;
        };

        if (!barberId) {
            return NextResponse.json(
                { error: "Barber ID is required" },
                { status: 400 }
            );
        }

        if (status === undefined && profileImageUrl === undefined) {
            return NextResponse.json(
                { error: "No data to update" },
                { status: 400 }
            );
        }

        if (
            status !== undefined &&
            !["PENDING", "APPROVED", "REJECTED"].includes(status)
        ) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        const existingBarber = await prisma.barber.findUnique({
            where: { id: barberId },
            select: {
                id: true,
                businessId: true,
            },
        });

        if (!existingBarber) {
            return NextResponse.json(
                { error: "Barber not found" },
                { status: 404 }
            );
        }

        if (role === "OWNER" && existingBarber.businessId !== businessId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updateData: {
            status?: BarberStatus;
            profileImageUrl?: string | null;
        } = {};

        if (status !== undefined) {
            updateData.status = status;
        }

        if (profileImageUrl !== undefined) {
            const normalizedImageUrl =
                typeof profileImageUrl === "string" && profileImageUrl.trim().length > 0
                    ? profileImageUrl.trim()
                    : null;

            updateData.profileImageUrl = normalizedImageUrl;
        }

        const updatedBarber = await prisma.barber.update({
            where: { id: barberId },
            data: updateData,
            select: {
                id: true,
                status: true,
                profileImageUrl: true,
            },
        });

        return NextResponse.json({
            message: "Barber updated successfully",
            barber: updatedBarber,
        });
    } catch (error) {
        console.error("Error updating barber:", error);
        return NextResponse.json(
            { error: "Error updating barber" },
            { status: 500 }
        );
    }
}
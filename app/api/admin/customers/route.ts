import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { updateCustomerBanSchema } from "@/lib/validations/schemas";

// ADMIN ve a todos los clientes; OWNER solo a los que tienen citas en su negocio
function requireCustomerManager(request: NextRequest) {
    const auth = requireAuth(request, ["ADMIN", "OWNER"]);

    if (auth.role === "OWNER" && !auth.businessId) {
        throw new AppError("Business context is required", 403);
    }

    return auth;
}

export async function GET(request: NextRequest) {
    try {
        const auth = requireCustomerManager(request);

        const customers = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                ...(auth.role === "OWNER"
                    ? { appointments: { some: { businessId: auth.businessId! } } }
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
        return errorResponse(error, "Error fetching customers");
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = requireCustomerManager(request);
        const { customerId, isBanned } = await parseJsonBody(request, updateCustomerBanSchema);

        if (auth.role === "OWNER") {
            const hasAppointmentInBusiness = await prisma.appointment.findFirst({
                where: {
                    userId: customerId,
                    businessId: auth.businessId!,
                },
                select: { id: true },
            });

            if (!hasAppointmentInBusiness) {
                throw new AppError("Forbidden", 403);
            }
        }

        // Solo se puede bloquear a clientes, nunca a barberos, owners o admins
        const customer = await prisma.user.findFirst({
            where: { id: customerId, role: "CUSTOMER" },
            select: { id: true },
        });

        if (!customer) {
            throw new AppError("Customer not found", 404);
        }

        const updatedCustomer = await prisma.user.update({
            where: { id: customerId },
            data: { isBanned },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                isBanned: true,
            },
        });

        return NextResponse.json({ success: true, user: updatedCustomer });
    } catch (error) {
        return errorResponse(error, "Error updating customer ban status");
    }
}

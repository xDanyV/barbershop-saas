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

// ADMIN usa el bloqueo global (User.isBanned); OWNER bloquea solo en su negocio (BusinessCustomerBan)
export async function GET(request: NextRequest) {
    try {
        const auth = requireCustomerManager(request);
        const ownerBusinessId = auth.role === "OWNER" ? auth.businessId! : null;

        const customers = await prisma.user.findMany({
            where: {
                role: "CUSTOMER",
                ...(ownerBusinessId ? { appointments: { some: { businessId: ownerBusinessId } } } : {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
                isBanned: true,
                businessBans: ownerBusinessId
                    ? { where: { businessId: ownerBusinessId }, select: { id: true } }
                    : false,
                _count: {
                    select: {
                        // Para un OWNER solo cuentan las citas en su negocio
                        appointments: ownerBusinessId ? { where: { businessId: ownerBusinessId } } : true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(
            customers.map(({ businessBans, ...customer }) => ({
                ...customer,
                isBanned: ownerBusinessId ? (businessBans?.length ?? 0) > 0 : customer.isBanned,
            }))
        );
    } catch (error) {
        return errorResponse(error, "Error fetching customers");
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const auth = requireCustomerManager(request);
        const { customerId, isBanned } = await parseJsonBody(request, updateCustomerBanSchema);

        // Solo se puede bloquear a clientes, nunca a barberos, owners o admins
        const customer = await prisma.user.findFirst({
            where: { id: customerId, role: "CUSTOMER" },
            select: { id: true, name: true, email: true, phone: true, isBanned: true },
        });

        if (!customer) {
            throw new AppError("Customer not found", 404);
        }

        if (auth.role === "OWNER") {
            const businessId = auth.businessId!;

            const hasAppointmentInBusiness = await prisma.appointment.findFirst({
                where: { userId: customerId, businessId },
                select: { id: true },
            });

            if (!hasAppointmentInBusiness) {
                throw new AppError("Forbidden", 403);
            }

            if (isBanned) {
                await prisma.businessCustomerBan.upsert({
                    where: { businessId_userId: { businessId, userId: customerId } },
                    update: {},
                    create: { businessId, userId: customerId },
                });
            } else {
                await prisma.businessCustomerBan.deleteMany({
                    where: { businessId, userId: customerId },
                });
            }

            return NextResponse.json({ success: true, user: { ...customer, isBanned } });
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

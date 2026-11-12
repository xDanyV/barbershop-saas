import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { favoriteBusinessSchema } from "@/lib/validations/schemas";
import { publicBusinessWhere } from "@/lib/billing/status";

// Barberías favoritas del usuario: solo los ids, el directorio ya trae el resto
export async function GET(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const favorites = await prisma.favoriteBusiness.findMany({ where: { userId }, select: { businessId: true } });

        return NextResponse.json(favorites.map((favorite) => favorite.businessId));
    } catch (error) {
        return errorResponse(error, "Get favorites error");
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const { businessId } = await parseJsonBody(request, favoriteBusinessSchema);

        const business = await prisma.business.findFirst({ where: { id: businessId, ...publicBusinessWhere }, select: { id: true } });
        if (!business) throw new AppError("Business not found", 404);

        await prisma.favoriteBusiness.upsert({
            where: { userId_businessId: { userId, businessId } },
            update: {},
            create: { userId, businessId },
        });

        return NextResponse.json({ favorite: true });
    } catch (error) {
        return errorResponse(error, "Add favorite error");
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const { businessId } = await parseJsonBody(request, favoriteBusinessSchema);

        await prisma.favoriteBusiness.deleteMany({ where: { userId, businessId } });

        return NextResponse.json({ favorite: false });
    } catch (error) {
        return errorResponse(error, "Remove favorite error");
    }
}

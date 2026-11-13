import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { barberPhotoSchema } from "@/lib/validations/schemas";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";
import { cleanUpUploads } from "@/lib/uploads";
import { replacedUrls } from "@/lib/upload-keys";

// El barbero pone o quita su propia foto de perfil (la ven los clientes en la página y al reservar)
export async function PATCH(request: NextRequest) {
    try {
        const { userId } = requireAuth(request, ["BARBER", "OWNER"]);
        const { url } = await parseJsonBody(request, barberPhotoSchema);

        const barber = await prisma.barber.findUnique({ where: { userId }, select: { id: true, businessId: true, profileImageUrl: true } });
        if (!barber) throw new AppError("Barber profile not found", 404);

        await prisma.barber.update({ where: { id: barber.id }, data: { profileImageUrl: url } });

        await revalidateBusinessPages(barber.businessId);
        // La foto anterior ya no se usa
        cleanUpUploads(replacedUrls([[barber.profileImageUrl, url]]));

        return NextResponse.json({ profileImageUrl: url });
    } catch (error) {
        return errorResponse(error, "Update barber photo error");
    }
}

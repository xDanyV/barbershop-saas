import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { TERMS_VERSION } from "@/lib/legal";

// Registra que el usuario aceptó la versión vigente de los Términos y el Aviso de Privacidad
export async function POST(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);

        await prisma.user.update({
            where: { id: userId },
            data: { termsVersion: TERMS_VERSION, termsAcceptedAt: new Date() },
        });

        return NextResponse.json({ termsVersion: TERMS_VERSION });
    } catch (error) {
        return errorResponse(error, "Accept terms error");
    }
}

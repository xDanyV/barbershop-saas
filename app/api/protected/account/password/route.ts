import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { AppError, errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { parseJsonBody } from "@/lib/api/validation";
import { changePasswordSchema } from "@/lib/validations/schemas";

export async function POST(request: NextRequest) {
    try {
        const { userId } = requireAuth(request);
        const { currentPassword, newPassword } = await parseJsonBody(request, changePasswordSchema);

        const user = await prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { password: true },
        });

        if (!(await bcrypt.compare(currentPassword, user.password))) {
            throw new AppError("Your current password is not correct.", 403);
        }

        await prisma.user.update({
            where: { id: userId },
            data: { password: await bcrypt.hash(newPassword, 10) },
        });

        return NextResponse.json({ updated: true });
    } catch (error) {
        return errorResponse(error, "Change password error");
    }
}

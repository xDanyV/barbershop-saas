import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { parseJsonBody } from "@/lib/api/validation";
import { resetPasswordSchema } from "@/lib/validations/schemas";
import { RATE_LIMITS, consumeRateLimit, getClientIp } from "@/lib/rate-limit";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";

export async function POST(req: Request) {
    try {
        await consumeRateLimit(`password-reset:ip:${getClientIp(req)}`, RATE_LIMITS.passwordResetIp);
        const { token, newPassword } = await parseJsonBody(req, resetPasswordSchema);

        const { email } = await resetPasswordWithToken(token, newPassword);

        return NextResponse.json({ updated: true, email });
    } catch (error) {
        return errorResponse(error, "Password reset error");
    }
}

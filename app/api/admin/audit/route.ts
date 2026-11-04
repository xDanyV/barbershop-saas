import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireAuth } from "@/lib/api/auth";
import { listAuditLog } from "@/lib/services/audit.service";

export async function GET(request: NextRequest) {
    try {
        requireAuth(request, ["ADMIN"]);

        return NextResponse.json(await listAuditLog(request.nextUrl.searchParams.get("cursor")));
    } catch (error) {
        return errorResponse(error, "Get audit log error");
    }
}

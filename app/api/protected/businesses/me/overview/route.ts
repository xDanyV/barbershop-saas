import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { requireOwnerAuth } from "@/lib/api/auth";
import { getOwnerOverview } from "@/lib/services/owner-overview.service";

export async function GET(request: NextRequest) {
    try {
        const { businessId } = requireOwnerAuth(request);

        return NextResponse.json(await getOwnerOverview(businessId));
    } catch (error) {
        return errorResponse(error, "Get owner overview error");
    }
}

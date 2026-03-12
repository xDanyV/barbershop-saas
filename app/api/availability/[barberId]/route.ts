import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ barberId: string }> }
) {
    try {

        const { barberId } = await context.params;

        const availability = await prisma.availability.findMany({
            where: {
                barberId: barberId,
            },
        });

        return NextResponse.json(availability);

    } catch {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
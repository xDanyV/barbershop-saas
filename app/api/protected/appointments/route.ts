import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

// Create a new appointment for the authenticated user
export async function POST(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");

        // Check if user ID is present in headers (you can also implement proper authentication)
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { date, service } = body;

        if (!date || !service) {
            return NextResponse.json(
                { error: "Date and service are required" },
                { status: 400 }
            );
        }
        // Check if the time slot is already booked
        const existing = await prisma.appointment.findFirst({
            where: {
                date: new Date(date),
                status: {
                    in: ["PENDING", "CONFIRMED"],
                },
            },
        });

        // If the time slot is already booked, return an error
        if (existing) {
            return NextResponse.json(
                { error: "Time slot not available" },
                { status: 409 }
            );
        }

        // Create a new appointment in the database
        const appointment = await prisma.appointment.create({
            data: {
                date: new Date(date),
                service,
                userId,
            },
        });

        // Return the created appointment
        return NextResponse.json(appointment, { status: 201 });

    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Get all appointments for the authenticated user
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const appointments = await prisma.appointment.findMany({
            where: { userId, status: { not: "CANCELLED" } },
            orderBy: { date: "asc" },
        });

        return NextResponse.json(appointments);

    } catch (error) {
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

//Get all active services in the catalog
export async function GET() {
  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(services);
}

//Create a new service in the catalog
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { name, price, duration } = body;

    if (!name || !price || !duration) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const service = await prisma.service.create({
      data: {
        name,
        price: Number(price),
        duration: Number(duration),
      },
    });

    return NextResponse.json(service, { status: 201 });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
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
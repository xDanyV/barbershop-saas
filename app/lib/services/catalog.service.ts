import { prisma } from "@/lib/prisma";

function canManageCatalog(role: string) {
  return role === "BARBER" || role === "OWNER" || role === "ADMIN";
}

export async function createCatalogService(
  name: string,
  price: number,
  duration: number,
  role: string,
  barberId: string
) {
  if (!canManageCatalog(role)) {
    throw new Error("Only barbers or owners can create services");
  }

  if (!name || !price || !duration || !barberId) {
    throw new Error("Missing required fields");
  }

  if (price <= 0) {
    throw new Error("Price must be greater than 0");
  }

  if (duration <= 0) {
    throw new Error("Duration must be greater than 0");
  }

  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: {
      id: true,
      businessId: true,
      active: true,
    },
  });

  if (!barber || !barber.active) {
    throw new Error("Barber not available");
  }

  return prisma.service.create({
    data: {
      name,
      price,
      duration,
      barberId,
      businessId: barber.businessId,
    },
  });
}

export async function updateCatalogService(
  serviceId: string,
  data: {
    name?: string;
    price?: number;
    duration?: number;
    active?: boolean;
  },
  role: string,
  barberId: string
) {
  if (!canManageCatalog(role)) {
    throw new Error("Only barbers or owners can update services");
  }

  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new Error("Service not found");
  }

  if (existing.barberId !== barberId) {
    throw new Error("Not authorized");
  }

  if (data.price !== undefined && data.price <= 0) {
    throw new Error("Price must be greater than 0");
  }

  if (data.duration !== undefined && data.duration <= 0) {
    throw new Error("Duration must be greater than 0");
  }

  return prisma.service.update({
    where: { id: serviceId },
    data,
  });
}

export async function deleteCatalogService(
  serviceId: string,
  role: string,
  barberId: string
) {
  if (!canManageCatalog(role)) {
    throw new Error("Only barbers or owners can delete services");
  }

  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new Error("Service not found");
  }

  if (existing.barberId !== barberId) {
    throw new Error("Not authorized");
  }

  if (!existing.active) {
    throw new Error("Service is already inactive");
  }

  return prisma.service.update({
    where: { id: serviceId },
    data: { active: false },
  });
}
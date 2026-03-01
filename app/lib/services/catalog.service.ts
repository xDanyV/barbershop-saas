import { prisma } from "@/lib/prisma";

// Create a new service in the catalog (only for barbers)
export async function createCatalogService(
  name: string,
  price: number,
  duration: number,
  role: string
) {
  if (role !== "BARBER") {
    throw new Error("Only barbers can create services");
  }

  if (!name || !price || !duration) {
    throw new Error("Missing required fields");
  }

  if (price <= 0) {
    throw new Error("Price must be greater than 0");
  }

  if (duration <= 0) {
    throw new Error("Duration must be greater than 0");
  }

  return prisma.service.create({
    data: {
      name,
      price,
      duration,
    },
  });
}
// Update an existing service in the catalog (only for barbers)
export async function updateCatalogService(
  serviceId: string,
  data: {
    name?: string;
    price?: number;
    duration?: number;
    active?: boolean;
  },
  role: string
) {
  if (role !== "BARBER") {
    throw new Error("Only barbers can update services");
  }

  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new Error("Service not found");
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
// Soft delete a service from the catalog (only for barbers)
export async function deleteCatalogService(
  serviceId: string,
  role: string
) {
  if (role !== "BARBER") {
    throw new Error("Only barbers can delete services");
  }

  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new Error("Service not found");
  }

  if (!existing.active) {
    throw new Error("Service is already inactive");
  }

  return prisma.service.update({
    where: { id: serviceId },
    data: {
      active: false,
    },
  });
}
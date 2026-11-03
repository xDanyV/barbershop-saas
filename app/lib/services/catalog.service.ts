import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

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
    throw new AppError("Only barbers or owners can create services");
  }

  if (!name || !price || !duration || !barberId) {
    throw new AppError("Missing required fields");
  }

  if (price <= 0) {
    throw new AppError("Price must be greater than 0");
  }

  if (duration <= 0) {
    throw new AppError("Duration must be greater than 0");
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
    throw new AppError("Barber not available");
  }

  const trimmedName = name.trim();

  // El borrado es lógico (active=false) y el nombre es único por barbero:
  // volver a crear un servicio eliminado lo reactiva con los datos nuevos
  const sameName = await prisma.service.findUnique({
    where: {
      businessId_barberId_name: {
        businessId: barber.businessId,
        barberId,
        name: trimmedName,
      },
    },
    select: { id: true, active: true },
  });

  if (sameName?.active) {
    throw new AppError("A service with this name already exists", 409);
  }

  if (sameName) {
    return prisma.service.update({
      where: { id: sameName.id },
      data: { price, duration, active: true },
    });
  }

  return prisma.service.create({
    data: {
      name: trimmedName,
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
    throw new AppError("Only barbers or owners can update services");
  }

  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new AppError("Service not found", 404);
  }

  if (existing.barberId !== barberId) {
    throw new AppError("Not authorized", 403);
  }

  if (data.price !== undefined && data.price <= 0) {
    throw new AppError("Price must be greater than 0");
  }

  if (data.duration !== undefined && data.duration <= 0) {
    throw new AppError("Duration must be greater than 0");
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
    throw new AppError("Only barbers or owners can delete services");
  }

  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new AppError("Service not found", 404);
  }

  if (existing.barberId !== barberId) {
    throw new AppError("Not authorized", 403);
  }

  if (!existing.active) {
    throw new AppError("Service is already inactive");
  }

  return prisma.service.update({
    where: { id: serviceId },
    data: { active: false },
  });
}
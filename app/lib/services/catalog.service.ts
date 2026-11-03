import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { revalidateBusinessPages } from "@/lib/cache/business-pages";

// La validación de formato (zod) y de rol se hace en las rutas; aquí solo reglas de negocio

export async function getActiveServices(barberId: string) {
  return prisma.service.findMany({
    where: {
      barberId,
      active: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCatalogService(
  data: { name: string; priceCents: number; duration: number },
  barberId: string
) {
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

  // El borrado es lógico (active=false) y el nombre es único por barbero:
  // volver a crear un servicio eliminado lo reactiva con los datos nuevos
  const sameName = await prisma.service.findUnique({
    where: {
      businessId_barberId_name: {
        businessId: barber.businessId,
        barberId,
        name: data.name,
      },
    },
    select: { id: true, active: true },
  });

  if (sameName?.active) {
    throw new AppError("A service with this name already exists", 409);
  }

  const service = sameName
    ? await prisma.service.update({
      where: { id: sameName.id },
      data: { priceCents: data.priceCents, duration: data.duration, active: true },
    })
    : await prisma.service.create({
      data: {
        ...data,
        barberId,
        businessId: barber.businessId,
      },
    });

  // Los servicios aparecen en la página pública del negocio
  await revalidateBusinessPages(barber.businessId);

  return service;
}

async function getOwnedService(serviceId: string, barberId: string) {
  const existing = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!existing) {
    throw new AppError("Service not found", 404);
  }

  if (existing.barberId !== barberId) {
    throw new AppError("Not authorized", 403);
  }

  return existing;
}

export async function updateCatalogService(
  serviceId: string,
  data: {
    name?: string;
    priceCents?: number;
    duration?: number;
    active?: boolean;
  },
  barberId: string
) {
  const existing = await getOwnedService(serviceId, barberId);

  const service = await prisma.service.update({
    where: { id: serviceId },
    data,
  });

  await revalidateBusinessPages(existing.businessId);

  return service;
}

export async function deleteCatalogService(serviceId: string, barberId: string) {
  const existing = await getOwnedService(serviceId, barberId);

  if (!existing.active) {
    throw new AppError("Service is already inactive");
  }

  const service = await prisma.service.update({
    where: { id: serviceId },
    data: { active: false },
  });

  await revalidateBusinessPages(existing.businessId);

  return service;
}

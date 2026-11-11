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

// Servicios de la barbería que un barbero puede copiar a su catálogo: uno por nombre,
// con el precio y la duración del dueño cuando él también lo ofrece
export async function getBusinessServicesToCopy(barberId: string) {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    select: { businessId: true, business: { select: { ownerId: true } } },
  });

  if (!barber) throw new AppError("Barber not available");

  const [services, own] = await Promise.all([
    prisma.service.findMany({
      where: { businessId: barber.businessId, active: true, barberId: { not: barberId }, barber: { active: true } },
      select: { name: true, priceCents: true, duration: true, barber: { select: { userId: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.service.findMany({ where: { barberId, active: true }, select: { name: true } }),
  ]);

  const taken = new Set(own.map((service) => service.name.trim().toLowerCase()));
  const byName = new Map<string, { name: string; priceCents: number; duration: number }>();

  for (const service of services) {
    const key = service.name.trim().toLowerCase();
    if (taken.has(key)) continue;

    const isOwner = service.barber.userId === barber.business.ownerId;
    if (!byName.has(key) || isOwner) {
      byName.set(key, { name: service.name, priceCents: service.priceCents, duration: service.duration });
    }
  }

  return [...byName.values()].sort((a, b) => a.priceCents - b.priceCents);
}

export async function copyBusinessServices(barberId: string) {
  const services = await getBusinessServicesToCopy(barberId);
  let created = 0;

  for (const service of services) {
    try {
      await createCatalogService(service, barberId);
      created++;
    } catch (error) {
      if (!(error instanceof AppError && error.status === 409)) throw error;
    }
  }

  return { created };
}

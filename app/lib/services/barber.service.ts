import { prisma } from "@/lib/prisma";
import { Role, BarberStatus } from "@prisma/client";

export async function createBarberFromUser(data: {
  userId: string;
  businessId: string;
  isFirstUser?: boolean;
}) {
  const { userId, businessId, isFirstUser = false } = data;

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!businessId) {
    throw new Error("Business ID is required");
  }

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      include: { barberProfile: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.barberProfile) {
      throw new Error("User is already a barber");
    }

    const business = await tx.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error("Business not found");
    }

    const finalRole = isFirstUser ? Role.ADMIN : Role.BARBER;

    await tx.user.update({
      where: { id: userId },
      data: { role: finalRole },
    });

    const barber = await tx.barber.create({
      data: {
        userId,
        businessId,
        status: isFirstUser ? BarberStatus.APPROVED : BarberStatus.PENDING,
      },
    });

    return barber;
  });
}
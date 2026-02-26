import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function createBarberFromUser(userId: string) {
  if (!userId) {
    throw new Error("User ID is required");
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

    await tx.user.update({
      where: { id: userId },
      data: { role: Role.BARBER },
    });

    const barber = await tx.barber.create({
      data: {
        userId: userId,
      },
    });

    return barber;
  });
}
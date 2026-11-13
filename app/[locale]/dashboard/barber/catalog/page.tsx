import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import CatalogClient from "./CatalogClient";

export default async function CatalogPage() {
    const headerList = await headers();
    const role = headerList.get("x-user-role");
    const barberId = headerList.get("x-barber-id");

    // El dueño viendo los servicios de otro barbero: el título dice de quién son
    const managed =
        headerList.get("x-managing-team-barber") === "true" && barberId
            ? await prisma.barber.findUnique({ where: { id: barberId }, select: { user: { select: { name: true } } } })
            : null;

    return <CatalogClient isOwner={role === "OWNER"} managedName={managed?.user.name ?? null} />;
}

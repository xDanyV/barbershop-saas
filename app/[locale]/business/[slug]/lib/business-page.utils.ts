import { GroupedService, PublicBusinessService } from "./business-page.types";

export function formatDate(date: Date) {
    return new Intl.DateTimeFormat("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);
}

export function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function getWhatsAppUrl(phone: string) {
    const cleanPhone = phone.replace(/\D/g, "");

    return `https://wa.me/${cleanPhone}`;
}

export function groupServicesByName(
    services: PublicBusinessService[]
): GroupedService[] {
    const grouped = new Map<string, GroupedService>();

    for (const service of services) {
        const key = service.name.trim().toLowerCase();
        const barberName = service.barber.user.name || "Barbero";

        const existing = grouped.get(key);

        if (!existing) {
            grouped.set(key, {
                key,
                name: service.name,
                minPriceCents: service.priceCents,
                maxPriceCents: service.priceCents,
                minDuration: service.duration,
                maxDuration: service.duration,
                barberNames: [barberName],
            });

            continue;
        }

        existing.minPriceCents = Math.min(existing.minPriceCents, service.priceCents);
        existing.maxPriceCents = Math.max(existing.maxPriceCents, service.priceCents);
        existing.minDuration = Math.min(existing.minDuration, service.duration);
        existing.maxDuration = Math.max(existing.maxDuration, service.duration);

        if (!existing.barberNames.includes(barberName)) {
            existing.barberNames.push(barberName);
        }
    }

    return Array.from(grouped.values()).map((service) => ({
        ...service,
        barberNames: service.barberNames.sort(),
    }));
}
import type { BusinessBillingStatus } from "@prisma/client";

export function canBusinessAcceptBookings(status: BusinessBillingStatus) {
    return status === "ACTIVE" || status === "PAST_DUE";
}

export function isBusinessSuspended(status: BusinessBillingStatus) {
    return status === "SUSPENDED" || status === "CANCELED";
}

export function getBillingStatusLabel(status: BusinessBillingStatus) {
    const labels: Record<BusinessBillingStatus, string> = {
        PENDING_PAYMENT: "Pago pendiente",
        ACTIVE: "Activa",
        PAST_DUE: "Pago atrasado",
        SUSPENDED: "Suspendida",
        CANCELED: "Cancelada",
    };

    return labels[status];
}

export function getBillingStatusDescription(status: BusinessBillingStatus) {
    const descriptions: Record<BusinessBillingStatus, string> = {
        PENDING_PAYMENT:
            "El negocio todavía no ha completado el pago inicial.",
        ACTIVE:
            "La suscripción está activa y el negocio puede recibir reservas.",
        PAST_DUE:
            "Hay un pago pendiente. El negocio sigue activo temporalmente.",
        SUSPENDED:
            "La suscripción está suspendida. Las reservas deben pausarse.",
        CANCELED:
            "La suscripción fue cancelada.",
    };

    return descriptions[status];
}
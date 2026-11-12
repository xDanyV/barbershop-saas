// Utilidades de mapa sin servicios de pago: distancias y enlaces para llegar

export type LatLng = { latitude: number; longitude: number };

// Centro de Tijuana: donde abre el mapa si la barbería aún no marca su ubicación
export const DEFAULT_CENTER: LatLng = { latitude: 32.5149, longitude: -117.0382 };

export function hasLocation<T extends { latitude: number | null; longitude: number | null }>(
    value: T
): value is T & LatLng {
    return typeof value.latitude === "number" && typeof value.longitude === "number";
}

// Distancia en línea recta (fórmula de haversine), en kilómetros
export function distanceKm(a: LatLng, b: LatLng) {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;

    return 2 * 6371 * Math.asin(Math.sqrt(h));
}

// "350 m", "1.2 km", "15 km"
export function formatDistance(km: number, locale: string) {
    const format = (value: number, digits: number) =>
        new Intl.NumberFormat(locale === "en" ? "en-US" : "es-MX", { maximumFractionDigits: digits }).format(value);

    if (km < 1) return `${format(Math.max(50, Math.round((km * 1000) / 50) * 50), 0)} m`;
    return `${format(km, km < 10 ? 1 : 0)} km`;
}

// Abre la ruta en Google Maps (app o web) hasta el pin de la barbería
export function directionsUrl({ latitude, longitude }: LatLng) {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

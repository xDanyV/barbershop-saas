"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";
import { DEFAULT_CENTER, type LatLng } from "@/lib/geo";

type Props = {
    value: LatLng | null;
    // Con onChange el mapa es editable: tocar el mapa o arrastrar el pin cambia la ubicación
    onChange?: (value: LatLng) => void;
    label: string;
    className?: string;
};

// Mosaicos de OpenStreetMap: gratis y sin llaves, con su crédito visible (la clase .map-muted baja sus colores)
const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

// Pin cuadrado con los colores de la marca, sin las imágenes por defecto de Leaflet
const PIN_HTML =
    '<span style="display:block;width:22px;height:22px;background:#e8603a;border:3px solid #0f2733;transform:rotate(45deg);box-shadow:0 2px 6px rgba(15,39,51,.35)"></span>';

export default function LocationMap({ value, onChange, label, className = "h-64" }: Props) {
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<LeafletMap | null>(null);
    const marker = useRef<Marker | null>(null);
    const onChangeRef = useRef(onChange);
    const editable = Boolean(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    // Leaflet usa window: se carga solo en el navegador
    useEffect(() => {
        let cancelled = false;

        import("leaflet").then((L) => {
            if (cancelled || !container.current || map.current) return;

            const start = value ?? DEFAULT_CENTER;
            const instance = L.map(container.current, {
                center: [start.latitude, start.longitude],
                zoom: value ? 16 : 12,
                scrollWheelZoom: false,
                // En el celular un dedo desplaza la página, no el mapa (salvo al editar)
                dragging: editable || !L.Browser.mobile,
                attributionControl: true,
            });

            L.tileLayer(TILES, { attribution: ATTRIBUTION, maxZoom: 19 }).addTo(instance);

            const icon = L.divIcon({ html: PIN_HTML, className: "", iconSize: [22, 22], iconAnchor: [11, 22] });
            const place = (point: LatLng) => {
                if (marker.current) {
                    marker.current.setLatLng([point.latitude, point.longitude]);
                    return;
                }

                marker.current = L.marker([point.latitude, point.longitude], { icon, draggable: editable, keyboard: editable, title: label }).addTo(instance);
                marker.current.on("dragend", () => {
                    const { lat, lng } = marker.current!.getLatLng();
                    onChangeRef.current?.({ latitude: lat, longitude: lng });
                });
            };

            if (value) place(value);

            if (editable) {
                instance.on("click", (event) => {
                    const point = { latitude: event.latlng.lat, longitude: event.latlng.lng };
                    place(point);
                    onChangeRef.current?.(point);
                });
            }

            map.current = instance;
        });

        return () => {
            cancelled = true;
            map.current?.remove();
            map.current = null;
            marker.current = null;
        };
        // El mapa se crea una vez; los cambios de valor se aplican en el efecto de abajo
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editable]);

    // Valor nuevo desde fuera (buscar dirección, "mi ubicación", quitar pin)
    useEffect(() => {
        const instance = map.current;
        if (!instance) return;

        if (!value) {
            marker.current?.remove();
            marker.current = null;
            return;
        }

        import("leaflet").then((L) => {
            if (!map.current) return;
            const current = marker.current?.getLatLng();
            if (current && current.lat === value.latitude && current.lng === value.longitude) return;

            if (marker.current) marker.current.setLatLng([value.latitude, value.longitude]);
            else {
                const icon = L.divIcon({ html: PIN_HTML, className: "", iconSize: [22, 22], iconAnchor: [11, 22] });
                marker.current = L.marker([value.latitude, value.longitude], { icon, draggable: editable, keyboard: editable, title: label }).addTo(map.current);
                marker.current.on("dragend", () => {
                    const { lat, lng } = marker.current!.getLatLng();
                    onChangeRef.current?.({ latitude: lat, longitude: lng });
                });
            }
            map.current.setView([value.latitude, value.longitude], Math.max(map.current.getZoom(), 16));
        });
    }, [value, editable, label]);

    return <div ref={container} role="region" aria-label={label} className={`map-muted relative z-0 w-full bg-[#e6eae8] ${className}`} />;
}

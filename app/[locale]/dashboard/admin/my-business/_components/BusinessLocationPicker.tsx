"use client";

import { useState } from "react";
import { Crosshair, Loader2, MapPin, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import LocationMap from "@/[locale]/components/LocationMap";
import type { LatLng } from "@/lib/geo";
import { card, dangerLink, secondaryButton, sectionHint, sectionTitle } from "./ui";

type Props = {
    address: string;
    value: LatLng | null;
    onChange: (value: LatLng | null) => void;
};

// El dueño marca su local en el mapa: buscando la dirección, con su ubicación actual o tocando el mapa
export default function BusinessLocationPicker({ address, value, onChange }: Props) {
    const t = useTranslations("MyBusiness.location");
    const [working, setWorking] = useState<"search" | "here" | null>(null);

    // OpenStreetMap (Nominatim): gratis, una búsqueda a la vez, solo en México
    const searchAddress = async () => {
        const text = address.trim();
        if (!text) return toast.error(t("noAddress"));

        setWorking("search");

        try {
            const query = /baja california|tijuana|rosarito|tecate|ensenada|mexicali/i.test(text) ? text : `${text}, Tijuana, Baja California`;
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=mx&accept-language=es&q=${encodeURIComponent(query)}`
            );
            const [first] = res.ok ? await res.json() : [];

            if (!first) return toast.error(t("notFound"));

            onChange({ latitude: Number(first.lat), longitude: Number(first.lon) });
            toast.success(t("found"));
        } catch {
            toast.error(t("searchFailed"));
        } finally {
            setWorking(null);
        }
    };

    const useCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error(t("noGeolocation"));

        setWorking("here");
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                onChange({ latitude: coords.latitude, longitude: coords.longitude });
                setWorking(null);
            },
            () => {
                toast.error(t("denied"));
                setWorking(null);
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    };

    return (
        <section className={card}>
            <h2 className={sectionTitle}>{t("title")}</h2>
            <p className={sectionHint}>{t("hint")}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button type="button" onClick={searchAddress} disabled={working !== null} className={secondaryButton}>
                    {working === "search" ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                    {t("search")}
                </button>
                <button type="button" onClick={useCurrentLocation} disabled={working !== null} className={secondaryButton}>
                    {working === "here" ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Crosshair size={16} aria-hidden="true" />}
                    {t("here")}
                </button>
            </div>

            <LocationMap value={value} onChange={onChange} label={t("mapLabel")} className="mt-4 h-72" />

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className={`flex items-center gap-2 text-sm ${value ? "text-gray-900" : "text-gray-600"}`}>
                    <MapPin size={16} className={value ? "text-[#e8603a]" : ""} aria-hidden="true" />
                    {value ? t("placed") : t("missing")}
                </p>
                {value && (
                    <button type="button" onClick={() => onChange(null)} className={dangerLink}>
                        {t("remove")}
                    </button>
                )}
            </div>
            <p className="mt-1 text-sm text-gray-500">{t("tapHint")}</p>
        </section>
    );
}

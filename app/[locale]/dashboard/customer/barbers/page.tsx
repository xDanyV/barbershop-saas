"use client";

import { useEffect, useMemo, useState } from "react";
import { Heart, Loader2, MapPin, Navigation, Search, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { Link } from "../../../../../i18n/routing";
import PageHeader from "@/[locale]/components/PageHeader";
import { getOpenState, type DayHours } from "@/lib/business-hours";
import { dayOfWeekFromKey, formatMinutes12h, minutesOfDay, resolveTimezone, toDateKey } from "@/lib/time/zoned";
import { getInitials } from "@/[locale]/business/[slug]/lib/business-page.utils";
import { distanceKm, formatDistance, hasLocation, type LatLng } from "@/lib/geo";

type Business = {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    timezone: string;
    latitude: number | null;
    longitude: number | null;
    hours: DayHours[];
    bookable: boolean;
    settings: { isServiceActive: boolean } | null;
};

type Filter = "all" | "favorites" | "open";

// Sin acentos ni mayúsculas: "barberia" encuentra "Barbería", "otay" encuentra "Otay Universidad"
const normalize = (value: string) =>
    value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .trim();

function openState(business: Business, now: Date) {
    const tz = resolveTimezone(business.timezone);
    return getOpenState(business.hours, dayOfWeekFromKey(toDateKey(now, tz)), minutesOfDay(now, tz));
}

// Directorio para reservar: buscar por nombre o zona, ver qué está abierto y guardar favoritas
export default function BusinessesPage() {
    const t = useTranslations("BusinessDirectory");
    const locale = useLocale();
    // La ubicación del cliente se queda en su navegador: solo se usa para ordenar
    const [here, setHere] = useState<LatLng | null>(null);
    const [locating, setLocating] = useState(false);
    const [businesses, setBusinesses] = useState<Business[] | null>(null);
    const [favorites, setFavorites] = useState<Set<string>>(new Set());
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        Promise.all([
            fetch("/api/businesses").then((res) => (res.ok ? res.json() : [])),
            fetch("/api/protected/favorites").then((res) => (res.ok ? res.json() : [])),
        ])
            .then(([list, favoriteIds]) => {
                setBusinesses(Array.isArray(list) ? list : []);
                setFavorites(new Set(Array.isArray(favoriteIds) ? favoriteIds : []));
                setNow(new Date());
            })
            .catch(() => setBusinesses([]));

        const timer = window.setInterval(() => setNow(new Date()), 60_000);
        return () => window.clearInterval(timer);
    }, []);

    const toggleFavorite = async (business: Business) => {
        const isFavorite = favorites.has(business.id);
        const next = new Set(favorites);
        if (isFavorite) next.delete(business.id);
        else next.add(business.id);
        setFavorites(next);

        try {
            const res = await fetch("/api/protected/favorites", {
                method: isFavorite ? "DELETE" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ businessId: business.id }),
            });
            if (!res.ok) throw new Error();
        } catch {
            setFavorites(favorites);
            toast.error(t("favoriteFailed"));
        }
    };

    const distanceTo = (business: Business) => (here && hasLocation(business) ? distanceKm(here, business) : null);

    const toggleNearMe = () => {
        if (here) return setHere(null);
        if (!navigator.geolocation) return toast.error(t("near.unsupported"));

        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setHere({ latitude: coords.latitude, longitude: coords.longitude });
                setLocating(false);
            },
            (error) => {
                toast.error(error.code === error.PERMISSION_DENIED ? t("near.denied") : t("near.failed"));
                setLocating(false);
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 }
        );
    };

    const visible = useMemo(() => {
        if (!businesses) return [];
        const words = normalize(query).split(/\s+/).filter(Boolean);

        return businesses
            .filter((business) => {
                const text = normalize(`${business.name} ${business.address ?? ""}`);
                if (!words.every((word) => text.includes(word))) return false;
                if (filter === "favorites") return favorites.has(business.id);
                if (filter === "open") return now ? openState(business, now).open : false;
                return true;
            })
            .sort((a, b) => {
                // Cerca de mí: la más cercana primero; las que no marcan su ubicación, al final
                if (here) {
                    const da = hasLocation(a) ? distanceKm(here, a) : Infinity;
                    const db = hasLocation(b) ? distanceKm(here, b) : Infinity;
                    if (da !== db) return da - db;
                }
                return Number(favorites.has(b.id)) - Number(favorites.has(a.id)) || a.name.localeCompare(b.name, "es");
            });
    }, [businesses, query, filter, favorites, now, here]);

    const chips: { id: Filter; label: string }[] = [
        { id: "all", label: t("filters.all") },
        { id: "favorites", label: favorites.size ? t("filters.favoritesCount", { count: favorites.size }) : t("filters.favorites") },
        { id: "open", label: t("filters.open") },
    ];

    return (
        <div className="pb-6">
            <PageHeader title={t("title")} subtitle={t("subtitle")} />

            <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <label className="relative block flex-1">
                    <span className="sr-only">{t("searchLabel")}</span>
                    <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder={t("searchPlaceholder")}
                        className="min-h-12 w-full border border-gray-200 bg-white pl-11 pr-11 text-base outline-none transition-colors focus:border-gray-900"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            aria-label={t("clearSearch")}
                            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-gray-900"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    )}
                </label>

                <div role="group" aria-label={t("filters.label")} className="scroll-strip -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
                    <button
                        type="button"
                        aria-pressed={Boolean(here)}
                        onClick={toggleNearMe}
                        disabled={locating}
                        className={`inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap border px-4 text-sm font-semibold transition-colors disabled:opacity-60 ${here ? "border-[#e8603a] bg-[#e8603a] text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-900"}`}
                    >
                        {locating ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Navigation size={16} aria-hidden="true" />}
                        {locating ? t("near.locating") : t("near.label")}
                    </button>
                    {chips.map((chip) => (
                        <button
                            key={chip.id}
                            type="button"
                            aria-pressed={filter === chip.id}
                            onClick={() => setFilter(chip.id)}
                            className={`min-h-11 shrink-0 whitespace-nowrap border px-4 text-sm font-semibold transition-colors ${filter === chip.id ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 bg-white text-gray-700 hover:border-gray-900"}`}
                        >
                            {chip.label}
                        </button>
                    ))}
                </div>
            </div>

            {businesses === null ? (
                <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                        <li key={i} className="h-72 animate-pulse bg-gray-100" />
                    ))}
                </ul>
            ) : visible.length === 0 ? (
                <div className="mt-6 border border-dashed border-gray-300 p-8 text-center">
                    <p className="font-semibold text-gray-900">
                        {businesses.length === 0
                            ? t("empty.none")
                            : query
                              ? t("empty.search", { query })
                              : filter === "favorites"
                                ? t("empty.favorites")
                                : t("empty.open")}
                    </p>
                    {businesses.length > 0 && filter === "favorites" && !query && <p className="mt-1 text-gray-600">{t("empty.favoritesHint")}</p>}
                    {(query || filter !== "all") && businesses.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setFilter("all");
                            }}
                            className="mt-4 min-h-11 border border-gray-200 bg-white px-4 text-sm font-semibold hover:border-gray-900"
                        >
                            {t("empty.showAll")}
                        </button>
                    )}
                </div>
            ) : (
                <>
                    <p className="mt-5 text-sm text-gray-600" aria-live="polite">
                        {here ? t("near.results", { count: visible.length }) : t("results", { count: visible.length })}
                    </p>
                    <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {visible.map((business) => {
                            const isFavorite = favorites.has(business.id);
                            const paused = business.settings?.isServiceActive === false;
                            const canBook = business.bookable && !paused;
                            const state = now ? openState(business, now) : null;

                            return (
                                <li key={business.id} className="flex flex-col border border-gray-200 bg-white">
                                    <div className="relative aspect-[16/9] bg-[#0f2733]">
                                        {business.coverUrl ? (
                                            <img src={business.coverUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="flex h-full items-center justify-center text-4xl text-[#f1f3f2]" aria-hidden="true">
                                                {getInitials(business.name)}
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => toggleFavorite(business)}
                                            aria-pressed={isFavorite}
                                            aria-label={isFavorite ? t("unfavorite", { name: business.name }) : t("favorite", { name: business.name })}
                                            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center bg-white/95 text-gray-900 transition-transform active:scale-95"
                                        >
                                            <Heart size={20} aria-hidden="true" className={isFavorite ? "fill-[#e8603a] text-[#e8603a]" : ""} />
                                        </button>
                                    </div>

                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="flex items-center gap-3">
                                            {business.logoUrl && <img src={business.logoUrl} alt="" className="h-10 w-10 shrink-0 border border-gray-100 object-cover" />}
                                            <h2 className="min-w-0 break-words text-lg font-semibold text-gray-900">{business.name}</h2>
                                        </div>

                                        {(business.address || here) && (
                                            <p className="mt-2 flex items-start gap-2 text-sm text-gray-600">
                                                <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                                                <span className="min-w-0 break-words">
                                                    {here && (
                                                        <strong className="font-semibold text-gray-900">
                                                            {distanceTo(business) !== null ? formatDistance(distanceTo(business)!, locale) : t("near.noPin")}
                                                        </strong>
                                                    )}
                                                    {here && business.address && " · "}
                                                    {business.address}
                                                </span>
                                            </p>
                                        )}

                                        <p className="mt-2 flex min-h-6 items-center gap-2 text-sm font-semibold text-gray-900">
                                            {state && (
                                                <>
                                                    <span className={`h-2.5 w-2.5 shrink-0 ${state.open ? "bg-[#2f7d5b]" : "bg-gray-400"}`} aria-hidden="true" />
                                                    {state.open
                                                        ? t("openUntil", { time: formatMinutes12h(state.closesAt) })
                                                        : state.opensTodayAt !== null
                                                          ? t("opensAt", { time: formatMinutes12h(state.opensTodayAt) })
                                                          : t("closed")}
                                                </>
                                            )}
                                        </p>

                                        <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                                            <Link
                                                href={`/business/${business.slug}`}
                                                className="inline-flex min-h-11 items-center justify-center border border-gray-200 px-3 text-sm font-semibold transition-colors hover:border-gray-900"
                                            >
                                                {t("view")}
                                            </Link>
                                            {canBook ? (
                                                <Link
                                                    href={`/business/${business.slug}/book`}
                                                    className="inline-flex min-h-11 items-center justify-center bg-gray-900 px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                                                >
                                                    {t("book")}
                                                </Link>
                                            ) : (
                                                <span className="inline-flex min-h-11 items-center justify-center bg-gray-100 px-3 text-center text-xs font-semibold text-gray-500">
                                                    {paused ? t("paused") : t("notYet")}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </>
            )}
        </div>
    );
}

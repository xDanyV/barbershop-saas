"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { brandFontClasses } from "@/[locale]/brand";
import { businessThemeStyle } from "@/lib/theme";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { useApiError } from "@/[locale]/components/useApiError";
import { formatPriceFromCents } from "@/lib/billing/pricing";
import { addDaysToKey, dayOfWeekFromKey, toDateKey } from "@/lib/time/zoned";
import { getInitials } from "../lib/business-page.utils";
import LocaleSwitch from "@/[locale]/components/LocaleSwitch";

type Service = { id: string; name: string; priceCents: number; duration: number };

type Barber = {
    id: string;
    name: string;
    imageUrl: string | null;
    services: Service[];
    workDays: number[];
};

type Slot = { start: string; label: string; maxMinutes: number };
type Exception = { startDate: string; endDate: string };

type Props = {
    business: {
        name: string;
        slug: string;
        logoUrl: string | null;
        // Si la barbería confirma sola, el cliente reserva; si no, envía una solicitud
        autoConfirm: boolean;
        themePrimary: string | null;
        themeAccent: string | null;
        timezone: string;
        barbers: Barber[];
    };
    // Lo que venga en la URL: el enlace de un servicio o barbero del perfil, o la vuelta después de iniciar sesión
    initial: { barber: string | null; service: string | null; date: string | null; time: string | null };
};

// Días que se ofrecen para reservar, a partir de hoy: nueve semanas, de tres en tres
const DAYS_PER_PAGE = 21;
const PAGES = 3;
const DAYS_AHEAD = DAYS_PER_PAGE * PAGES;

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function findService(barber: Barber | undefined, wanted: string | null) {
    if (!barber || !wanted) return null;
    return barber.services.find((service) => service.id === wanted || sameName(service.name, wanted)) ?? null;
}

// Primero el barbero, luego el servicio, luego el día y por último la hora:
// así solo se muestran horas en las que el servicio elegido cabe completo.
export default function BusinessBookingClient({ business, initial }: Props) {
    const t = useTranslations("BookingPage");
    const locale = useLocale();
    const apiError = useApiError();
    const dateLocale = locale === "en" ? "en-US" : "es-MX";
    const { barbers, timezone } = business;

    const [barberId, setBarberId] = useState<string | null>(() => {
        if (initial.barber && barbers.some((barber) => barber.id === initial.barber)) return initial.barber;
        if (barbers.length === 1) return barbers[0].id;

        // Un servicio que solo hace un barbero ya decide con quién
        const offering = initial.service ? barbers.filter((barber) => findService(barber, initial.service)) : [];
        return offering.length === 1 ? offering[0].id : null;
    });
    const [serviceId, setServiceId] = useState<string | null>(
        () => findService(barbers.find((barber) => barber.id === barberId), initial.service)?.id ?? null
    );
    // Nombre del servicio pedido desde el perfil, para elegirlo cuando se escoja barbero
    const [wantedService, setWantedService] = useState<string | null>(() => (serviceId ? null : initial.service));
    const [date, setDate] = useState<string | null>(initial.date);
    const [dayPage, setDayPage] = useState(0);
    const [time, setTime] = useState<string | null>(initial.time);

    const [exceptions, setExceptions] = useState<{ barberId: string; list: Exception[] } | null>(null);
    const [slots, setSlots] = useState<{ key: string; list: Slot[] } | null>(null);
    const [slotsFailed, setSlotsFailed] = useState(false);
    const [reloadSlots, setReloadSlots] = useState(0);
    const [confirming, setConfirming] = useState(false);
    const [booking, setBooking] = useState(false);

    const serviceRef = useRef<HTMLElement>(null);
    const dateRef = useRef<HTMLElement>(null);
    const timeRef = useRef<HTMLElement>(null);

    const barber = barbers.find((item) => item.id === barberId);
    const service = barber?.services.find((item) => item.id === serviceId) ?? null;
    const exceptionsReady = exceptions?.barberId === barberId;

    const days = useMemo(() => {
        const today = toDateKey(new Date(), timezone);
        return Array.from({ length: DAYS_AHEAD }, (_, index) => addDaysToKey(today, index));
    }, [timezone]);

    const isOpenDay = (key: string) => {
        if (!barber || !barber.workDays.includes(dayOfWeekFromKey(key))) return false;
        return !(exceptions?.list ?? []).some((range) => key >= range.startDate && key <= range.endDate);
    };

    // Días libres del barbero (vacaciones, permisos)
    useEffect(() => {
        if (!barberId) return;

        let ignore = false;

        fetch(`/api/exceptions/${barberId}`)
            .then((res) => (res.ok ? res.json() : []))
            .catch(() => [])
            .then((list: Exception[]) => {
                if (!ignore) setExceptions({ barberId, list: Array.isArray(list) ? list : [] });
            });

        return () => {
            ignore = true;
        };
    }, [barberId]);

    // Con barbero y servicio elegidos se propone el primer día que trabaja
    useEffect(() => {
        if (!service || !exceptionsReady) return;
        if (date && days.includes(date) && isOpenDay(date)) {
            setDayPage(Math.floor(days.indexOf(date) / DAYS_PER_PAGE));
            return;
        }

        const first = days.find(isOpenDay) ?? null;
        setDate(first);
        setDayPage(first ? Math.floor(days.indexOf(first) / DAYS_PER_PAGE) : 0);
        setTime(null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [service, exceptionsReady, days]);

    const slotsKey = barberId && date ? `${barberId}:${date}:${reloadSlots}` : null;

    useEffect(() => {
        if (!slotsKey || !service) return;

        let ignore = false;
        setSlotsFailed(false);

        fetch(`/api/availability/${barberId}/slots?date=${date}`)
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("slots"))))
            .then((data: { slots: Slot[] }) => {
                if (!ignore) setSlots({ key: slotsKey, list: data.slots ?? [] });
            })
            .catch(() => {
                if (!ignore) setSlotsFailed(true);
            });

        return () => {
            ignore = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slotsKey, Boolean(service)]);

    // Solo horas en las que el servicio cabe antes de la siguiente cita, el descanso o el cierre
    const fittingSlots = useMemo(() => {
        if (!service || !slots || slots.key !== slotsKey) return null;
        return slots.list.filter((slot) => slot.maxMinutes >= service.duration);
    }, [service, slots, slotsKey]);

    // Una hora que ya no está disponible (o ya no cabe) se descarta
    useEffect(() => {
        if (time && fittingSlots && !fittingSlots.some((slot) => slot.start === time)) setTime(null);
    }, [time, fittingSlots]);

    // La selección vive en la URL: si hay que iniciar sesión, al volver todo sigue elegido
    useEffect(() => {
        const params = new URLSearchParams();
        if (barberId) params.set("barber", barberId);
        if (serviceId) params.set("service", serviceId);
        else if (wantedService) params.set("service", wantedService);
        if (date) params.set("date", date);
        if (time) params.set("time", time);

        const query = params.toString();
        window.history.replaceState(window.history.state, "", query ? `?${query}` : window.location.pathname);
    }, [barberId, serviceId, wantedService, date, time]);

    const scrollTo = (ref: React.RefObject<HTMLElement | null>) =>
        requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

    const chooseBarber = (next: Barber) => {
        const sameService = findService(next, service?.name ?? wantedService);

        setBarberId(next.id);
        setServiceId(sameService?.id ?? null);
        if (sameService) setWantedService(null);
        setTime(null);
        scrollTo(sameService ? dateRef : serviceRef);
    };

    const chooseService = (next: Service) => {
        setServiceId(next.id);
        setWantedService(null);
        setTime(null);
        scrollTo(dateRef);
    };

    const chooseDate = (key: string) => {
        setDate(key);
        setTime(null);
        scrollTo(timeRef);
    };

    const dayLabel = (key: string, options: Intl.DateTimeFormatOptions) =>
        new Intl.DateTimeFormat(dateLocale, { ...options, timeZone: "UTC" }).format(new Date(`${key}T12:00:00Z`));

    const pageDays = days.slice(dayPage * DAYS_PER_PAGE, (dayPage + 1) * DAYS_PER_PAGE);
    const firstMonth = dayLabel(pageDays[0], { month: "long", year: "numeric" });
    const lastMonth = dayLabel(pageDays[pageDays.length - 1], { month: "long", year: "numeric" });
    const pageMonths =
        firstMonth === lastMonth
            ? firstMonth
            : `${dayLabel(pageDays[0], pageDays[0].slice(0, 4) === pageDays[pageDays.length - 1].slice(0, 4) ? { month: "long" } : { month: "long", year: "numeric" })} – ${lastMonth}`;

    const timeLabel = fittingSlots?.find((slot) => slot.start === time)?.label ?? null;
    const ready = Boolean(barber && service && date && time && timeLabel);

    const book = async () => {
        if (!barber || !service || !time) return;

        setBooking(true);

        try {
            const res = await fetch("/api/protected/appointments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ barberId: barber.id, serviceId: service.id, date: time }),
            });
            const data = await res.json().catch(() => null);

            if (res.status === 401) {
                toast(t("errors.loginRequired"));
                const back = window.location.pathname + window.location.search;
                window.location.assign(`/${locale}/login?redirectTo=${encodeURIComponent(back)}`);
                return;
            }

            if (!res.ok) {
                toast.error(apiError(data, t("errors.bookFailed")));
                // Quizá alguien más tomó la hora: se vuelve a consultar
                setConfirming(false);
                setTime(null);
                setReloadSlots((value) => value + 1);
                return;
            }

            toast.success(data?.status === "CONFIRMED" ? t("successConfirmed") : t("success"));
            window.location.assign(`/${locale}/dashboard/customer/home`);
        } catch {
            toast.error(t("errors.network"));
        } finally {
            setBooking(false);
        }
    };

    const optionClass = (selected: boolean) =>
        `border text-left transition-colors ${selected
            ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-[var(--brand-on-primary)]"
            : "border-[var(--brand-surface)] bg-[var(--brand-paper)] hover:border-[var(--brand-ink)]"
        }`;

    return (
        <main className={`brand ${brandFontClasses} min-h-screen pb-40`} style={businessThemeStyle(business.themePrimary, business.themeAccent)}>
            <header className="sticky top-0 z-40 border-b border-[var(--brand-surface)] bg-[var(--brand-paper)]">
                <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4 md:px-8">
                    <Link
                        href={`/${locale}/business/${business.slug}`}
                        aria-label={t("backToProfile")}
                        className="-ml-2 flex h-11 w-11 shrink-0 items-center justify-center transition-colors hover:bg-[var(--brand-bg)]"
                    >
                        <ArrowLeft size={20} aria-hidden="true" />
                    </Link>
                    {business.logoUrl && <img src={business.logoUrl} alt="" className="h-8 w-8 shrink-0 object-cover" />}
                    <span className="truncate font-semibold">{business.name}</span>
                    <LocaleSwitch className="-mr-2 ml-auto shrink-0" />
                </div>
            </header>

            <div className="mx-auto max-w-4xl px-4 md:px-8">
                <h1 className="brand-display pb-2 pt-8 text-[length:var(--step-head)] md:pt-12">{t("title")}</h1>

                {barbers.length > 1 && (
                    <Step number={1} title={t("steps.barber")} done={Boolean(barber)}>
                        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {barbers.map((item) => {
                                const selected = item.id === barberId;
                                const offersWanted = !wantedService || Boolean(findService(item, wantedService));

                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => chooseBarber(item)}
                                            aria-pressed={selected}
                                            className={`flex min-h-16 w-full items-center gap-3 p-2 ${optionClass(selected)} ${offersWanted ? "" : "opacity-60"}`}
                                        >
                                            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden bg-[var(--brand-sand)] font-semibold text-[var(--brand-ink)]">
                                                {item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover" /> : getInitials(item.name)}
                                            </span>
                                            <span className="min-w-0 break-words font-semibold leading-tight">{item.name}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                        {wantedService && !barber && <p className="mt-3 text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("wantedService", { name: wantedService })}</p>}
                    </Step>
                )}

                <Step ref={serviceRef} number={barbers.length > 1 ? 2 : 1} title={t("steps.service")} done={Boolean(service)}>
                    {!barber ? (
                        <p className="text-[var(--brand-muted)]">{t("pickBarberFirst")}</p>
                    ) : (
                        <ul className="grid gap-2 sm:grid-cols-2">
                            {barber.services.map((item) => {
                                const selected = item.id === serviceId;

                                return (
                                    <li key={item.id}>
                                        <button
                                            type="button"
                                            onClick={() => chooseService(item)}
                                            aria-pressed={selected}
                                            className={`flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 ${optionClass(selected)}`}
                                        >
                                            <span className="min-w-0">
                                                <span className="block font-semibold">{item.name}</span>
                                                <span className={`block text-[length:var(--step-small)] ${selected ? "text-[var(--brand-field-muted)]" : "text-[var(--brand-muted)]"}`}>
                                                    {t("minutes", { min: item.duration })}
                                                </span>
                                            </span>
                                            <span className="tabular shrink-0 font-semibold">{formatPriceFromCents(item.priceCents)}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Step>

                <Step ref={dateRef} number={barbers.length > 1 ? 3 : 2} title={t("steps.date")} done={Boolean(service && date)}>
                    {!service ? (
                        <p className="text-[var(--brand-muted)]">{t("pickServiceFirst")}</p>
                    ) : !exceptionsReady ? (
                        <p className="text-[var(--brand-muted)]">{t("loading")}</p>
                    ) : (
                        <>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="font-semibold first-letter:uppercase" aria-live="polite">
                                    {pageMonths}
                                </p>
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setDayPage((page) => Math.max(0, page - 1))}
                                        disabled={dayPage === 0}
                                        aria-label={t("daysPrevious")}
                                        className="flex h-11 w-11 items-center justify-center border border-[var(--brand-surface)] bg-[var(--brand-paper)] transition-colors hover:border-[var(--brand-ink)] disabled:border-transparent disabled:bg-transparent disabled:opacity-30"
                                    >
                                        <ChevronLeft size={20} aria-hidden="true" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDayPage((page) => Math.min(PAGES - 1, page + 1))}
                                        disabled={dayPage === PAGES - 1}
                                        aria-label={t("daysNext")}
                                        className="flex h-11 w-11 items-center justify-center border border-[var(--brand-surface)] bg-[var(--brand-paper)] transition-colors hover:border-[var(--brand-ink)] disabled:border-transparent disabled:bg-transparent disabled:opacity-30"
                                    >
                                        <ChevronRight size={20} aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                            <ul key={dayPage} className="day-page scroll-strip -mx-4 flex gap-2 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-7 md:overflow-visible md:px-0">
                                {pageDays.map((key) => {
                                    const open = isOpenDay(key);
                                    const selected = key === date;

                                    return (
                                        <li key={key} className="shrink-0">
                                            <button
                                                type="button"
                                                disabled={!open}
                                                onClick={() => chooseDate(key)}
                                                aria-pressed={selected}
                                                aria-label={dayLabel(key, { weekday: "long", day: "numeric", month: "long" })}
                                                className={`flex h-[4.5rem] w-16 flex-col items-center justify-center md:w-full ${open ? optionClass(selected) : "border border-transparent text-[var(--brand-muted)] opacity-50"}`}
                                            >
                                                <span className="text-[length:var(--step-small)] first-letter:uppercase">{dayLabel(key, { weekday: "short" }).replace(".", "")}</span>
                                                <span className="tabular text-xl font-semibold">{dayLabel(key, { day: "numeric" })}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            {!days.some(isOpenDay) ? (
                                <p className="mt-3 text-[var(--brand-muted)]">{t("noDays")}</p>
                            ) : (
                                !pageDays.some(isOpenDay) && <p className="mt-3 text-[var(--brand-muted)]">{t("noDaysHere")}</p>
                            )}
                        </>
                    )}
                </Step>

                <Step ref={timeRef} number={barbers.length > 1 ? 4 : 3} title={t("steps.time")} done={Boolean(timeLabel)}>
                    {!service || !date ? (
                        <p className="text-[var(--brand-muted)]">{t("pickDateFirst")}</p>
                    ) : slotsFailed ? (
                        <p className="text-[var(--brand-muted)]">
                            {t("errors.slots")}{" "}
                            <button type="button" onClick={() => setReloadSlots((value) => value + 1)} className="min-h-11 font-semibold underline underline-offset-4">
                                {t("retry")}
                            </button>
                        </p>
                    ) : fittingSlots === null ? (
                        <p className="text-[var(--brand-muted)]">{t("loading")}</p>
                    ) : fittingSlots.length === 0 ? (
                        <p className="text-[var(--brand-muted)]">{t("noTimes", { duration: service.duration })}</p>
                    ) : (
                        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {fittingSlots.map((slot) => {
                                const selected = slot.start === time;

                                return (
                                    <li key={slot.start}>
                                        <button
                                            type="button"
                                            onClick={() => setTime(slot.start)}
                                            aria-pressed={selected}
                                            className={`tabular flex min-h-12 w-full items-center justify-center px-1 font-semibold ${optionClass(selected)} text-center`}
                                        >
                                            {slot.label}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Step>
            </div>

            {/* Resumen siempre visible: qué se va a reservar y el botón para confirmar */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--brand-surface)] bg-[var(--brand-paper)]">
                <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-8">
                    <p className="min-w-0 text-[length:var(--step-small)] leading-snug">
                        {service ? (
                            <>
                                <span className="font-semibold">{service.name}</span>
                                <span className="tabular"> · {formatPriceFromCents(service.priceCents)}</span>
                                {barbers.length > 1 && barber && <span className="text-[var(--brand-muted)]"> · {barber.name}</span>}
                                <br />
                                <span className="inline-block text-[var(--brand-muted)] first-letter:uppercase">
                                    {date ? dayLabel(date, { weekday: "long", day: "numeric", month: "long" }) : t("summary.noDate")}
                                    {timeLabel && `, ${timeLabel}`}
                                </span>
                            </>
                        ) : (
                            <span className="text-[var(--brand-muted)]">{t("summary.empty")}</span>
                        )}
                    </p>
                    <button type="button" disabled={!ready} onClick={() => setConfirming(true)} className={`${brandPrimaryButton} sm:w-auto`}>
                        {t("continue")}
                    </button>
                </div>
            </div>

            {confirming && barber && service && date && timeLabel && (
                <BrandDialog title={t("confirm.title")} subtitle={t("confirm.subtitle")} closeLabel={t("confirm.cancel")} onClose={() => !booking && setConfirming(false)}>
                    <dl className="divide-y divide-[var(--brand-surface)] border-y border-[var(--brand-surface)]">
                        {[
                            [t("confirm.service"), `${service.name} (${t("minutes", { min: service.duration })})`],
                            [t("confirm.barber"), barber.name],
                            [t("confirm.date"), dayLabel(date, { weekday: "long", day: "numeric", month: "long" })],
                            [t("confirm.time"), timeLabel],
                            [t("confirm.price"), formatPriceFromCents(service.priceCents)],
                        ].map(([label, value]) => (
                            <div key={label} className="flex items-baseline justify-between gap-4 py-3">
                                <dt className="text-[var(--brand-muted)]">{label}</dt>
                                <dd className="text-right font-semibold first-letter:uppercase">{value}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-4 text-[length:var(--step-small)] text-[var(--brand-muted)]">{business.autoConfirm ? t("confirm.noteInstant") : t("confirm.note")}</p>
                    <button type="button" onClick={book} disabled={booking} className={`mt-5 ${brandPrimaryButton}`}>
                        {booking ? t("confirm.sending") : business.autoConfirm ? t("confirm.actionInstant") : t("confirm.action")}
                    </button>
                </BrandDialog>
            )}
        </main>
    );
}

type StepProps = {
    number: number;
    title: string;
    done: boolean;
    children: ReactNode;
    ref?: React.Ref<HTMLElement>;
};

function Step({ number, title, done, children, ref }: StepProps) {
    return (
        <section ref={ref} className="scroll-mt-20 border-t border-[var(--brand-surface)] py-6 first-of-type:border-t-0 md:py-8">
            <h2 className="mb-4 flex items-center gap-3 text-[length:var(--step-lead)] font-semibold">
                <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center text-base ${done ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)]" : "border border-[var(--brand-ink)]"}`}
                    aria-hidden="true"
                >
                    {done ? <Check size={16} /> : number}
                </span>
                {title}
            </h2>
            {children}
        </section>
    );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { CalendarClock, MessageCircle, Plus, RotateCcw, XCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatPriceFromCents } from "@/lib/billing/pricing";
import RescheduleDialog from "@/[locale]/components/RescheduleDialog";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import PageHeader from "@/[locale]/components/PageHeader";
import { getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";
import { useApiError } from "@/[locale]/components/useApiError";
import PushInvite from "@/[locale]/components/push/PushInvite";

type Appointment = {
  id: string;
  date: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";
  cancelledBy: "CUSTOMER" | "BUSINESS" | "SYSTEM" | null;
  barberId: string;
  business: { name: string; slug: string; phone: string | null };
  service: { id: string; name: string; duration: number; priceCents: number };
  barber: { user: { name: string | null } };
};

const HOUR_MS = 60 * 60 * 1000;
// El cliente puede cancelar o mover su cita hasta 2 horas antes (igual que la API)
const CHANGE_LIMIT_MS = 2 * HOUR_MS;
const HISTORY_PAGE = 6;

const isOpen = (a: Appointment) => a.status === "PENDING" || a.status === "CONFIRMED";

// isStaff: un dueño o barbero viendo lo que reservó en otras barberías
export default function CustomerHome({ isStaff = false }: { isStaff?: boolean }) {
  const t = useTranslations("CustomerHome");
  const tw = useTranslations("WhatsAppMessages");
  const apiError = useApiError();
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "es-MX";

  const [all, setAll] = useState<Appointment[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [historyShown, setHistoryShown] = useState(HISTORY_PAGE);
  const [cancelling, setCancelling] = useState<Appointment | null>(null);
  const [working, setWorking] = useState(false);
  const [rescheduling, setRescheduling] = useState<Appointment | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    fetch("/api/protected/appointments/user")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("load"))))
      .then((data: Appointment[]) => setAll(Array.isArray(data) ? data : []))
      .catch(() => {
        setAll([]);
        setFailed(true);
      });

    // "Hoy", "en 2 horas" y el límite para cambios se mantienen al día si la pantalla queda abierta
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Próximas: activas que no han terminado, y las que canceló la barbería (el cliente tiene que enterarse)
  const { upcoming, history } = useMemo(() => {
    const list = all ?? [];
    const isCurrent = (a: Appointment) =>
      new Date(a.date).getTime() + HOUR_MS > now && (isOpen(a) || (a.status === "CANCELLED" && a.cancelledBy === "BUSINESS"));

    return {
      upcoming: list.filter(isCurrent).sort((x, y) => new Date(x.date).getTime() - new Date(y.date).getTime()),
      history: list.filter((a) => !isCurrent(a)).sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime()),
    };
  }, [all, now]);

  const day = (iso: string) => {
    const date = new Date(iso);
    const key = (d: Date) => d.toDateString();
    const today = new Date(now);
    const tomorrow = new Date(now + 24 * HOUR_MS);
    const long = date.toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" }).replace(",", "");

    if (key(date) === key(today)) return t("today", { date: long });
    if (key(date) === key(tomorrow)) return t("tomorrow", { date: long });
    return long;
  };
  const time = (iso: string) => new Date(iso).toLocaleTimeString(dateLocale, { hour: "numeric", minute: "2-digit" });
  const shortDate = (iso: string) =>
    new Date(iso).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: new Date(iso).getFullYear() === new Date(now).getFullYear() ? undefined : "numeric" });

  // Al escribirle a la barbería, el mensaje ya dice de qué cita se trata
  const whatsapp = (a: Appointment) =>
    a.business.phone
      ? getWhatsAppUrl(
          a.business.phone,
          tw("customerAbout", { service: a.service.name, day: day(a.date).toLowerCase(), time: time(a.date), barber: a.barber.user.name ?? "" })
        )
      : null;

  const rebookUrl = (a: Appointment) => `/${locale}/business/${a.business.slug}/book?barber=${a.barberId}&service=${a.service.id}`;

  const cancel = async () => {
    if (!cancelling) return;
    setWorking(true);

    try {
      const res = await fetch(`/api/protected/appointments/${cancelling.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        toast.error(apiError(data, t("errors.cancelFailed")));
        return;
      }

      setAll((prev) => (prev ?? []).map((a) => (a.id === cancelling.id ? { ...a, status: "CANCELLED", cancelledBy: "CUSTOMER" } : a)));
      setCancelling(null);
      toast.success(t("success.cancelled"));
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setWorking(false);
    }
  };

  const statusChip = (a: Appointment) => {
    if (a.status === "CONFIRMED") return { label: t("status.CONFIRMED"), className: "bg-[#dcefe6] text-[#1f6f5c]" };
    if (a.status === "PENDING") return { label: t("status.PENDING"), className: "bg-[#fbf0d4] text-[#7a5a0b]" };
    return null;
  };

  const historyStatus = (a: Appointment) => {
    if (a.status === "COMPLETED" || (a.status === "CONFIRMED" && new Date(a.date).getTime() < now)) return t("status.COMPLETED");
    if (a.status === "NO_SHOW") return t("status.NO_SHOW");
    if (a.status === "CANCELLED") {
      if (a.cancelledBy === "BUSINESS") return t("cancelledByBusiness");
      if (a.cancelledBy === "SYSTEM") return t("expiredUnconfirmed");
      return t("status.CANCELLED");
    }
    return t(`status.${a.status}`);
  };

  // Acciones de una cita próxima; a menos de 2 horas ya no se puede cambiar en línea
  const actions = (a: Appointment, tone: "ticket" | "row") => {
    const url = whatsapp(a);
    const locked = new Date(a.date).getTime() - now < CHANGE_LIMIT_MS;
    const quiet = tone === "ticket" ? "text-[#0f2733]" : "text-gray-700";

    if (locked) {
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">{t("locked")}</p>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className={`inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline underline-offset-4 ${quiet}`}>
              <MessageCircle size={16} aria-hidden="true" />
              {t("contactBusiness")}
            </a>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <button
          type="button"
          onClick={() => setRescheduling(a)}
          className="inline-flex min-h-11 items-center gap-2 bg-[#0f2733] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          <CalendarClock size={16} aria-hidden="true" />
          {t("reschedule")}
        </button>
        <button
          type="button"
          onClick={() => setCancelling(a)}
          className="inline-flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-[#b8431f] hover:underline"
        >
          <XCircle size={16} aria-hidden="true" />
          {t("cancel")}
        </button>
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title={t("contactHint")}
            aria-label={t("contactBusiness")}
            className={`ml-auto inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-sm font-semibold ${quiet}`}
          >
            <MessageCircle size={18} aria-hidden="true" />
            <span className="hidden sm:inline">{t("contactShort")}</span>
          </a>
        )}
      </div>
    );
  };

  const [next, ...later] = upcoming;
  const lastVisited = history.find((a) => a.status === "COMPLETED" || a.status === "CONFIRMED");

  return (
    <div className="mx-auto max-w-2xl pb-6">
      <PageHeader
        title={isStaff ? t("titleStaff") : t("title")}
        subtitle={all === null ? undefined : upcoming.some(isOpen) ? t("subtitleCount", { count: upcoming.filter(isOpen).length }) : t("subtitleNone")}
        actions={
          <Link
            href={`/${locale}/dashboard/customer/barbers`}
            className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#0f2733] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            <Plus size={16} aria-hidden="true" />
            {t("bookNow")}
          </Link>
        }
      />

      {/* Solo tiene sentido con algo que avisar: al menos una cita próxima */}
      {upcoming.some(isOpen) && <PushInvite audience="customer" />}

      {all === null ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-64 animate-pulse bg-gray-200/70" />
          <div className="h-20 animate-pulse bg-gray-200/50" />
        </div>
      ) : (
        <>
          {failed && (
            <p role="alert" className="mb-4 border-l-4 border-[#b8431f] bg-white p-4 text-gray-900">
              {t("errors.load")}
            </p>
          )}

          {/* La próxima cita, como un turno impreso: lo primero que el cliente viene a revisar */}
          {next ? (
            next.status === "CANCELLED" ? (
              <section aria-labelledby="next-title" className="border-l-4 border-[#b8431f] bg-white p-5">
                <h2 id="next-title" className="text-lg font-semibold text-gray-900">
                  {t("cancelledTitle")}
                </h2>
                <p className="mt-1 text-gray-700">
                  {t("cancelledText", { service: next.service.name, business: next.business.name, date: day(next.date).toLowerCase(), time: time(next.date) })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={rebookUrl(next)} className="inline-flex min-h-11 items-center bg-[#0f2733] px-4 text-sm font-semibold text-white">
                    {t("bookAgain")}
                  </Link>
                  {whatsapp(next) && (
                    <a
                      href={whatsapp(next)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 border border-gray-300 px-4 text-sm font-semibold text-gray-900"
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      {t("contactBusiness")}
                    </a>
                  )}
                </div>
              </section>
            ) : (
              <section aria-labelledby="next-title" className="overflow-hidden border border-[#0f2733]">
                <div className="bg-[#0f2733] p-5 text-[#f1f3f2] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h2 id="next-title" className="text-sm text-[#a9b7bc] first-letter:uppercase">
                      {day(next.date)}
                    </h2>
                    {statusChip(next) && (
                      <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold ${statusChip(next)!.className}`}>{statusChip(next)!.label}</span>
                    )}
                  </div>
                  <p className="mt-1 text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">{time(next.date)}</p>
                  <p className="mt-4 text-lg font-semibold break-words">{next.service.name}</p>
                  <p className="mt-1 text-[#c9d2d4] break-words">
                    {t("withBarber", { barber: next.barber.user.name ?? "" })}{" "}
                    <Link href={`/${locale}/business/${next.business.slug}`} className="underline underline-offset-4 hover:text-white">
                      {next.business.name}
                    </Link>
                  </p>
                  <dl className="mt-4 flex gap-6 text-sm">
                    <div>
                      <dt className="text-[#a9b7bc]">{t("duration")}</dt>
                      <dd className="font-semibold">{t("minutes", { minutes: next.service.duration })}</dd>
                    </div>
                    <div>
                      <dt className="text-[#a9b7bc]">{t("price")}</dt>
                      <dd className="font-semibold">{formatPriceFromCents(next.service.priceCents)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="bg-[#e4dccb] px-4 py-3 sm:px-5">{actions(next, "ticket")}</div>
                {next.status === "PENDING" && <p className="bg-[#e4dccb] px-5 pb-4 text-sm text-gray-700">{t("pendingNote")}</p>}
              </section>
            )
          ) : (
            <section className="border border-dashed border-gray-300 bg-white p-6 text-center">
              <h2 className="text-lg font-semibold text-gray-900">{t("emptyTitle")}</h2>
              <p className="mx-auto mt-1 max-w-sm text-gray-600">{t("emptyText")}</p>
              <div className="mt-5 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
                {lastVisited && (
                  <Link href={rebookUrl(lastVisited)} className="inline-flex min-h-11 items-center gap-2 bg-[#0f2733] px-4 text-sm font-semibold text-white">
                    <RotateCcw size={16} aria-hidden="true" />
                    {t("repeat", { service: lastVisited.service.name, business: lastVisited.business.name })}
                  </Link>
                )}
                <Link
                  href={`/${locale}/dashboard/customer/barbers`}
                  className={`inline-flex min-h-11 items-center px-4 text-sm font-semibold ${lastVisited ? "text-gray-900 underline underline-offset-4" : "bg-[#0f2733] text-white"}`}
                >
                  {t("findBarbershop")}
                </Link>
              </div>
            </section>
          )}

          {/* Las demás próximas, más compactas */}
          {later.length > 0 && (
            <section aria-labelledby="later-title" className="mt-8">
              <h2 id="later-title" className="text-lg font-semibold text-gray-900">
                {t("laterTitle")}
              </h2>
              <ul className="mt-3 divide-y divide-gray-200 border-y border-gray-200 bg-white">
                {later.map((a) => (
                  <li key={a.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 first-letter:uppercase">
                          {day(a.date)}, {time(a.date)}
                        </p>
                        <p className="mt-0.5 break-words text-gray-700">
                          {a.status === "CANCELLED" ? t("cancelledByBusiness") : `${a.service.name}, ${t("withBarberOnly", { barber: a.barber.user.name ?? "" })}`}
                        </p>
                        <p className="break-words text-sm text-gray-500">{a.business.name}</p>
                      </div>
                      {statusChip(a) && <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold ${statusChip(a)!.className}`}>{statusChip(a)!.label}</span>}
                    </div>
                    <div className="mt-2">
                      {a.status === "CANCELLED" ? (
                        <Link href={rebookUrl(a)} className="inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-4">
                          {t("bookAgain")}
                        </Link>
                      ) : (
                        actions(a, "row")
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Historial: lo que ya pasó, con atajo para repetir */}
          {history.length > 0 && (
            <section aria-labelledby="history-title" className="mt-10">
              <h2 id="history-title" className="text-lg font-semibold text-gray-900">
                {t("historyTitle")}
              </h2>
              <ul className="mt-3 divide-y divide-gray-200 border-y border-gray-200">
                {history.slice(0, historyShown).map((a) => {
                  const done = a.status === "COMPLETED" || (a.status === "CONFIRMED" && new Date(a.date).getTime() < now);

                  return (
                    <li key={a.id} className="flex items-center gap-4 py-3">
                      <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-gray-500">{shortDate(a.date)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium text-gray-900">{a.service.name}</p>
                        <p className="break-words text-sm text-gray-500">
                          {a.business.name}
                          {a.barber.user.name ? `, ${a.barber.user.name}` : ""}
                        </p>
                        <p className={`text-sm ${done ? "text-gray-500" : "text-[#b8431f]"}`}>{historyStatus(a)}</p>
                      </div>
                      <Link
                        href={rebookUrl(a)}
                        aria-label={t("repeatLabel", { service: a.service.name, business: a.business.name })}
                        className="inline-flex min-h-11 shrink-0 items-center gap-1.5 px-2 text-sm font-semibold text-gray-900 hover:underline"
                      >
                        <RotateCcw size={16} aria-hidden="true" />
                        <span className="hidden sm:inline">{t("repeatShort")}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {history.length > historyShown && (
                <button
                  type="button"
                  onClick={() => setHistoryShown((n) => n + HISTORY_PAGE)}
                  className="mt-3 inline-flex min-h-11 items-center border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-900 hover:border-gray-900"
                >
                  {t("showMore")}
                </button>
              )}
            </section>
          )}
        </>
      )}

      {cancelling && (
        <BrandDialog
          title={t("cancelConfirm.title")}
          subtitle={t("cancelConfirm.description", { service: cancelling.service.name, date: day(cancelling.date).toLowerCase(), time: time(cancelling.date) })}
          closeLabel={t("cancelConfirm.keep")}
          onClose={() => !working && setCancelling(null)}
        >
          <button type="button" onClick={cancel} disabled={working} className={brandPrimaryButton}>
            {working ? t("cancelling") : t("cancelConfirm.confirm")}
          </button>
        </BrandDialog>
      )}

      {rescheduling && (
        <RescheduleDialog
          appointmentId={rescheduling.id}
          currentDate={rescheduling.date}
          serviceName={rescheduling.service.name}
          needsConfirmation
          onClose={() => setRescheduling(null)}
          onDone={({ date, status }) => {
            setAll((prev) => (prev ?? []).map((a) => (a.id === rescheduling.id ? { ...a, date, status: status as Appointment["status"] } : a)));
            setRescheduling(null);
          }}
        />
      )}
    </div>
  );
}

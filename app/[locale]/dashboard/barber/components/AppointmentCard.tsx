"use client";

import { useState } from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { CalendarClock, MessageCircle, MoreVertical, UserX, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import { getWhatsAppUrl } from "@/[locale]/business/[slug]/lib/business-page.utils";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import RescheduleDialog from "@/[locale]/components/RescheduleDialog";

type AppointmentStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

type Appointment = {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  service: string;
  time: string;
  date: string;
  isWalkIn: boolean;
  status: AppointmentStatus;
};

type Props = {
  appointment: Appointment;
  onConfirm?: (id: string) => void;
  onChanged?: () => void;
};

const STATUS_STYLE: Record<AppointmentStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  COMPLETED: "bg-gray-100 text-gray-600",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-red-100 text-red-700",
};

const menuItemClass = "flex min-h-11 w-full items-center gap-3 px-4 text-left data-[focus]:bg-[#f1f3f2]";

export default function AppointmentCard({ appointment, onConfirm, onChanged }: Props) {
  const t = useTranslations("AppointmentCard");
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);
  const [working, setWorking] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const changeStatus = async (next: AppointmentStatus, failedMessage: string) => {
    setWorking(true);

    try {
      const res = await fetch(`/api/protected/appointments/${appointment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });

      if (!res.ok) toast.error(failedMessage);

      return res.ok;
    } catch {
      toast.error(t("errors.network"));
      return false;
    } finally {
      setWorking(false);
    }
  };

  const confirm = async () => {
    if (!(await changeStatus("CONFIRMED", t("errors.confirmFailed")))) return;

    setStatus("CONFIRMED");
    onConfirm?.(appointment.id);
    toast.success(t("success.confirmed", { name: appointment.customerName }));
  };

  const markNoShow = async () => {
    if (!(await changeStatus("NO_SHOW", t("errors.noShowFailed")))) return;

    setStatus("NO_SHOW");
    toast.success(t("success.noShow", { name: appointment.customerName }));
  };

  const cancel = async () => {
    if (!(await changeStatus("CANCELLED", t("errors.cancelFailed")))) return;

    setCancelling(false);
    toast.success(t("success.cancelled", { name: appointment.customerName }));
    onChanged?.();
  };

  const isOpen = status === "PENDING" || status === "CONFIRMED";
  const canReschedule = isOpen && new Date(appointment.date).getTime() > Date.now();
  const hasPhone = appointment.customerPhone.replace(/\D/g, "").length === 10;
  const contact = [appointment.customerPhone, appointment.customerEmail].filter((value) => value && value !== "N/A").join(" · ");
  const hasActions = hasPhone || canReschedule || status === "COMPLETED" || isOpen;

  return (
    <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 gap-3 sm:gap-4">
        <p className="w-20 shrink-0 whitespace-nowrap font-semibold tabular-nums">{appointment.time}</p>

        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
            <span className="min-w-0 break-words">{appointment.customerName}</span>
            {appointment.isWalkIn && <span className="bg-amber-100 px-1.5 py-0.5 text-xs font-semibold">{t("walkIn")}</span>}
          </p>
          <p className="text-sm text-gray-600">{appointment.service}</p>
          {contact && <p className="truncate text-xs text-gray-500">{contact}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 sm:justify-end">
        <span className={`whitespace-nowrap px-2 py-1 text-xs font-semibold ${STATUS_STYLE[status]}`}>
          {t(`status.${status}`)}
        </span>

        <div className="flex items-center gap-1">
          {status === "PENDING" && (
            <button
              type="button"
              onClick={confirm}
              disabled={working}
              className="min-h-11 bg-gray-900 px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {t("confirm")}
            </button>
          )}

          {hasActions && (
            <Menu as="div" className="relative">
              <MenuButton
                aria-label={t("actions", { name: appointment.customerName })}
                className="flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 data-[open]:bg-gray-100"
              >
                <MoreVertical size={20} aria-hidden="true" />
              </MenuButton>

              <MenuItems
                anchor="bottom end"
                className="z-50 mt-1 w-60 border border-[#dbe0de] bg-white py-1 text-sm text-[#0f2733] outline-none"
              >
                {hasPhone && (
                  <MenuItem>
                    <a href={getWhatsAppUrl(appointment.customerPhone)} target="_blank" rel="noopener noreferrer" className={menuItemClass}>
                      <MessageCircle size={18} aria-hidden="true" />
                      {t("whatsapp")}
                    </a>
                  </MenuItem>
                )}
                {canReschedule && (
                  <MenuItem>
                    <button type="button" onClick={() => setRescheduling(true)} className={menuItemClass}>
                      <CalendarClock size={18} aria-hidden="true" />
                      {t("reschedule")}
                    </button>
                  </MenuItem>
                )}
                {status === "COMPLETED" && (
                  <MenuItem>
                    <button type="button" onClick={markNoShow} className={menuItemClass}>
                      <UserX size={18} aria-hidden="true" />
                      {t("markNoShow")}
                    </button>
                  </MenuItem>
                )}
                {isOpen && (
                  <MenuItem>
                    <button type="button" onClick={() => setCancelling(true)} className={`${menuItemClass} text-[#b8431f]`}>
                      <XCircle size={18} aria-hidden="true" />
                      {t("cancelAppointment")}
                    </button>
                  </MenuItem>
                )}
              </MenuItems>
            </Menu>
          )}
        </div>
      </div>

      {rescheduling && (
        <RescheduleDialog
          appointmentId={appointment.id}
          currentDate={appointment.date}
          serviceName={appointment.service}
          onClose={() => setRescheduling(false)}
          onDone={() => {
            setRescheduling(false);
            onChanged?.();
          }}
        />
      )}

      {cancelling && (
        <BrandDialog
          title={t("cancelAppointment")}
          subtitle={t("cancelText", { name: appointment.customerName, service: appointment.service, time: appointment.time })}
          closeLabel={t("keep")}
          onClose={() => !working && setCancelling(false)}
        >
          <button type="button" onClick={cancel} disabled={working} className={brandPrimaryButton}>
            {t("cancelAppointment")}
          </button>
        </BrandDialog>
      )}
    </div>
  );
}

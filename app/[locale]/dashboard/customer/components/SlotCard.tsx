"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  Clock,
  Scissors,
  DollarSign,
  X,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useTranslations } from "next-intl";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type Props = {
  time: string;
  selectedDate: Date;
  barberId: string;
  onBook?: (bookedTime: string) => void;
};

export default function SlotCard({
  time,
  selectedDate,
  barberId,
  onBook,
}: Props) {
  const t = useTranslations("SlotCard");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const service = services.find((s) => s.id === selectedService);

  useEffect(() => {
    if (!popoverOpen || services.length > 0) return;

    setLoading(true);

    fetch(`/api/catalog?barberId=${barberId}`)
      .then((res) => res.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => toast.error(t("errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [popoverOpen, barberId, services.length, t]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
        setSelectedService(null);
      }
    }

    if (popoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const handleToggle = () => {
    setPopoverOpen((prev) => !prev);
    setSelectedService(null);
  };

  const handleConfirmClick = () => {
    if (!selectedService) {
      toast.error(t("errors.noService"));
      return;
    }

    setPopoverOpen(false);
    setModalOpen(true);
  };

  const buildDateTime = (): string => {
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    const day = selectedDate.getDate();

    return new Date(year, month, day, hours, minutes, 0, 0).toISOString();
  };

  const getLoginRedirectUrl = () => {
    const currentPath = window.location.pathname + window.location.search;
    const localeMatch = window.location.pathname.match(/^\/(en|es)/);
    const localePrefix = localeMatch ? localeMatch[0] : "";

    return `${localePrefix}/login?redirectTo=${encodeURIComponent(currentPath)}`;
  };

  const getCustomerHomeUrl = () => {
    const localeMatch = window.location.pathname.match(/^\/(en|es)/);
    const localePrefix = localeMatch ? localeMatch[0] : "";

    return `${localePrefix}/dashboard/customer/home`;
  };

  const handleFinalConfirm = async () => {
    if (!selectedService) return;

    setBooking(true);

    try {
      const res = await fetch("/api/protected/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barberId,
          serviceId: selectedService,
          date: buildDateTime(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (res.status === 401) {
        toast.error("Inicia sesión para reservar esta cita");
        window.location.href = getLoginRedirectUrl();
        return;
      }

      if (!res.ok) {
        toast.error(data?.error ?? t("errors.bookFailed"));
        return;
      }

      toast.success(t("success.booked", { name: service?.name ?? "" }));

      onBook?.(time);

      setModalOpen(false);
      setSelectedService(null);

      window.location.href = getCustomerHomeUrl();
    } catch {
      toast.error(t("errors.network"));
    } finally {
      setBooking(false);
    }
  };

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const modalFields = [
    {
      icon: CalendarDays,
      label: t("modal.fields.date"),
      value: formattedDate,
      highlight: false,
    },
    {
      icon: Clock,
      label: t("modal.fields.time"),
      value: time,
      highlight: false,
    },
    {
      icon: Scissors,
      label: t("modal.fields.service"),
      value: service?.name,
      highlight: false,
    },
    {
      icon: DollarSign,
      label: t("modal.fields.total"),
      value: `$${service?.price.toFixed(2)}`,
      highlight: true,
    },
  ];

  return (
    <>
      <div ref={containerRef} className="relative">
        <div
          className={`overflow-hidden rounded-3xl border bg-white transition-all duration-300 ${popoverOpen
              ? "border-indigo-200 shadow-xl shadow-indigo-100/60"
              : "border-gray-100 hover:border-indigo-100 hover:shadow-md hover:shadow-gray-100"
            }`}
        >
          <button
            type="button"
            onClick={handleToggle}
            className="group w-full px-4 py-4 text-left"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all ${popoverOpen
                      ? "bg-indigo-600 text-white"
                      : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white"
                    }`}
                >
                  <Clock size={18} strokeWidth={2.5} />
                </div>

                <div className="min-w-0">
                  <p
                    className={`text-lg font-black tracking-tight transition-colors ${popoverOpen ? "text-indigo-900" : "text-gray-900"
                      }`}
                  >
                    {time}
                  </p>

                </div>
              </div>

              <motion.div
                animate={{ rotate: popoverOpen ? 180 : 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${popoverOpen
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  }`}
              >
                <ChevronDown size={18} strokeWidth={2.5} />
              </motion.div>
            </div>
          </button>

          <AnimatePresence>
            {popoverOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                <div className="border-t border-gray-100 px-4 pb-4 pt-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                      {t("availableServices")}
                    </p>

                    {!loading && services.length > 0 && (
                      <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[10px] font-black text-gray-400">
                        {services.length}
                      </span>
                    )}
                  </div>

                  <div className="max-h-60 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {loading ? (
                      <div className="py-7 text-center">
                        <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
                        <p className="text-[11px] font-bold text-gray-400">
                          {t("loading")}
                        </p>
                      </div>
                    ) : services.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-center">
                        <p className="text-xs font-bold text-gray-400">
                          No hay servicios disponibles.
                        </p>
                      </div>
                    ) : (
                      services.map((s) => {
                        const isSelected = selectedService === s.id;

                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelectedService(s.id)}
                            className={`w-full rounded-2xl border p-3.5 text-left transition-all ${isSelected
                                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                : "border-gray-100 bg-gray-50 hover:bg-gray-100"
                              }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p
                                  className={`truncate text-sm font-black ${isSelected
                                      ? "text-indigo-900"
                                      : "text-gray-800"
                                    }`}
                                >
                                  {s.name}
                                </p>

                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-gray-400">
                                    {s.duration} MIN
                                  </span>

                                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">
                                    ${s.price}
                                  </span>
                                </div>
                              </div>

                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="shrink-0 text-indigo-600"
                                >
                                  <CheckCircle2
                                    size={21}
                                    className="fill-indigo-100"
                                  />
                                </motion.div>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleConfirmClick}
                    disabled={!selectedService}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 disabled:bg-gray-300 disabled:opacity-60 disabled:shadow-none"
                  >
                    {t("buttons.continue")}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-9999"
          onClose={() => !booking && setModalOpen(false)}
        >
          <Transition.Child as={Fragment}>
            <div className="fixed inset-0 bg-gray-950/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-4"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-md overflow-hidden rounded-4xl border border-gray-100 bg-white p-5 shadow-2xl md:p-7">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                      <CalendarDays size={21} />
                    </div>

                    <Dialog.Title className="text-2xl font-black tracking-tight text-gray-900">
                      {t("modal.title")}
                    </Dialog.Title>

                    <p className="mt-1 text-sm text-gray-500">
                      Revisa los datos antes de completar tu reserva.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    disabled={booking}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gray-50 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3">
                  {modalFields.map((item, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 rounded-2xl border p-3.5 ${item.highlight
                          ? "border-emerald-100 bg-emerald-50"
                          : "border-gray-100 bg-gray-50"
                        }`}
                    >
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${item.highlight
                            ? "bg-white text-emerald-600"
                            : "bg-white text-indigo-600"
                          }`}
                      >
                        <item.icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                          {item.label}
                        </p>

                        <p
                          className={`truncate font-black ${item.highlight
                              ? "text-lg text-emerald-600"
                              : "text-gray-900"
                            }`}
                        >
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleFinalConfirm}
                  disabled={booking}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-900 px-4 py-4 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 disabled:opacity-50"
                >
                  {booking ? (
                    <>
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Reservando...
                    </>
                  ) : (
                    t("buttons.completeBooking")
                  )}
                </button>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
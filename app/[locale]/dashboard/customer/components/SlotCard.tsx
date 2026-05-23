"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, Scissors, DollarSign, X, CheckCircle2, ChevronDown } from "lucide-react";
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
  onBook?: (bookedTime: string) => void; // only time needed — parent tracks booked slots
};

export default function SlotCard({ time, selectedDate, barberId, onBook }: Props) {
  const t = useTranslations("SlotCard");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const service = services.find((s) => s.id === selectedService);

  // Load services only when card is first opened
  useEffect(() => {
    if (!popoverOpen || services.length > 0) return;
    setLoading(true);
    fetch(`/api/catalog?barberId=${barberId}`)
      .then((res) => res.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => toast.error(t("errors.loadFailed")))
      .finally(() => setLoading(false));
  }, [popoverOpen, barberId, services.length, t]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverOpen(false);
        setSelectedService(null);
      }
    }
    if (popoverOpen) document.addEventListener("mousedown", handleClickOutside);
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
    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
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

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? t("errors.bookFailed"));
        return;
      }

      toast.success(t("success.booked", { name: service?.name ?? "" }));

      // Notify parent to immediately remove this slot from the list
      onBook?.(time);

      setModalOpen(false);
      setSelectedService(null);
      window.location.href = "/dashboard/customer/home";
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
    { icon: CalendarDays, label: t("modal.fields.date"), value: formattedDate, highlight: false },
    { icon: Clock, label: t("modal.fields.time"), value: time, highlight: false },
    { icon: Scissors, label: t("modal.fields.service"), value: service?.name, highlight: false },
    { icon: DollarSign, label: t("modal.fields.total"), value: `$${service?.price.toFixed(2)}`, highlight: true },
  ];

  return (
    <>
      <div ref={containerRef} className="relative">
        <div
          className={`group flex flex-col border transition-all duration-500 overflow-hidden ${popoverOpen
            ? "border-indigo-200 bg-white shadow-xl shadow-indigo-100/50 rounded-3xl"
            : "border-gray-100 bg-white hover:border-indigo-100 hover:shadow-md rounded-2xl"
            }`}
        >
          {/* Header — always visible */}
          <div
            onClick={handleToggle}
            className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 cursor-pointer"
          >
            <div className="flex items-center gap-3 md:gap-4">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${popoverOpen
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                  : "bg-gray-50 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"
                  }`}
              >
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <span
                className={`font-black tracking-tight text-lg md:text-xl transition-colors ${popoverOpen ? "text-indigo-900" : "text-gray-700"
                  }`}
              >
                {time}
              </span>
            </div>

            <motion.div
              animate={{ rotate: popoverOpen ? 180 : 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className={`p-2 rounded-xl transition-colors duration-300 ${popoverOpen
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-400 group-hover:text-indigo-500 group-hover:bg-indigo-50"
                }`}
            >
              <ChevronDown size={20} strokeWidth={2.5} />
            </motion.div>
          </div>

          {/* Expandable service selector */}
          <AnimatePresence>
            {popoverOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="px-4 md:px-5 pb-5">
                  <div className="h-px w-full bg-linear-to-r from-transparent via-gray-100 to-transparent mb-4" />

                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-3">
                    {t("availableServices")}
                  </p>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                    {loading ? (
                      <div className="py-6 text-center">
                        <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-gray-400">{t("loading")}</p>
                      </div>
                    ) : (
                      services.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setSelectedService(s.id)}
                          className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all duration-200 ${selectedService === s.id
                            ? "border-indigo-600 bg-indigo-50 shadow-sm"
                            : "border-transparent bg-gray-50 hover:bg-gray-100"
                            }`}
                        >
                          <div className="text-left min-w-0 flex-1">
                            <p className={`text-sm font-black truncate ${selectedService === s.id ? "text-indigo-900" : "text-gray-700"}`}>
                              {s.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-bold text-gray-400">{s.duration} MIN</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="text-[10px] font-black text-emerald-500">${s.price}</span>
                            </div>
                          </div>
                          {selectedService === s.id && (
                            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-indigo-600 ml-3 shrink-0">
                              <CheckCircle2 size={20} className="fill-indigo-100" />
                            </motion.div>
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <button
                    onClick={handleConfirmClick}
                    disabled={!selectedService}
                    className="mt-5 w-full py-4 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-30 disabled:bg-gray-300 disabled:hover:bg-gray-300 transition-all shadow-lg shadow-indigo-100"
                  >
                    {t("buttons.continue")}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation modal */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-9999" onClose={() => !booking && setModalOpen(false)}>
          <Transition.Child as={Fragment}>
            <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-sm bg-white rounded-4xl shadow-2xl p-6 md:p-8 relative overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    {t("modal.title")}
                  </Dialog.Title>
                  <button
                    onClick={() => setModalOpen(false)}
                    className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-3 mb-8">
                  {modalFields.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3.5 bg-gray-50 rounded-2xl">
                      <div className={`p-2.5 rounded-xl ${item.highlight ? "bg-emerald-100 text-emerald-600" : "bg-white text-indigo-500 shadow-sm"}`}>
                        <item.icon size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-wider">{item.label}</p>
                        <p className={`font-bold ${item.highlight ? "text-emerald-600 text-lg" : "text-gray-900"}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleFinalConfirm}
                  disabled={booking}
                  className="w-full py-4 rounded-xl bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {booking ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
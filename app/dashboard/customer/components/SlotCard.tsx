"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, Scissors, DollarSign, X, ChevronRight, Check } from "lucide-react";

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
  onBook?: (time: string, serviceId: string) => void;
};

export default function SlotCard({ time, selectedDate, barberId, onBook }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const service = services.find((s) => s.id === selectedService);

  useEffect(() => {
    if (!popoverOpen || services.length > 0) return;
    setLoading(true);
    fetch(`/api/catalog?barberId=${barberId}`)
      .then((res) => res.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => toast.error("Could not load services"))
      .finally(() => setLoading(false));
  }, [popoverOpen, barberId, services.length]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) && !buttonRef.current?.contains(e.target as Node)) {
        setPopoverOpen(false);
        setSelectedService(null);
      }
    }
    if (popoverOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

  const handleToggle = () => {
    if (!popoverOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 280);
    }
    setPopoverOpen((prev) => !prev);
    setSelectedService(null);
  };

  const handleConfirmClick = () => {
    if (!selectedService) {
      toast.error("Please select a service");
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
        toast.error(data.error ?? "Could not book appointment");
        return;
      }
      toast.success(`${service?.name} booked successfully!`);
      onBook?.(time, selectedService);
      setModalOpen(false);
      setSelectedService(null);
    } catch {
      toast.error("Network error, please try again");
    } finally {
      setBooking(false);
    }
  };

  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="relative">
        {/* Slot Row */}
        <div
          className={`group flex items-center justify-between border rounded-2xl px-5 py-4 transition-all duration-300 ${popoverOpen
            ? "border-indigo-500 bg-indigo-50 shadow-md"
            : "border-gray-100 bg-white hover:border-indigo-200 hover:shadow-sm"
            }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg transition-colors ${popoverOpen ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-400 group-hover:text-indigo-500"}`}>
              <Clock size={18} />
            </div>
            <span className={`font-black tracking-tight text-lg ${popoverOpen ? "text-indigo-900" : "text-gray-700"}`}>
              {time}
            </span>
          </div>

          <button
            ref={buttonRef}
            onClick={handleToggle}
            className={`px-6 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${popoverOpen
              ? "bg-gray-800 text-white"
              : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100"
              }`}
          >
            {popoverOpen ? "Cancel" : "Book"}
          </button>
        </div>

        {/* Popover */}
        <AnimatePresence>
          {popoverOpen && (
            <motion.div
              ref={popoverRef}
              initial={{ opacity: 0, scale: 0.95, y: openUpward ? 10 : -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: openUpward ? 10 : -10 }}
              className={`absolute right-0 z-50 w-80 bg-white border border-gray-100 rounded-4xl shadow-2xl p-5 overflow-hidden ${openUpward ? "bottom-full mb-4" : "top-full mt-4"
                }`}
            >
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4">
                Available Services
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-14 rounded-2xl bg-gray-50 animate-pulse" />
                  ))
                ) : services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedService(s.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${selectedService === s.id
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-transparent bg-gray-50 hover:bg-gray-100"
                      }`}
                  >
                    <div className="text-left">
                      <p className={`text-sm font-black ${selectedService === s.id ? "text-indigo-900" : "text-gray-700"}`}>
                        {s.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {s.duration} MIN · ${s.price}
                      </p>
                    </div>
                    {selectedService === s.id && (
                      <div className="bg-indigo-600 rounded-full p-1 text-white">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <button
                onClick={handleConfirmClick}
                disabled={!selectedService}
                className="mt-5 w-full py-4 rounded-2xl bg-gray-900 text-white text-xs font-black uppercase tracking-[0.2em] hover:bg-indigo-600 disabled:opacity-20 transition-all shadow-xl shadow-gray-200"
              >
                Continue
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={() => !booking && setModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100"
            leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md" />
          </Transition.Child>

          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300" enterFrom="opacity-0 scale-95 y-20" enterTo="opacity-100 scale-100 y-0"
              leave="ease-in duration-200" leaveFrom="opacity-100 scale-100 y-0" leaveTo="opacity-0 scale-95 y-20"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <Scissors size={120} />
                </div>

                <div className="flex items-center justify-between mb-8">
                  <Dialog.Title className="text-2xl font-black text-gray-900 tracking-tight">
                    Confirm Booking
                  </Dialog.Title>
                  <button onClick={() => setModalOpen(false)} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 transition">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 mb-8">
                  {[
                    { icon: CalendarDays, label: "Date", value: formattedDate },
                    { icon: Clock, label: "Time", value: time },
                    { icon: Scissors, label: "Service", value: `${service?.name} (${service?.duration} min)` },
                    { icon: DollarSign, label: "Price", value: `$${service?.price.toFixed(2)}`, highlight: true },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                      <div className="bg-white p-2.5 rounded-xl shadow-sm text-indigo-500">
                        <item.icon size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.label}</p>
                        <p className={`text-sm font-bold ${item.highlight ? "text-indigo-600 text-lg" : "text-gray-700"}`}>
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    disabled={booking}
                    className="flex-1 py-4 rounded-2xl border-2 border-gray-100 text-xs font-black uppercase tracking-widest text-gray-400 hover:bg-gray-50 transition disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalConfirm}
                    disabled={booking}
                    className="flex-2 py-4 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {booking ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Complete Booking <ChevronRight size={16} /></>
                    )}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
"use client";

import { useState, useRef, useEffect, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { CalendarDays, Clock, Scissors, DollarSign, X } from "lucide-react";

type Service = {
  id: string;
  name: string;
  duration: number;
  price: number;
};

type Props = {
  time: string;
  selectedDate: Date;
  barberId: string; // hardcoded por ahora, luego dinámico
  onBook?: (time: string, serviceId: string) => void;
};

export default function SlotCard({ time, selectedDate, barberId, onBook }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const service = services.find((s) => s.id === selectedService);

  // Fetch services when popover opens (only once)
  useEffect(() => {
    if (!popoverOpen || services.length > 0) return;

    setLoading(true);
    fetch("/api/catalog")
      .then((res) => res.json())
      .then((data: Service[]) => setServices(data))
      .catch(() => toast.error("Could not load services"))
      .finally(() => setLoading(false));
  }, [popoverOpen]);

// Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setPopoverOpen(false);
        setSelectedService(null);
      }
    }
    if (popoverOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [popoverOpen]);

// Handle confirm button click
  const handleConfirmClick = () => {
    if (!selectedService) {
      toast.error("Please select a service");
      return;
    }
    setPopoverOpen(false);
    setModalOpen(true);
  };

// Build ISO datetime string for booking
  const buildDateTime = (): string => {
    const [timePart, modifier] = time.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const date = new Date(selectedDate);
    date.setHours(hours, minutes, 0, 0);
    return date.toISOString();
  };

// Final booking confirmation
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

      toast.success(`${service?.name} booked for ${time}!`);
      onBook?.(time, selectedService);
      setModalOpen(false);
      setSelectedService(null);

    } catch {
      toast.error("Network error, please try again");
    } finally {
      setBooking(false);
    }
  };
// Formatted date for modal display
  const formattedDate = selectedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <div className="relative">
        {/* Slot row */}
        <div
          className={`flex items-center justify-between border rounded-xl px-4 py-3 transition ${
            popoverOpen
              ? "border-indigo-400 bg-indigo-50"
              : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
          }`}
        >
          <span className="font-medium text-gray-700">{time}</span>

          <button
            ref={buttonRef}
            onClick={() => {
              setPopoverOpen((prev) => !prev);
              setSelectedService(null);
            }}
            className="text-sm font-medium bg-indigo-600 text-white px-4 py-1.5 rounded-lg hover:bg-indigo-700 transition cursor-pointer"
          >
            {popoverOpen ? "Cancel" : "Book"}
          </button>
        </div>

        {/* Popover */}
        {popoverOpen && (
          <div
            ref={popoverRef}
            className="absolute right-0 z-50 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl p-4 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />

            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Select a service
            </p>

            <div className="flex flex-col gap-2">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-xl bg-gray-100 animate-pulse" />
                ))
              ) : services.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">
                  No services available
                </p>
              ) : (
                services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedService(s.id)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition cursor-pointer ${
                      selectedService === s.id
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700"
                    }`}
                  >
                    <span className="font-medium">{s.name}</span>
                    <span className={`text-xs ${selectedService === s.id ? "text-indigo-200" : "text-gray-400"}`}>
                      {s.duration} min · ${s.price}
                    </span>
                  </button>
                ))
              )}
            </div>

            <button
              onClick={handleConfirmClick}
              disabled={!selectedService}
              className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer
                bg-indigo-600 text-white hover:bg-indigo-700
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm Booking
            </button>
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !booking && setModalOpen(false)}>

          {/* Blurred background */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          {/* Centered Panel */}
          <div className="fixed inset-0 flex items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title className="text-lg font-semibold text-gray-800">
                    Confirm your appointment
                  </Dialog.Title>
                  <button
                    onClick={() => setModalOpen(false)}
                    disabled={booking}
                    className="text-gray-400 hover:text-gray-600 transition cursor-pointer disabled:opacity-40"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Detail of the appointment */}
                <div className="bg-gray-50 rounded-xl divide-y divide-gray-200 mb-6">

                  <div className="flex items-center gap-3 px-4 py-3">
                    <CalendarDays size={16} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Date</p>
                      <p className="text-sm font-medium text-gray-700">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3">
                    <Clock size={16} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Time</p>
                      <p className="text-sm font-medium text-gray-700">{time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3">
                    <Scissors size={16} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Service</p>
                      <p className="text-sm font-medium text-gray-700">
                        {service?.name}
                        <span className="ml-2 text-gray-400 font-normal">
                          {service?.duration} min
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 px-4 py-3">
                    <DollarSign size={16} className="text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400">Price</p>
                      <p className="text-sm font-semibold text-gray-800">
                        ${service?.price.toFixed(2)}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setModalOpen(false)}
                    disabled={booking}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFinalConfirm}
                    disabled={booking}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {booking ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Booking...
                      </>
                    ) : (
                      "Confirm"
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
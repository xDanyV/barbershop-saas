"use client";

import { useEffect, useState } from "react";
import {
    Ban,
    ImageIcon,
    Mail,
    Phone,
    Save,
    ShieldCheck,
    UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { useTranslations } from "next-intl";

type BarberStatus = "PENDING" | "APPROVED" | "REJECTED";

type Barber = {
    id: string;
    userId: string;
    businessId: string;
    status: BarberStatus;
    active: boolean;
    createdAt: string;
    profileImageUrl: string | null;
    isSelf?: boolean;
    user: {
        name: string | null;
        email: string;
        phone: string;
    };
};

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function ActiveBarbersList() {
    const t = useTranslations("ActiveBarbersList");

    const [barbers, setBarbers] = useState<Barber[]>([]);
    const [loading, setLoading] = useState(true);
    const [imageDrafts, setImageDrafts] = useState<Record<string, string>>({});
    const [savingImageId, setSavingImageId] = useState<string | null>(null);

    const fetchManaged = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/admin/barbers/active");

            if (!res.ok) {
                toast.error(`${t("errors.fetch")}: ${res.statusText}`);
                setBarbers([]);
                return;
            }

            const data = await res.json();

            if (!Array.isArray(data)) {
                setBarbers([]);
                toast.error(t("errors.format"));
                return;
            }

            setBarbers(data);

            const drafts = data.reduce<Record<string, string>>((acc, barber: Barber) => {
                acc[barber.id] = barber.profileImageUrl ?? "";
                return acc;
            }, {});

            setImageDrafts(drafts);
        } catch (err) {
            console.error("Fetch error:", err);
            toast.error(t("errors.connection"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchManaged();
    }, []);

    const executeStatusChange = async (
        barberId: string,
        newStatus: BarberStatus,
        statusLabel: string
    ) => {
        const loadingToast = toast.loading(t("toasts.updating"));

        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ barberId, status: newStatus }),
            });

            if (res.ok) {
                toast.success(t("toasts.updatedTo", { status: statusLabel }), {
                    id: loadingToast,
                });
                fetchManaged();
            } else {
                toast.error(t("errors.update"), { id: loadingToast });
                fetchManaged();
            }
        } catch (err) {
            console.error("Action error:", err);
            toast.error(t("errors.connection"), { id: loadingToast });
            fetchManaged();
        }
    };

    const handleStatusChange = (barberId: string, newStatus: BarberStatus) => {
        const statusLabels: Record<BarberStatus, string> = {
            PENDING: t("statusLabels.PENDING"),
            APPROVED: t("statusLabels.APPROVED"),
            REJECTED: t("statusLabels.REJECTED"),
        };

        const targetLabel = statusLabels[newStatus];

        toast(
            (toastObj) => (
                <div className="flex flex-col gap-3">
                    <p className="text-sm font-medium text-gray-900">
                        {t("confirmModal.question")}{" "}
                        <span className="font-bold text-indigo-600">
                            {targetLabel}
                        </span>
                        ?
                    </p>

                    <div className="flex gap-2 justify-end">
                        <button
                            onClick={() => {
                                toast.dismiss(toastObj.id);
                                fetchManaged();
                            }}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            {t("confirmModal.cancel")}
                        </button>

                        <button
                            onClick={() => {
                                toast.dismiss(toastObj.id);
                                executeStatusChange(barberId, newStatus, targetLabel);
                            }}
                            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            {t("confirmModal.confirm")}
                        </button>
                    </div>
                </div>
            ),
            {
                duration: 8000,
                id: `confirm-${barberId}`,
            }
        );
    };

    const handleImageDraftChange = (barberId: string, value: string) => {
        setImageDrafts((prev) => ({
            ...prev,
            [barberId]: value,
        }));
    };

    const handleSaveProfileImage = async (barberId: string) => {
        const imageUrl = imageDrafts[barberId]?.trim() ?? "";

        setSavingImageId(barberId);

        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    barberId,
                    profileImageUrl: imageUrl,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error ?? "No se pudo guardar la foto");
                return;
            }

            setBarbers((prev) =>
                prev.map((barber) =>
                    barber.id === barberId
                        ? {
                            ...barber,
                            profileImageUrl: data.barber.profileImageUrl,
                        }
                        : barber
                )
            );

            setImageDrafts((prev) => ({
                ...prev,
                [barberId]: data.barber.profileImageUrl ?? "",
            }));

            toast.success("Foto del barbero actualizada");
        } catch (error) {
            console.error("Profile image update error:", error);
            toast.error("Error de conexión al guardar la foto");
        } finally {
            setSavingImageId(null);
        }
    };

    if (loading) {
        return (
            <div className="p-10 text-center font-bold text-gray-400">
                {t("loadingDir")}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="max-h-150 md:max-h-175 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid gap-4 pb-24 md:pb-0">
                    <AnimatePresence mode="popLayout">
                        {barbers.length === 0 ? (
                            <p className="text-center py-10 text-gray-400 font-bold italic">
                                {t("empty")}
                            </p>
                        ) : (
                            barbers.map((barber) => {
                                const isApproved = barber.status === "APPROVED";
                                const barberName = barber.user?.name || t("barber.noName");
                                const initials = getInitials(barberName);
                                const imageDraft = imageDrafts[barber.id] ?? "";
                                const hasImageChanged =
                                    imageDraft.trim() !== (barber.profileImageUrl ?? "");
                                const isSavingImage = savingImageId === barber.id;

                                return (
                                    <motion.div
                                        key={barber.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`bg-white border p-5 md:p-6 rounded-4xl shadow-sm transition-colors ${isApproved
                                                ? "border-gray-100"
                                                : "border-red-100 bg-red-50/30"
                                            }`}
                                    >
                                        <div className="flex flex-col gap-5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <div
                                                            className={`w-16 h-16 rounded-3xl overflow-hidden flex items-center justify-center border ${barber.profileImageUrl
                                                                    ? "bg-gray-100 border-gray-100"
                                                                    : isApproved
                                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                                        : "bg-red-50 text-red-500 border-red-100"
                                                                }`}
                                                        >
                                                            {barber.profileImageUrl ? (
                                                                <img
                                                                    src={barber.profileImageUrl}
                                                                    alt={barberName}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : isApproved ? (
                                                                <span className="font-black text-lg">
                                                                    {initials || <UserRound size={24} />}
                                                                </span>
                                                            ) : (
                                                                <Ban size={24} />
                                                            )}
                                                        </div>

                                                        {isApproved && (
                                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full" />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-black text-gray-900 truncate">
                                                                {barberName}
                                                            </h3>

                                                            {isApproved && (
                                                                <ShieldCheck
                                                                    size={15}
                                                                    className="text-emerald-500 shrink-0"
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1 mt-1">
                                                            <span className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                                                <Mail size={12} className="shrink-0" />
                                                                <span className="truncate">
                                                                    {barber.user?.email}
                                                                </span>
                                                            </span>

                                                            <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                                                <Phone size={12} className="shrink-0" />
                                                                {barber.user?.phone}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center w-full md:w-auto pt-4 md:pt-0 border-t border-gray-100 md:border-0">
                                                    {barber.isSelf ? (
                                                        <span className="w-full md:w-auto text-center px-4 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm border border-indigo-100">
                                                            {t("barber.yourAccount")}
                                                        </span>
                                                    ) : (
                                                        <select
                                                            value={barber.status}
                                                            onChange={(e) =>
                                                                handleStatusChange(
                                                                    barber.id,
                                                                    e.target.value as BarberStatus
                                                                )
                                                            }
                                                            className={`w-full md:w-auto px-4 py-3 md:py-2.5 bg-white border rounded-xl font-bold text-sm focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-colors ${isApproved
                                                                    ? "border-gray-200 text-gray-700"
                                                                    : "border-red-200 text-red-600"
                                                                }`}
                                                        >
                                                            <option value="APPROVED">
                                                                {t("options.APPROVED")}
                                                            </option>
                                                            <option value="PENDING">
                                                                {t("options.PENDING")}
                                                            </option>
                                                            <option value="REJECTED">
                                                                {t("options.REJECTED")}
                                                            </option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="rounded-3xl bg-gray-50 border border-gray-100 p-4">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="w-8 h-8 rounded-2xl bg-white flex items-center justify-center text-indigo-600">
                                                        <ImageIcon size={15} />
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-black text-gray-900">
                                                            Foto pública del barbero
                                                        </p>
                                                        <p className="text-[11px] text-gray-400 font-bold">
                                                            Pega una URL de imagen. Déjalo vacío para quitarla.
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col md:flex-row gap-2">
                                                    <input
                                                        type="url"
                                                        value={imageDraft}
                                                        onChange={(e) =>
                                                            handleImageDraftChange(
                                                                barber.id,
                                                                e.target.value
                                                            )
                                                        }
                                                        placeholder="https://ejemplo.com/foto.jpg"
                                                        className="flex-1 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50"
                                                    />

                                                    <button
                                                        type="button"
                                                        onClick={() => handleSaveProfileImage(barber.id)}
                                                        disabled={!hasImageChanged || isSavingImage}
                                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm shadow-indigo-100 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                                    >
                                                        {isSavingImage ? (
                                                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                                        ) : (
                                                            <Save size={15} />
                                                        )}
                                                        Guardar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
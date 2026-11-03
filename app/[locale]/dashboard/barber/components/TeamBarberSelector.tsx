"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

type TeamBarber = {
    id: string;
    status: string;
    active: boolean;
    isSelf: boolean;
    user: { name: string | null };
};

type Props = {
    // Barbero que el proxy está usando ahora (x-barber-id)
    currentBarberId: string | null;
};

// Solo para OWNER: elige qué barbero del equipo se gestiona en la agenda y el catálogo
export default function TeamBarberSelector({ currentBarberId }: Props) {
    const t = useTranslations("TeamBarberSelector");
    const [team, setTeam] = useState<TeamBarber[]>([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch("/api/admin/barbers/active")
            .then((res) => (res.ok ? res.json() : []))
            .then((data: TeamBarber[]) =>
                setTeam(Array.isArray(data) ? data.filter((b) => b.status === "APPROVED" && b.active) : [])
            )
            .catch(() => setTeam([]));
    }, []);

    // Sin más barberos que el propio no hay nada que elegir
    if (team.filter((b) => !b.isSelf).length === 0) return null;

    const handleChange = async (barberId: string) => {
        const selected = team.find((b) => b.id === barberId);
        setSaving(true);

        try {
            const res = await fetch("/api/protected/team/managed-barber", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ barberId: selected?.isSelf ? null : barberId }),
            });

            if (!res.ok) {
                toast.error(t("error"));
                return;
            }

            // Las páginas cargan sus datos al montar: recargar aplica el nuevo barbero en todo
            window.location.reload();
        } catch {
            toast.error(t("error"));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="mx-auto mt-4 flex max-w-7xl flex-col gap-2 rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-indigo-700">
                <Users size={16} />
                <span className="text-xs font-black uppercase tracking-widest">{t("label")}</span>
                <select
                    value={currentBarberId ?? ""}
                    disabled={saving}
                    onChange={(e) => handleChange(e.target.value)}
                    className="rounded-xl border border-indigo-200 bg-white px-3 py-1.5 text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:opacity-60"
                >
                    {team.map((barber) => (
                        <option key={barber.id} value={barber.id}>
                            {barber.isSelf ? t("self") : barber.user.name ?? barber.id}
                        </option>
                    ))}
                </select>
            </div>

            <p className="text-[11px] font-medium text-indigo-500">{t("hint")}</p>
        </div>
    );
}

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
        <div className="mt-4 bg-white p-4">
            <label className="flex flex-col gap-2 text-sm font-semibold sm:flex-row sm:items-center sm:gap-3">
                <span className="flex items-center gap-2">
                    <Users size={18} aria-hidden="true" />
                    {t("label")}
                </span>
                <select
                    value={currentBarberId ?? ""}
                    disabled={saving}
                    onChange={(e) => handleChange(e.target.value)}
                    className="min-h-11 border border-gray-200 bg-white px-3 font-normal text-gray-900 outline-none focus:border-gray-900 disabled:opacity-60"
                >
                    {team.map((barber) => (
                        <option key={barber.id} value={barber.id}>
                            {barber.isSelf ? t("self") : barber.user.name ?? barber.id}
                        </option>
                    ))}
                </select>
            </label>
            <p className="mt-2 text-xs text-gray-500">{t("hint")}</p>
        </div>
    );
}

"use client";

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { CalendarDays, ImageIcon, KeyRound, MoreVertical, Scissors, Trash2, UserMinus, UserPlus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import toast from "react-hot-toast";
import BrandDialog, { brandPrimaryButton } from "@/[locale]/components/BrandDialog";
import { useApiError } from "@/[locale]/components/useApiError";
import { useUploadThing } from "@/lib/uploadthing";
import { compressImage } from "@/lib/compress-image";
import ResetLinkDialog from "@/[locale]/components/ResetLinkDialog";

type Member = {
    id: string;
    active: boolean;
    isSelf: boolean;
    profileImageUrl: string | null;
    user: { name: string | null; email: string; phone: string };
    servicesCount: number;
    hoursDays: number;
    upcomingCount: number;
};

const MAX_PHOTO_MB = 4;
const menuItemClass = "flex min-h-11 w-full items-center gap-3 px-4 text-left data-[focus]:bg-[#f1f3f2]";

// Equipo de la barbería: quién está activo, qué le falta para recibir citas y acciones de cada barbero
export default function TeamList() {
    const t = useTranslations("TeamList");
    const locale = useLocale();
    const router = useRouter();
    const apiError = useApiError();
    const [members, setMembers] = useState<Member[] | null>(null);
    const [leaving, setLeaving] = useState<Member | null>(null);
    const [working, setWorking] = useState(false);
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [resetLink, setResetLink] = useState<{ member: Member; token: string; expiresAt: string } | null>(null);
    const uploadTarget = useRef<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const load = useCallback(async () => {
        const res = await fetch("/api/admin/barbers/active").catch(() => null);
        setMembers(res?.ok ? await res.json() : []);
        if (!res?.ok) toast.error(t("errors.load"));
    }, [t]);

    useEffect(() => {
        load();
    }, [load]);

    const patch = async (body: object, failed: string) => {
        setWorking(true);

        try {
            const res = await fetch("/api/admin/barbers", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, failed));
                return null;
            }

            return data;
        } catch {
            toast.error(failed);
            return null;
        } finally {
            setWorking(false);
        }
    };

    // Enlace de un solo uso para que el barbero elija una contraseña nueva
    const createResetLink = async (member: Member) => {
        setWorking(true);

        try {
            const res = await fetch("/api/admin/barbers/reset-link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ barberId: member.id }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(apiError(data, t("errors.resetLink")));
                return;
            }

            setResetLink({ member, token: data.token, expiresAt: data.expiresAt });
        } catch {
            toast.error(t("errors.resetLink"));
        } finally {
            setWorking(false);
        }
    };

    const { startUpload } = useUploadThing("barberProfileImage", {
        onClientUploadComplete: async (res) => {
            const url = res?.[0]?.serverData?.url ?? res?.[0]?.url;
            const id = uploadTarget.current;
            uploadTarget.current = null;
            setUploadingId(null);

            if (id && url && (await patch({ barberId: id, profileImageUrl: url }, t("errors.photo")))) {
                toast.success(t("photoSaved"));
                load();
            }
        },
        onUploadError: () => {
            uploadTarget.current = null;
            setUploadingId(null);
            toast.error(t("errors.photo"));
        },
    });

    const pickPhoto = (id: string) => {
        uploadTarget.current = id;
        fileInput.current?.click();
    };

    const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file || !uploadTarget.current) return;
        if (!file.type.startsWith("image/")) return void toast.error(t("errors.notImage"));
        // Se sube una versión más ligera; el límite se revisa sobre ella
        const upload = await compressImage(file, { maxSize: 800 });

        if (upload.size > MAX_PHOTO_MB * 1024 * 1024) return void toast.error(t("errors.tooBig", { mb: MAX_PHOTO_MB }));

        setUploadingId(uploadTarget.current);
        await startUpload([upload]);
    };

    const removePhoto = async (id: string) => {
        if (await patch({ barberId: id, profileImageUrl: "" }, t("errors.photo"))) load();
    };

    const setActive = async (member: Member, active: boolean) => {
        const data = await patch({ barberId: member.id, active }, t("errors.status"));
        if (!data) return;

        setLeaving(null);
        toast.success(
            active
                ? t("reactivated", { name: member.user.name ?? "" })
                : t("removed", { name: member.user.name ?? "", count: data.cancelledCount ?? 0 })
        );
        load();
    };

    // El dueño trabaja la agenda o el catálogo de otro barbero eligiéndolo primero
    const manage = async (member: Member, path: string) => {
        await fetch("/api/protected/team/managed-barber", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ barberId: member.isSelf ? null : member.id }),
        }).catch(() => null);
        router.push(`/${locale}${path}`);
    };

    if (members === null) return <p className="py-6 text-gray-500">{t("loading")}</p>;
    if (members.length === 0) return <p className="py-6 text-gray-500">{t("empty")}</p>;

    return (
        <>
            <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={onFile} />

            <ul className="space-y-3">
                {members.map((member) => {
                    const name = member.user.name || t("noName");
                    const missing = [member.servicesCount === 0 && t("missingServices"), member.hoursDays === 0 && t("missingHours")].filter(Boolean);

                    return (
                        <li key={member.id} className={`bg-white p-4 sm:p-5 ${member.active ? "" : "opacity-70"}`}>
                            <div className="flex gap-4">
                                <div className="h-14 w-14 shrink-0 overflow-hidden bg-gray-100">
                                    {member.profileImageUrl ? (
                                        <img src={member.profileImageUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-gray-500">
                                            {name.charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                                        <span className="break-words">{name}</span>
                                        {member.isSelf && <span className="bg-gray-100 px-1.5 py-0.5 text-xs">{t("you")}</span>}
                                        {!member.active && <span className="bg-red-100 px-1.5 py-0.5 text-xs text-red-700">{t("inactive")}</span>}
                                        {uploadingId === member.id && <span className="text-xs font-normal text-gray-500">{t("uploading")}</span>}
                                    </p>
                                    <p className="truncate text-xs text-gray-500">
                                        {member.user.phone} · {member.user.email}
                                    </p>
                                    {member.active && (
                                        <p className="mt-1 text-sm text-gray-600">
                                            {t("summary", { services: member.servicesCount, days: member.hoursDays, upcoming: member.upcomingCount })}
                                        </p>
                                    )}
                                    {member.active && missing.length > 0 && (
                                        <p className="mt-1 text-sm font-semibold text-amber-700">
                                            {missing.join(" · ")}. {t("notBookable")}
                                        </p>
                                    )}
                                </div>

                                <Menu as="div" className="relative shrink-0">
                                    <MenuButton
                                        aria-label={t("actions", { name })}
                                        className="flex h-11 w-11 items-center justify-center text-gray-600 transition-colors hover:bg-gray-100 data-[open]:bg-gray-100"
                                    >
                                        <MoreVertical size={20} aria-hidden="true" />
                                    </MenuButton>
                                    <MenuItems anchor="bottom end" className="z-50 mt-1 w-60 border border-[#dbe0de] bg-white py-1 text-sm text-[#0f2733] outline-none">
                                        <MenuItem>
                                            <button type="button" onClick={() => pickPhoto(member.id)} className={menuItemClass}>
                                                <ImageIcon size={18} aria-hidden="true" />
                                                {member.profileImageUrl ? t("changePhoto") : t("addPhoto")}
                                            </button>
                                        </MenuItem>
                                        {member.profileImageUrl && (
                                            <MenuItem>
                                                <button type="button" onClick={() => removePhoto(member.id)} className={menuItemClass}>
                                                    <Trash2 size={18} aria-hidden="true" />
                                                    {t("removePhoto")}
                                                </button>
                                            </MenuItem>
                                        )}
                                        {!member.isSelf && member.active && (
                                            <MenuItem>
                                                <button type="button" onClick={() => createResetLink(member)} disabled={working} className={menuItemClass}>
                                                    <KeyRound size={18} aria-hidden="true" />
                                                    {t("resetLink")}
                                                </button>
                                            </MenuItem>
                                        )}
                                        {!member.isSelf && (
                                            <MenuItem>
                                                {member.active ? (
                                                    <button type="button" onClick={() => setLeaving(member)} className={`${menuItemClass} text-[#b8431f]`}>
                                                        <UserMinus size={18} aria-hidden="true" />
                                                        {t("remove")}
                                                    </button>
                                                ) : (
                                                    <button type="button" onClick={() => setActive(member, true)} className={menuItemClass}>
                                                        <UserPlus size={18} aria-hidden="true" />
                                                        {t("reactivate")}
                                                    </button>
                                                )}
                                            </MenuItem>
                                        )}
                                    </MenuItems>
                                </Menu>
                            </div>

                            {member.active && (
                                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:pl-[4.5rem]">
                                    <button
                                        type="button"
                                        onClick={() => manage(member, "/dashboard/barber")}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-gray-200 px-3 text-sm font-semibold transition-colors hover:border-gray-900"
                                    >
                                        <CalendarDays size={16} aria-hidden="true" />
                                        {t("openSchedule")}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => manage(member, "/dashboard/barber/catalog")}
                                        className="inline-flex min-h-11 items-center justify-center gap-2 border border-gray-200 px-3 text-sm font-semibold transition-colors hover:border-gray-900"
                                    >
                                        <Scissors size={16} aria-hidden="true" />
                                        {t("openCatalog")}
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>

            {resetLink && (
                <ResetLinkDialog
                    name={resetLink.member.user.name ?? resetLink.member.user.email}
                    phone={resetLink.member.user.phone}
                    token={resetLink.token}
                    expiresAt={resetLink.expiresAt}
                    onClose={() => setResetLink(null)}
                />
            )}

            {leaving && (
                <BrandDialog
                    title={t("removeTitle", { name: leaving.user.name ?? "" })}
                    subtitle={leaving.upcomingCount > 0 ? t("removeTextWithAppointments", { count: leaving.upcomingCount }) : t("removeText")}
                    closeLabel={t("keep")}
                    onClose={() => !working && setLeaving(null)}
                >
                    <button type="button" onClick={() => setActive(leaving, false)} disabled={working} className={brandPrimaryButton}>
                        {t("remove")}
                    </button>
                </BrandDialog>
            )}
        </>
    );
}

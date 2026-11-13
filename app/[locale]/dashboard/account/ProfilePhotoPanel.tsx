"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useUploadThing } from "@/lib/uploadthing";
import { compressImage } from "@/lib/compress-image";
import { useApiError } from "@/[locale]/components/useApiError";

const MAX_MB = 4;

// El barbero elige su propia foto: los clientes la ven en la página de la barbería y al elegir con quién reservar
export default function ProfilePhotoPanel({ initialUrl, name, className = "" }: { initialUrl: string | null; name: string; className?: string }) {
    const t = useTranslations("Account.photo");
    const apiError = useApiError();
    const [url, setUrl] = useState(initialUrl);
    // Si la imagen no carga se muestra la inicial, no el texto alternativo
    const [broken, setBroken] = useState(false);
    const [working, setWorking] = useState<"upload" | "remove" | null>(null);
    const failedUpload = useRef(false);
    const { startUpload } = useUploadThing("barberProfileImage", {
        onUploadError: (error) => {
            failedUpload.current = true;
            toast.error(error.message || t("failed"));
        },
    });

    const save = async (next: string | null) => {
        const res = await fetch("/api/protected/account/photo", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: next }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(apiError(data, t("failed")));
        setBroken(false);
        setUrl(next);
    };

    const pick = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) return void toast.error(t("notImage"));

        setWorking("upload");
        failedUpload.current = false;

        try {
            // Se sube una versión más ligera; el límite se revisa sobre ella
            const light = await compressImage(file, { maxSize: 800 });
            if (light.size > MAX_MB * 1024 * 1024) return void toast.error(t("tooBig", { mb: MAX_MB }));

            const result = await startUpload([light]);
            const uploaded = result?.[0]?.serverData?.url ?? result?.[0]?.url;
            if (!uploaded) {
                if (!failedUpload.current) toast.error(t("failed"));
                return;
            }

            await save(uploaded);
            toast.success(t("saved"));
        } catch (error) {
            toast.error(error instanceof Error && error.message ? error.message : t("failed"));
        } finally {
            setWorking(null);
        }
    };

    const remove = async () => {
        setWorking("remove");
        try {
            await save(null);
            toast.success(t("removed"));
        } catch (error) {
            toast.error(error instanceof Error && error.message ? error.message : t("failed"));
        } finally {
            setWorking(null);
        }
    };

    return (
        <section aria-labelledby="photo-title" className={className}>
            <h2 id="photo-title" className="text-[length:var(--step-lead)] font-semibold">
                {t("title")}
            </h2>
            <p className="mt-1 text-[var(--brand-muted)]">{t("text")}</p>

            <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                <span className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden bg-[var(--brand-sand)]">
                    {url && !broken ? (
                        <img src={url} alt={t("alt", { name })} onError={() => setBroken(true)} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-3xl font-semibold" aria-hidden="true">
                            {(name.trim().charAt(0) || "?").toUpperCase()}
                        </span>
                    )}
                </span>

                <div className="flex flex-wrap gap-2">
                    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 bg-[var(--brand-ink)] px-4 font-semibold text-[var(--brand-paper)] transition-opacity hover:opacity-90 has-[:disabled]:pointer-events-none has-[:disabled]:opacity-50">
                        <input type="file" accept="image/*" className="sr-only" disabled={working !== null} onChange={pick} />
                        {working === "upload" ? <Loader2 size={18} className="animate-spin" aria-hidden="true" /> : <Camera size={18} aria-hidden="true" />}
                        {working === "upload" ? t("uploading") : url ? t("change") : t("add")}
                    </label>
                    {url && (
                        <button
                            type="button"
                            onClick={remove}
                            disabled={working !== null}
                            className="inline-flex min-h-11 items-center gap-2 px-3 font-semibold text-[#b8431f] disabled:opacity-50"
                        >
                            <Trash2 size={18} aria-hidden="true" />
                            {t("remove")}
                        </button>
                    )}
                </div>
            </div>
            <p className="mt-3 text-[length:var(--step-small)] text-[var(--brand-muted)]">{t("hint", { mb: MAX_MB })}</p>
        </section>
    );
}

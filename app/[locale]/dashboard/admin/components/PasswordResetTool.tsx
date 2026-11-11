"use client";

import { useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import { useApiError } from "@/[locale]/components/useApiError";
import ResetLinkDialog from "@/[locale]/components/ResetLinkDialog";

type Created = { token: string; expiresAt: string; name: string | null; phone: string | null; email: string };

// El administrador crea un enlace para quien olvidó su contraseña (clientes y dueños)
export default function PasswordResetTool() {
    const t = useTranslations("ResetLink.tool");
    const apiError = useApiError();
    const [email, setEmail] = useState("");
    const [working, setWorking] = useState(false);
    const [created, setCreated] = useState<Created | null>(null);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setWorking(true);

        try {
            const res = await fetch("/api/admin/password-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                toast.error(res.status === 404 ? t("notFound") : apiError(data, t("failed")));
                return;
            }

            setCreated({ ...data, email });
            setEmail("");
        } catch {
            toast.error(t("failed"));
        } finally {
            setWorking(false);
        }
    };

    return (
        <section className="mb-8 border border-gray-200 bg-white p-5 md:p-6">
            <div className="flex items-start gap-3">
                <KeyRound size={22} className="mt-0.5 shrink-0 text-[#e8603a]" aria-hidden="true" />
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">{t("title")}</h2>
                    <p className="mt-1 max-w-[65ch] text-sm text-gray-600">{t("text")}</p>
                </div>
            </div>

            <form onSubmit={submit} className="mt-4 flex flex-col gap-2 sm:flex-row">
                <label className="sr-only" htmlFor="reset-email">{t("email")}</label>
                <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={t("email")}
                    className="min-h-11 flex-1 border border-gray-200 px-4 text-sm outline-none focus:border-gray-900"
                />
                <button
                    type="submit"
                    disabled={working}
                    className="min-h-11 bg-gray-900 px-5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {working ? t("creating") : t("create")}
                </button>
            </form>

            {created && (
                <ResetLinkDialog
                    name={created.name ?? created.email}
                    phone={created.phone}
                    token={created.token}
                    expiresAt={created.expiresAt}
                    onClose={() => setCreated(null)}
                />
            )}
        </section>
    );
}
